const PATH_TO_SPRITES = 'sprites/normal/';
const PATH_TO_SHINY_SPRITES = 'sprites/shiny/';
const SPRITE_EXTENTION = '.webp';

interface Pokemon {
	/** National Pokédex number. */
	id: number;
	/** The display name of this Pokémon. */
	name: string;
	/** This Pokémon's type(s) (lowercased). */
	types: string[];
	/** Whether this Pokémon is not fully evolved. Defaults to false. */
	isNfe?: boolean;
	/** The number of times this Pokémon has evolved. Defaults to 0 (unevolved). */
	evolutionCount?: 0 | 1 | 2;
	/** Whether this Pokémon is a sub-legendary. Defaults to false. */
	isSubLegendary?: boolean;
	/** Whether this Pokémon is a restricted legendary. Defaults to false. */
	isLegendary?: boolean;
	/** Whether this Pokémon is mythical. Defaults to false. */
	isMythical?: boolean;
	/** Whether this Pokémon is a Paradox (from Scarlet and Violet). Defaults to false. */
	isParadox?: boolean;
	/** Whether this Pokémon is an Ultra Beast. Defaults to false. */
	isUltraBeast?: boolean;
	/** Alternate forms for this Pokémon, if any. */
	forms?: Form[];
	/** Ratio of male to female or "unknown". Defaults to (1:1). */
	genderRatio?: {male: number, female: number} | "unknown";
}

interface Form {
	/**
	 * Display name for this form. If absent, it will default to the base Pokémon's name, also
	 * specifying if it's a Mega Evolution or Gigantamax.
	 */
	name?: string;
	/** Type(s) of this form (lowercased). If absent, it will default to the base Pokémon's types. */
	types?: string[];
	/** An optional suffix added to the sprite's filename (between a hyphen and the extension). */
	spriteSuffix?: string;
	/** Whether this form is a Mega Evolution. Defaults to false. */
	isMega?: boolean;
	/** Whether this form is a Gigantamax. Defaults to false. */
	isGigantamax?: boolean;
	/** Ratio of male to female or "unknown". Defaults to the base Pokémon's ratio. */
	genderRatio?: {male: number, female: number} | "unknown";
}

class GeneratedPokemon {
	/** National Pokédex number. */
	readonly id: number;
	/** The name of this Pokémon, excluding what form it is. */
	readonly baseName: string;
	/** The name of this Pokémon, including what form it is. */
	readonly name: string;
	/** An optional suffix added to the sprite's filename (between a hyphen and the extension). */
	private readonly spriteSuffix?: string;
	/** This Pokémon's nature, if generated. */
	readonly nature?: string;
	/** Whether this Pokémon is shiny. */
	readonly shiny: boolean;
	/** When this Pokémon was generated. */
	readonly date: Date;
	/** This Pokémon's gender, or null if not generated or neuter. */
	readonly gender?: "male" | "female";
	readonly showName: boolean = true;
	readonly showSprite: boolean = true;

	private constructor(pokemon?: Pokemon, form?: Form, options?: Options) {
		if (!pokemon) {
			return;
		}
		this.showName = options.names;
		this.showSprite = options.sprites;
		this.id = pokemon.id;
		this.baseName = pokemon.name;
		this.name = getName(pokemon, form);
		this.spriteSuffix = form?.spriteSuffix;
		if (options.natures) {
			this.nature = generateNature();
		}
		// http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
		this.shiny = this.showSprite && Math.floor(Math.random() * 65536) < 16;
		this.date = new Date();
		if (options.genders) {
			const ratio = form?.genderRatio ?? pokemon?.genderRatio ?? {male: 1, female: 1};
			if (ratio != "unknown") {
				this.gender = Math.random() < (ratio.male / (ratio.male + ratio.female)) ? "male" : "female";
			}
		}
	}

	static generate(pokemon: Pokemon, form: Form | undefined, options: Options): GeneratedPokemon {
		return new GeneratedPokemon(pokemon, form, options);
	}

