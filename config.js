class Config {

    static _config = {
        name: 'CFHT Telegram Channel Services', // name of the instance (account)
        useWebhook: true,
        botToken: '',
        botDomain: 'https://bot.fht.org',
        botPath: '/cfhtbot',
        botPort: 443,
        botId: '12345',
        redisUrl: 'redis://cfht-bot-redis-cluster.8okdsp.ng.0001.use1.cache.amazonaws.com:6379',
        instance_push_id: "",
        mediaPath: "/media/",
        mediaDir: "/mnt/efs/fs1/media"
        };

    static manifest = {
        name: 'CFHTTelegram',  // name of the integration
        id: 'org.cfht.integration.zendesk.telegram', // id of thentegration
        version: '1.0.0',
        author: 'Lianghwa Jou',
    //    push_client_id: '',
        channelback_files: false,
        create_followup_tickets: true,
        push_client_id: 'cfht_telegram_channel_services',
        urls: {
            admin_ui: '/channel/admin_ui',
            pull_url: '/channel/pull',
            channelback_url: '/channel/channelback',
            event_callback_url: '/channel/event_callback'
    //        click_through: './channel/click_through',
    //        about_url: './channel/about',
    //        dashboard_url: ''
        }

    };


    static get manfest () {
        return this.manifest;
    }

    static get config () {
        return this._config;
    }

    static get botId () {
        return this.config.botId;
    }

    static get botToken () {
        return this.config.botToken;
    }

    static set botToken (token) {
        this.config.botToken = token;
        let parts = token.split(':');
        this.config.botId = parts[0];
//        this.config.botApiEndpoint = this.config.botApiBase + token;
    }

    static update(configData) {
        let config = this.config;
        if (configData) {
            if (configData.subdomain) {
                config.subdomain = configData.subdomain;
            }
            if (configData.instance_push_id) {
                config.instance_push_id = configData.instance_push_id;
            }
            if (configData.zendesk_access_token) {
                config.zendesk_access_token = configData.zendesk_access_token;
            }
            if (configData.pathToken) {
                config.pathToken = configData.pathToken;
            }
            if (configData.botToken) {
                this.botToken = configData.botToken;
            }
        }
    }

}

exports.Config = Config;

// exports.config = config;
// exports.manifest = manifest;
