const debug = require('debug')('app:bot');
const {createWriteStream} = require('node:fs');
const {pipeline} = require('node:stream');
const {promisify} = require('node:util');
const fetch = require('node-fetch');
const {checkStatus} = require("./fetch-error");
const { Update } = require('./update');
const { Message } = require('./message');
const { Config } =  require('./config');
const config = Config.config;
const { createClient } = require('redis');
const { Session } = require('./session');
const { Dialog } = require('./dialog');

const botApiEndpoint = 'https://api.telegram.org/bot';
const botApiFileEndpoint = 'https://api.telegram.org/file/bot';

class Bot {
    #token;
    #zendesk;
    #client;
    #apiUrl;
    #apiFileUrl;
    #updateId;
    #session;

    constructor (zendesk, session) {
        this.#updateId = 0;
        this.#zendesk = zendesk;
        this.#session = session;
        this.#client = createClient();
        this.#client.on('error', (err) => console.log('Redis Client Error', err));
    }

    set token(token) {
        this.#token = token;
        this.#apiUrl = botApiEndpoint + this.#token
        this.#apiFileUrl = botApiFileEndpoint + this.#token
        debug("set token", token);
    }

    get token() {
        return this.#token;
    }

    async #setWebhook(domain, path) {
        let url = this.#apiUrl + '/setWebhook?' + "url=" + domain + path;
        let res = await fetch(url);
        checkStatus(res);
        let status = await res.json();
        debug("setWebhook", {url, status});
    }

    async #deleteWebhook() {
        let url = this.#apiUrl + '/deleteWebhook';
        let res = await fetch(url);
        checkStatus(res);
        let status = await res.json();
        debug("deleteWebhook", {url, status});
    }

    async asyncInit (enableWebhook) {
        if (enableWebhook) {
            await this.#setWebhook(config.botDomain, `/${config.pathToken}${config.botPath}`);
        } else {
            await this.#deleteWebhook();
        }
    }
    
    async botHandler (req, res) {
        debug("botHandler req.body:", req.body);
        try {
            await this.#processUpdate(req.body);
            res.sendStatus(200);
        } catch(e) {
            res.sendStatus(503);
            console.error(e);
            debug("botHandler Exception:", e);
        }
    }

    async sendMessage (chatId, text, replyKeyboard) {
        debug("sendMessage chatId: %s text: %s", chatId, text);
        text= encodeURIComponent(text).replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,);
        let url = `${this.#apiUrl}/sendMessage?chat_id=${chatId}&text=${text}`;
        if (replyKeyboard) {
            url += "&reply_markup="+JSON.stringify(replyKeyboard);
        } else {
            url += "&reply_markup="+JSON.stringify({remove_keyboard: true});
        }
        debug("sendMessage url: ", url);
        let response = await fetch(url);
        debug("sendMessage response", {response});
        checkStatus(response);
        let data = await response.json();
        debug("sendMessage results", {data});
        if (data.ok) {
            return {
                ok: data.ok,
                message: new Message(data.result)
            };
        } else {
            return {
                ok: data.ok
            }
        }
    }

    async downloadFile (photo) {
        let fileId = photo.file_id;
        let url = `${this.#apiUrl}/getFile?file_id=${fileId}`;
        debug("download getFile url:", url);
        let getFileResp = await fetch(url);
        let fileObj = await getFileResp.json();
        debug("download download fileObj:", fileObj);
        let filePath = fileObj.result.file_path;
        let fileUrl = `${this.#apiFileUrl}/${filePath}`;
        const streamPipeline = promisify(pipeline);
        debug("download url:", fileUrl);
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
        let ext = filePath.split(".").pop();
        let uniqueFilename = `${photo.file_unique_id}.${ext}`;
        await streamPipeline(response.body, createWriteStream(`${config.mediaDir}/${uniqueFilename}`));
        return `${config.mediaPath}${uniqueFilename}`;
    }

    async addMedia (message) {
        if (message.photo) {
            let photo = message.pickPhoto(message.photo);
            let filePath = await this.downloadFile(photo);
            message.fileUrls = [filePath];
        }

    }

    async #processUpdate (update) {
        if (!update.message) return;
        let message = new Message(update.message, [], config.tags);
        let ctx = await this.#session.retrieve(message.extUserId);
        let dialog = ctx.getProp("dialog");
        if (!dialog) {
            dialog = new Dialog();
            ctx.setProp("dialog", dialog);
        }
        if (message.cmd == "newrequest") {
            if (dialog.isCompleted) {
                dialog.form = "ticket";
                dialog.clear();
                ctx.setProp("threadHead", message.messageId);
            } else {
                dialog.clear();
            }
        }
        if (message.cmd == "start") {
            if (!dialog.isCompleted) {
                dialog.clear();
            }
        }
        if (dialog.isCompleted) {
            debug("#processUpdate dialog completed dialog.state:", dialog.state);
            // send to Zendesk
            await this.addMedia(message);
            message.threadHead = ctx.getProp("threadHead");
            this.#zendesk.push(message);
        } else {
            dialog.reply = message.text;
            let dialogMsg = dialog.run();
            let replyKeyboard = undefined;
            if (dialogMsg.keyboard) {
                replyKeyboard = {keyboard: dialogMsg.keyboard, resize_keyboard: true, one_time_keyboard: true};
            }
            debug("#processUpdate dialog running dialog.state:", dialog.state);
            if (dialog.isCompleted) {
                // send to Zendesk
                let resp = await this.sendMessage(message.chatId, dialogMsg.text, replyKeyboard);
                message = new Message(update.message, dialog.answers, this.combineTags(config.tags, dialog.errTag));
                await this.addMedia(message);
                ctx.setProp("threadHead", message.messageId);
                message.threadHead = ctx.getProp("threadHead");
                let results = await this.#zendesk.push(message);
                if (results.error) {
                    throw new Error(results.error);
                }
            } else {
                let resp = await this.sendMessage(message.chatId, dialogMsg.text, replyKeyboard);
            }
//            ctx.setProp("dialog", dialog);
        }
        await this.#session.store(ctx);
    }

    async getMessages () {
        let url = this.#apiUrl+'/getUpdates';
        url += '?timeout=1';
        if (this.#updateId) {
            url += `&offset=${this.#updateId}`;
        }
        // let response = await fetch(url, {timeout: 1, allowed_updates: ['message']});
        let response = await fetch(url);
        let data = await response.json();
        let updates = Update.updateList(data.result);
        let latestUpdateId = Update.latestUpdateId(updates);
        if (this.#updateId < latestUpdateId) {
            this.#updateId = latestUpdateId;
        }
        return Update.messageList(updates);
    }

    combineTags(tag1, tag2) {
        debug("combineTag", {"tags": tag1, "errTag": tag2});
        if (tag1 && tag2) {
            return `${tag1},${tag2}`;
        } else {
            return tag1 || tag2;
        }

    }

    get zendesk () {
        return this.#zendesk;
    }

    healthCheck (req, res) {
        res.send('Bot ok');
    }
}

exports.Bot = Bot;;