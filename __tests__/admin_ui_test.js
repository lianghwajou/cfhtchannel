const request = require("supertest");
const app = require("../app");

describe("Test Zendesk admin_ui", () => {
  test("It sends POST with urlencoded data, respond with html string ", async () => {
    const response = await request(app)
                            .post("/channel/admin_ui")
                            .send("name=testform&return_url=http://zendesk.com&metadata="+JSON.stringify({"token":"12345"}))
                            .set("ACCEPT", "application/x-www-form-urlencoded");
    expect(response.statusCode).toBe(200);
  });
});
