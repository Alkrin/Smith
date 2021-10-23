//=============================================================================
// TIOK_SmithItemGenerator.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Generates items into the MZ database, so you don't have to manually input all ingredient and quality permutations.

@param Run Database Validation
@desc Validates Note tags for Patterns, Ores, and Additives.  Should be turned off for release.
@type boolean
@on Yes
@off No
@default false

@param Write Permutations to Database
@desc Generates all item permutations and saves them to the Database.  Should be turned off for release.
@type boolean
@on Yes
@off No
@default false

@author TIOK

@help 

============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 09.11.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SmithItemGenerator = true;

var TIOK = TIOK || {};
TIOK.SmithItemGenerator = TIOK.SmithItemGenerator || {};

//=============================================================================
// Plugin Parameters
//=============================================================================
// We use this to simplify access to the params in later code.  Not strictly necessary.
var parameters = PluginManager.parameters('TIOK_SmithItemGenerator');
TIOK.SmithItemGenerator.Params = {
	validateNotes: parameters['Run Database Validation'] === 'true',
	writeToDB: parameters['Write Permutations to Database'] === 'true',
};

var params = TIOK.SmithItemGenerator.Params;

//=============================================================================
// Plugin Dependencies
//=============================================================================
if (!true) {
	console.error('ERROR!\nThis Plugin requires ________.js');
	if (Utils.isNwjs() && Utils.isOptionValid('test')) {
		if (!require('nw.gui').Window.get().isDevToolsOpen()) {
			require('nw.gui').Window.get().showDevTools();
		}
	}
} else {

(function() {
	
'use strict';

console.warn('ZZZ LOADING TIOK_SmithItemGenerator');

// This one allows us to actually overwrite the appropriate database files.
// Note that you should restart RMMZ after running this script to avoid getting overwritten.
StorageManager.saveDataFile = function(src, json) {
    if (this.isLocalMode()) {
        var data = JSON.stringify(json);
        var fs = require('fs');
        var path = require('path');
        var base = path.dirname(process.mainModule.filename);
        //
        var dirPath = path.join(base, 'data/');
        var filePath = dirPath + src + ".json";
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
    } else {
        // This section isn't complete
        console.log("saveDataFile: Not local");
    }
};

// The ids of the various additive families.
// Each additive family has a unique effect.
// The power of any individual additive is determined by its Rank, which allows for multiple additives to give the same effect (e.g troll blood / regen root / life crystal, etc.)
const AdditiveFamily = {
	flux: { // Increases success rate of crafting attempt.  Does not consume Additive slots on patterns.  One per crafting attempt.
		index: 0,
		name: 'flux',
	}, 
	regen: { // Chance to add hp regen trait to the produced item.
		index: 1,
		name: 'regen',
		prefixes: {
			E: 'Lively',
			D: 'Regenerating',
			C: 'Troll\'s',
			B: 'Rebirth',
			A: 'Undying',
			S: 'Immortal\'s',
		},
		postfixes: {
			E: 'of the Starfish',
			D: 'of Revival',
			C: 'of the Troll',
			B: 'of the Troll Lord',
			A: 'of the Troll King',
			S: 'of the Troll God',
		},
		descriptions: {
			E: 'Grants minor health regeneration.',
			D: 'Grants lesser health regeneration.',
			C: 'Grants health regeneration.',
			B: 'Grants greater health regeneration.',
			A: 'Grants major health regeneration.',
			S: 'Grants massive health regeneration.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 0.01; break;
				case 'D': power = 0.015; break;
				case 'C': power = 0.02; break;
				case 'B': power = 0.025; break;
				case 'A': power = 0.03; break;
				case 'S': power = 0.05; break;
			}
			// Add health regen trait.
			let regenTrait = item.traits.find((trait) => { return trait.code === 22 && trait.dataId === 7;});
			if (regenTrait) {
				regenTrait.value = regenTrait.value + power;
			} else {
				regenTrait = {
					code: 22,
					dataId: 7,
					value: power
				};
				item.traits.push(regenTrait);
			}
			return item;
		},
	},
	attack: { // Chance to increase attack (mat) of the produced item.
		index: 2,
		name: 'attack',
		prefixes: {
			E: 'Jagged',
			D: 'Sharp',
			C: 'Keen',
			B: 'Cutting',
			A: 'Rending',
			S: 'Devouring',
		},
		postfixes: {
			E: 'of Stinging',
			D: 'of Smiting',
			C: 'of Crushing',
			B: 'of Destruction',
			A: 'of Annihilation',
			S: 'of Death',
		},
		descriptions: {
			E: 'Slightly sharper than average.',
			D: 'Moderately sharper than average.',
			C: 'Sharper than average.',
			B: 'Much sharper than average.',
			A: 'Incredibly sharp.',
			S: 'Sharp enough to cut the wind.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 1; break;
				case 'D': power = 3; break;
				case 'C': power = 6; break;
				case 'B': power = 10; break;
				case 'A': power = 15; break;
				case 'S': power = 25; break;
			}
			// Boost attack value.
			item.params[4] = item.params[4] + power;

			return item;
		},
	},
	defense: { // Chance to increase defense of the produced item.
		index: 3,
		name: 'defense',
		prefixes: {
			E: 'Tough',
			D: 'Hard',
			C: 'Rugged',
			B: 'Unbending',
			A: 'Unbreaking',
			S: 'Invulnerable',
		},
		postfixes: {
			E: 'of the Crag',
			D: 'of the Stone',
			C: 'of the Hills',
			B: 'of the Mountain',
			A: 'of the Unbroken',
			S: 'of Olympus',
		},
		descriptions: {
			E: 'Slightly harder than average.',
			D: 'Moderately harder than average.',
			C: 'Harder than average.',
			B: 'Much harder than average.',
			A: 'Incredibly hard.',
			S: 'Diamonds couldn\'t scratch this.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 1; break;
				case 'D': power = 3; break;
				case 'C': power = 6; break;
				case 'B': power = 10; break;
				case 'A': power = 15; break;
				case 'S': power = 25; break;
			}
			// Boost defense value.
			item.params[3] = item.params[3] + power;

			return item;
		},
	},
	resist: { // Chance to increase resistance of the produced item.
		index: 4,
		name: 'resist',
		prefixes: {
			E: 'Glinting',
			D: 'Gleaming',
			C: 'Shining',
			B: 'Bright',
			A: 'Blinding',
			S: 'Glorious',
		},
		postfixes: {
			E: 'of Light',
			D: 'of Radiance',
			C: 'of Glory',
			B: 'of the Stars',
			A: 'of the Moon',
			S: 'of the Sun',
		},
		descriptions: {
			E: 'Grants minor magic resistance.',
			D: 'Grants lesser magic resistance.',
			C: 'Grants magic resistance.',
			B: 'Grants greater magic resistance.',
			A: 'Grants major magic resistance.',
			S: 'Magic itself fears this item.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 1; break;
				case 'D': power = 3; break;
				case 'C': power = 6; break;
				case 'B': power = 10; break;
				case 'A': power = 15; break;
				case 'S': power = 25; break;
			}
			// Boost resist value.
			item.params[5] = item.params[5] + power;

			return item;
		},
	},
	speed: { // Chance to increase speed of the produced item.
		index: 5,
		name: 'speed',
		prefixes: {
			E: 'Quick',
			D: 'Fast',
			C: 'Swift',
			B: 'Rushing',
			A: 'Charging',
			S: 'Hermes\'',
		},
		postfixes: {
			E: 'of Speed',
			D: 'of Alacrity',
			C: 'of Impatience',
			B: 'of Haste',
			A: 'of the Zephyr',
			S: 'of the Comet',
		},
		descriptions: {
			E: 'Grants minor speed boost.',
			D: 'Grants lesser speed boost.',
			C: 'Grants speed boost.',
			B: 'Grants greater speed boost.',
			A: 'Grants major speed boost.',
			S: 'Makes you fast as lightning.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 1; break;
				case 'D': power = 3; break;
				case 'C': power = 6; break;
				case 'B': power = 10; break;
				case 'A': power = 15; break;
				case 'S': power = 25; break;
			}
			// Boost speed value.
			item.params[6] = item.params[6] + power;

			return item;
		},
	},
	hp: { // Chance to increase the hp provided by the produced item.
		index: 6,
		name: 'hp',
		prefixes: {
			E: 'Hardy',
			D: 'Lively',
			C: 'Roach\'s',
			B: 'Vigorous',
			A: 'Gaean',
			S: 'Eternal',
		},
		postfixes: {
			E: 'of the Turtle',
			D: 'of the Badger',
			C: 'of the Bear',
			B: 'of the Rhino',
			A: 'of the Whale',
			S: 'of the Behemoth',
		},
		descriptions: {
			E: 'Grants minor health boost.',
			D: 'Grants lesser health boost.',
			C: 'Grants health boost.',
			B: 'Grants greater health boost.',
			A: 'Grants major health boost.',
			S: 'Grants overwhelming vitality.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 10; break;
				case 'D': power = 30; break;
				case 'C': power = 60; break;
				case 'B': power = 100; break;
				case 'A': power = 150; break;
				case 'S': power = 250; break;
			}
			// Boost hp value.
			item.params[0] = item.params[0] + power;

			return item;
		},
	},
	mp: { // Chance to increase the mp provided by the produced item.
		index: 7,
		name: 'mp',
		prefixes: {
			E: 'Apprentice\'s',
			D: 'Sorceror\'s',
			C: 'Mage\'s',
			B: 'Wizard\'s',
			A: 'Holy',
			S: 'Kyn\'s',
		},
		postfixes: {
			E: 'of Study',
			D: 'of Scrolls',
			C: 'of Wisdom',
			B: 'of Insight',
			A: 'of the Sage',
			S: 'of Kyn',
		},
		descriptions: {
			E: 'Increases intellect slightly.',
			D: 'Increases intellect moderately.',
			C: 'Increases intellect.',
			B: 'Increases intellect greatly.',
			A: 'Increases intellect drastically.',
			S: 'Expands the mind past mortal limits.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			switch(rank) {
				case 'E': power = 10; break;
				case 'D': power = 30; break;
				case 'C': power = 60; break;
				case 'B': power = 100; break;
				case 'A': power = 150; break;
				case 'S': power = 250; break;
			}
			// Boost mp value.
			item.params[1] = item.params[1] + power;

			return item;
		},
	},
	fire: { // Chance to add fire element to the produced item.
		index: 8,
		name: 'fire',
		prefixes: {
			E: 'Ashen',
			D: 'Heated',
			C: 'Burning',
			B: 'Fiery',
			A: 'Blazing',
			S: 'Solar',
		},
		postfixes: {
			E: 'of Embers',
			D: 'of Flame',
			C: 'of the Salamander',
			B: 'of Dragons',
			A: 'of Inferno',
			S: 'of Hell',
		},
		descriptions: {
			E: 'Mildly warm.',
			D: 'Moderately hot.',
			C: 'Hot to the touch.',
			B: 'Very hot to the touch.',
			A: 'Wildly hot to the touch.',
			S: 'Contains the essence of fire.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			let element = 0;
			switch(rank) {
				case 'E': power = 1; element = 0.08; break;
				case 'D': power = 2; element = 0.11; break;
				case 'C': power = 4; element = 0.14; break;
				case 'B': power = 7; element = 0.17; break;
				case 'A': power = 10; element = 0.20; break;
				case 'S': power = 17; element = 0.25; break;
			}
			if (isArmor) {
				// Boost defense value.
				item.params[3] = item.params[3] + power;
				// Add fire element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 11 && trait.dataId === 2;});
				if (elementTrait) {
					elementTrait.value = elementTrait.value - element;
				} else {
					elementTrait = {
						code: 11,
						dataId: 2,
						value: 1 - element
					};
					item.traits.push(elementTrait);
				}
			} else {
				// Boost attack value.
				item.params[4] = item.params[4] + power;
				// Add fire element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 31;});
				if (elementTrait) {
					elementTrait.dataId = 2;
				} else {
					elementTrait = {
						code: 31,
						dataId: 2,
						value: 0
					};
					item.traits.push(elementTrait);
				}
			}

			return item;
		},
	},
	ice: { // Chance to add ice element to the produced item.
		index: 9,
		name: 'ice',
		prefixes: {
			E: 'Shivering',
			D: 'Chilling',
			C: 'Freezing',
			B: 'Frozen',
			A: 'Glacial',
			S: 'Polar',
		},
		postfixes: {
			E: 'of Frost',
			D: 'of Snow',
			C: 'of Ice',
			B: 'of the Tundra',
			A: 'of Rime',
			S: 'of Boreas',
		},
		descriptions: {
			E: 'Cools the air around it.',
			D: 'Chills the air around it.',
			C: 'Glistens with frost.',
			B: 'Studded with ice crystals.',
			A: 'Encased in ice.',
			S: 'Contains the essence of winter.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			let element = 0;
			switch(rank) {
				case 'E': power = 1; element = 0.08; break;
				case 'D': power = 2; element = 0.11; break;
				case 'C': power = 4; element = 0.14; break;
				case 'B': power = 7; element = 0.17; break;
				case 'A': power = 10; element = 0.20; break;
				case 'S': power = 17; element = 0.25; break;
			}
			if (isArmor) {
				// Boost defense value.
				item.params[3] = item.params[3] + power;
				// Add ice element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 11 && trait.dataId === 3;});
				if (elementTrait) {
					elementTrait.value = elementTrait.value - element;
				} else {
					elementTrait = {
						code: 11,
						dataId: 3,
						value: 1 - element
					};
					item.traits.push(elementTrait);
				}
			} else {
				// Boost attack value.
				item.params[4] = item.params[4] + power;
				// Add ice element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 31;});
				if (elementTrait) {
					elementTrait.dataId = 3;
				} else {
					elementTrait = {
						code: 31,
						dataId: 3,
						value: 0
					};
					item.traits.push(elementTrait);
				}
			}

			return item;
		},
	},
	lightning: { // Chance to add lightning element to the produced item.
		index: 10,
		name: 'lightning',
		prefixes: {
			E: 'Sparking',
			D: 'Arcing',
			C: 'Charged',
			B: 'Stormy',
			A: 'Tempestuous',
			S: 'Thorian',
		},
		postfixes: {
			E: 'of Sparks',
			D: 'of Static',
			C: 'of Lightning',
			B: 'of Storms',
			A: 'of the Hurricane',
			S: 'of the Aether',
		},
		descriptions: {
			E: 'Makes sparks when struck.',
			D: 'Makes your hair stand on end.',
			C: 'Occasionally flashes with lightning.',
			B: 'Every movement crashes like thunder.',
			A: 'Bathed constantly in lightning.',
			S: 'The god of the storms\' own.',
		},
		applyToItem: (item, rank, isArmor) => {
			let power = 0;
			let element = 0;
			switch(rank) {
				case 'E': power = 1; element = 0.08; break;
				case 'D': power = 2; element = 0.11; break;
				case 'C': power = 4; element = 0.14; break;
				case 'B': power = 7; element = 0.17; break;
				case 'A': power = 10; element = 0.20; break;
				case 'S': power = 17; element = 0.25; break;
			}
			if (isArmor) {
				// Boost defense value.
				item.params[3] = item.params[3] + power;
				// Add lightning element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 11 && trait.dataId === 4;});
				if (elementTrait) {
					elementTrait.value = elementTrait.value - element;
				} else {
					elementTrait = {
						code: 11,
						dataId: 4,
						value: 1 - element
					};
					item.traits.push(elementTrait);
				}
			} else {
				// Boost attack value.
				item.params[4] = item.params[4] + power;
				// Add lightning element trait.
				let elementTrait = item.traits.find((trait) => { return trait.code === 31;});
				if (elementTrait) {
					elementTrait.dataId = 4;
				} else {
					elementTrait = {
						code: 31,
						dataId: 4,
						value: 0
					};
					item.traits.push(elementTrait);
				}
			}

			return item;
		},
	},

	// In the future, what about families that add multiple boosts from a single additive?
}

