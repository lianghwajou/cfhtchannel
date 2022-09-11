const request = require("supertest");
const nock = require("nock");
const app = require("../app");

const botApiEndpoint = 'https://api.telegram.org/bot';
const botToken = '12345';

describe('unit testing /channel/admin_ui_2 route', function() {
  describe('testing deleteWebhook', function(){
    beforeAll(function(){
      let fake_api = nock(botApiEndpoint+botToken)
          .get('/deleteWebhook')
          .reply(200, {"ok": true, "result": true, "description": "Webhook was deleted"});
    })
    it('should return the expected json response', async function(){
      const response = await request(app)
                              .post("/channel/admin_ui_2")
                              .send("name=testform&return_url=http://zendesk.com&token="+botToken)
                              .set("ACCEPT", "application/x-www-form-urlencoded");
      expect(response.statusCode).toBe(200);
        
    })
    afterAll(function(){
        
    })
  })
});