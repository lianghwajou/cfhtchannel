const questions = require("./questions.json");
const questionnaire = {
	startMsg: "Start message",
	postMsg: "Someone will provide feedback",
	title: 1,
	qns: undefined
};

class Survey{
	getQre () {
		if (!questionnaire.qns) {
			questionnaire.qns = this.processQuestions();
		}
		return questionnaire;
	}

	get title () {
		if (questionnaire.title >= questionnaire.qns.length) {
			return questionnaire.qns.length - 1;
		} else {
			return questionnaire.title;
		}
	}

	processQuestions () {
		try {
			let questions = require("./questions.json");
			for (let question of questions) {
				question.validation = new RegExp(question.validation);
			}
			return questions;
		} catch (e) {
			console.error(e);
		}
	}
}

exports.Survey = Survey;