// Created in advance to provide a consistent ordering when iterating AdditiveFamilies.
const AdditiveFamilyArray = Object.values(AdditiveFamily).sort((familyLeft, familyRight) => {
	return familyLeft.index - familyRight.index;
});

// Pattern Notes
//  - MinSkill:<number>			Minimum Blacksmithing skill required to use this pattern.
//	- SuccessRate:<number>		0-100.  Base chance of success crafting this pattern to the quality of the used ore.
//	- OreRank:<rank>			E|D|C|B|A|S. Minimum quality of ore required to even TRY to craft this pattern.
//	- OreCount:<number>			Number of ores consumed in a single crafting attempt.
//	- MaxAdditives:<number>		Number of additives that can be injected during crafting.  Try to keep this number SMALL (0-2), else DB size explodes.
//	- AdditiveMod:<id>:<number>	Id of the additive family to modify. Number is decimal multiplier of additive effectiveness.  0.5 means half effectiveness, 2.0 means double effectiveness.

// Ore Notes
//	- MinSkill:<number>			Minimum Blacksmithing skill required to use this ore.
//	- SuccessRate:<number>		Additive modifier to base success rate of pattern when using this ore.
//	- Rank:<rank>				E|D|C|B|A|S.
//	- AdditiveMod:<id>:<number>	Id of the additive family to modify. Number is decimal multiplier of additive effectiveness.  0.5 means half effectiveness, 2.0 means double effectiveness.

