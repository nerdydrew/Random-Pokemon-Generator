const HISTORY_SIZE = 64;
const STORAGE_LATEST_KEY = "latestPokemon";
const STORAGE_SHINIES_KEY = "shinies";

/** The last HISTORY_SIZE sets of Pokémon to be generated, newest first. Stored per session. */
type LatestPokemon = GeneratedPokemon[][];

let displayedIndex: number = -1; // Nothing displayed on first load

function addToHistory(pokemon: GeneratedPokemon[]) {
	const latest = getLatestPokemon();
	latest.unshift(pokemon);
	while (latest.length > HISTORY_SIZE) {
		latest.pop();
	}
	window.sessionStorage.setItem(STORAGE_LATEST_KEY, JSON.stringify(latest));

	const shinies = getShinies();
	shinies.unshift(...pokemon.filter(p => p.shiny));
	window.localStorage.setItem(STORAGE_SHINIES_KEY, JSON.stringify(shinies));

	displayedIndex = 0;
	toggleHistoryVisibility(latest, shinies);
}

function toggleHistoryVisibility(latest?: LatestPokemon, shinies?: GeneratedPokemon[]) {
	latest = latest ?? getLatestPokemon();
	shinies = shinies ?? getShinies();

	document.getElementById("history").classList.toggle("hidden", displayedIndex == null);
	document.getElementById("previous").classList.toggle("hidden", displayedIndex >= latest.length - 1);
	document.getElementById("next").classList.toggle("hidden", displayedIndex <= 0);
}

function displayPrevious() {
	displayHistoryAtIndex(displayedIndex + 1); // One older
}

function displayNext() {
	displayHistoryAtIndex(displayedIndex - 1); // One newer
}

function displayHistoryAtIndex(index: number) {
	const latest = getLatestPokemon();
	index = Math.max(0, Math.min(index, latest.length-1));
	displayedIndex = index;
	displayPokemon(latest[index]);
	toggleHistoryVisibility(latest);
}

function getLatestPokemon(): LatestPokemon {
	const parties = JSON.parse(window.sessionStorage.getItem(STORAGE_LATEST_KEY));
	if (!Array.isArray(parties)) {
		return [];
	}
	return parties
		.map(party => party
			.map((member: Object) => GeneratedPokemon.fromJson(member)));
}

/** All encountered shiny Pokémon, newest first. */
function getShinies(): GeneratedPokemon[] {
	const shinies = JSON.parse(window.localStorage.getItem(STORAGE_SHINIES_KEY));
	if (!Array.isArray(shinies)) {
		return [];
	}
	return shinies.map(shiny => GeneratedPokemon.fromJson(shiny));
}

function clearShinies() {
	window.localStorage.removeItem(STORAGE_SHINIES_KEY);
}