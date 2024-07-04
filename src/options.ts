const STORAGE_OPTIONS_KEY = "options";

const numberDropdown = document.getElementById("n") as HTMLSelectElement;
const regionDropdown = document.getElementById("region") as HTMLSelectElement;
const typesDropdown = document.getElementById("types");
const allTypesCheckbox: HTMLInputElement = typesDropdown.querySelector("input[value='all']");
const typeCheckboxes: HTMLInputElement[] = Array.from(typesDropdown.querySelectorAll("input:not([value='all'])"));
const sublegendariesCheckbox = document.getElementById("sublegendaries") as HTMLInputElement;
const legendariesCheckbox = document.getElementById("legendaries") as HTMLInputElement;
const mythicalsCheckbox = document.getElementById("mythicals") as HTMLInputElement;
const paradoxCheckbox = document.getElementById("paradox") as HTMLInputElement;
const ultraBeastCheckbox = document.getElementById("ultraBeast") as HTMLInputElement;
const nfesCheckbox = document.getElementById("nfes") as HTMLInputElement;
const fullyEvolvedCheckbox = document.getElementById("fullyEvolved") as HTMLInputElement;
const unevolvedCheckbox = document.getElementById("unevolved") as HTMLInputElement;
const evolvedOnceCheckbox = document.getElementById("evolvedOnce") as HTMLInputElement;
const evolvedTwiceCheckbox = document.getElementById("evolvedTwice") as HTMLInputElement;
const evolutionCountCheckboxes = [unevolvedCheckbox, evolvedOnceCheckbox, evolvedTwiceCheckbox];
const spritesCheckbox = document.getElementById("sprites") as HTMLInputElement;
const naturesCheckbox = document.getElementById("natures") as HTMLInputElement;
const gendersCheckbox = document.getElementById("genders") as HTMLInputElement;
const formsDropdown = document.getElementById("formsDropdown") as HTMLInputElement;
const formsCheckbox = document.getElementById("forms") as HTMLInputElement;
const megasCheckbox = document.getElementById("megas") as HTMLInputElement;
const gigantamaxesCheckbox = document.getElementById("gigantamaxes") as HTMLInputElement;

type Options = {
	n: number;
	region: string;
	types: string[];
	sublegendaries: boolean;
	/** Whether to include restricted legendaries. */
	legendaries: boolean;
	mythicals: boolean;
	paradoxes: boolean;
	ultraBeasts: boolean;
	/** The number of times a Pokémon has evolved. */
	evolutionCounts: number[];
	nfes: boolean;
	fullyEvolved: boolean;
	sprites: boolean;
	natures: boolean;
	genders: boolean;
	forms: boolean;
	/** Whether to include mega evolutions. Ignored if forms is false. */
	megas: boolean;
	/** Whether to include gigantamax forms. Ignored if forms is false. */
	gigantamaxes: boolean;
	generate?: boolean;
}

function getOptionsFromForm(): Options {
	return {
		n: parseInt(numberDropdown.value),
		region: regionDropdown.value,
		types: getSelectedTypes(),
		sublegendaries: sublegendariesCheckbox.checked,
		legendaries: legendariesCheckbox.checked,
		mythicals: mythicalsCheckbox.checked,
		paradoxes: paradoxCheckbox.checked,
		ultraBeasts: ultraBeastCheckbox.checked,
		evolutionCounts: getEvolutionCounts(),
		nfes: nfesCheckbox.checked,
		fullyEvolved: fullyEvolvedCheckbox.checked,
		sprites: spritesCheckbox.checked,
		natures: naturesCheckbox.checked,
		genders: gendersCheckbox.checked,
		forms: formsCheckbox.checked,
		megas: megasCheckbox.checked,
		gigantamaxes: gigantamaxesCheckbox.checked
	};
}

