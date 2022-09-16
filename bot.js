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

    constructor (zendesk) {
        this.#updateId = 0;
        this.#zendesk = zendesk;
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
        let updates = [req.body];
        this.#zendesk.push(this.#buildMessages(updates));
    }

    async sendMessage (chatId, text) {
        let url = `${this.#apiUrl}/sendMessage?chat_id=${chatId}&text=${text}`;
        let response = await fetch(url);
        let data = await response.json();
        let message = data.result;
        let user = message.from;
        return {
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
        };
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
        let updates = data.result;
        return this.#buildMessages(updates);
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