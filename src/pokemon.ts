const PATH_TO_SPRITES = 'sprites/png/normal/';
const PATH_TO_SHINY_SPRITES = 'sprites/png/shiny/';
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
	private readonly id: number;
	private readonly name: string;
	private readonly spriteSuffix?: string;
	private readonly nature?: string;
	private readonly shiny: boolean;

	constructor(pokemon: Pokemon, form: Form | undefined, options: Options) {
		this.id = pokemon.id;
		this.name = pokemon.name;
		this.spriteSuffix = form?.spriteSuffix;
		if (options.natures) {
			this.nature = generateNature();
		}
		// http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
		this.shiny = Math.floor(Math.random() * 65536) < 16;
	}

/** Converts JSON for a single Pokémon into an HTML list item. */
	toHtml(sprites: boolean) {
		const title = (this.shiny ? "Shiny " : "") + this.name;
		let classes = "";
		if (this.shiny) {
			classes += "shiny ";
		}
		if (!sprites) {
			classes += "imageless ";
		}
		return `<li title="${title}" class="${classes}">
			${this.nature ? `<span class="nature">${this.nature}</span>` : ""}
			${this.name}
			${this.shiny ? `<span class="star">&#9733;</span>` : ""}
			${sprites ? `<img src="${this.getSpritePath()}" alt="${title}" />` : ""}
		</li>`;
	}

	private getSpritePath() {
		const path = this.shiny ? PATH_TO_SHINY_SPRITES : PATH_TO_SPRITES;
		let name = String(this.id);
		if (this.spriteSuffix) {
			name += "-" + this.spriteSuffix;
		}
		return path + name + SPRITE_EXTENTION;
	}
}

function generateNature(): string {
	return getRandomElement(NATURES);
}

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Na&iuml;ve", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];
