function getRandomElement<T>(arr: T[]): T {
	return arr[randomInteger(arr.length)];
}

function removeRandomElement<T>(arr: T[]): T {
	return arr.splice(randomInteger(arr.length), 1)[0];
}

/** Modern Fisher-Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = randomInteger(i + 1);
		const temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}
	return arr;
}

function randomInteger(maxExclusive: number): number {
	return Math.floor(Math.random() * maxExclusive);
}

function markLoading(isLoading: boolean) {
	document.getElementById("controls").classList.toggle("loading", isLoading);
}

function setDropdownIfValid(select: HTMLSelectElement, value: string | number) {
	const option: HTMLOptionElement = select.querySelector("[value='" + value + "']");
	if (option) {
		select.value = option.value;
	}
}

function parseBoolean(boolean: string): boolean {
	return boolean.toLowerCase() == "true";
}