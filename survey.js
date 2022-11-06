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
			const questions_opts = require("./questions.json");
			let questionnaire;
			if (process.env.NODE_ENV == "dev") {
				questionnaire = questions_opts.dev;
			} else {
				questionnaire = questions_opts.prod;
			}
			let questions = questionnaire.qns;
			for (let question of questions) {
				question.validation = new RegExp(question.validation, "u");
			}
			return questionnaire;
		} catch (e) {
			console.error(e);
		}
	}
}

exports.Survey = Survey;