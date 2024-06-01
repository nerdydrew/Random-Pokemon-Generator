const STORAGE_OPTIONS_KEY = "options";

const numberDropdown = document.getElementById("n") as HTMLSelectElement;
const regionDropdown = document.getElementById("region") as HTMLSelectElement;
const typesDropdown = document.getElementById("types");
const allTypesCheckbox: HTMLInputElement = typesDropdown.querySelector("input[value='all']");
const typeCheckboxes: HTMLInputElement[] = Array.from(typesDropdown.querySelectorAll("input:not([value='all'])"));
const legendariesCheckbox = document.getElementById("legendaries") as HTMLInputElement;
const stadiumRentalsCheckbox = document.getElementById("stadiumRentals") as HTMLInputElement;
const nfesCheckbox = document.getElementById("nfes") as HTMLInputElement;
const spritesCheckbox = document.getElementById("sprites") as HTMLInputElement;
const naturesCheckbox = document.getElementById("natures") as HTMLInputElement;
const formsCheckbox = document.getElementById("forms") as HTMLInputElement;

type Options = {
	n: number;
	region: string;
	types: string[];
	legendaries: boolean;
	/**
	 * Whether to only generate Pokémon that can be chosen as rentals. Only relevant for
	 * Stadium 1 and 2 (Kanto and Johto).
	 */
	stadiumRentals: boolean;
	nfes: boolean;
	sprites: boolean;
	natures: boolean;
	forms: boolean;
	generate?: boolean;
}

function getOptionsFromForm(): Options {
	return {
		n: parseInt(numberDropdown.value),
		region: regionDropdown.value,
		types: getSelectedTypes(),
		legendaries: legendariesCheckbox.checked,
		stadiumRentals: stadiumRentalsCheckbox.checked,
		nfes: nfesCheckbox.checked,
		sprites: spritesCheckbox.checked,
		natures: naturesCheckbox.checked,
		forms: formsCheckbox.checked
	};
}

function getSelectedTypes(): string[] {
	return typeCheckboxes
			.filter(checkbox => checkbox.checked)
			.map(checkbox => checkbox.value);
}

function setOptions(options: Partial<Options>) {
	if (options.n != null) {
		setDropdownIfValid(numberDropdown, options.n);
	}
	if (options.region != null) {
		setDropdownIfValid(regionDropdown, options.region);
	}
	if (options.types != null) {
		const types = new Set(options.types);
		typeCheckboxes.forEach(checkbox => {
			// Treat an empty array as every type being selected.
			checkbox.checked = types.has(checkbox.value) || options.types.length == 0;
		});
	}
	if (options.legendaries != null) {
		legendariesCheckbox.checked = options.legendaries;
	}
	if (options.stadiumRentals != null) {
		stadiumRentalsCheckbox.checked = options.stadiumRentals;
	}
	if (options.nfes != null) {
		nfesCheckbox.checked = options.nfes;
	}
	if (options.sprites != null) {
		spritesCheckbox.checked = options.sprites;
	}
	if (options.natures != null) {
		naturesCheckbox.checked = options.natures;
	}
	if (options.forms != null) {
		formsCheckbox.checked = options.forms;
	}
	if (options.generate !== undefined) {
		generateRandom();
	}
}

/** Stores the current options in local storage and in the URL. */
function persistOptions(options: Options) {
	const optionsJson = JSON.stringify(options);
	window.localStorage.setItem(STORAGE_OPTIONS_KEY, optionsJson);

	window.history.replaceState({}, "", "?" + convertOptionsToUrlParams(options));
}

/** Loads options from either the URL or local storage. */
function loadOptions() {
	if (urlHasOptions()) {
		setOptions(convertUrlParamsToOptions());
	} else {
		const optionsJson = window.localStorage.getItem(STORAGE_OPTIONS_KEY);
		if (optionsJson) {
			setOptions(JSON.parse(optionsJson));
		}
	}
}

/** Returns whether or not the URL specifies any options as parameters. */
function urlHasOptions(): boolean {
	const queryString = window.location.href.split("?")[1];
	return queryString && queryString.length > 0;
}

