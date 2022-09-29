const questions = require("./questions.json");
let questionnaire = undefined;

class Survey{
	getQre () {
		if (!questionnaire) {
			questionnaire = this.processQuestions();
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
			let questionnaire = require("./questions.json");
			let questions = questionnaire.qns;
			for (let question of questions) {
				question.validation = new RegExp(question.validation);
			}
			return questionnaire;
		} catch (e) {
			console.error(e);
		}
	}
}

exports.Survey = Survey;