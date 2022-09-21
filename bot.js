const fetch = require('node-fetch');
const { Update } = require('./update');
const { Message } = require('./message');
const { Config } =  require('./config');
const config = Config.config;
const { createClient } = require('redis');

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


        console.log(url);
        let res = await fetch(url);
    }

    async #deleteWebhook() {
        let url = this.#apiUrl + '/deleteWebhook';
        let res = await fetch(url);
    }

    async asyncInit (enableWebhook) {
//        await this.#client.connect();
        if (enableWebhook) {
            await this.#setWebhook(config.botDomain, config.botPath);
        } else {
            await this.#deleteWebhook();
        }
    }
    
    async botHandler (req, res) {
        res.sendStatus(200);
        this.#processUpdate(req.body);
        // let updates = [req.body];
        // this.#zendesk.push(this.#buildMessages(updates));
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
        // let message = data.result;
        // let user = message.from;
        // return {
        //     id: message.message_id,
        //     text: message.text,
        //     date: message.date,
        //     chat_id: message.chat.id,
        //     author: {
        //         id: user.id,
        //         username: (user.username)?user.username:'',
        //         first_name: user.first_name,
        //         last_name: (user.last_name)?user.last_name:''
        //     },
        // };
    }

    async #processUpdate (update) {
        let message = new Message(update.message);
        this.#zendesk.push(message);
        // let text = message.text;
        // let entities = message.entities;
        // let user = message.from;
        // if (entities) {
        //     for (let entity of entities) {
        //         switch(entity.type) {
        //             case ('bot_command'):
        //                 switch(text.substr(entity.offset, entity.length)) {
        //                     case "/start":
        //                 }

        //         }
        //     }
        // }
        // let context = session.createOrGet(user.id);
        // if (context.completeDialog) {
        //     this.#zendesk.push(this.#buildMessages([update]));
        // } else {
        //     let dialog = new Dialog(context.dialogState);
        //     context.dialogstate = dialog.run();
        //     if (context.dialogstate.isCompleted()) {
        //         // push to zendesk
        //     } else {
        //         // continue dialog
        //         this.sendMessage(message.chat.id, context.dialogstate.message);
        //     }

        // }
    }

    #buildMessage (update) {
        let message = update.message;
        let user = message.from;
        return ({
            id: message.message_id,
            text: message.text,
            date: message.date,
            chat_id: message.chat.id,
            author: {
                id: user.id,
                username: (user.username)?user.username:'',
                first_name: user.first_name,
                last_name: (user.last_name)?user.last_name:''
            },
        });
    }

    #buildMessages (updates) {
        let messages = [];
        for(let update of updates) {
            if (update.update_id > this.#updateId) {
                this.#updateId = update.update_id;
                messages.push(this.#buildMessage(update));
            }
        }
        return messages;
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
        // return this.#buildMessages(updates);
    }

    // async sendMessage (chat_id, text) {
    //     let url = this.#apiUrl+'/sendMessage';
    //     let body = {chat_id, text};
    //     let response = await fetch(url, {
    //         method: "post",
    //         body: JSON.stringify(body),
    //         headers: {'Content-Type': 'application/json'}
    //     });
    //     console.log(response);
    //     let data = await response.json();
    // }

    getTicket(username) {
        let ticket = zendesk.getTicketByUser(username);
        if (!ticket) {
            ticket = zendesk.createTicket(username);
        }
    }

    healthCheck (req, res) {
        res.send('Bot ok');
    }
}


// factory
exports.Bot = Bot;;