jest.mock('../session');
const { Session } = require('../session');
jest.spyOn(Session.prototype, 'retrieve').
    mockImplementation(() => {
        const { Context } = require('../context');
        let context = new Context("5251845982");
        context.setProp("dialog", {isCompleted: true});
        return context;
    }
);

const request = require("supertest");
const nock = require("nock");
const app = require("../app");
const { Zendesk } = require("../zendesk");

const botApiEndpoint = 'https://api.telegram.org/bot';
const botToken = '12345';
const messageDate = (new Date()).getTime();
const subdomain = "zyz";
Object.defineProperty(Zendesk, "subdomain", {
    get: jest.fn(()=>dubdomain)
});

describe('unit testing webhook route', function() {
    describe('testing push', function(){
        beforeEach(function(){
            let fake_push_api = nock(`https://${subdomain}.zendesk.com`)
                    .post("/api/v2/any_channel/push")
                    .reply(200, {ok: true});
            let fake_deleteWebhook_api = nock(botApiEndpoint+botToken)
                    .get('/deleteWebhook')
                    .reply(200, {"ok": true, "result": true, "description": "Webhook was deleted"});
            let fake_setWebhook_api = nock(botApiEndpoint+botToken)
                    .get('/setWebhook')
                    .query(true)
                    .reply(200, {"ok": true, "result": true, "description": "Webhook was deleted"});
        });
        it('should return the html string and setup pull route', async function(){
        });
        it('Should push one message to Zendesk', async function(){
            const admin_ui_response = await request(app)
                                                            .post("/channel/admin_ui")
                                                            .send("name=testform&return_url=http://zendesk.com&token="+botToken+"&subdomain="+subdomain)
                                                            .set("ACCEPT", "application/x-www-form-urlencoded");
            expect(admin_ui_response.statusCode).toBe(200);

            const webhook_response = await request(app)
                                                            .post("/cfhtbot")
                                                            .send({
                                                                "update_id": 20306818,
                                                                "message": {
                                                                        "message_id": 98,
                                                                        "from": {
                                                                                "id": 5251845982,
                                                                                "is_bot": false,
                                                                                "first_name": "Lianghwa",
                                                                                "last_name": "Jou",
                                                                                "language_code": "en"
                                                                        },
                                                                        "chat": {
                                                                                "id": 5251845982,
                                                                                "first_name": "Lianghwa",
                                                                                "last_name": "Jou",
                                                                                "type": "private"
                                                                        },
                                                                        "date": 1663128765,
                                                                        "text": "Test32"
                                                                }})
                                                            .set("Content-Type", "application/json");
            expect(webhook_response.statusCode).toBe(200);
                
        })
        afterAll(function(){
                
        })
    })
});