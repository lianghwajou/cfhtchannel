const config = {
    name: 'CFHT Telegram Channel Services',
    botToken: '5492482664:AAF95og2FW79pQ2lfX4tKsBq7qo7ZVuqU20',
    botDomain: 'https://626a-73-223-169-83.ngrok.io',
    botPath: '/cfhtbot',
    botPort: 443,
    botId: '12345'
}

const manifest = {
    name: 'CFHTTelegram',
    id: 'org.cfht.integration.zendesk.telegram',
    version: '1.0.0',
    author: 'Lianghwa Jou',
//    push_client_id: '',
    channelback_files: false,
    create_followup_tickets: true,
    urls: {
        admin_ui: './channel/admin_ui',
        pull_url: './channel/pull',
        channelback_url: './channel/channelback',
//        click_through: './channel/click_through',
//        about_url: './channel/about',
//        dashboard_url: ''
    }

}

exports.config = config;
exports.manifest = manifest;