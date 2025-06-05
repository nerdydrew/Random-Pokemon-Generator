const assert = require("assert");
const fs = require("fs");

const DEX_FOLDER = "public/dex/";

describe("Pokédexes", function() {
	const dexes = fs.readdirSync(DEX_FOLDER);

	it("should exist", function() {
		assert.notEqual([], dexes);
	});

	for (const dex of dexes) {
		it(dex + " should be valid", function() {
			const contents = fs.readFileSync(DEX_FOLDER + dex);
			const parsed = JSON.parse(contents);
			assert.notEqual(0, parsed.length);
			// We could ideally check whether each dex matches the Pokémon[] interface,
			// but that doesn't seem like a thing that TypeScript can reasonably do.
		});
	}
});
