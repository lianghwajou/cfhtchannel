const { config, manifest } = require('./config');

class Zendesk {

    #bot;
    #botToken;

    constructor () {
        
    }

    set bot(v) {
        if (this.#bot === undefined) {
            this.#bot = v;
        }
    }


    pull(req, res) {
        let body = req.body;
        let metadata = body.metadata;
        let state  = body.state;

        this.#pullMessage (metadata, state, res);
    }

    async findUser(author) {
        return false;
    }

    async pull(req, res) {
        let metadata = req.body.metadata;
        let state = req.body.state;
        let externalResources = await this.#pullMessage (metadata, state, res);
        res.send({
            external_resources: externalResources,
            state: state,
            metadata_needs_update: true,
            metadata: metadata
        });
    }

    async #pullMessage (metadata, state, res) {
        let messages =  await this.#bot.getMessages();
        let extResources = [];
        for (var message of messages) {
            let extResource = {
                external_id: 'telegram' + message.author.id.toString() + ':' + message.id,
                message: message.text,
                createdAt: (new Date(message.date)).toISOString(),
                author: {
                    external_id: config.botId+ ':' + message.author.id.toString() + ':',
                    name: message.author.username()
                },
                allowChannelBack: yes,
            };
            let user = this.findUser(message.author);
            if (user)  {
                extResource.thread_id = 'telegram' + message.author.id.toString();
            }
            extResources.push (extResource);
        }
    }

    channelback(req,res) {

    }


    manifest (res) {
        console.log(manifest);
        res.json(manifest);

    }

    healthCheck(redis, res) {
        res.send('Zendesk ok');
    }

    adminUIHtml (token, return_url, warning) {
        let warningStr = '';

        if (warning){
            warningStr = '${warning}<br>';
        }
    }

    admin_ui (req, res) {
        let name = req.body.name;
        let metadata = JSON.parse(req.body.metadata);
        if (!name) {
            // New account
            name = config.name;
        }
        if (!metadata.token) {
            metadata.token = '';
        }
        res.render('admin_ui', {name, token: metadata.token, return_url: req.body.return_url}, (err, html) => {
            console.log(err);
            res.send(html);
        });
    }

    admin_ui_2 (req, res) {
        let data = req.body;
        this.#botToken = data.token;
        let metadata = JSON.stringify({
            token: data.token
        });
        let return_url = data.return_url;
        res.render('admin_ui_2', {name: data.name, metadata, return_url: return_url}, (err, html)=>{
            res.send(html);
        })
    }
}

exports.Zendesk = Zendesk;