// Additive Notes
//	- MinSkill:<number>			Minimum Blacksmithing skill required to use this additive.
//	- SuccessRate:<number>		Additive modifier to base success rate of pattern when using this additive.  Positive for fluxes.  Usually negative for others.
//	- Rank:<rank>				E|D|C|B|A|S.  Determines the efficacy of the family's effect.
//	- Family:<string>			Declares the "family" of this additive.  See the "AdditiveFamily" enum.  Referenced in AdditiveMod fields.

var alias_DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
   	alias_DataManager_createGameObjects.call(this, arguments);

	// At this point we can guarantee that all database items have been loaded.
   	console.log('$dataItems', $dataItems);
	console.log('$dataArmors', $dataArmors);
	console.log('$dataWeapons', $dataWeapons);

	// Find all valid pattern items.
	let patterns = [];
	let inPatterns = false;
	for (let i = 1; i < $dataItems.length; ++i) {
		const pattern = $dataItems[i];
		if (inPatterns) {
			if (pattern.name === '--EndPatterns') {
				break;
			}
			if (!params.validateNotes || patternIsValid(pattern)) {
				patterns.push(parsePattern(pattern));
			}
		} else if (pattern.name === '--StartPatterns') {
			inPatterns = true;
		}
	}

	TIOK.SmithItemGenerator.patterns = patterns;
	console.log('Patterns:', patterns);

	// Find all valid ore items.
	let ores = {
		E: [],
		D: [],
		C: [],
		B: [],
		A: [],
		S: [],
	};
	let inOres = false;
	for (let i = 1; i < $dataItems.length; ++i) {
		const ore = $dataItems[i];
		if (inOres) {
			if (ore.name === '--EndOres') {
				break;
			}
			if (!params.validateNotes || oreIsValid(ore)) {
				const pOre = parseOre(ore);
				ores[pOre.rank].push(pOre);
			}
		} else if (ore.name === '--StartOres') {
			inOres = true;
		}
	}

	TIOK.SmithItemGenerator.ores = ores;
	console.log('Ores:', ores);

	const additives = [];
	let inAdditives = false;
	for (let i = 1; i < $dataItems.length; ++i) {
		const additive = $dataItems[i];
		if (inAdditives) {
			if (additive.name === '--EndAdditives') {
				break;
			}
			if (!params.validateNotes || additiveIsValid(additive)) {
				additives.push(parseAdditive(additive));
			}
		} else if (additive.name === '--StartAdditives') {
			inAdditives = true;
		}
	}
	console.log('Additives:', additives);

	TIOK.SmithItemGenerator.firstGeneratedArmorIndex = $dataArmors.find((armor) => {
		return armor && armor.name === '--StartGeneratedArmors';
	}).id + 1;

	TIOK.SmithItemGenerator.firstGeneratedWeaponIndex = $dataWeapons.find((weapon) => {
		return weapon && weapon.name === '--StartGeneratedWeapons';
	}).id + 1;

	let nextArmorIndex = TIOK.SmithItemGenerator.firstGeneratedArmorIndex;
	let nextWeaponIndex = TIOK.SmithItemGenerator.firstGeneratedWeaponIndex;
	patterns.forEach((pattern) => {
		pattern.isArmor = true;
		// Find all template items (unobtainable item from which we can copy most fields to help generate the new items).
		const baseItemName = pattern.name.substr(9);
		let templateItem = $dataArmors.find((armor) => { return armor && armor.name === baseItemName; });
		if (!templateItem) {
			pattern.isArmor = false;
			templateItem = $dataWeapons.find((weapon) => { return weapon && weapon.name === baseItemName; });
		}
		if (!templateItem) {
			console.error(`Unable to find Template Item named "${baseItemName}"`);
			return;
		} else {
			pattern.templateItem = templateItem;
		}
		pattern.isWeapon = !pattern.isArmor;

		// Capture the first index of items generated for this pattern so we can index into them during crafting.
		pattern.firstIndex = pattern.isArmor ? nextArmorIndex : nextWeaponIndex;

		//Iterate all permutations.
		getSupportedOres(pattern).forEach((ore) => {
			// Ores are iterated from S rank on down to the minimum supported rank.
			getRanksAtOrBelow(ore.rank).forEach((oreRank) => {
				// Ranks are iterated from the base rank down to E.
				if (pattern.maxAdditives === 0) {
					// No additives allowed, so make the item now.
					createItem(pattern.isArmor ? nextArmorIndex++ : nextWeaponIndex++, pattern, ore, oreRank);
				} else {
					AdditiveFamilyArray.forEach((familyA) => {
						// Skip flux, as it doesn't modify items directly.
						if (familyA.name === 'flux') {
							return;
						}
						getRanksAtOrBelow('S').forEach((familyARank) => {
							if (pattern.maxAdditives === 1) {
								// Exactly one additive allowed, so make the item now.
								createItem(pattern.isArmor ? nextArmorIndex++ : nextWeaponIndex++, pattern, ore, oreRank, familyA, familyARank);
							} else {
								AdditiveFamilyArray.forEach((familyB) => {
									// Skip flux, as it doesn't modify items directly.
									if (familyB.name === 'flux') {
										return;
									}
									getRanksAtOrBelow('S').forEach((familyBRank) => {
										// Exactly two additives allowed, so make the item now.
										createItem(pattern.isArmor ? nextArmorIndex++ : nextWeaponIndex++, pattern, ore, oreRank, familyA, familyARank, familyB, familyBRank);
									});
								});							
							}
						});

					});
				}
			});
		});
	});

	if (params.writeToDB) {
		// Save the database files with the new values.
		StorageManager.saveDataFile('Armors', $dataArmors)
		StorageManager.saveDataFile('Weapons', $dataWeapons)
	}
};

