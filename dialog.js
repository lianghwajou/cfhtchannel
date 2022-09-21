const { Survey } = require('./survey');
const survey = new Survey();

class Dialog {

	constructor (state) {
		if (!state) {
			state = {
				step: 0,
				retry: 0,
				answers: [],
				message: "",
				reply: "",
				completed: false
			}
		}
		this.state = state;
	}
	
	run () {
		this.state.message = "";
		let qre = survey.getQre();
		if (!(this.state.step || this.state.retry)) {
			this.state.message = qre.startMsg + '\n';
		}
		let question = qre.qns[this.state.step];
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
					this.state.message += question.errorMsg + "\n";
					this.state.retry++;
				} else {
					this.state.answers[this.state.step] = "";
					this.nextStep(this.state);
				}
			}
		}
		if (this.state.step >= qre.qns.length) {
			this.state.completed = true;
		} else {
			question = qre.qns[this.state.step];
			this.state.reply = '';
			this.state.message += question.prompt;
		}
		return this.state;
	}

	set reply (msg) {
		this.state.reply = nsg;
	}

	isComplete () {
		return this.state,completed;
	}

	answers () {
		return this.state.answers;
	}

	message () {
		return this.state.message;
	}

	state() {
		return this.state;
	}

	nextStep (state) {
		state.retry = 0;
		state.reply = "";
		state.message = "";
		state.step++;
	}
}

exports.Dialog = Dialog;