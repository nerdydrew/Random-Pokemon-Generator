const HISTORY_SIZE = 10;
const STORAGE_LATEST_KEY = "latestPokemon";
const STORAGE_SHINIES_KEY = "shinies";

/** The last HISTORY_SIZE sets of Pokémon to be generated, oldest first. Stored per session. */
type LatestPokemon = GeneratedPokemon[][];

function addToHistory(pokemon: GeneratedPokemon[]) {
	const latest = getLatestPokemon();
	latest.push(pokemon);
	while (latest.length > HISTORY_SIZE) {
		latest.shift();
	}
	window.sessionStorage.setItem(STORAGE_LATEST_KEY, JSON.stringify(latest));

	const shinies = getShinies();
	shinies.push(...pokemon.filter(p => p.shiny));
	window.localStorage.setItem(STORAGE_SHINIES_KEY, JSON.stringify(shinies));
}

function updateDisplayedHistory(latest?: LatestPokemon, shinies?: GeneratedPokemon[]) {
	latest = latest ?? getLatestPokemon();
	shinies = shinies ?? getShinies();
	//TODO
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

/** All encountered shiny Pokémon, oldest first. */
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