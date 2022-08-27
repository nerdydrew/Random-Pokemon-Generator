const STORAGE_OPTIONS_KEY = "options";

type Options = {
	n: number;
	region: string;
	type: string;
	legendaries: boolean;
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
		type: typeDropdown.value,
		legendaries: legendariesCheckbox.checked,
		nfes: nfesCheckbox.checked,
		sprites: spritesCheckbox.checked,
		natures: naturesCheckbox.checked,
		forms: formsCheckbox.checked
	};
}

function setOptions(options: Partial<Options>) {
	if (options.n != null) {
		setDropdownIfValid(numberDropdown, options.n);
	}
	if (options.region != null) {
		setDropdownIfValid(regionDropdown, options.region);
	}
	if (options.type != null) {
		setDropdownIfValid(typeDropdown, options.type);
	}
	if (options.legendaries != null) {
		legendariesCheckbox.checked = options.legendaries;
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
		options.type = params.get("type");
	}
	if (params.has("legendaries")) {
		options.legendaries = parseBoolean(params.get("legendaries"));
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
			return encodeURIComponent(key) + "=" + encodeURIComponent(value);
		})
		.join("&");
}