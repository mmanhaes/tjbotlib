/*
Configuration File for DBpedia
User-specific configuration
    ** IMPORTANT NOTE ********************
    * Please ensure you do not interchange your username and password.
    * Hint: Your username is the lengthy value ~ 36 digits including a hyphen
    * Hint: Your password is the smaller value ~ 12 characters
*/ 

exports.conversationWorkspaceId = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'; // replace with the workspace identifier of your conversation

// Create the credentials object for export
exports.credentials = {};

exports.conversation = {};

exports.dbpedia = {
		intents : [
			{name:'Informações Específicas',searcher: 'pt',pageLanguage: 'pt',searchKey : 'dbpedia-owl:abstract', conversation:'Sobre Informações específicas o que tenho é que '},
			{name:'Informações Gerais',searcher: 'pt',pageLanguage: 'pt',searchKey : 'rdfs:comment', conversation:'Sobre Informações gerais o que tenho é que '},
			{name:'Conjuge',searcher: 'pt',pageLanguage: 'en',searchKey : 'dbpprop:conjuge', conversation:'Sobre relacionamento o que sei é que teve os seguintes conjuges '},
			{name:'Local de Nascimento', searcher: 'pt',pageLanguage: 'pt',searchKey : 'dbpedia-owl:birthPlace',conversation:'Sobre o local de nascimento o que sei é que nasceu em '},
			{name:'Profissão', searcher: 'pt',pageLanguage: 'pt',searchKey:'dbpedia-owl:occupation',conversation:'Sobre a profissão o que sei é que seria a de '},
			{name:'Data de Nascimento',searcher: 'en',pageLanguage: 'en',searchKey:'dbo:birthDate',conversation:'A data de nascimento seria '}			
		]		
};

//Watson Natural Language Understanding
//https://www.ibm.com/watson/developercloud/natural-language-understanding.html
exports.credentials.nlu = {
	password: 'XXXXXXXXX',
	username: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
};


// Watson Conversation
// https://www.ibm.com/watson/developercloud/conversation.html
exports.credentials.conversation = {
	password: 'XXXXXXXXX',
	username: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
};

// Watson Speech to Text
// https://www.ibm.com/watson/developercloud/speech-to-text.html
exports.credentials.speech_to_text = {
	password: 'XXXXXXXXX',
	username: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
};

//Watson Language Translator
exports.credentials.language_translator = {
	password: 'XXXXXXXXX',
	username: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
};

// Watson Text to Speech
// https://www.ibm.com/watson/developercloud/text-to-speech.html
exports.credentials.text_to_speech = {
	password: 'XXXXXXXXX',
	username: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
};

