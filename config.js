class Config {

    static _config = {
        name: 'CFHT Telegram Channel Services',
        useWebhook: true,
        botToken: '5492482664:AAF95og2FW79pQ2lfX4tKsBq7qo7ZVuqU20',
        botDomain: 'https://779b-73-223-169-83.ngrok.io',
        botPath: '/cfhtbot',
        botPort: 443,
        botId: '12345',
        redisUrl: 'redis://127.0.0.1:6379'
        };

    static manifest = {
        name: 'CFHTTelegram',
        id: 'org.cfht.integration.zendesk.telegram',
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
    }
}

exports.Config = Config;

// exports.config = config;
// exports.manifest = manifest;