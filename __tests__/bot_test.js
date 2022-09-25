const debug = require('debug')('test:bot');
const { Bot } = require('../bot');
const { Session } = require('../session');
const session = new Session();
const { Zendesk } = require('../zendesk');
const zendesk = new Zendesk();
const { Dialog } = require('../dialog');
const { Message } = require('../message');
jest.mock('../session');
jest.mock('../zendesk');

let mockDate= "2020-05-12T23:50:21.817Z";
let res = jest.fn();
res.sendStatus = jest.fn();

describe("Test Bot class", ()=>{
	describe("Test botHandler", ()=>{
		beforeEach(()=>{
			jest.clearAllMocks();
		});
		it("process update after dialog is completed", async ()=>{
			let req = {
				body: {
					message: {
						message_id: 10,
						from: {
							id: 20,
							first_name: "john",
							last_name: "doe",
							usernname: "jdoe"
						},
						text: "test",
						date: new Date(mockDate),
						chat: {
							id: 20
						}
					}
				}
			}
			jest.spyOn(Session.prototype, 'retrieve').
				mockImplementation(() => {
					const { Context } = require('../context');
					let context = new Context("5251845982");
					const { Dialog } = require('../dialog');
					const dialog = new Dialog();
					dialog.state.completed = true;
					context.setProp("dialog", dialog);
					return context;
				}
			);

			//zendesk.push = jest.fn();
			let bot = new Bot(zendesk, session);
			bot.sendMessage = jest.fn();
			await bot.botHandler(req,res);
			expect(zendesk.push).toHaveBeenCalled();
			expect(zendesk.push).toHaveBeenCalledWith(new Message(req.body.message));
		})
		it("process update the first time", async ()=>{
			let req = {
				body: {
					message: {
						message_id: 10,
						from: {
							id: 20,
							first_name: "john",
							last_name: "doe",
							usernname: "jdoe"
						},
						text: "test",
						date: new Date(mockDate),
						chat: {
							id: 20
						}
					}
				}
			}
			jest.spyOn(Session.prototype, 'retrieve').
			  mockImplementation(() => {
			    const { Context } = require('../context');
			    let context = new Context("5251845982");
			    return context;
			  }
			);
			Session.prototype.store = jest.fn();
			let bot = new Bot(zendesk, session);
			bot.sendMessage = jest.fn();
			await bot.botHandler(req,res);

			expect(zendesk.push).toBeCalledTimes(0);
			expect(bot.sendMessage).toHaveBeenCalledWith("20", expect.anything());
		})
	})
})