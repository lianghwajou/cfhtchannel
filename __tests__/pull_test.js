const request = require("supertest");
const nock = require("nock");
const app = require("../app");

const botApiEndpoint = 'https://api.telegram.org/bot';
const botToken = '12345';
const messageDate = (new Date()).getTime();

describe('unit testing /channel/pull route', function() {
  describe('testing getUpdates', function(){
    beforeAll(function(){
      let fake_deleteWebhook_api = nock(botApiEndpoint+botToken)
          .get('/deleteWebhook')
          .reply(200, {"ok": true, "result": true, "description": "Webhook was deleted"});
      let fake_setWebhook_api = nock(botApiEndpoint+botToken)
          .get('/setWebhook')
          .query(true)
          .reply(200, {"ok": true, "result": true, "description": "Webhook was deleted"});
      let fake_get_updates_api = nock(botApiEndpoint+botToken)
          .get('/getUpdates')
          .query(true)
          .reply(200, {
                        "ok": true,
                        "result":[{
                        "message":{
                          "message_id": 11,
                          "text": "test message 1",
                          "date": messageDate,
                          "from": {
                            "id": 12,
                            "username": "johndoe",
                            "first_name": "John",
                            "last_name": "Doe"
                          },
                          "chat": {
                            "id": 44
                          }
                        }}]});
    });
    // it('should return the html string and setup pull route', async function(){
    // });
    it('should return array of text messages', async function(){
      // const admin_ui_2_response = await request(app)
      //                         .post("/channel/admin_ui_2")
      //                         .send("name=testform&return_url=http://zendesk.com&token="+botToken)
      //                         .set("ACCEPT", "application/x-www-form-urlencoded");
      // expect(admin_ui_2_response.statusCode).toBe(200);

      const pull_response = await request(app)
                              .post("/channel/pull")
                              .send("state={}&metadata={\"token\":\""+botToken+"\"}")
                              .set("ACCEPT", "application/x-www-form-urlencoded");
      expect(pull_response.statusCode).toBe(200);
        
    })
    afterAll(function(){
        
    })
  })
});