	static fromJson(parsed: Object): GeneratedPokemon {
		const pokemon = new GeneratedPokemon();
		Object.assign(pokemon, parsed);
		return pokemon;
	}

	/** Converts JSON for a single Pokémon into an HTML list item. */
	toHtml(): string {
		let classes = "";
		if (this.shiny) {
			classes += "shiny ";
		}
		if (!this.showSprite) {
			classes += "imageless ";
		}
		return `<li class="${classes}">
			${this.showSprite ? this.toImage() : ""}
			${this.toText(this.showName)}
		</li>`;
	}

	toHtmlForShinyHistory(): string {
		const encounterDate = this.date ?
			`<div class="date" title="${this.date}">Encountered on ${this.date.toLocaleDateString()}</div>`
			: "";
		return `<li>
			${this.toImage()}
			${this.toText(true)}
			${encounterDate}
		</li>`;
	}

	toText(includeName: boolean): string {
		return `
			${this.nature ? `<span class="nature">${this.nature}</span>` : ""}
			${includeName ? this.name : ""}
			${this.genderToText()}
			${this.shiny ? `<span class="star">&starf;</span>` : ""}
		`.trim() || "&nbsp;";
		// Return a non-breaking space if the text would otherwise be empty so that it still takes
		// up height. Otherwise, generating a shiny Pokémon without names would align poorly.
	}

	private genderToText(): string {
		if (this.name == "Nidoran ♀" || this.name == "Nidoran ♂") {
			return "";
		} else if (this.gender == "male") {
			return `<span class="male" title="Male">♂</span>`;
		} else if (this.gender == "female") {
			return `<span class="female" title="Female">♀</span>`;
		} else {
			return "";
		}
	}

	toImage(): string {
		const altText = (this.shiny ? "Shiny " : "") + this.name;
		return `<img src="${this.getSpritePath()}" alt="${altText}" title="${altText}" />`;
	}

	private getSpritePath(): string {
		const path = this.shiny ? PATH_TO_SHINY_SPRITES : PATH_TO_SPRITES;
		let name = this.normalizeName();
		if (this.spriteSuffix) {
			name += "-" + this.spriteSuffix;
		}
		return path + name + SPRITE_EXTENTION;
	}

	private normalizeName(): string {
		return (this.baseName ?? this.name)
			.toLowerCase()
			.replaceAll("é", "e")
			.replaceAll("♀", "f")
			.replaceAll("♂", "m")
			.replaceAll(/['.:% -]/g, "");
	}
}

function getName(pokemon: Pokemon, form?: Form): string {
	if (form) {
		if (form.name) {
			return form.name;
		} else if (form.isMega) {
			return pokemon.name + " Mega";
		} else if (form.isGigantamax) {
			return pokemon.name + " Gigantamax";
		}
	}
	return pokemon.name;
}

/** Merges two versions of the same Pokémon from different regions. */
function mergePokemon(primary: Pokemon, secondary: Pokemon): Pokemon {
	// If only one Pokémon is provided or neither has forms, we can use the primary.
	if (!secondary || (!primary.forms && !secondary.forms)) {
		return primary;
	}
	// If at least one has forms, we need to merge them. Copy the primary so we can modify it.
	const merged = JSON.parse(JSON.stringify(primary));
	merged.forms = mergeForms(primary?.forms ?? [primary], secondary.forms ?? [secondary]);
	return merged;
}

function mergeForms(primaries: Form[], secondaries: Form[]): Form[] {
	const formsBySpriteSuffix = new Map<string, Form>();
	for (const forms of [secondaries, primaries]) {
		for (const form of forms) {
			formsBySpriteSuffix.set(form.spriteSuffix, form);
		}
	}
	return Array.from(formsBySpriteSuffix.values());
}

function generateNature(): string {
	return getRandomElement(NATURES);
}

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle",
	"Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Na&iuml;ve",
	"Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];
