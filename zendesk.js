const debug = require('debug')('app:zendesk')
const { Config } = require('./config');
const config = Config.config;
const fetch = require('node-fetch');
const pushEndpoint = '/api/v2/any_channel/push'
const { Message } = require('./message');

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
    #tags;

    // Got tokens either from constructor or admin_ui
    constructor (subdomain, instance_push_id, zendesk_access_token) {
        this.#subdomain = subdomain;
        this.#instance_push_id = instance_push_id;
        this.#zendesk_access_token = zendesk_access_token;
        this.#botId = '';
    }

    set bot(v) {
        if (this.#bot === undefined) {
            this.#bot = v;
        }
    }

    get subdomain () {
        return this.#subdomain;
    }


    #readMetadata (metadataStr) {
        if (metadataStr && !this.#metadata) {
            this.#metadata = JSON.parse(metadataStr);
            this.#zendesk_access_token = this.#metadata.zendesk_access_token;
            this.#instance_push_id = this.#metadata.instance_push_id;
            this.#subdomain = this.#metadata.subdomain;
            this.#tags = this.#metadata.tags;
            Config.update({tags: this.#metadata.tags, subdomain: this.#subdomain,instance_push_id: this.#instance_push_id,zendesk_access_token: this.#zendesk_access_token,botToken: this.#metadata.botToken});
            if (this.#metadata.botToken) {
                this.#setupBot(this.#metadata.botToken, config.useWebhook);
            }
        }
    }

    #setupBot(token, useWebhook) {
        this.#bot.token = token;
        this.#bot.asyncInit(useWebhook);
    }

    async pull(req, res) {
        try {
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
                let externalResources = [];
                let messages = await this.#bot.getMessages();
                for (let message of messages) {
                    externalResources.push(message.extResource);
                }
                res.send({
                    external_resources: externalResources,
                    // state: JSON.stringify(state),
                    metadata_needs_update: false,
                    metadata: JSON.stringify(this.#metadata)
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    async channelback(req,res) {
        try {
            this.#readMetadata(req.body.metadata); 
            let chatId = Message.getChatFromExtId(req.body.thread_id);
            let results = await this.#bot.sendMessage(chatId, req.body.message);
            if (results.ok) {
                res.send({
                    external_id: results.message.extId,
                    allow_channelback: true
                })
            } else {
                res.send(400);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async push (message) {
        try {
            let extResources = [message.extResource];
            let url = `https://${this.subdomain}.zendesk.com${pushEndpoint}`;
            let body = {
                instance_push_id: this.#instance_push_id,
                external_resources: extResources
            }
            let headers= {'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.#zendesk_access_token
            }
            debug('push url: %o body: %o', url, body);
            const response = await fetch(url, {
                method: 'post',
                body: JSON.stringify(body),
                headers: headers
            });
            const data = await response.json();

            debug('push results:', data);
            return data;
        } catch (e) {
            console.error(e);
        }
    }

    manifest (res) {
        res.json(Config.manifest);
    }

    // Authorative subdomain, insstance_push_id, zendesk_access_token, botToken from Zendesk

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
        // Save received parameters into metadaa.
        if (!this.#name) {
            // New account
            this.#name = config.name;
        }
        if (!this.#metadata.botToken) {
            this.#metadata.botToken = '';
        }
        if (!this.#metadata.tags) {
            this.#metadata.tags = '';
        }
        this.#tags = this.#metadata.tags;
        this.#metadata.instance_push_id = this.#instance_push_id;
        this.#metadata.zendesk_access_token = this.#zendesk_access_token;
        this.#metadata.subdomain = this.#subdomain;
        Config.update({tags: this.#metadata.tags, subdomain: this.#subdomain,instance_push_id: this.#instance_push_id,zendesk_access_token: this.#zendesk_access_token});
        debug("admin_ui", {subdomain:this.#subdomain, instance_push_id:this.#instance_push_id, zendesk_access_token:this.#zendesk_access_token, meta_data:this.#metadata});
        res.render('admin_ui', {name: this.#name, token: this.#metadata.botToken, tags: this.#metadata.tags, metadata: JSON.stringify(this.#metadata), return_url: this.#return_url}, (err, html) => {
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
        this.#metadata.botToken = data.token;
        this.#metadata.tags = data.tags;
        this.#metadataStr = JSON.stringify(this.#metadata);
        this.#tags = data.tags
        let return_url = data.return_url;
        Config.update({botToken: data.token, tags: data.tags});

        this.#setupBot(this.#metadata.botToken, config.useWebhook);
        debug("admin_ui_2",{name: data.name, metadata: this.#metadata});
        res.render('admin_ui_2', {name: data.name, metadata: this.#metadataStr, return_url: return_url}, (err, html)=>{
            res.send(html);
        })
    }
}

exports.Zendesk = Zendesk;