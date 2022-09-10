const request = require("supertest");
const app = require("../app");

describe("Test Zendesk manifest", () => {
  test("It should response the GET method", async () => {
    const response = await request(app).get("/channel/manifest");
    expect(response.statusCode).toBe(200);
  });
});
