// Called when the Generate button is clicked. Gets the form info
// and initiates the AJAX request to generate random Pokémon.
function generateRandom() {
	var n = document.getElementById('n').value;
	var ubers = document.getElementById('ubers').checked;
	var nfes = document.getElementById('nfes').checked;
	var natures = document.getElementById('natures').checked;
	var sprites = document.getElementById('sprites').checked;
	var region = document.getElementById('region').value;
	var type = document.getElementById('type').value;

	var url = "random?n="+n+"&ubers="+ubers+"&nfes="+nfes+"&natures="+natures+"&sprites="+sprites+"&region="+region+"&type="+type;

	if (window.XMLHttpRequest) {
		var xmlhttp = new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}

	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 1) {
			document.getElementById("controls").className = "loading";
		}
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			document.getElementById("controls").className = "";
			document.getElementById("results").innerHTML = htmlifyListOfPokemon(xmlhttp.responseText);
			logToAnalytics(url);
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

// Converts a JSON array of Pokémon into an HTML ordered list.
function htmlifyListOfPokemon(generatedPokemonJson) {
	var generatedPokemon = JSON.parse(generatedPokemonJson);
	var output = '<ol>';
	for (i=0;i<generatedPokemon.length; i++) {
		output += htmlifyPokemon(generatedPokemon[i]);
	}
	output += '</ol>';

	return output;
}

// Converts JSON for a single Pokémon into an HTML list item.
function htmlifyPokemon(pokemon) {
	var title = (pokemon.shiny) ? 'Shiny ' + pokemon.name : pokemon.name;

	if (pokemon.sprite) {
	var out = '<li title="' + title + '">';
	} else {
	var out = '<li class="imageless">';
	}

	if (pokemon.nature) {
		out += '<span class="nature">' + pokemon.nature + "</span> ";
	}
	out += pokemon.name;
	if (pokemon.shiny) {
		out += ' <span class="shiny">&#9733;</span>';
	}
	if (pokemon.sprite) {
		out += '<div class="wrapper"><img src="' + pokemon.sprite + '" alt="' + title + '" title="' + title + '" /></div>';
	}

	out += '</li>';

	return out;
}