function getEvolutionCounts(): number[] {
	return evolutionCountCheckboxes
			.filter(checkbox => checkbox.checked)
			.map(checkbox => parseInt(checkbox.value));
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
	if (options.sublegendaries != null) {
		sublegendariesCheckbox.checked = options.sublegendaries;
	}
	if (options.legendaries != null) {
		legendariesCheckbox.checked = options.legendaries;
	}
	if (options.mythicals != null) {
		mythicalsCheckbox.checked = options.mythicals;
	}
	if (options.paradoxes != null) {
		paradoxCheckbox.checked = options.paradoxes;
	}
	if (options.ultraBeasts != null) {
		ultraBeastCheckbox.checked = options.ultraBeasts;
	}
	if (options.evolutionCounts != null) {
		const counts = new Set(options.evolutionCounts);
		evolutionCountCheckboxes.forEach(checkbox => {
			// Treat an empty array as every type being selected.
			checkbox.checked = counts.has(parseInt(checkbox.value)) || options.evolutionCounts.length == 0; //TODO this isn't working?
		});
	}
	if (options.nfes != null) {
		nfesCheckbox.checked = options.nfes;
	}
	if (options.fullyEvolved != null) {
		fullyEvolvedCheckbox.checked = options.fullyEvolved;
	}
	if (options.sprites != null) {
		spritesCheckbox.checked = options.sprites;
	}
	if (options.natures != null) {
		naturesCheckbox.checked = options.natures;
	}
	if (options.genders != null) {
		gendersCheckbox.checked = options.genders;
	}
	if (options.forms != null) {
		formsCheckbox.checked = options.forms;
	}
	if (options.megas != null) {
		megasCheckbox.checked = options.megas;
	}
	if (options.gigantamaxes != null) {
		gigantamaxesCheckbox.checked = options.gigantamaxes;
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
	if (params.has("sublegendaries")) {
		options.sublegendaries = parseBoolean(params.get("sublegendaries"));
	}
	if (params.has("legendaries")) {
		options.legendaries = parseBoolean(params.get("legendaries"));
	}
	if (params.has("mythicals")) {
		options.mythicals = parseBoolean(params.get("mythicals"));
	}
	if (params.has("paradoxes")) {
		options.paradoxes = parseBoolean(params.get("paradoxes"));
	}
	if (params.has("ultraBeasts")) {
		options.ultraBeasts = parseBoolean(params.get("ultraBeasts"));
	}
	if (params.has("evolutionCounts")) {
		options.evolutionCounts = params.get("evolutionCounts")
			.split(",")
			.map(c => parseInt(c));
	}
	if (params.has("nfes")) {
		options.nfes = parseBoolean(params.get("nfes"));
	}
	if (params.has("fullyEvolved")) {
		options.fullyEvolved = parseBoolean(params.get("fullyEvolved"));
	}
	if (params.has("sprites")) {
		options.sprites = parseBoolean(params.get("sprites"));
	}
	if (params.has("natures")) {
		options.natures = parseBoolean(params.get("natures"));
	}
	if (params.has("genders")) {
		options.genders = parseBoolean(params.get("genders"));
	}
	if (params.has("forms")) {
		options.forms = parseBoolean(params.get("forms"));
	}
	if (params.has("megas")) {
		options.megas = parseBoolean(params.get("megas"));
	}
	if (params.has("gigantamaxes")) {
		options.gigantamaxes = parseBoolean(params.get("gigantamaxes"));
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
	toggleDropdownsOnButtonClick();

	regionDropdown.addEventListener("change", toggleFormsVisibility);
	toggleFormsVisibility();

	formsCheckbox.addEventListener("change", toggleFormSubtypes);
	toggleFormSubtypes();

	document.querySelectorAll("input[type='checkbox'][data-select-all='true']").forEach(checkbox => {
		checkbox.addEventListener("change", selectAll);
	});

	document.querySelectorAll(".dropdown").forEach((dropdown: HTMLElement) => {
		updateDropdownTitle(dropdown);
		dropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
			checkbox.addEventListener("change", () => updateDropdownTitle(dropdown));
		});
	});
}

function toggleFormsVisibility() {
	const regionOption = regionDropdown.options[regionDropdown.selectedIndex];
	const shouldShow = regionOption?.dataset?.forms != "false";
	formsDropdown.classList.toggle("invisible", !shouldShow);
}

function toggleFormSubtypes() {
	megasCheckbox.disabled = !formsCheckbox.checked;
	gigantamaxesCheckbox.disabled = !formsCheckbox.checked;
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

function selectAll(event: Event) {
	if (!(event.target instanceof HTMLInputElement)) {
		return;
	}
	const selectAll = event.target.checked;
	const container = event.target.closest(".popup");
	container.querySelectorAll("input[type='checkbox']:not([data-select-all]")
		.forEach((checkbox: HTMLInputElement) => checkbox.checked = selectAll);
}

function updateDropdownTitle(dropdownContainer: HTMLElement) {
	const button = dropdownContainer.querySelector("button");
	const selectAllCheckbox: HTMLInputElement = dropdownContainer.querySelector("input[type='checkbox'][data-select-all='true']");
	const allCheckboxes: HTMLInputElement[] = Array.from(dropdownContainer.querySelectorAll("input[type='checkbox']:not([data-select-all]"));
	const selectedCheckboxes: HTMLInputElement[] = allCheckboxes.filter(checkbox => checkbox.checked && !checkbox.disabled);
	const allAreSelected = selectedCheckboxes.length == allCheckboxes.length;
	const allowNoSelection = !!button.dataset.allowNone;
	const pluralName = button.dataset.pluralName;

	// Update the "select all" checkbox if one exists.
	if (selectAllCheckbox) {
		selectAllCheckbox.checked = selectedCheckboxes.length > 0;
		selectAllCheckbox.indeterminate = !allAreSelected && selectAllCheckbox.checked;
	}

	// Update the text on the title button.
	let displayText;
	if (allowNoSelection && selectedCheckboxes.length == 0) {
		displayText = "No " + pluralName;
	} else if (allAreSelected || selectedCheckboxes.length == 0) {
		displayText = button.dataset.allName ?? ("All " + pluralName);
	} else if (selectedCheckboxes.length == 1) {
		displayText = getNameForCheckbox(selectedCheckboxes[0]);
	} else if (button.dataset.allowShowingTwo && selectedCheckboxes.length == 2) {
		displayText = getNameForCheckbox(selectedCheckboxes[0]) + ", " + getNameForCheckbox(selectedCheckboxes[1]);
	} else {
		const nameForCount = button.dataset.nameForCount ?? pluralName;
		displayText = selectedCheckboxes.length + " " + nameForCount;
	}
	button.innerText = displayText;
}

function getNameForCheckbox(checkbox: HTMLInputElement) {
	if (checkbox.dataset.shortName) {
		return checkbox.dataset.shortName;
	} else {
		return checkbox.parentElement.innerText;
	}
}