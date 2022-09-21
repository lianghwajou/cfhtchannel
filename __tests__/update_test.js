const { Config } = require("../config");
const { Update } = require("../update");

//jest.mock("../config");
const updateData = {
	update_id: 10,
	message: {
	}
}

describe("Test Update class", ()=>{
	it("Test Update getter/setter", () => {
		Object.defineProperty(Config, "botId", {
			get: jest.fn(()=>"7890")
		});
		const update = new Update(updateData);

		expect(update.updateId).toBe("10");
	});
})