function createItem(index, pattern, ore, oreRank, familyA, familyARank, familyB, familyBRank) {
	// If we aren't updating the DB this launch, we will trust the DB as it currently stands.
	if (!params.writeToDB) {
		return;
	}

	const newItem = JSON.parse(JSON.stringify(pattern.templateItem));

	newItem.id = index;

	// Build the item name.
	const oreName = ore.name.replace(' Ore','');
	newItem.name = `${oreName} ${pattern.templateItem.name}`;
	if (familyA) { // Add postfix.
		const postfix = familyA.postfixes[familyARank];
		newItem.name = `${newItem.name} ${postfix}`;
	}
	if (familyB) { // Add prefix.
		const prefix = familyB.prefixes[familyBRank];
		newItem.name = `${prefix} ${newItem.name}`;
	}

	// Update basic stats by oreRank delta.
	const oreRankDelta = getRankDelta(pattern.oreRank, oreRank);
	const oreRankMultiplier = getOreRankMultiplierForDelta(oreRankDelta);
	for (let i = 0; i < newItem.params.length; ++i) {
		newItem.params[i] = Math.floor(newItem.params[i] * oreRankMultiplier);
	}

	// Update price.
	newItem.price = Math.floor(newItem.price * oreRankMultiplier);
	if (oreRankDelta > 0) { // Better items get multiplier twice (caps out at 4x price for an item that is 2x as good.).
		newItem.price = Math.floor(newItem.price * oreRankMultiplier);
	}

	// Update description.
	newItem.description = `Rank ${oreRank}.`;
	if (familyB) { // If there are 2 additives, describe the prefix first.
		newItem.description = `${newItem.description} ${familyB.descriptions[familyBRank]}\n${familyA.descriptions[familyARank]}`;
	} else if (familyA) {
		newItem.description = `${newItem.description} ${familyA.descriptions[familyARank]}`;
	}

	// TODO: Are there any traits we want to multiply as well?  Crit? Evasion?

	// Apply familyA by rank.
	if (familyA) {
		newItem = familyA.applyToItem(newItem, familyARank, pattern.isArmor);
	}
	
	// Apply familyB by rank.
	if (familyB) {
		newItem = familyB.applyToItem(newItem, familyBRank, pattern.isArmor);
	}

	// Push the item into either $dataArmors or $dataWeapons.
	if (pattern.isArmor) {
		$dataArmors[index] = newItem;
	} else {
		$dataWeapons[index] = newItem;
	}
}

