const questionnaire = {
	startMsg: "Start message",
	subject: 2,
	qns: [
		{
			id: "name",
			prompt: "What's your name?",
			type: "text",
			validation: /(?:)/,
			errorMsg: "Invalid name",
			retry: 2,
			form: 'user',
			fieldId: "",
		},	
		{
			id: "phone",
			prompt: "What's your phone number?",
			type: "text",
			validation: /\d+/,
			errorMsg: "Invalid phone number",
			retry: 2,
			form: 'user',
			fieldId: "",
		},
		{
			name: "destination",
			prompt: "What's your destination?",
			type: "text",
			validation: /(?:)/,
			errorMsg: "Invalid destination",
			retry: 2,
			form: 'user',
			fieldId: "",
		}
	]
};

class Survey{
	getQre () {
		return questionnaire;
	}
}

exports.Survey = Survey;