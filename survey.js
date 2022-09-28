const questionnaire = {
	startMsg: "Start message",
	postMsg: "Someone will provide feedback",
	title: 1,
	qns: [
		{
			id: "phone",
			prompt: "What's your phone number?",
			type: "text",
			validation: /\d+/,
			errorMsg: "Invalid phone number",
			retry: 2,
			form: 'user',
			fieldId: "text_field_key",
		},
		{
			name: "destination",
			prompt: "What's your destination?",
			type: "text",
			validation: /(?:)/,
			errorMsg: "Invalid destination",
			retry: 2,
			form: 'ticket',
			fieldId: "text_field",
		}
	]
};

class Survey{
	getQre () {
		return questionnaire;
	}

	get title () {
		if (questionnaire.title >= questionnaire.qns.length) {
			return questionnaire.qns.length - 1;
		} else {
			return questionnaire.title;
		}
	}
}

exports.Survey = Survey;