function getRankDelta(originalRank, currentRank) {
	const originalIndex = AllRanks.indexOf(originalRank);
	const currentIndex = AllRanks.indexOf(currentRank);

	return currentIndex - originalIndex;
}

function getOreRankMultiplierForDelta(rankDelta) {
	const deltaIndex = rankDelta + 5;
	const multipliers = [
		0.30, // -5
		0.40, // -4
		0.50, // -3
		0.70, // -2
		0.90, // -1
		1.00, //  0
		1.10, // +1
		1.25, // +2
		1.45, // +3
		1.70, // +4
		2.00, // +5
	];

	return multipliers[deltaIndex];
}

function getSupportedOres(pattern) {
	const ores = TIOK.SmithItemGenerator.ores;
	// S-rank is always supported.
	const supportedOres = [
		...ores.S
	];
	if (pattern.oreRank === 'S') {
		return supportedOres;
	}

	// A-rank?
	ores.A.forEach((ore) => { supportedOres.push(ore) });
	if (pattern.oreRank === 'A') {
		return supportedOres;
	}

	// B-rank?
	ores.B.forEach((ore) => { supportedOres.push(ore) });
	if (pattern.oreRank === 'B') {
		return supportedOres;
	}

	// C-rank?
	ores.C.forEach((ore) => { supportedOres.push(ore) });
	if (pattern.oreRank === 'C') {
		return supportedOres;
	}

	// D-rank?
	ores.D.forEach((ore) => { supportedOres.push(ore) });
	if (pattern.oreRank === 'D') {
		return supportedOres;
	}

	// E-rank?
	ores.E.forEach((ore) => { supportedOres.push(ore) });
	return supportedOres;
}

