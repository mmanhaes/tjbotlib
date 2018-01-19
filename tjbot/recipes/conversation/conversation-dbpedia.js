/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TJBot = require('tjbot');
var config = require('./config.default');
var language = 'pt';
var nlu = require('../nlu/nlu');
var dbpedia = require('../dbpedia/dbpedia');
var dbpedia_config = config.dbpedia;

//obtain our credentials from config.js
var credentials = config.credentials;

//obtain user-specific config
const WORKSPACEID = config.conversationWorkspaceId;

//Program Control Variables

const SPEAK_ACTION = "SPEAK";

const NO_SPEAK_ACTION = "NO_SPEAK";

const DBPEDIA_LINK = "DBPEDIA_LINK";

const NO_RESPONSE = "Não encontrei nada para a sua pergunta, poderia refazer sua pergunta?";

const PERSON_TAG = "<person>";

const PORTUGUESE_PADDING = "Estou falando em português, por favor entenda a sentença ";

console.log("Using workspace ID "+WORKSPACEID);

//these are the hardware capabilities that TJ needs for this recipe
var hardware = ['microphone', 'speaker'];

//set up TJBot's configuration
var tjConfig = {
		log: {
			level: 'verbose'
		},
		robot: {        
			name: 'fernanda',
			gender: 'female'
		},
		wave: {
			servoPin: 7 // corresponds to BCM 7 / physical PIN 26
		},
		listen: {
			microphoneDeviceId: "plughw:1,0", // plugged-in USB card 1, device 0; see arecord -l for a list of recording devices
			inactivityTimeout: -1, // -1 to never timeout or break the connection. Set this to a value in seconds e.g 120 to end connection after 120 seconds of silence
			language: 'pt-BR' // see TJBot.prototype.languages.listen
		},
		speak: {
			language: 'pt-BR', // see TJBot.prototype.languages.speak
			voice: undefined, // use a specific voice; if undefined, a voice is chosen based on robot.gender and speak.language
			speakerDeviceId: "plughw:0,0" // plugged-in USB card 1, device 0; see aplay -l for a list of playback devices
		}
};

//instantiate our TJBot!
var tj = new TJBot(hardware, tjConfig, credentials);

if (language === 'en'){
	console.log("You can ask me to introduce myself or tell you a joke.");
	console.log("Try saying, \"" + tj.configuration.robot.name + ", please introduce yourself\" or \"" + tj.configuration.robot.name + ", who are you?\"");
	console.log("You can also say, \"" + tj.configuration.robot.name + ", tell me a joke!\"");
}
if (language === 'pt'){
	//console.log("Sempre use o nome do Robo inicialmente, antes de perguntar e pergunte sobre a materia ou o professor !");
	//console.log("Tente dizer, \"" + tj.configuration.robot.name + ", Apresente-se\" or \"" + tj.configuration.robot.name + ", quem é voce?\"");
	//console.log("Voce também pode dizer, \"" + tj.configuration.robot.name + ", Fale sobre a matéria\"");
	//console.log("Ou ainda Voce também pode dizer, \"" + tj.configuration.robot.name + ", Fale sobre o professor\"");
}

//listen for utterances with our attentionWord and send the result to
//the Conversation service

function getQueryConfig(intentKey,callback){
	//Search on intents in config to match which intent and returns the SPARQL and the words around response
	for (var i=0;i<dbpedia_config.intents.length;++i){
		console.log(JSON.stringify(dbpedia_config.intents[i].name));
		console.log(JSON.stringify(dbpedia_config.intents[i].searchKey));
		console.log(intentKey);
		if (JSON.stringify(dbpedia_config.intents[i].name) === intentKey)
		{
			return callback(dbpedia_config.intents[i],false);
		}	
	}	
	return callback(null,true);
}

function buildDBPediaURLFromSPARQLQuery(person,callback){
	
	dbpedia.searchForDocs(person,function(error, response, body){
		//console.log('statusCode:', response && response.statusCode);
		if (error){
			console.log("Error in search for Docs : "+error);
			return callback(true,null);					
		}
		else {
			if (response != null && response.statusCode === 200) {
				console.log("Process with Success !");
				body = JSON.parse(body);
				if (body.results.bindings.length === 0)
				{
					console.log("No Body Content");
					return callback(true,null);
				}
				else{
					console.log("Formatting the response with body "+JSON.stringify(body));
					dbpedia.formatResponseSearchForDocs(body,'pt',function(data){	        	
						console.log("DB pedia Link : "+JSON.stringify(data));
						return callback(null,data);
					});
				}
			}
			else{
				return callback(true,null);
			}
		}
	});
		
}

