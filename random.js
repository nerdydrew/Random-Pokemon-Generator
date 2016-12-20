// Called when the Generate button is clicked. Gets the form info
// and initiates the AJAX request to generate random Pokémon.
function generateRandom() {
	var n = document.getElementById('n').value;
	var ubers = document.getElementById('ubers').checked;
	var nfes = document.getElementById('nfes').checked;
	var natures = document.getElementById('natures').checked;
	var sprites = document.getElementById('sprites').checked;
	var forms = document.getElementById('forms').checked;
	var region = document.getElementById('region').value;
	var type = document.getElementById('type').value;

	var url = "pokemon_list.php?n=" + n + "&ubers=" + ubers + "&nfes=" + nfes + "&natures=" + natures + "&sprites=" + sprites + "&forms=" + forms + "&region=" + region + "&type=" + type;

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 1) {
			document.getElementById("controls").className = "loading";
		}
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById("controls").className = "";
			var randomPokemon = generateRandomPokemon(xmlhttp.responseText);
			document.getElementById("results").innerHTML = htmlifyListOfPokemon(randomPokemon);
			logToAnalytics(url);
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function generateRandomPokemon(eligiblePokemonJson) {
	var eligiblePokemon = JSON.parse(eligiblePokemonJson);
	var n = document.getElementById('n').value;
	var randomIndices = generateDistinctRandomNumbers(eligiblePokemon.length, n);
	var forms = document.getElementById('forms').checked;

	// Keep track so that only one Pokemon can be mega.
	var canBeMega = forms;

	// Generate n random Pokemon.
	var randomPokemon = [];
	randomIndices.forEach(function(index) {
		var pokemon = eligiblePokemon[index];
		if (forms && pokemon.forms) {
			// Pick a random form. Avoid megas, if possible.
			pokemon = getRandomForm(pokemon.forms, false);

			if (pokemon.is_mega == 1) {
				canBeMega = false;
			}
		}

		randomPokemon.push(pokemon);

	});

	if (forms && canBeMega) {
		// Choose a mega if one hasn't already been generated.
		var potentialIndices = getPotentialMegaIndices(eligiblePokemon, randomIndices);
		if (potentialIndices.length > 0) {
			var chosenIndex = getRandomElement(potentialIndices);
			var chosenPokemon = eligiblePokemon[randomIndices[chosenIndex]];
			randomPokemon[chosenIndex] = getRandomForm(chosenPokemon.forms, true);
		}
	}

	return randomPokemon;
}

// Returns a list of indices for the given pokemonList of Pokemon that have mega forms.
function getPotentialMegaIndices(eligiblePokemon, randomIndices) {
	var indices = [];
	for (var i=0; i<randomIndices.length; i++) {
		var forms = eligiblePokemon[randomIndices[i]].forms;
		if (forms) {
			forms.forEach(function(form) {
				if (form.is_mega == 1) {
					indices.push(i);
				}
			})
		}
	}
	return indices;
}

// Returns a random form from the list. Either tries to get or avoids getting a mega,
// depending on favorMegas. An example where we can't avoid a mega: if an Ampharos
// is generated for Dragon types.
function getRandomForm(forms, favorMegas) {
	var preferredMegaValue = favorMegas ? 1 : 0;
	var nonMegaForms = forms.filter(function(form) {
		return (form.is_mega == preferredMegaValue);
	});
	if (nonMegaForms.length > 0) {
		return getRandomElement(nonMegaForms);
	} else {
		return getRandomElement(forms);
	}
}

// Converts a JSON array of Pokémon into an HTML ordered list.
function htmlifyListOfPokemon(generatedPokemon) {
	var output = '<ol>';
	for (i=0; i<generatedPokemon.length; i++) {
		output += htmlifyPokemon(generatedPokemon[i]);
	}
	output += '</ol>';

	return output;
}

// Converts JSON for a single Pokémon into an HTML list item.
function htmlifyPokemon(pokemon) {
	// http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
	var shiny = Math.floor(Math.random() * 65536) < 16;
	var sprites = document.getElementById('sprites').checked;
	var natures = document.getElementById('natures').checked;

	var title = shiny ? 'Shiny ' + pokemon.name : pokemon.name;

	if (sprites) {
		var out = '<li title="' + title + '">';
	} else {
		var out = '<li class="imageless">';
	}

	if (natures) {
		out += '<span class="nature">' + generateNature() + "</span> ";
	}
	out += pokemon.name;
	if (shiny) {
		out += ' <span class="shiny">&#9733;</span>';
	}
	if (sprites) {
		var sprite = getSpritePath(pokemon, shiny);
		out += '<div class="wrapper"><img src="' + sprite + '" alt="' + title + '" title="' + title + '" /></div>';
	}

	out += '</li>';

	return out;
}

function getSpritePath(pokemon, shiny) {
	var path = shiny ? PATH_TO_SHINY_SPRITES : PATH_TO_SPRITES;
	var name = pokemon.id;
	if (pokemon.sprite_suffix) {
		name = name + '-' + pokemon.sprite_suffix;
	}
	return path + name + SPRITE_EXTENTION;
}

function generateNature() {
	return getRandomElement(natures_list);
}

var natures_list = ['Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Na&iuml;ve', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'];

// Generates up to n random numbers from [0, range).
function generateDistinctRandomNumbers(range, n) {
	if (range > 10 * n) {  // 10 is an arbitrarily chosen value
		return generateDistinctRandomNumbersLarge(range, n);
	} else {
		return generateDistinctRandomNumbersSmall(range, n);
	}
}

// Generate distinct random numbers where the possible range is closer
// to the number of elements (n) to generate.
function generateDistinctRandomNumbersSmall(range, n) {
	// Instantiate array of valid numbers
	var valid_numbers = [];
	for (var i=0; i<range; i++) {
		valid_numbers.push(i);
	}

	var generated_numbers = [];
	while (generated_numbers.length < n && valid_numbers.length > 0) {
		var random_index = Math.floor(Math.random()*valid_numbers.length);
		generated_numbers.push(valid_numbers[random_index]);
		valid_numbers.splice(random_index, 1);
	}
	return generated_numbers;
}

// Generate distinct random numbers where the possible range is much
// larger than the number of elements (n) to generate.
function generateDistinctRandomNumbersLarge(range, n) {
	var numbers = [];
	while(numbers.length < n) {
	    var random = Math.floor(Math.random() * range);
	    if (numbers.indexOf(random) < 0) {
			numbers.push(random);
		}
	}
	return numbers;
}

function getRandomElement(arr) {
	return arr[Math.floor(Math.random()*arr.length)];
}
