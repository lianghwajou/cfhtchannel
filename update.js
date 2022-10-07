const { Message } = require('./message');
const { Config } = require('./config');
const config = Config.config;

class Update {

	constructor (update, answers) {
		this.update = update;
		this._message = new Message (update.message, answers, config.tags);
	}

	get updateId () {
		return this.update.update_id.toString();
	}

	get message () {
		return this._message;
	}

	// Take a list of update data and return a list of Update object
	static updateList(updates) {
		let list = [];
		for (let update of updates) {
			list.push(new Update(update))
		}
		return list;
	}

	// Take a list of Update object and return the lastest updateId
	static latestUpdateId (updateList) {
		let updateId = 0;
		for(let update of updateList) {
			if (update.updateId > updateId) {
				updateId = update.updateId
			}
		}
		return updateId;
	}

	// Take a list of Update object and extract a list of message object
	static messageList(updateList) {
		let list = [];
		for (let update of updateList) {
			list.push(update.message);
		}
		return list;
	}
}

exports.Update = Update;