function formatPerson(input,callback){
	if (input.toLowerCase().startsWith("de ") || input.toLowerCase().startsWith("do ") || input.toLowerCase().startsWith("da "))
	   return callback(input.substring(3,input.length));

	return callback(input);
}

function buildPersonFromKeyword(turn,callback){
	nlu.keywordsText(credentials.nlu.username, credentials.nlu.password,PORTUGUESE_PADDING+turn,function(err,response){
		if (err){
			console.log("error:", err);
			return callback(err,null);
		}	
		else{
			console.log("NLU Keywords of "+turn+" response "+JSON.stringify(response));
			if (response.keywords.length === 0 ||typeof response.keywords[0].text === 'undefined') 
			{  
				console.log("no Person Entity Found");
				return callback(true,null);
			}		
			else //Entity found
			{
				console.log("Person Entity Found");
				formatPerson(response.keywords[0].text,function(possiblePerson){
					return callback(false,possiblePerson);
				});			
			}
		}
	});			
}

function buildPersonFromEntity(turn,callback){
	nlu.entitiesText(credentials.nlu.username, credentials.nlu.password,PORTUGUESE_PADDING+turn,function(err,response){
		if (err){
			console.log("error:", err);
			return callback(err,null);
		}	
		else{
			console.log("NLU Entities of "+turn+" response "+JSON.stringify(response));
			if (response.entities.length === 0 || typeof response.entities[0].type === 'undefined' || response.entities[0].type !== 'Person')
			{  
				console.log("no Person Entity Found");
				return callback(true,null);
			}		
			else //Entity found
			{
				console.log("Person Entity Found");
				formatPerson(response.entities[0].text,function(possiblePerson){
					return callback(false,possiblePerson);
				});				
			}
		}
	});			
}

function formatResponsePrefix(responsePrefix,person){
	if (responsePrefix.indexOf(PERSON_TAG) !== -1){
		return responsePrefix.trim().replace(PERSON_TAG,person);
	}
	else{
		return responsePrefix.trim();
	}
}

function transformQuestion(input,intent,callback){
	var tokens = input.split(" ");
	input = "";
	for (var i=0;i<tokens.length;++i){
		if (tokens[i] !== "é" && tokens[i] !== "e" && tokens[i] !== "de" && tokens[i] !== "do" && tokens[i] !== "da"){
			input += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1)+ " "; 
		}
		else{
			input += tokens[i]+" "; 
		}		
	}		
	
	if (intent !== null)
		return callback(input.trim().replace(intent," "));
	else
		return callback(input.trim());
}

function collectPersonFromQuestion(turn,intent,callback){
		transformQuestion(turn,intent,function(text){
			console.log("Text capitalized on each keyword "+text);
			buildPersonFromEntity(text,function(err,possiblePerson){	
				if (err)
				{  
				  return callback(SPEAK_ACTION,NO_RESPONSE);
				}								
				buildDBPediaURLFromSPARQLQuery(possiblePerson,function(error,responseSPARQL){	
					if (error){
						return callback(SPEAK_ACTION,NO_RESPONSE,null);
					}
					else{
						return callback(DBPEDIA_LINK,responseSPARQL,possiblePerson);
					}
				});		
			});
		});	
}


