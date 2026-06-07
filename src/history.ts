const HISTORY_SIZE = 64;
const STORAGE_SHINIES_KEY = "shinies";

/** The last HISTORY_SIZE sets of Pokémon to be generated, newest first. */
const latestPokemon: GeneratedPokemon[][] = [];

let displayedIndex: number = -1; // Nothing displayed on first load

function addToHistory(pokemon: GeneratedPokemon[]) {
	if (!pokemon || pokemon.length == 0) {
		return;
	}
	latestPokemon.unshift(pokemon);
	while (latestPokemon.length > HISTORY_SIZE) {
		latestPokemon.pop();
	}

	const shinies = getShinies();
	shinies.unshift(...pokemon.filter(p => p.shiny));
	window.localStorage.setItem(STORAGE_SHINIES_KEY, JSON.stringify(shinies));

	displayedIndex = 0;
	updateHistoryDisplay(shinies);
}

/**
 * Displays or hides the next and previous buttons, depending on what index of history is viewed.
 * Updates which shiny Pokémon are displayed.
 * @param shinies Which shiny Pokémon have been encountered. If not specified, they will be loaded
 *                from local storage.
 */
function updateHistoryDisplay(shinies?: GeneratedPokemon[]) {
	document.getElementById("previous").classList.toggle("hidden", displayedIndex >= latestPokemon.length - 1);
	document.getElementById("next").classList.toggle("hidden", displayedIndex <= 0);

	shinies = shinies ?? getShinies();
	document.getElementById("shiny-count").innerHTML = String(shinies.length);
	document.getElementById("shinies").innerHTML = "<ol>"
		+ shinies.map(p => p.toHtmlForShinyHistory()).join(" ")
		+ "</ol>";

	const toggleShiniesButton = document.getElementById("shiny-toggler") as HTMLButtonElement;
	toggleShiniesButton.classList.toggle("invisible", shinies.length == 0);
	if (shinies.length == 0 && toggleShiniesButton.classList.contains("is-showing")) {
		toggleContentForButton(toggleShiniesButton);
	}
}

function displayPrevious() {
	displayHistoryAtIndex(displayedIndex + 1); // One older
}

function displayNext() {
	displayHistoryAtIndex(displayedIndex - 1); // One newer
}

function displayHistoryAtIndex(index: number) {
	index = Math.max(0, Math.min(index, latestPokemon.length-1));
	if (index != displayedIndex) {
		displayedIndex = index;
		displayPokemon(latestPokemon[index]);
		updateHistoryDisplay();
	}
}

/** All encountered shiny Pokémon, newest first. */
function getShinies(): GeneratedPokemon[] {
	const shinies = JSON.parse(window.localStorage.getItem(STORAGE_SHINIES_KEY), dateReviver);
	if (!Array.isArray(shinies)) {
		return [];
	}
	return shinies.map(shiny => GeneratedPokemon.fromJson(shiny));
}

function dateReviver(key: string, value: any) {
	if (key == "date" && typeof value == "string") {
		return new Date(value);
	} else {
		return value;
	}
}

function clearShinies() {
	if (window.confirm("Are you sure you want to clear your shiny Pokémon?")) {
		window.localStorage.removeItem(STORAGE_SHINIES_KEY);
		updateHistoryDisplay([]);
	}
}

// Allow swiping to the next or previous pages of history.
document.addEventListener("DOMContentLoaded", () => {
	let touchStartX = 0;
	let touchStartY = 0;
	const resultsElement = document.getElementById("results");
	resultsElement.addEventListener("touchstart", e => {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	});
	resultsElement.addEventListener("touchend", e => {
		const changeX = e.changedTouches[0].screenX - touchStartX;
		const changeY = e.changedTouches[0].screenY - touchStartY;
		// Arbitrary constants to detect a mostly horizontal swipe.
		if (Math.abs(changeX) > 100 && Math.abs(changeX) > 2 * Math.abs(changeY)) {
			if (changeX > 0) {
				displayPrevious();
			} else {
				displayNext();
			}
		}
	});
});