/** Parses options from the URL parameters. */
function convertUrlParamsToOptions(): Partial<Options> {
	const options: Partial<Options> = {};
	const params = new URL(window.location.href).searchParams;
	if (params.has("n")) {
		options.n = parseInt(params.get("n"));
	}
	if (params.has("region")) {
		options.region = params.get("region");
	}
	if (params.has("type")) {
		const type = params.get("type");
		options.types = type == "all" ? [] : [type];
	}
	if (params.has("types")) {
		const types = params.get("types").split(",");
		options.types = types[0] == "all" ? [] : types;
	}
	if (params.has("legendaries")) {
		options.legendaries = parseBoolean(params.get("legendaries"));
	}
	if (params.has("stadiumRentals")) {
		options.stadiumRentals = parseBoolean(params.get("stadiumRentals"));
	}
	if (params.has("nfes")) {
		options.nfes = parseBoolean(params.get("nfes"));
	}
	if (params.has("sprites")) {
		options.sprites = parseBoolean(params.get("sprites"));
	}
	if (params.has("natures")) {
		options.natures = parseBoolean(params.get("natures"));
	}
	if (params.has("forms")) {
		options.forms = parseBoolean(params.get("forms"));
	}
	if (params.has("generate")) {
		options.generate = true;
	}
	return options;
}

/** Returns URL parameters for the given settings, excluding the leading "?". */
function convertOptionsToUrlParams(options: Partial<Options>): string {
	return Object.entries(options)
		.map(function([key, value]) {
			if (Array.isArray(value)) {
				if (key == "types" && value.length == typeCheckboxes.length || value.length == 0) {
					// If all types are selected, store it as "all" for a shorter URL.
					value = "all";
				} else {
					value = value.join(",");
				}
			}
			return encodeURIComponent(key) + "=" + encodeURIComponent(value);
		})
		.join("&");
}

function addFormChangeListeners() {
	regionDropdown.addEventListener("change", toggleStadiumRentalsCheckbox);
	toggleStadiumRentalsCheckbox();
	regionDropdown.addEventListener("change", toggleFormsCheckbox);
	toggleFormsCheckbox();
	toggleDropdownsOnButtonClick();

	allTypesCheckbox.addEventListener("change", toggleAllTypes);
	typeCheckboxes.forEach(checkbox => {
		checkbox.addEventListener("change", handleTypeChange);
	});
	handleTypeChange();
}

function toggleStadiumRentalsCheckbox() {
	const regionOption = regionDropdown.options[regionDropdown.selectedIndex];
	const shouldShow = regionOption?.dataset?.stadium == "true";
	stadiumRentalsCheckbox.parentElement.classList.toggle("invisible", !shouldShow);
}

function toggleFormsCheckbox() {
	const regionOption = regionDropdown.options[regionDropdown.selectedIndex];
	const shouldShow = regionOption?.dataset?.forms != "false";
	formsCheckbox.parentElement.classList.toggle("invisible", !shouldShow);
}

function toggleDropdownsOnButtonClick() {
	// Toggle a dropdown by clicking its button. Also close with the Escape key or
	// by clicking outside of it.

	document.querySelectorAll(".dropdown").forEach(dropdownWrapper => {
		const button = dropdownWrapper.querySelector("button");
		const popup = dropdownWrapper.querySelector(".popup");
		if (popup) {
			button.addEventListener("click", e => {
				popup.classList.toggle("visible");
			});
			document.addEventListener("keydown", event => {
				if (event.keyCode == 27) {
					popup.classList.remove("visible");
				}
			});
			document.addEventListener("click", event => {
				if (event.target instanceof HTMLElement && event.target != button
						&& !popup.contains(event?.target)) {
					popup.classList.remove("visible");
				}
			});
		}
	});
}

function toggleAllTypes() {
	const selectAll = allTypesCheckbox.checked;
	typeCheckboxes.forEach(checkbox => checkbox.checked = selectAll);
	handleTypeChange();
}

function handleTypeChange() {
	// Updates the dropdown button's text and the "all" checkbox's state.
	const selected = getSelectedTypes();
	const allSelected = selected.length == typeCheckboxes.length;

	allTypesCheckbox.checked = selected.length > 0;
	allTypesCheckbox.indeterminate = !allSelected && allTypesCheckbox.checked;

	let displayText;
	if (allSelected || selected.length == 0) {
		displayText = "All Types";
	} else if (selected.length == 1) {
		displayText = typesDropdown.querySelector("input[value='" + selected[0] + "']").parentElement.innerText;
	} else {
		displayText = selected.length + " Types";
	}
	typesDropdown.querySelector("button").innerText = displayText;
}