function getRanksAtOrBelow(highestRank) {
	const possibleRanks = {
		S: ['S','A','B','C','D','E'],
		A: ['A','B','C','D','E'],
		B: ['B','C','D','E'],
		C: ['C','D','E'],
		D: ['D','E'],
		E: ['E'],
	}

	return possibleRanks[highestRank];
}

function parsePattern(item) {
	const notes = item.note.split('\n');
	const pattern = {
		index: item.id,
		name: item.name,
		minSkill: +(notes.find((note) => { return note.startsWith('MinSkill:')}).substr(9)),
		successRate: +(notes.find((note) => { return note.startsWith('SuccessRate:')}).substr(12)),
		oreRank: notes.find((note) => { return note.startsWith('OreRank:')}).substr(8),
		oreCount: +(notes.find((note) => { return note.startsWith('OreCount:')}).substr(9)),
		maxAdditives: +(notes.find((note) => { return note.startsWith('MaxAdditives:')}).substr(13)),
		shape: +(notes.find((note) => { return note.startsWith('Shape:')}).substr(6)),
		polish: +(notes.find((note) => { return note.startsWith('Polish:')}).substr(7)),
		image: notes.find((note) => { return note.startsWith('Image:')}).substr(6),
		additiveMods: {},
	};

	notes.filter((note) => { return note.startsWith('AdditiveMod:')}).forEach((modNote) => { 
		const split = modNote.split(':');
		pattern.additiveMods[split[1]] = +(split[2]);
	});

	return pattern;
}