function verifyIntentsAndDefineActions(turn,response,callback){
	console.log("verifyIntentsAndDefineActions...");

	//Verify Intents first for general actions
	if (typeof response.object.intents[0] !== 'undefined' && response.object.intents[0].intent !== "Assuntos"){
		return callback(SPEAK_ACTION,response.description);			
	}
	else{
		
	    	    // if is ready to process the questions, it will check the entities
		    if (typeof response.object.entities[0] !== 'undefined'){
			    var entity = response.object.entities[0].value;
		   	 switch(entity){
				case "Informações Gerais":
					collectPersonFromQuestion(turn,response.object.entities[0].entity,function(action,data,person){
						return callback(action,data,person);
					});
					break;
				case "Profissão":		   
					collectPersonFromQuestion(turn,response.object.entities[0].entity,function(action,data,person){
						return callback(action,data,person);
					});
					break;
				case "Informações Específicas":
					collectPersonFromQuestion(turn,response.object.entities[0].entity,function(action,data,person){
						return callback(action,data,person);
					});
					break;
				case "Data de Nascimento":
					collectPersonFromQuestion(turn,response.object.entities[0].entity,function(action,data,person){
						return callback(action,data,person);
					});
					break;
				case "Local de Nascimento":
					collectPersonFromQuestion(turn,response.object.entities[0].entity,function(action,data,person){
						return callback(action,data,person);
					});
					break;
				default:
				       console.log('Nenhuma entidade verificada');
				       return callback(SPEAK_ACTION,NO_RESPONSE,null);			
		    	    }
		    }
		    else {
			if (response.description !== ''){
				return callback(SPEAK_ACTION,response.description);
			}
			else{
				return callback(SPEAK_ACTION,NO_RESPONSE);
			}
		    }		
	}
}


var buildTJBotResponse = function (logData,response){
	if (response !== "" && response.description !== ""){
		console.log(logData);
		tj.speak(response);		
		console.log('Mensagem Enviada do speaker');
	}
	else
	{	
		console.log("Mensagem Vazia ao Speaker");
	}
	return 'OK';
}


tj.converse(WORKSPACEID, "", function(response) {
	var resp = buildTJBotResponse("Enviando mensagem ao Speaker de inicialização "+response.description,response.description);
	console.log('Inicializando a conversação '+resp);	
});

tj.listen(function(turn){
		console.log("Sending message "+turn.trim()+ " to conversation");
	
		tj.converse(WORKSPACEID, turn.trim(), function(response) {
	
			console.log("Response from Conversation: "+JSON.stringify(response));
	
			verifyIntentsAndDefineActions(turn,response,function(action,data,person){
				console.log(' Action to be executed: '+action);
				switch(action) {			
				case SPEAK_ACTION:
					buildTJBotResponse("Conversação Normal - action "+action,data);   				
					break;
				case DBPEDIA_LINK:
					console.log("DBPedia link found");
					var dbpediaURL = data;
					var entity = response.object.entities[0].value;
					getQueryConfig(JSON.stringify(entity),function(queryResp,notFound){
						if (notFound===false)
						{							
							console.log("Config for intent found "+JSON.stringify(queryResp));
							var responseMsg = formatResponsePrefix(response.description,person);
							dbpedia.searchInDoc(queryResp.searcher,queryResp.pageLanguage,dbpediaURL,queryResp.searchKey,function callback(error, response, body){
								console.log('statusCode:', response && response.statusCode);
								if (error){
									buildTJBotResponse("error: "+error,NO_RESPONSE);
								}
								else 
									if (response.statusCode === 200) {
										console.log("Process with Success !");
										body = JSON.parse(body);
										console.log("Formatting the response ");
										dbpedia.formatResponseSearchInDoc(body,function(data){	        	
											console.log("Sending a response with query intent " +JSON.stringify(entity)+" MSG: "+responseMsg);
											for(var i=0;i<data.length;++i){
												if (data[i]!==""){
													if (queryResp.searchKey === 'dbo:birthDate'){
														dbpedia.formatDatesToSpell(data[i],function(resp){
															responseMsg+=" "+resp;
														});	
														break;
													}	
													else{	
														if (i===0)
														   responseMsg+=" "+data[i];
														else
														   responseMsg+=", "+data[i];
													}		
												}	
											}
											 if (responseMsg.trim() !== response.description){
												if (responseMsg.trim().length > 200){
													tj.enableStopListening();
												}
												buildTJBotResponse(responseMsg,responseMsg);																					
											 }
											 else{
												buildTJBotResponse("Not found any search results in DB pedia",NO_RESPONSE);
											 }
										});
									}								
							});
						} 
						else{
							//Speak no Intent found for the question or no response
							buildTJBotResponse("Not found any keys for the turn "+turn+ " and the intent "+JSON.stringify(response.object.intents[0].intent),NO_RESPONSE);	
						}
					});	
					break;
				case NO_SPEAK_ACTION:
					console.log("No action to be executed");
					break;
				} 
			});
		});
});






