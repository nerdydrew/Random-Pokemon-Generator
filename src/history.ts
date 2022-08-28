const HISTORY_SIZE = 10;
const STORAGE_HISTORY_KEY = "history";

interface GenerationHistory {
	/** The last HISTORY_SIZE sets of Pokémon to be generated, latest first. */
	latest: GeneratedPokemon[][];
	/** The last shiny of each Pokémon to have been encountered. */
	shinies: {[id: number]: GeneratedPokemon};
}

function addToHistory(pokemon: GeneratedPokemon[]) {
	const history = getHistoryFromLocalStorage();
	history.latest.unshift(pokemon);
	while (history.latest.length > HISTORY_SIZE) {
		history.latest.pop();
	}
	for (const shiny of pokemon.filter(p => p.shiny)) {
		history.shinies[shiny.id] = shiny;
	}
	window.localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
	updateDisplayedHistory(history);
}

function updateDisplayedHistory(history?: GenerationHistory) {
	if (!history) {
		history = getHistoryFromLocalStorage();
	}
	console.log(history); //TODO
}

function getHistoryFromLocalStorage(): GenerationHistory {
	const history: GenerationHistory = {latest: [], shinies: {}};
	const json = JSON.parse(window.localStorage.getItem(STORAGE_HISTORY_KEY));
	if (!json) {
		return history;
	}
	history.latest = json.latest;
	for (const [id, shinyJson] of Object.entries(json.shinies)) {
		history.shinies[Number(id)] = GeneratedPokemon.fromJson(shinyJson);
	}
	return history;
}

function clearHistory() {
	window.localStorage.removeItem(STORAGE_HISTORY_KEY);
	updateDisplayedHistory();
}