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
            type: "select",
            options: "sfo,sjc,tpe",
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
        let results;
        let dialog = new Dialog();
        results = dialog.run();
        // start message plus first question
        expect(results.text).toBe("Start message\nWhat's your name?");
        // first answer
        dialog.reply = "john";
        // second question
        results = dialog.run();
        expect(dialog.step).toBe(1);
        expect(results.text).toBe("What's your phone number?");
        // second anser (invalid case)
        dialog.reply = "nnn";
        results = dialog.run();

        expect(dialog.step).toBe(1);
        expect(results.text).toBe("Invalid phone number\nWhat's your phone number?");
        expect(dialog.retry).toBe(1);
        // second answer (valid)
        dialog.reply = "18000000000";
        results = dialog.run();
        expect(dialog.step).toBe(2);
        expect(results.text).toBe("What's your destination?");
        expect(results.keyboard).toStrictEqual([["sfo","sjc"],["tpe"]]);
        expect(dialog.retry).toBe(0);
        expect(dialog.isCompleted).toBe(false);
        // third question
        dialog.reply = "San Francisco";
        results = dialog.run();
        expect(dialog.step).toBe(3);
        expect(results.text).toBe("");
        expect(dialog.retry).toBe(0);
        expect(dialog.isCompleted).toBe(true);


    });
});
