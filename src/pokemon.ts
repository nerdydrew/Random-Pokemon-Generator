const PATH_TO_SPRITES = 'sprites/normal/';
const PATH_TO_SHINY_SPRITES = 'sprites/shiny/';
const SPRITE_EXTENTION = '.webp';

interface Pokemon {
	/** National Pokédex number. */
	id: number;
	/** The display name of this Pokémon. */
	name: string;
	/** This Pokémon's type(s) (lowecased). */
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
	/** Alternate forms for this Pokémon, if any. */
	forms?: Form[];
	/** Ratio of male to female or "unknown". Defaults to (1:1). */
	genderRatio?: {male: number, female: number} | "unknown";
}

interface Form {
	/** Display name for this form. */
	name: string;
	/** Type(s) of this form (lowercased). */
	types: string[];
	/** An optional suffix added to the sprite's filename (between a hyphen and the extension). */
	spriteSuffix?: string;
	/** Whether this form is a Mega Evolution. Defaults to false. */
	isMega?: boolean;
	/** Whether this form is a Gigantamax. Defaults to false. */
	isGigantamax?: boolean;
	/** Ratio of male to female or "unknown". Defaults to (1:1). */
	genderRatio?: {male: number, female: number} | "unknown";
}

class GeneratedPokemon {
	/** National Pokédex number. */
	readonly id: number;
	/** The name of this Pokémon, not including what form it is. */
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

	private constructor(pokemon?: Pokemon, form?: Form, options?: Options) {
		if (!pokemon) {
			return;
		}
		this.id = pokemon.id;
		this.baseName = pokemon.name;
		this.name = form?.name ?? pokemon.name;
		this.spriteSuffix = form?.spriteSuffix;
		if (options.natures) {
			this.nature = generateNature();
		}
		// http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
		this.shiny = Math.floor(Math.random() * 65536) < 16;
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
	toHtml(includeSprite: boolean): string {
		let classes = "";
		if (this.shiny) {
			classes += "shiny ";
		}
		if (!includeSprite) {
			classes += "imageless ";
		}
		return `<li class="${classes}">
			${includeSprite ? this.toImage() : ""}
			${this.toText()}
		</li>`;
	}

	toHtmlForShinyHistory(): string {
		const encounterDate = this.date ?
			`<div class="date" title="${this.date}">Encountered on ${this.date.toLocaleDateString()}</div>`
			: "";
		return `<li>
			${this.toImage()}
			${this.toText()}
			${encounterDate}
		</li>`;
	}

	toText(): string {
		return `
			${this.nature ? `<span class="nature">${this.nature}</span>` : ""}
			${this.name}
			${this.genderToText()}
			${this.shiny ? `<span class="star">&starf;</span>` : ""}
		`;
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

function generateNature(): string {
	return getRandomElement(NATURES);
}

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Na&iuml;ve", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];
