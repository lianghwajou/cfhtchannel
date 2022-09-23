const { Context } = require('../context');

describe("Test Context class", () => {
	it("Test constructor with key only", () => {
		const context = new Context("key");
		expect(JSON.parse(context.json())).toStrictEqual({
			key: "key",
			obj: {}
		})
	})
	it("Test constructor with key and data", () => {
		const data = {key: "key", obj: {prop: "prop"}};
		const dataJson = JSON.stringify(data);
		const context = new Context("wrongkey",dataJson);
		expect(JSON.parse(context.json())).toStrictEqual(data);
	})
	it("Test set/get prop", () => {
		const data = {key: "key", obj: {prop: "prop"}};
		const dataJson = JSON.stringify(data);
		const context = new Context("wrongkey",dataJson);
		const state = {value: "value"};
		context.setProp ("state", state);
		expect(context.getProp("state")).toStrictEqual(state);
	})
})