const debug = require('debug')("app:dialog");
const { Survey } = require('./survey');
const survey = new Survey();

class Dialog {

	constructor (value) {
		if (!value) {
			this.reset();
		} else {
			this.state = value.state;
		}
		debug("constructor this.state:", this.state);
	}


	clear () {
		this.state.step = -1;
		this.state.retry = 0;
		this.state.answer = [];
		this.state.message = "";
		this.state.reply = "";
		this.state.errTag = "";
		this.state.completed = false;
	}

	reset () {
		this.state = {
			step: -1,
			retry: 0,
			answers: [],
			message: "",
			reply: "",
			errTag: "",
			form: false,
			completed: false
		}

	}

	generate_tags_from_contents(contents) {
		return contents.replace(/[ ,()]/g, "_");
	}
	
	run () {
		let message = {
			text: ""
		};
		debug("run: state:", this.state);
		this.state.message = "";
		let qre = survey.getQre();
		if (this.state.step == -1) {
			this.nextStep(this.state);
			// this.state.message = qre.startMsg + '\n';
			message.text = qre.startMsg + '\n';
		}
		let question = qre.qns[this.state.step];
		debug(`run before message: ${this.state.message}`);
		if (this.state.reply) {
			if (question.validation.test(this.state.reply)) {
				// valid return 
				let tags = "";
				if (question.addTag) {
					tags = this.generate_tags_from_contents(this.state.reply);
				}
				this.state.answers[this.state.step] = {
					form: question.form,
					fieldId: question.fieldId,
					content: this.state.reply,
					tags: tags
				};
				this.nextStep(this.state);
			} else {
				if (this.state.retry < question.retry) {
					this.nextTry(this.state);
					// this.state.message += question.errorMsg + "\n";
					message.text = question.errorMsg + "\n\n";
				} else {
					this.state.errTag = qre.errTag;
					this.state.answers[this.state.step] = {
						form: question.form,
						fieldId: question.fieldId,
						content: ""
					};
					this.nextStep(this.state);
				}
			}
		}
		if (this.state.step >= qre.qns.length) {
			this.state.completed = true;
			// this.state.message = qre.postMsg;
			message.text = qre.postMsg;
			if (!qre.postMsg) {
				// this.state.message = "";
				message.text = "";
			}
		} else {
			question = qre.qns[this.state.step];
			// this.state.message += question.prompt;
			let results = this.processQuestion(question);
			message.text += results.text;
			message.keyboard = results.keyboard;
		}
		debug(`run after message: ${this.state.message}`);
		return message;
		//return {state: this.state};
	}

	get form () {
		return this.state.form;
	}

	set form (val) {
		this.state.form = val;
	}

	set reply (msg) {
		this.state.reply = msg;
	}

	get isCompleted () {
		return this.state.completed;
	}

	get answers () {
		return this.state.answers;
	}
	
	get errTag () {
		return this.state.errTag;
	}

	get message () {
		return this.state.message;
	}

	get step () {
		return this.state.step;
	}

	get retry () {
		return this.state.retry;
	}

	nextTry (state) {
		state.retry++;
		state.reply = "";
		state.message = "";
	}

	nextStep (state) {
		state.retry = 0;
		state.reply = "";
		state.message = "";
		let qre = survey.getQre();
		let qns = qre.qns;
		while (true) {
			state.step++;
			if (state.step >= qns.length || qns[state.step].form == state.form || !state.form) {
				break;
			}
		}
	}

	processQuestion (question) {
		let col = 2;
		let results = {};
		results.text = question.prompt;
		debug("processQuestion question:", question);
		if (question.type == "select" && question.options) {
			if (question.column) {
				col = question.column;
			}
			let keyboardButtons = [];
			let optionList = question.options;
			for(let idx=0; idx < optionList.length;) {
				let row = [];
				for (let colIdx=0; colIdx < col && idx < optionList.length; idx++, colIdx++) {
					row.push(optionList[idx]);
				}
				debug("processQuestion row:", row);
				keyboardButtons.push(row);
			}
			results.keyboard = keyboardButtons;
		}
		debug("processQuestion results:", results);
		return results;
	}
	// toJSON () {
	// 	return JSON.stringify(this.state);
	// }
}

exports.Dialog = Dialog;