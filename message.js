const debug = require('debug')('app:message')
const { Config } = require('./config');
// const { Media } = require('./media');

class Message {

	fileUrls;	// array

	constructor (message, answers) {
		this.message = message;
		this.answers = answers;
		this.processAnswers();
	}

	static messageList(messages) {
		let list = [];
		for (let message of messages) {
			list.push(new Update(message))
		}
		return list;
	}

	static extId (userId, messageId) {
		return `${userId}:${messageId}`;
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
		let username = (this.username) ? this.username : "";
		return ((`${this.firstname} ${this.lastname}`).trim()+` (${username})`);
	}

	get date () {
		return this.message.date;
	}

	get dateISO () {
		return (new Date(this.date)).toISOString();
	}

	get extUserId () {
		return `${Config.botId}:${this.userId}:${this.username}`;
	}

	get extId () {
		return this.constructor.extId(this.userId, this.messageId);
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
			thread_id: this.chatId,
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
	                break;
	            }
	        }

		}
		debug("processAnswers", this.answers, this.userFields, this.ticketFields);
	}


}

exports.Message = Message;