/** Called when the Generate button is clicked. */
async function generateRandom() {
	markLoading(true);

	const options = getOptionsFromForm();
	persistOptions(options);

	try {
		const eligiblePokemon = await getEligiblePokemon(options);
		const generatedPokemon = chooseRandom(eligiblePokemon, options);
		addToHistory(generatedPokemon);
		displayPokemon(generatedPokemon);
	} catch (error) {
		console.error(error);
		displayPokemon(null);
	}
	markLoading(false);
}

function onPageLoad() {
	loadOptions();
	toggleHistoryVisibility();
	addFormChangeListeners();
	displayYearsInFooter();
}
document.addEventListener("DOMContentLoaded", onPageLoad);

function displayPokemon(pokemon: GeneratedPokemon[]) {
	const resultsContainer = document.getElementById("results");
	if (!pokemon) {
		resultsContainer.innerHTML = "An error occurred while generating Pok&eacute;mon.";
	} else if (pokemon.length == 0) {
		resultsContainer.innerHTML = "No matching Pok&eacute;mon found.";
	} else {
		resultsContainer.innerHTML = toHtml(pokemon);
	}
}

// Cache the results of getEligiblePokemon by options.
let cachedOptionsJson: string;
let cachedEligiblePokemon: Pokemon[];

async function getEligiblePokemon(options: Options): Promise<Pokemon[]> {
	const optionsJson = JSON.stringify(options);

	if (cachedOptionsJson == optionsJson) {
		return Promise.resolve(cachedEligiblePokemon);
	} else {
		const response = await fetch("dex/" + options.region + ".json");
		if (!response.ok) {
			console.error(response);
			throw Error("Failed to get eligible Pokémon.");
		}
		const pokemonInRegion: Pokemon[] = await response.json();
		const eligiblePokemon = filterByOptions(pokemonInRegion, options);
		cachedOptionsJson = optionsJson;
		cachedEligiblePokemon = eligiblePokemon;
		return eligiblePokemon;
	}
}

function filterByOptions<P extends Pokemon|Form>(pokemonInRegion: P[], options: Options): P[] {
	const evolutionCounts = new Set(options.evolutionCounts);
	const types = new Set(options.types);
	return pokemonInRegion.filter((pokemon: Pokemon | Form) => {
		// Legendary, evolution, and Stadium status are independent of form, so check these before
		// checking forms.
		if (options.stadiumRentals && "isStadiumRental" in pokemon && !pokemon.isStadiumRental) {
			return false;
		}
		if (!options.sublegendaries && "isSubLegendary" in pokemon && pokemon.isSubLegendary) {
			return false;
		}
		if (!options.legendaries && "isLegendary" in pokemon && pokemon.isLegendary) {
			return false;
		}
		if (!options.mythicals && "isMythical" in pokemon && pokemon.isMythical) {
			return false;
		}
		if (options.nfes || options.fullyEvolved) {
			// If neither option is checked, treat it as both being checked.
			if (!options.nfes && "isNfe" in pokemon && pokemon.isNfe) {
				return false;
			}
			if (!options.fullyEvolved && !("isNfe" in pokemon)) {
				return false;
			}
		}
		if (evolutionCounts.size > 0) {
			const evolutionCount = "evolutionCount" in pokemon ? pokemon.evolutionCount : 0;
			if (!evolutionCounts.has(evolutionCount)) {
				return false;
			}
		}
		if (!options.megas && "isMega" in pokemon && pokemon.isMega) {
			return false;
		}
		if (!options.gigantamaxes && "isGigantamax" in pokemon && pokemon.isGigantamax) {
			return false;
		}

		if (options.forms && "forms" in pokemon) {
			// If we are generating with forms and this Pokémon has forms,
			// filter on them instead of the top-level Pokémon.
			pokemon.forms = filterByOptions(pokemon.forms, options);
			return pokemon.forms.length > 0;
		}

		if (types.size > 0 && !pokemon.types.some(type => types.has(type))) {
			return false;
		}

		return true;
	});
}

/** Chooses N random Pokémon from the array of eligibles without replacement. */
function chooseRandom(eligiblePokemon: Pokemon[], options: Options): GeneratedPokemon[] {
	const generated = [];

	// Deep copy so that we can modify the array as needed.
	eligiblePokemon = JSON.parse(JSON.stringify(eligiblePokemon));

	while (eligiblePokemon.length > 0 && generated.length < options.n) {
		const pokemon: Pokemon = removeRandomElement(eligiblePokemon);
		let form = null;

		if (options.forms && pokemon.forms) {
			form = removeRandomElement(pokemon.forms);

			// If we generated a mega, we can't choose any more.
			if (form.isMega) {
				eligiblePokemon = removeMegas(eligiblePokemon);
			}
			if (form.isGigantamax) {
				eligiblePokemon = removeGigantamaxes(eligiblePokemon);
			}
		}

		generated.push(GeneratedPokemon.generate(pokemon, form, options));
	}

	// Megas are more likely to appear at the start of the array,
	// so we shuffle for good measure.
	return shuffle(generated);
}

/** Filters megas from the array. Doesn't mutate the original array. */
function removeMegas(pokemonArray: Pokemon[]): Pokemon[] {
	return pokemonArray.filter((pokemon: Pokemon) => {
		if (pokemon.forms) {
			pokemon.forms = pokemon.forms.filter(form => !form.isMega);
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

/** Filters Gigantamax forms from the array. Doesn't mutate the original array. */
function removeGigantamaxes(pokemonArray: Pokemon[]): Pokemon[] {
	return pokemonArray.filter((pokemon: Pokemon) => {
		if (pokemon.forms) {
			pokemon.forms = pokemon.forms.filter(form => !form.isGigantamax);
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

/** Converts a JSON array of Pokémon into an HTML ordered list. */
function toHtml(pokemon: GeneratedPokemon[]) {
	const includeSprites = spritesCheckbox.checked;
	return `<ol>${pokemon.map(p => p.toHtml(includeSprites)).join("")}</ol>`;
}