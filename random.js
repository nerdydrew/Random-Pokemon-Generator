const PATH_TO_SPRITES = 'sprites/png/normal/';
const PATH_TO_SHINY_SPRITES = 'sprites/png/shiny/';
const SPRITE_EXTENTION = '.png';




/** Called when the Generate button is clicked. */
function generateRandom() {
	markLoading(true);

	var options = getOptions();
	persistOptions(options);

	getEligiblePokemon(
		options,
		function(eligiblePokemon) {
			var results = document.getElementById("results");
			if (eligiblePokemon) {
				var generatedPokemon = chooseRandom(eligiblePokemon, options);
				var html = htmlifyPokemonArray(generatedPokemon, options);
				results.innerHTML = html;
			} else {
				results.innerHTML = "An error occurred while generating Pok&eacute;mon.";
			}
			markLoading(false);
		}
	);
}
function grabValue(e) {
	return e.value;
}
function getValuesFromIndexPage() {
	const QUERY_AMOUNT = {
		"keys": ["number","n"],
		"values" : [].slice.call(document.querySelectorAll("#n>option")).map(grabValue)
	}
	const QUERY_REGION = {
		"keys": ["region","r"],
		"values" : [].slice.call(document.querySelectorAll("#region>option")).map(grabValue)
	}
	const QUERY_TYPE = {
		"keys": ["type","t"],
		"values" : [].slice.call(document.querySelectorAll("#type>option")).map(grabValue)
	}
	const BOOLEAN_OPTIONS = ["yes","true","no","false"]
	const QUERY_CHECK_UBERS = {
		"keys": ["ubers","u"],
		"values" : BOOLEAN_OPTIONS
	}
	const QUERY_CHECK_NFES = {
		"keys": ["nfes","nf"],
		"values" : BOOLEAN_OPTIONS
	}
	const QUERY_CHECK_SPRITES = {
		"keys": ["sprites","s"],
		"values" : BOOLEAN_OPTIONS
	}
	const QUERY_CHECK_NATURES = {
		"keys": ["natures","na"],
		"values" : BOOLEAN_OPTIONS
	}
	const QUERY_CHECK_FORMS = {
		"keys": ["forms","f"],
		"values" : BOOLEAN_OPTIONS
	}
}
function parseGETtoOptions() {
	// everything which is not given is false
	
	optionmodel = {
		n : "",
		region : "",
		type : "",
		ubers : "false",
		nfes : "false",
		sprites : "false",
		natures : "false",
		forms : "false",
		// default values 
		// ubers : "true",
		// nfes : "true",
		// sprites : "false",
		// natures : "true",
		// forms : "true",
	}
	
	// return {
	// 	n: Number(document.getElementById("n").value),
	// 	region: document.getElementById("region").value,
	// 	type: document.getElementById("type").value,
	// 	ubers: document.getElementById("ubers").checked,
	// 	nfes: document.getElementById("nfes").checked,
	// 	sprites: document.getElementById("sprites").checked,
	// 	natures: document.getElementById("natures").checked,
	// 	forms: document.getElementById("forms").checked
	// };	
}
/**Called when the Webpage is called via GET-Query */
function generateRandomByGET() {

	//parseOptions - Think about XSS
	getEligiblePokemon(
		options,
		function(eligiblePokemon) {
			var results = document.getElementById("results");
			if (eligiblePokemon) {
				var generatedPokemon = chooseRandom(eligiblePokemon, options);
				console.log(generatedPokemon)
				//var html = htmlifyPokemonArray(generatedPokemon, options);
				//results.innerHTML = html;
			} else {
				results.innerHTML = "An error occurred while generating Pok&eacute;mon.";
			}
			markLoading(false);
		}
	);

}

function markLoading(isLoading) {
	document.getElementById("controls").className = isLoading ? "loading" : "";
}

function getOptions() {
	return {
		n: Number(document.getElementById("n").value),
		region: document.getElementById("region").value,
		type: document.getElementById("type").value,
		ubers: document.getElementById("ubers").checked,
		nfes: document.getElementById("nfes").checked,
		sprites: document.getElementById("sprites").checked,
		natures: document.getElementById("natures").checked,
		forms: document.getElementById("forms").checked
	};
}

function setOptions(options) {
	document.getElementById("n").value = options.n;
	document.getElementById("region").value = options.region;
	document.getElementById("type").value = options.type;
	document.getElementById("ubers").checked = options.ubers;
	document.getElementById("nfes").checked = options.nfes;
	document.getElementById("sprites").checked = options.sprites;
	document.getElementById("natures").checked = options.natures;
	document.getElementById("forms").checked = options.forms;
}

// Cache the results of getEligiblePokemon by options.
var cachedOptionsJson;
var cachedEligiblePokemon;

function getEligiblePokemon(options, callback) {
	var optionsJson = JSON.stringify(options);

	if (cachedOptionsJson == optionsJson) {
		callback(cachedEligiblePokemon);
	} else {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() {
			if (request.readyState == XMLHttpRequest.DONE) {
				if (request.status == 200) {
					var pokemonInRegion = JSON.parse(request.responseText);
					var eligiblePokemon = filterByOptions(pokemonInRegion, options);
					cachedOptionsJson = optionsJson;
					cachedEligiblePokemon = eligiblePokemon;
					callback(eligiblePokemon);
				} else {
					console.error(request);
					callback(null);
				}
			}
		};
		request.open("GET", "dex/" + options.region + ".json");
		request.send();
	}
}

