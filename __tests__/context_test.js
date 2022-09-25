const { Context } = require('../context');
const { Dialog } = require('../dialog');

describe("Test Context class", () => {
	it("Test constructor with key only", () => {
		const context = new Context("key");
		expect(JSON.parse(JSON.stringify(context))).toStrictEqual({
			data: {
				key: "key",
				obj: {}
			}
		})
	})
	it("Test constructor with key and data", () => {
		const data = {data: {key: "key", obj: {dialog: new Dialog()}}};
		const dataJson = JSON.stringify(data);
		const context = new Context("wrongkey",dataJson);
		expect(context.data).toStrictEqual(data.data);
	})
	it("Test set/get prop", () => {
		const dialog = new Dialog();
		const context = new Context("wrongkey");
		context.setProp ("dialog", dialog);
		expect(context.getProp("dialog")).toStrictEqual(dialog);
	})
})