function parseOre(item) {
	const notes = item.note.split('\n');
	const heatNote = notes.find((note) => { return note.startsWith('Heat:')}).substr(5);
	const heats = heatNote.split(',');
	const ore = {
		index: item.id,
		name: item.name,
		minSkill: +(notes.find((note) => { return note.startsWith('MinSkill:')}).substr(9)),
		successRate: +(notes.find((note) => { return note.startsWith('SuccessRate:')}).substr(12)),
		rank: notes.find((note) => { return note.startsWith('Rank:')}).substr(5),
		color: TIOK.Utils.hex2rgb(notes.find((note) => { return note.startsWith('Color:')}).substr(7)),
		heatEnough: +heats[0],
		heatGood: +heats[1],
		heatTooMuch: +heats[2],
		heatMelting: +heats[3],
		additiveMods: {},
	};

	notes.filter((note) => { return note.startsWith('AdditiveMod:')}).forEach((modNote) => { 
		const split = modNote.split(':');
		pattern.additiveMods[split[1]] = +(split[2]);
	});

	return ore;
}

function parseAdditive(item) {
	const notes = item.note.split('\n');
	const additive = {
		index: item.id,
		name: item.name,
		minSkill: +(notes.find((note) => { return note.startsWith('MinSkill:')}).substr(9)),
		successRate: +(notes.find((note) => { return note.startsWith('SuccessRate:')}).substr(12)),
		rank: notes.find((note) => { return note.startsWith('Rank:')}).substr(5),
		family: notes.find((note) => { return note.startsWith('Family:')}).substr(7),
	};

	return additive;
}

function patternIsValid(pattern) {
	// Exists at all?
	if (!pattern) {
		return false;
	}

	// Appropriate name?
	if (!pattern.name || pattern.name.length <= 10 || !pattern.name.startsWith('Pattern: ')) {
		console.error('Found pattern with invalid name!', pattern);
		return false;
	}

	// Has all required note fields with supported values?
	const notes = pattern.note.split('\n');
	const minSkillNote = notes.find((note) => { return note.startsWith('MinSkill:')});
	const successRateNote = notes.find((note) => { return note.startsWith('SuccessRate:')});
	const oreRankNote = notes.find((note) => { return note.startsWith('OreRank:')});
	const oreCountNote = notes.find((note) => { return note.startsWith('OreCount:')});
	const maxAdditivesNote = notes.find((note) => { return note.startsWith('MaxAdditives:')});
	if (minSkillNote) {
		const minSkill = +(minSkillNote.substr(9));
		if (isNaN(minSkill) || minSkill < 1 || !Number.isInteger(minSkill)) {
			console.error('Found pattern with invalid MinSkill note (should be integer 1 or greater)!', pattern, minSkillNote);
			return false;
		}
	} else {
		console.error('Found pattern with missing MinSkill note!', pattern);
		return false;
	}
	if (successRateNote) {
		const successRate = +(successRateNote.substr(12));
		if (isNaN(successRate) || successRate < -100 || successRate > 200) {
			console.error('Found pattern with invalid SuccessRate note (should be between -100 and 200)!', pattern, successRateNote);
			return false;
		}
	} else {
		console.error('Found pattern with missing SuccessRate note!', pattern);
		return false;
	}
	if (oreRankNote) {
		const oreRank = oreRankNote.substr(8);
		if (!isRankString(oreRank)) {
			console.error('Found pattern with invalid OreRank note!', pattern, oreRankNote);
			return false;
		}
	} else {
		console.error('Found pattern with missing OreRank note!', pattern);
		return false;
	}
	if (oreCountNote) {
		const oreCount = +(oreCountNote.substr(9));
		if (isNaN(oreCount) || oreCount < 0 || oreCount > 99) {
			console.error('Found pattern with invalid OreCount note (should be between 0 and 99)!', pattern, oreCountNote);
			return false;
		}
	} else {
		console.error('Found pattern with missing OreCount note!', pattern);
		return false;
	}
	if (maxAdditivesNote) {
		const maxAdditives = +(maxAdditivesNote.substr(13));
		if (isNaN(maxAdditives) || maxAdditives < 0 || maxAdditives > 2 || !Number.isInteger(maxAdditives)) {
			console.error('Found pattern with invalid MaxAdditives note (should be between 0 and 2)!', pattern, maxAdditivesNote);
			return false;
		}
	} else {
		console.error('Found pattern with missing MaxAdditives note!', pattern);
		return false;
	}

	// Any optional notes are valid?
	const additiveModNotes = notes.filter((note) => { return note.startsWith('AdditiveMod:')});
	additiveModNotes.forEach((additiveModNote) => {
		const split = additiveModNote.split(':');
		if (split.length !== 3) {
			console.error('Found pattern with invalid AdditiveMod note!', pattern, additiveModNote);
			return false;
		}
		const family = split[1];
		if (!AdditiveFamily[family]) {
			console.error('Found pattern with invalid AdditiveMod note (unrecognized family)!', pattern, additiveModNote);
			return false;
		}
		const mod = +(split[2]);
		if (isNaN(mod) || mod < 0) {
			console.error('Found pattern with invalid AdditiveMod note (should be non-negative decimal)!', pattern, additiveModNote);
			return false;
		}
	});

	return true;
}

