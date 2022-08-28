const HISTORY_SIZE = 64;
const STORAGE_SHINIES_KEY = "shinies";

/** The last HISTORY_SIZE sets of Pokémon to be generated, newest first. */
const latestPokemon: GeneratedPokemon[][] = [];

let displayedIndex: number = -1; // Nothing displayed on first load

function addToHistory(pokemon: GeneratedPokemon[]) {
	latestPokemon.unshift(pokemon);
	while (latestPokemon.length > HISTORY_SIZE) {
		latestPokemon.pop();
	}

	const shinies = getShinies();
	shinies.unshift(...pokemon.filter(p => p.shiny));
	window.localStorage.setItem(STORAGE_SHINIES_KEY, JSON.stringify(shinies));

	displayedIndex = 0;
	toggleHistoryVisibility(shinies);
}

function toggleHistoryVisibility(shinies?: GeneratedPokemon[]) {
	document.getElementById("previous").classList.toggle("hidden", displayedIndex >= latestPokemon.length - 1);
	document.getElementById("next").classList.toggle("hidden", displayedIndex <= 0);

	shinies = shinies ?? getShinies();
	document.getElementById("shinies").innerHTML = shinies.map(p => p.toImage()).join(" ");
	document.getElementById("shiny-toggler").classList.toggle("invisible", shinies.length == 0);
}

function displayPrevious() {
	displayHistoryAtIndex(displayedIndex + 1); // One older
}

function displayNext() {
	displayHistoryAtIndex(displayedIndex - 1); // One newer
}

function displayHistoryAtIndex(index: number) {
	index = Math.max(0, Math.min(index, latestPokemon.length-1));
	displayedIndex = index;
	displayPokemon(latestPokemon[index]);
	toggleHistoryVisibility();
}

/** All encountered shiny Pokémon, newest first. */
function getShinies(): GeneratedPokemon[] {
	const shinies = JSON.parse(window.localStorage.getItem(STORAGE_SHINIES_KEY));
	if (!Array.isArray(shinies)) {
		return [];
	}
	return shinies.map(shiny => GeneratedPokemon.fromJson(shiny));
}

function toggleShinyDisplay() {
	const isInvisible = document.getElementById("shiny-container").classList.toggle("invisible");
	updateShinyTogglerText(!isInvisible);
}

function updateShinyTogglerText(shiniesVisible: boolean) {
	const button = document.getElementById("shiny-toggler");
	if (shiniesVisible) {
		button.innerHTML = button.innerHTML.replace("Show", "Hide");
	} else {
		button.innerHTML = button.innerHTML.replace("Hide", "Show");
	}
}

function clearShinies() {
	if (window.confirm("Are you sure you want to clear your shiny Pokémon?")) {
		window.localStorage.removeItem(STORAGE_SHINIES_KEY);
		document.getElementById("shiny-container").classList.add("invisible");
		toggleHistoryVisibility([]);
		updateShinyTogglerText(false); // Prepare for next time
	}
}