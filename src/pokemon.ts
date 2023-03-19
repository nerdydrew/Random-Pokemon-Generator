const PATH_TO_SPRITES = 'sprites/normal/';
const PATH_TO_SHINY_SPRITES = 'sprites/shiny/';
const SPRITE_EXTENTION = '.png';

interface Pokemon {
	id: number;
	name: string;
	types: string[];
	isNfe?: boolean;
	isLegendary?: boolean;
	forms?: Form[];
}

interface Form {
	name: string;
	types: string[];
	spriteSuffix?: string;
	isMega?: boolean;
	isGigantamax?: boolean;
}

class GeneratedPokemon {
	readonly id: number;
	readonly baseName: string;
	readonly name: string;
	private readonly spriteSuffix?: string;
	readonly nature?: string;
	readonly shiny: boolean;
	readonly date: Date;

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

	toText(): string {
		return `
			${this.nature ? `<span class="nature">${this.nature}</span>` : ""}
			${this.name}
			${this.shiny ? `<span class="star">&starf;</span>` : ""}
		`;
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
