const debug = require('debug')('app:message')
const { Config } = require('./config');
// const { Media } = require('./media');

class Message {

	fileUrls;	// array

	constructor (message, answers, tags) {
		this.message = message;
		this.answers = answers;
		if (tags && tags.length) {
			tags = tags.trim();
			this.tags = tags;
		}
		this.processAnswers();
		this.processCmd();
	}

	// static messageList(messages) {
	// 	let list = [];
	// 	for (let message of messages) {
	// 		list.push(new Update(message))
	// 	}
	// 	return list;
	// }

	// static extId (userId, messageId) {
	// 	return `${userId}:${messageId}`;
	// }

	static getChatFromExtId (extId) {
		let ids = extId.split(":");
		return ids[2];
	}

	get text() {
		return this.message.text;
	}

	get messageId () {
		return this.message.message_id.toString();
	}

	get chatId() {
		return this.message.chat.id.toString();
	}

	get userId() {
		return this.message.from.id.toString();
	}

	get username() {
		return this.message.from.username;
	}

	get firstname() {
		return this.message.from.first_name;
	}

	get lastname() {
		return this.message.from.last_name;
	}

	get extUsername () {
		let lastname = (this.lastname) ? this.lastname : "";
		let username = (this.username) ? this.username : "";
		return ((`${this.firstname} ${lastname}`).trim()+` (${username})`);
	}

	get date () {
		// Telegam date is in second
		return this.message.date*1000;
	}

	get dateISO () {
		return (new Date(this.date)).toISOString();
	}

	get extUserId () {
		// let username = (this.username) ? this.username : "";
		return `${Config.botId}:${this.userId}`;
	}

	get extId () {
		let config = Config.config;
		return `${config.instance_push_id}:${config.botId}:${this.chatId}:${this.userId}:${this.messageId}`;
	}

	get entities () {
		return this.message.entities;
	}

	get cmd () {
		return this._cmd;
	}

	set threadHead (threadHead) {
		this._threadHead = threadHead;
	}

	get threadHead () {
		return this._threadHead;
	}

	get threadId () {
		let config = Config.config;
		let threadId = `${config.instance_push_id}:${config.botId}:${this.chatId}:${this.userId}:`;
		if (this.threadHead) {
			threadId += this.threadHead;
		}
		return threadId;
	}

	get photo () {
		return this.message.photo;
	}

	get caption () {
		return this.message.caption;
	}

	get userFields () {
		return this._userFields;
	}

	get ticketFields () {
		return this._ticketFields
	}

	set fileUrls (urls) {
		this.fileUrls = urls;
	}

	get extResource () {
		let resource = {
			external_id: this.extId,
			message: this.text,
			created_at: this.dateISO,
			internal_note: false,
			allow_channelback: true,
			thread_id: this.threadId,
			fields: this.ticketFields,
			author: {
				external_id: this.extUserId,
				name: this.extUsername,
				fields: this.userFields,
			},
		}
		if (!this.text) {
			if (this.caption) {
				resource.message = this.caption;
			} else {
				resource.message = "photos";				
			}
		}
		if (this.fileUrls) {
			resource.file_urls = this.fileUrls;
		}
		debug("extResource resource:", resource);
		return resource;
	}

	pickPhoto (photos) {
		let size = 0;
		let largestPhoto;
		for (let photo of photos) {
			if (photo.file_size > size) {
				largestPhoto = photo;
			}
		}
		return largestPhoto;
	}

	// async processPhoto () {
	// 	if (this.photo) {
	// 		let largestPhoto = this.pickPhoto (this.photo);
	// 		let media = new Media(largestPhoto.file_id);
	// 		let fileObj = await media.download();
	// 		return media.filePath;
	// 	} else {
	// 		return nil;
	// 	}
	// }


	processAnswers () {
		this._userFields = [];
		this._ticketFields = [];
		let answerTagList= [];
		if (this.answers) {
	        for (let answer of this.answers) {
	            switch(answer.form) {
	            case "user":
	                this._userFields.push({
	                    id: answer.fieldId,
	                    value: answer.content                    
	                });
	                break;
	            case "ticket":
	                this._ticketFields.push({
	                    id: answer.fieldId,
	                    value: answer.content                    
	                });
	                if (answer.tags) {
	                	answerTagList.push(answer.tags);
	                }
	                break;
	            }
	        }

		}
		let answerTags = answerTagList.join();
		if (this.tags && answerTags) {
            this.tags = `${this.tags},${answerTags}`;
        } else {
            this.tags = this.tags || answerTags;
        }

		if (this.tags) {
			this._ticketFields.push({
				id: "tags",
				value: this.tags.split(',').map(str=>str.trim())
			});
		}
		debug("processAnswers", this.answers, this.userFields, this.ticketFields);
	}

	processCmd () {
		if (this.entities) {
			for (let entity of this.entities) {
				if (entity.type == "bot_command") {
					switch (this.text.substr(entity.offset, entity.length)) {
						case "/newrequest":
							this._cmd = "newrequest";
							break;
						case "/start":
							this._cmd = "start";
							break;
					}
				}
			}

		}
	}


}

exports.Message = Message;