function oreIsValid(ore) {
	// Exists at all?
	if (!ore) {
		return false;
	}

	// Appropriate name?
	if (!ore.name || ore.name.length < 1) {
		console.error('Found ore with invalid name!', ore);
		return false;
	}

	// Has all required note fields with supported values?
	const notes = ore.note.split('\n');
	const minSkillNote = notes.find((note) => { return note.startsWith('MinSkill:')});
	const successRateNote = notes.find((note) => { return note.startsWith('SuccessRate:')});
	const rankNote = notes.find((note) => { return note.startsWith('Rank:')});
	if (minSkillNote) {
		const minSkill = +(minSkillNote.substr(9));
		if (isNaN(minSkill) || minSkill < 1 || !Number.isInteger(minSkill)) {
			console.error('Found ore with invalid MinSkill note (should be integer 1 or greater)!', ore, minSkillNote);
			return false;
		}
	} else {
		console.error('Found ore with missing MinSkill note!', ore);
		return false;
	}
	if (successRateNote) {
		const successRate = +(successRateNote.substr(12));
		if (isNaN(successRate) || successRate < -100 || successRate > 100) {
			console.error('Found ore with invalid SuccessRate note (should be between -100 and 100)!', ore, successRateNote);
			return false;
		}
	} else {
		console.error('Found ore with missing SuccessRate note!', ore);
		return false;
	}
	if (rankNote) {
		const rank = rankNote.substr(5);
		if (!isRankString(rank)) {
			console.error('Found ore with invalid Rank note!', ore, rankNote);
			return false;
		}
	} else {
		console.error('Found ore with missing Rank note!', ore);
		return false;
	}

	// Any optional notes are valid?
	const additiveModNotes = notes.filter((note) => { return note.startsWith('AdditiveMod:')});
	additiveModNotes.forEach((additiveModNote) => {
		const split = additiveModNote.split(':');
		if (split.length !== 3) {
			console.error('Found ore with invalid AdditiveMod note!', ore, additiveModNote);
			return false;
		}
		const family = split[1];
		if (!AdditiveFamily[family]) {
			console.error('Found ore with invalid AdditiveMod note (unrecognized family)!', ore, additiveModNote);
			return false;
		}
		const mod = +(split[2]);
		if (isNaN(mod) || mod < 0) {
			console.error('Found ore with invalid AdditiveMod note (should be non-negative decimal)!', ore, additiveModNote);
			return false;
		}
	});

	return true;
}

function additiveIsValid(additive) {
	// Exists at all?
	if (!additive) {
		return false;
	}

	// Appropriate name?
	if (!additive.name || additive.name.length <= 0) {
		console.error('Found additive with invalid name!', additive);
		return false;
	}

	// Has all required note fields with supported values?
	const notes = additive.note.split('\n');
	const minSkillNote = notes.find((note) => { return note.startsWith('MinSkill:')});
	const successRateNote = notes.find((note) => { return note.startsWith('SuccessRate:')});
	const rankNote = notes.find((note) => { return note.startsWith('Rank:')});
	const familyNote = notes.find((note) => { return note.startsWith('Family:')});
	if (minSkillNote) {
		const minSkill = +(minSkillNote.substr(9));
		if (isNaN(minSkill) || minSkill < 1 || !Number.isInteger(minSkill)) {
			console.error('Found additive with invalid MinSkill note (should be integer 1 or greater)!', additive, minSkillNote);
			return false;
		}
	} else {
		console.error('Found additive with missing MinSkill note!', additive);
		return false;
	}
	if (successRateNote) {
		const successRate = +(successRateNote.substr(12));
		if (isNaN(successRate) || successRate < -100 || successRate > 100) {
			console.error('Found additive with invalid SuccessRate note (should be between -100 and 100)!', additive, successRateNote);
			return false;
		}
	} else {
		console.error('Found additive with missing SuccessRate note!', additive);
		return false;
	}
	if (rankNote) {
		const rank = rankNote.substr(5);
		if (!isRankString(rank)) {
			console.error('Found additive with invalid Rank note!', additive, rankNote);
			return false;
		}
	} else {
		console.error('Found additive with missing Rank note!', additive);
		return false;
	}
	if (familyNote) {
		const family = familyNote.substr(7);
		if (!AdditiveFamily[family]) {
			console.error('Found additive with invalid Family note (unrecognized family)!', additive, familyNote);
			return false;
		}
	} else {
		console.error('Found additive with missing Family note!', additive);
		return false;
	}

	return true;
}

function isRankString(str) {
	if (str.length !== 1) {
		return false;
	}
	return AllRanks.indexOf(str) >= 0;
}

const AllRanks = 'EDCBAS';

})()}