function filterByOptions(pokemonInRegion, options) {
	return pokemonInRegion.filter(function (pokemon) {
		if (options.forms && "forms" in pokemon) {
			// If we are generating with forms and this Pokémon has forms,
			// filter on them instead of the top-level Pokémon.
			pokemon.forms = filterByOptions(pokemon.forms, options);
			return pokemon.forms.length > 0;
		}

		if (options.type != "all" && pokemon.types.indexOf(options.type) < 0) {
			return false;
		}

		if (!options.ubers && pokemon.isUber) {
			return false;
		}

		if (!options.nfes && pokemon.isNfe) {
			return false;
		}

		return true;
	});
}

/** Chooses N random Pokémon from the array of eligibles without replacement. */
function chooseRandom(eligiblePokemon, options) {
	var chosenArray = [];

	// Deep copy so that we can modify the array as needed.
	var eligiblePokemon = JSON.parse(JSON.stringify(eligiblePokemon));

	while (eligiblePokemon.length > 0 && chosenArray.length < options.n) {
		var chosen = removeRandomElement(eligiblePokemon);

		if (options.forms && chosen.forms) {
			// Choose a random form, getting its ID from the top level.
			var randomForm = removeRandomElement(chosen.forms);
			randomForm.id = chosen.id;
			chosen = randomForm;

			// If we generated a mega, we can't choose any more.
			if (chosen.isMega) {
				eligiblePokemon = removeMegas(eligiblePokemon);
			}
			if (chosen.isGigantamax) {
				eligiblePokemon = removeGigantamaxes(eligiblePokemon);
			}
		}

		chosenArray.push(chosen);
	}

	// Megas are more likely to appear at the start of the array,
	// so we shuffle for good measure.
	return shuffle(chosenArray);
}

/** Filters megas from the array. Doesn't mutate the original array. */
function removeMegas(pokemonArray) {
	return pokemonArray.filter(function (pokemon) {
		if ("forms" in pokemon) {
			pokemon.forms = pokemon.forms.filter(function (form) {return !form.isMega});
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

/** Filters Gigantamax forms from the array. Doesn't mutate the original array. */
function removeGigantamaxes(pokemonArray) {
	return pokemonArray.filter(function (pokemon) {
		if ("forms" in pokemon) {
			pokemon.forms = pokemon.forms.filter(function (form) {return !form.isGigantamax});
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

/** Converts a JSON array of Pokémon into an HTML ordered list. */
function htmlifyPokemonArray(generatedPokemon, options) {
	var output = "<ol>";
	for (var i=0; i<generatedPokemon.length; i++) {
		output += htmlifyPokemon(generatedPokemon[i], options);
	}
	output += "</ol>";

	return output;
}

/** Converts JSON for a single Pokémon into an HTML list item. */
function htmlifyPokemon(pokemon, options) {
	// http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
	var shiny = Math.floor(Math.random() * 65536) < 16;

	var title = (shiny ? "Shiny " : "") + pokemon.name;
	var classes = "";
	if (shiny) {
		classes += "shiny ";
	}
	if (!options.sprites) {
		classes += "imageless ";
	}

	var out = '<li title="' + title + '" class="' + classes + '">';

	if (options.natures) {
		out += '<span class="nature">' + generateNature() + "</span> ";
	}
	out += pokemon.name;
	if (shiny) {
		out += ' <span class="star">&#9733;</span>';
	}
	if (options.sprites) {
		var sprite = getSpritePath(pokemon, shiny);
		out += ' <img src="' + sprite + '" alt="' + title + '" title="' + title + '" />';
	}

	out += "</li>";

	return out;
}

function getSpritePath(pokemon, shiny) {
	var path = shiny ? PATH_TO_SHINY_SPRITES : PATH_TO_SPRITES;
	var name = pokemon.id;
	if (pokemon.spriteSuffix) {
		name = name + "-" + pokemon.spriteSuffix;
	}
	return path + name + SPRITE_EXTENTION;
}

function generateNature() {
	return getRandomElement(NATURES);
}

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Na&iuml;ve", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];

function getRandomElement(arr) {
	return arr[randomInteger(arr.length)];
}

function removeRandomElement(arr) {
	return arr.splice(randomInteger(arr.length), 1)[0];
}

/** Modern Fisher-Yates shuffle. */
function shuffle(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = randomInteger(i + 1);
		var temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}
	return arr;
}

function randomInteger(maxExclusive) {
	return Math.floor(Math.random() * maxExclusive);
}

const STORAGE_OPTIONS_KEY = "options";

function persistOptions(options) {
	var optionsJson = JSON.stringify(options);
	window.localStorage.setItem(STORAGE_OPTIONS_KEY, optionsJson);
}

function loadOptions() {
	var optionsJson = window.localStorage.getItem(STORAGE_OPTIONS_KEY);
	if (optionsJson) {
		setOptions(JSON.parse(optionsJson));
	}
}

document.addEventListener("DOMContentLoaded", loadOptions);
