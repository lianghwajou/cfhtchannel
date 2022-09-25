const request = require("supertest");
const { Dialog } = require("../dialog");
const { Survey } = require("../survey");
const questionnaire = {
    startMsg: "Start message",
    subject: 2,
    qns: [
        {
            id: "name",
            prompt: "What's your name?",
            type: "text",
            validation: /(?:)/,
            errorMsg: "Invalid name",
            retry: 2,
            form: 'user',
            fieldId: "text_field_key",
        },
        {
            id: "phone",
            prompt: "What's your phone number?",
            type: "text",
            validation: /\d+/,
            errorMsg: "Invalid phone number",
            retry: 2,
            form: 'user',
            fieldId: "text_field_key",
        },
        {
            name: "destination",
            prompt: "What's your destination?",
            type: "text",
            validation: /(?:)/,
            errorMsg: "Invalid destination",
            retry: 2,
            form: 'ticket',
            fieldId: "text_field",
        }
    ]
};

jest.mock("../survey");
jest.spyOn(Survey.prototype, "getQre").mockImplementation(()=>{
    return questionnaire;
})

describe("Test dialog engine", () => {
    test("It test start message", async () => {
        let dialog = new Dialog();
        let state = dialog.run();
        // start message plus first question
        expect(dialog.message).toBe("Start message\nWhat's your name?");
        // first answer
        dialog.reply = "john";
        // second question
        dialog.run();
        expect(dialog.step).toBe(1);
        expect(dialog.message).toBe("What's your phone number?");
        // second anser (invalid case)
        dialog.reply = "nnn";
        dialog.run();

        expect(dialog.step).toBe(1);
        expect(dialog.message).toBe("Invalid phone number\nWhat's your phone number?");
        expect(dialog.retry).toBe(1);
        // second answer (valid)
        dialog.reply = "18000000000";
        dialog.run();
        expect(dialog.step).toBe(2);
        expect(dialog.message).toBe("What's your destination?");
        expect(dialog.retry).toBe(0);
        expect(dialog.isCompleted).toBe(false);
        // third question
        dialog.reply = "San Francisco";
        dialog.run();
        expect(dialog.step).toBe(3);
        expect(dialog.message).toBe("");
        expect(dialog.retry).toBe(0);
        expect(dialog.isCompleted).toBe(true);


    });
});
