const debug = require('debug')("app:dialog");
const { Survey } = require('./survey');
const survey = new Survey();

class Dialog {

	constructor (value) {
		if (!value) {
			this.state = {
				step: -1,
				retry: 0,
				answers: [],
				message: "",
				reply: "",
				completed: false
			}
		} else {
			this.state = value.state;
		}
		debug("constructor this.state:", this.state);
	}
	
	run () {
		debug("run: state:", this.state);
		this.state.message = "";
		let qre = survey.getQre();
		if (this.state.step == -1) {
			this.nextStep(this.state);
			this.state.message = qre.startMsg + '\n';
		}
		let question = qre.qns[this.state.step];
		debug(`run before message: ${this.state.message}`);
		if (this.state.reply) {
			if (question.validation.test(this.state.reply)) {
				// valid return 
				this.state.answers[this.state.step] = {
					form: question.form,
					fieldId: question.fieldId,
					content: this.state.reply
				};
				this.nextStep(this.state);
			} else {
				if (this.state.retry < question.retry) {
					this.nextTry(this.state);
					this.state.message += question.errorMsg + "\n";
				} else {
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
		} else {
			question = qre.qns[this.state.step];
			this.state.message += question.prompt;
		}
		debug(`run after message: ${this.state.message}`);
		//return {state: this.state};
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
		state.step++;
	}


	// toJSON () {
	// 	return JSON.stringify(this.state);
	// }
}

exports.Dialog = Dialog;