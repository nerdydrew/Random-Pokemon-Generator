const values = require('./values')
const randomizer = require("../random")
function getRandomPokemonJson(queryparam) {
    let map = getValuesFromConstantValues();
    //api obj contains error and data properties
    let apiObj = randomizer.apiCall(map, queryparam);
    return apiObj;
}

module.exports = {getRandomPokemonJson};



function getValuesFromConstantValues() {
    let QUERY_MAP = new Map();
	let QUERY_AMOUNT = {
		"key" : "n",
		"keys": ["number","n"],
		"values" : values.AMOUNT
	};
	QUERY_AMOUNT.keys.forEach(k => {QUERY_MAP.set(k, QUERY_AMOUNT)});
	let QUERY_REGION = {
		"key" : "region", 
		"keys": ["region","r"],
		"values" : values.REGION
	};
	QUERY_REGION.keys.forEach(k => {QUERY_MAP.set(k, QUERY_REGION)});
	let QUERY_TYPE = {
		"key" : "type",
		"keys": ["type","t"],
		"values" : values.TYPE
	};
	QUERY_TYPE.keys.forEach(k => {QUERY_MAP.set(k, QUERY_TYPE)});
	let BOOLEAN_OPTIONS = ["yes","true","no","false"];
	let QUERY_CHECK_UBERS = {
		"key" : "ubers",
		"keys": ["ubers","u"],
		"values" : values.BOOLEAN_OPTIONS
	};
	QUERY_CHECK_UBERS.keys.forEach(k => {QUERY_MAP.set(k, QUERY_CHECK_UBERS)});
	let QUERY_CHECK_NFES = {
		"key" : ["nfes"],
		"keys": ["nfes","nf"],
		"values" : values.BOOLEAN_OPTIONS
	};
	QUERY_CHECK_NFES.keys.forEach(k => {QUERY_MAP.set(k, QUERY_CHECK_NFES)});
	let QUERY_CHECK_SPRITES = {
		"key": "sprites",
		"keys": ["sprites","s"],
		"values" : values.BOOLEAN_OPTIONS
	};
	QUERY_CHECK_SPRITES.keys.forEach(k => {QUERY_MAP.set(k, QUERY_CHECK_SPRITES)});
	let QUERY_CHECK_NATURES = {
		"key" : "natures",
		"keys": ["natures","na"],
		"values" : values.BOOLEAN_OPTIONS
	};
	QUERY_CHECK_NATURES.keys.forEach(k => {QUERY_MAP.set(k, QUERY_CHECK_NATURES)});
	let QUERY_CHECK_FORMS = {
		"key" : "forms",
		"keys": ["forms","f"],
		"values" : values.BOOLEAN_OPTIONS
	};
	QUERY_CHECK_FORMS.keys.forEach(k => {QUERY_MAP.set(k, QUERY_CHECK_FORMS)});

    return QUERY_MAP;
}

