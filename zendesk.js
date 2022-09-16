const { config, manifest } = require('./config');
const fetch = require('node-fetch');
const pushEndpoint = '/api/v2/any_channel/push'

class Zendesk {

    #bot;
    #botId;
    #name;
    #metadata;
    #metadataStr;
    #state;
    #return_url;
    #subdomain;
    #instance_push_id;
    #zendesk_access_token;
    #locale;

    constructor () {
        this.#botId = '8788277706395';
    }

    set bot(v) {
        if (this.#bot === undefined) {
            this.#bot = v;
        }
    }


    // pull(req, res) {
    //     let body = req.body;
    //     let metadata = body.metadata;
    //     let state  = body.state;

    //     this.#pullMessages (metadata, state, res);
    // }

    // async findUser(author) {
    //     return false;
    // }

    #externalId (userId, messageId) {
        return `telegram:${userId}:${messageId}`;
    }

    #userExtId (userId, username) {
        return `${this.#botId}:${userId}:${username}`;
    }

    #readMetadata (metadataStr) {
        if (metadataStr && !this.#metadata) {
            this.#metadata = JSON.parse(metadataStr);
            this.#instance_push_id = this.#metadata.instance_push_id;
            this.#zendesk_access_token = this.#metadata.zendesk_access_token;
            this.#subdomain = this.#metadata.subdomain;
            this.#setupBot(this.#metadata.token, config.useWebhook);
        }
    }

    #setupBot(token, useWebhook) {
        this.#bot.token = token;
        this.#bot.asyncInit(useWebhook);
    }

    async pull(req, res) {
        this.#readMetadata(req.body.metadata);
        // let metadata = (req.body.metadata)?JSON.parse(req.body.metadata):{};
        // let state = (req.body.state)?JSON.parse(req.body.state):{};
        if (config.useWebhook) {
            res.send({
                external_resources: [],
                // state: JSON.stringify(state),
                metadata_needs_update: false,
                metadata: JSON.stringify(this.#metadata)
            });
        } else {
            let externalResources = await this.#pullMessages ();
            res.send({
                external_resources: externalResources,
                state: JSON.stringify(state),
                metadata_needs_update: false,
                metadata: JSON.stringify(this.#metadata)
            });
        }
    }

    async #pullMessages () {
        let messages =  await this.#bot.getMessages();
        return this.#buildExtResources(messages);
    }

    #buildExtResources (messages) {
        let extResources = [];
        for (var message of messages) {
            let authorName = message.author.first_name +  ' ' + message.author.last_name;
            authorName = authorName.trim() + ' (' + message.author.username + ')'; 
            let extResource = {
                external_id: this.#externalId(message.author.id.toString(),message.id),
                message: message.text,
                created_at: (new Date(message.date)).toISOString(),
                author: {
                    external_id: this.#userExtId(message.author.id, message.author.username),
                    name: authorName,
                    fields: [{id:'text_field_key', value: 'CFHT user'}]
                },
                internal_note: false,
                allow_channelback: true,
                thread_id: message.chat_id.toString(),
                fields: [{id:'text_field', value: 'CFHT'}]
            };
            // let user = this.findUser(message.author);
            // if (user)  {
            //     extResource.thread_id = 'telegram' + message.author.id.toString();
            // }
            extResources.push (extResource);
        }
        return extResources;
    }

    async channelback(req,res) {
        this.#readMetadata(req.body.metadata); 
        let message = await this.#bot.sendMessage(req.body.thread_id, req.body.message);
        res.send({
            external_id: this.#externalId(message.author.id.toString(),message.id),
            allow_channelback: true
        })
    }

    async push (messages) {
        let url = `https://${this.#subdomain}.zendesk.com${pushEndpoint}`;
        let extResources = this.#buildExtResources(messages);
        let body = {
            instance_push_id: this.#instance_push_id,
            external_resources: extResources
        }
        let headers= {'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.#zendesk_access_token
        }
        const response = await fetch(url, {
            method: 'post',
            body: JSON.stringify(body),
            headers: headers
        });
        const data = await response.json();
        console.log(data);
    }

    manifest (res) {
        res.json(manifest);

    }

    healthCheck(redis, res) {
        res.send('Zendesk ok');
    }

    // admin_ui: return a html form for Zendesk to display in account 
    // creation. The form will be submitted to amdin_ui_2 endpoint
    // 
    // Zendesk posts to this endpoint with following parameters in urlencoded format
    // name: optional or account name
    // metadata: optional or stringified json
    // state: optional or stringified json
    // return_url: action url for form generated by admin_ui_2
    // locale:
    // subdomain: subdomain name 
    // instance_push_id: if push_client_id exists in manifest
    // zendeak_access_token: Only if push_client_id exists in manifest
    // It takes metadata from the request an

    admin_ui (req, res) {
        ({
            name:this.#name,
            metadata: this.#metadataStr,
//            state: this.#state,
            return_url: this.#return_url,
            locale: this.#locale,
            subdomain: this.#subdomain,
            instance_push_id: this.#instance_push_id,
            zendesk_access_token: this.#zendesk_access_token
        } = req.body);
        // save metadata as json
        this.#metadata = (this.#metadataStr)?JSON.parse(this.#metadataStr):{};

        //let state = (this.#state)?JSON.parse(this.#state):{};
        this.#metadata.instance_push_id = this.#instance_push_id;
        this.#metadata.zendesk_access_token = this.#zendesk_access_token;
        this.#metadata.subdomain = this.#subdomain;
        if (!this.#name) {
            // New account
            this.#name = config.name;
        }
        if (!this.#metadata.token) {
            this.#metadata.token = '';
        }
console.log("admin_ui metadata=%o", this.#metadata);       
        res.render('admin_ui', {name: this.#name, token: this.#metadata.token, metadata: JSON.stringify(this.#metadata), return_url: this.#return_url}, (err, html) => {
            res.send(html);
        });
    }

    // admin_ui_2: handle form submitted from admin_ui and return a html 
    // form that will be sumitted automatically to return_url
    // 
    // It will submit state, metadata and name
    admin_ui_2 (req, res) {
        let data = req.body;
        this.#metadata = JSON.parse(data.metadata);
        this.#metadata.token = data.token;
        this.#metadataStr = JSON.stringify(this.#metadata);
        let return_url = data.return_url;
        this.#setupBot(this.#metadata.token, config.useWebhook);
        res.render('admin_ui_2', {name: data.name, metadata: this.#metadataStr, return_url: return_url}, (err, html)=>{
            res.send(html);
        })
    }
}

exports.Zendesk = Zendesk;