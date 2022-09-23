const debug = require('debug')('app:bot');
const fetch = require('node-fetch');
const { Update } = require('./update');
const { Message } = require('./message');
const { Config } =  require('./config');
const config = Config.config;
const { createClient } = require('redis');
const { Session } = require('./session');
const { Dialog } = require('./dialog');

const botApiEndpoint = 'https://api.telegram.org/bot';

class Bot {
    #token;
    #zendesk;
    #client;
    #apiUrl;
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
    }

    get token() {
        return this.#token;
    }

    async #setWebhook(domain, path) {
        let url = this.#apiUrl + '/setWebhook?' + "url=" + domain + path;
        let res = await fetch(url);
    }

    async #deleteWebhook() {
        let url = this.#apiUrl + '/deleteWebhook';
        let res = await fetch(url);
    }

    async asyncInit (enableWebhook) {
        if (enableWebhook) {
            await this.#setWebhook(config.botDomain, config.botPath);
        } else {
            await this.#deleteWebhook();
        }
    }
    
    async botHandler (req, res) {
        debug("botHandler:", req);
        res.sendStatus(200);
        this.#processUpdate(req.body);
    }

    async sendMessage (chatId, text) {
        let url = `${this.#apiUrl}/sendMessage?chat_id=${chatId}&text=${text}`;
        let response = await fetch(url);
        let data = await response.json();
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

    async #processUpdate (update) {
        let message = new Message(update.message);
        let ctx = this.#session.retrieve(message.userId);
        let dialog = ctx.getProp("dialog");
        if (dialog && dialog.isCompleted) {
            // send to Zendesk
            this.#zendesk.push(message.text);
        } else {
            if (!dialog) {
                dialog = new Dialog();
            }
            dialog.run();
            this.sendMessage(message.chatId, dialog.message);
            ctx.setProp("dialog", dialog);
            this.#session.store(ctx);
        }
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

    healthCheck (req, res) {
        res.send('Bot ok');
    }
}

exports.Bot = Bot;;