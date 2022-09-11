const fetch = require('node-fetch');
const { config } =  require('./config');
const { createClient } = require('redis');

const botApiEndpoint = 'https://api.telegram.org/bot';

class Bot {
    #token;
    #zendesk;
    #client;
    #apiUrl;
    #updateId;

    constructor (token, zendesk) {
        this.#updateId = 0;
        this.#token = token;
        this.#zendesk = zendesk;
        this.#client = createClient();
        this.#client.on('error', (err) => console.log('Redis Client Error', err));
        this.#apiUrl = botApiEndpoint + this.#token
        console.log(this.#token);
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
//        await this.#client.connect();
        if (enableWebhook) {
            await this.#setWebhook(config.botDomain, config.botPath);
        } else {
            await this.#deleteWebhook();
        }
    }
    
    async botHandler (req, res) {
        res.sendStatus(200);
        console.log("bot handler");
        console.log(req.body.message);
        let msgResp = await this.sendMessage(req.body.message.chat.id, req.body.message.text+' reply');
    }

    async getMessages () {
        let url = this.#apiUrl+'/getUpdates';
        if (this.#updateId) {
            url += `?offset=${this.#updateId}`;
        }
        // let response = await fetch(url, {timeout: 1, allowed_updates: ['message']});
        let response = await fetch(url);
        let data = await response.json();
        let updates = data.result;
        let messages = [];
        for(let update of updates) {

            if (update.update_id > this.#updateId) {
                this.#updateId = update.update_id;
                let message = update.message;
                let user = message.from;
                messages.push({
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
                })
            }
        }
        return messages;
    }

    async sendMessage (chat_id, text) {
        let url = this.#apiUrl+'/sendMessage';
        let body = {chat_id, text};
        let response = await fetch(url, {
            method: "post",
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        });
        console.log(response);
        let data = await response.json();
    }

    getTicket(username) {
        let ticket = zendesk.getTicketByUser(username);
        if (!ticket) {
            ticket = zendesk.createTicket(username);
        }
    }

    webhookHandler(ctx) {

        console.log("webhookhandler");
        ctx.reply("reply");
        // let user = this.#store.findUser();
        // if (user) {

        // } else {
        //     user = this.#store.addUser();
        // }
        // this.messageHandler(ctx, user);
    }

    messageHandler (ctx, user) {
        if (user.isRelayMode()) {
            this.#zendesk.relay (ctx.message, user.ticket);
        } else {
            this.gatherInfo(ctx, user)
        }
    }

    healthCheck (req, res) {
        res.send('Bot ok');
    }
}


// factory
exports.Bot = Bot;;