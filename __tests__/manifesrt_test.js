const request = require("supertest");
const configData = require('../data.json');
configData.pathToken="1111";
const app = require("../app");

describe("Test Zendesk manifest", () => {
  test("It should response the GET method", async () => {
    const response = await request(app).get("/1111/channel/manifest");
    expect(response.statusCode).toBe(200);
  });
});
