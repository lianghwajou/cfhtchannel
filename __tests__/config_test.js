const { Config } = require ("../config");

describe("Test Config class", () => {
	it("Test Config getter/setter", () => {
		Config,manifest = {
	        name: 'CFHTTelegram',
	        id: 'org.cfht.integration.zendesk.telegram',
	        version: '1.0.0',
	        author: 'Lianghwa Jou',
	        channelback_files: false,
	        create_followup_tickets: true,
	        push_client_id: 'cfht_telegram_channel_services',
	        urls: {
	            admin_ui: '/channel/admin_ui',
	            pull_url: '/channel/pull',
	            channelback_url: '/channel/channelback',
	            event_callback_url: '/channel/event_callback'
	        }
	    };
	    Config.config = {
		    name: 'CFHT Telegram Channel Services',
		    useWebhook: true,
		    botToken: '5492482664:AAF95og2FW79pQ2lfX4tKsBq7qo7ZVuqU20',
		    botDomain: 'https://779b-73-223-169-83.ngrok.io',
		    botPath: '/cfhtbot',
		    botPort: 443,
		    botId: '12345',
		    redisUrl: 'redis://alice:foobared@awesome.redis.server:6380'
		};

		Config.botToken = "1234567890:AAF95og2FW79pQ2lfX4tKsBq7qo7ZVuqU20";
		expect(Config.botToken).toBe("1234567890:AAF95og2FW79pQ2lfX4tKsBq7qo7ZVuqU20");
		expect(Config.botId).toBe('1234567890');
		expect(Config.manifest.id).toBe('org.cfht.integration.zendesk.telegram');

	}) 
});