const request = require("supertest");
const { Dialog } = require("../dialog");

describe("Test dialog engine", () => {
    test("It test start message", async () => {
        let dialog = new Dialog();
        let state = dialog.run();
        // start message plus first question
        expect(state.message).toBe("Start message\nWhat's your name?");
        // first answer
        state.reply = "john";
        // second question
        dialog = new Dialog(state);
        state = dialog.run();
        expect(state.step).toBe(1);
        expect(state.message).toBe("What's your phone number?");
        // second anser (invalid case)
        state.reply = "nnn";
        dialog = new Dialog(state);
        state = dialog.run();

        expect(state.step).toBe(1);
        expect(state.message).toBe("Invalid phone number\nWhat's your phone number?");
        expect(state.retry).toBe(1);
        // second answer (valid)
        state.reply = "18000000000";
        dialog = new Dialog(state);
        state = dialog.run();
        expect(state.step).toBe(2);
        expect(state.message).toBe("What's your destination?");
        expect(state.retry).toBe(0);
        expect(state.completed).toBe(false);
        // third question
        state.reply = "San Francisco";
        dialog = new Dialog(state);
        state = dialog.run();
        expect(state.step).toBe(3);
        expect(state.message).toBe("");
        expect(state.retry).toBe(0);
        expect(state.completed).toBe(true);


    });
});
