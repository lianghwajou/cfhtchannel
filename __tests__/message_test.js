const { Config } = require("../config");
const { Message } = require("../message");

//jest.mock("../config");
Config.config.instance_push_id="1111";
Config.botToken = "2222:aaaa";

const messageData = {
	message_id: 20,
	from: {
		id: 30,
		first_name: "John",
		last_name: "Doe",
		username: "jdoe",
	},
	date: new Date("2020-05-12T23:50:21.817Z"),
	chat: {
		id: 30
	},
	text: "test1",
	entities: []
}

const answerData = [{
	form: "user",
	fieldId: "passport",
	content: "abcde"
	}, {
	form: "ticket",
	fieldId: "family",
	content: "5"

	}
];

describe("Test Message class", ()=>{
	it("Test Message getter/setter without answers", () => {
		Object.defineProperty(Config, "botId", {
			get: jest.fn(()=>"7890")
		});
		const message = new Message(messageData);

		expect(message.text).toBe("test1");
		expect(message.messageId).toBe("20");
		expect(message.extUsername).toBe("John Doe (jdoe)");
		expect(message.extId).toBe("1111:2222:30:30:20");
		expect(message.extUserId).toBe("7890:30:jdoe");
		expect(message.extResource).toStrictEqual({
			external_id: "1111:2222:30:30:20",
			message: "test1",
			created_at: "2020-05-12T23:50:21.817Z",
			internal_note: false,
			allow_channelback: true,
			thread_id: "30",
			fields: [],
			author: {
				external_id: "7890:30:jdoe",
				name: "John Doe (jdoe)",
				fields: []
			}
		});

	});
	it("Test Message getter/setter with answers", () => {
		// const mockBotId = jest.fn().mockReturnValue("12345");
		// Config.botId = mockBotId;
		// Failed to mock static getter
		// jest.spyOn(Config, "botToken", "get").mockReturnValue(()=>{return "7890"});
		Object.defineProperty(Config, "botId", {
			get: jest.fn(()=>"7890")
		});

		const message = new Message(messageData, answerData);
		expect(message.extResource).toStrictEqual({
			external_id: "1111:2222:30:30:20",
			message: "test1",
			created_at: "2020-05-12T23:50:21.817Z",
			internal_note: false,
			allow_channelback: true,
			thread_id: "30",
			fields: [{id: "family", value: "5"}],
			author: {
				external_id: "7890:30:jdoe",
				name: "John Doe (jdoe)",
				fields: [{id: "passport", value: "abcde"}]
			}
		});

	});

})