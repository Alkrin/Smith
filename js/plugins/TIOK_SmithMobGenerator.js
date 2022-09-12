//=============================================================================
// TIOK_SmithMobGenerator.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Generates monsters by combining DB-defined templates.

@author TIOK

@command generateMobsForAllRegions
@text 'GenerateMobsForAllRegions'
@ desc 'Picks the mobs that should appear in each map region.'

@command prepareMobsForCurrentRegion
@text 'PrepareMobsForCurrentRegion'
@ desc 'Populates the database with all mobs for the current region.'

@help 

============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 03.17.2022
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SmithMobGenerator = true;

var TIOK = TIOK || {};
TIOK.SmithMobGenerator = TIOK.SmithMobGenerator || {};

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand('TIOK_SmithMobGenerator', 'generateMobsForAllRegions' , function(args) {
	// All generated data goes into this array.
	const mobsByRegion = [];

	const chapters = [
		// Chapter 1
		{firstRegion:1, lastRegion:6, minTier:'F'},
		// Chapter 2: Regions ?.  Lowest enemy tier: E.
		// Chapter 3: Regions ?.  Lowest enemy tier: D.
		// Chapter 4: Regions ?.  Lowest enemy tier: C.
	];

	// Iterate all chapters.
	for (let ci = 0; ci < chapters.length; ++ci) {
		const chapter = chapters[ci];
		// Iterate all regions in this chapter.
		for (let ri = chapter.firstRegion; ri <= chapter.lastRegion; ++ri) {
			const mobs = {};
			// Each region will have one COMMON and one RARE enemy per enemy group size.
			// Enemy group sizes are SWARM, PACK, LONER, and MINIBOSS.
			//     SWARM is 5-10 mobs of LowestTier for the chapter.
			//     PACK is 3-5 mobs of LowestTier+1 for the chapter.
			//     LONER is 1 mob of LowestTier+2 for the chapter.
			//     MINIBOSS is 1 mob of LowestTier+3 for the chapter.
			mobs.swarmCommon = TIOK.SmithMobGenerator.generateMobOfTier(chapter.minTier, 'Small');
			mobs.swarmRare = TIOK.SmithMobGenerator.generateMobOfTier(chapter.minTier, 'Small');

			mobs.packCommon = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 1), 'Small');
			mobs.packRare = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 1), 'Small');

			mobs.lonerCommon = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 2), 'Small');
			mobs.lonerRare = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 2), 'Small');

			mobs.minibossCommon = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 3), 'Large');
			mobs.minibossRare = TIOK.SmithMobGenerator.generateMobOfTier(TIOK.Utils.shiftTier(chapter.minTier, 3), 'Large');

			// Now that they have been picked, store them for later reference.
			mobsByRegion[ri] = mobs;
		}
	}

	// We want the generated mobs to persist across save / load.
	TIOK.CustomSave.mobsByRegion = mobsByRegion;
});

PluginManager.registerCommand('TIOK_SmithMobGenerator', 'prepareMobsForCurrentRegion' , function(args) {
	// What map region are we in?
	const spawnerRegion = $gameVariables._data[13] || 1;

	// Where are the designated mob slots in the database?
	let firstMobIndex;
	for (firstMobIndex = 1; firstMobIndex < $dataEnemies.length; ++firstMobIndex) {
		const mob = $dataEnemies[firstMobIndex];
		if (mob.name === '--Start Prepared Mobs') {
			// Start after the tag so it is still there next time we need to prepare mobs.
			firstMobIndex = firstMobIndex + 1;
			break;
		}
	}

	// What mobs do we need to prepare?
	const possibleMobs = TIOK.CustomSave.mobsByRegion[spawnerRegion];

	// We also need to set the id because the RPGMaker expects id to match index for backwards references.
	$dataEnemies[firstMobIndex] = possibleMobs.swarmCommon;
	$dataEnemies[firstMobIndex].id = firstMobIndex;

	$dataEnemies[firstMobIndex + 1] = possibleMobs.swarmRare;
	$dataEnemies[firstMobIndex + 1].id = firstMobIndex + 1;

	$dataEnemies[firstMobIndex + 2] = possibleMobs.packCommon;
	$dataEnemies[firstMobIndex + 2].id = firstMobIndex + 2;

	$dataEnemies[firstMobIndex + 3] = possibleMobs.packRare;
	$dataEnemies[firstMobIndex + 3].id = firstMobIndex + 3;

	$dataEnemies[firstMobIndex + 4] = possibleMobs.lonerCommon;
	$dataEnemies[firstMobIndex + 4].id = firstMobIndex + 4;

	$dataEnemies[firstMobIndex + 5] = possibleMobs.lonerRare;
	$dataEnemies[firstMobIndex + 5].id = firstMobIndex + 5;

	$dataEnemies[firstMobIndex + 6] = possibleMobs.minibossCommon;
	$dataEnemies[firstMobIndex + 6].id = firstMobIndex + 6;

	$dataEnemies[firstMobIndex + 7] = possibleMobs.minibossRare;
	$dataEnemies[firstMobIndex + 7].id = firstMobIndex + 7;
});

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

console.warn('ZZZ LOADING TIOK_SmithMobGenerator');

let gameDataInitialized = false;
var alias_DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
   	alias_DataManager_createGameObjects.call(this, arguments);

	if (gameDataInitialized) {
		return;
	}
	gameDataInitialized = true;

	// Find the Base templates.
	let baseTemplates = {};
	let inBaseTemplates = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inBaseTemplates) {
			if (mob.name === '--End Base Stats') {
				break;
			}
			baseTemplates[mob.name] = mob;
		} else if (mob.name === '--Start Base Stats') {
			inBaseTemplates = true;
		}
	}
	TIOK.SmithMobGenerator.baseTemplates = baseTemplates;
	console.log('Base Mob Templates', baseTemplates);

	// Find the Specialization templates.
	// Stat values in these templates are percentage multipliers.  I.e. 100 attack means 100% of base value, 150 attack means 150% of base value.
	let specializations = [];
	let inSpecializations = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inSpecializations) {
			if (mob.name === '--End Specializations') {
				break;
			}
			specializations.push(mob);
		} else if (mob.name === '--Start Specializations') {
			inSpecializations = true;
		}
	}
	TIOK.SmithMobGenerator.specializations = specializations;
	console.log('Specializations', specializations);

	// Find the Elemental templates.
	// Stat values in these templates are percentage multipliers.  I.e. 100 attack means 100% of base value, 150 attack means 150% of base value.
	// Unique traits get added, duplicate traits get combined.
	let elements = [];
	let inElements = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inElements) {
			if (mob.name === '--End Elements') {
				break;
			}
			elements.push(mob);
		} else if (mob.name === '--Start Elements') {
			inElements = true;
		}
	}
	TIOK.SmithMobGenerator.elements = elements;
	console.log('Elements', elements);

	// Find the Weakness templates.
	// Unique traits get added, duplicate traits get combined.
	// EyeColor note helps determine final art.
	let weaknesses = [];
	let inWeaknesses = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inWeaknesses) {
			if (mob.name === '--End Weaknesses') {
				break;
			}
			weaknesses.push(mob);
		} else if (mob.name === '--Start Weaknesses') {
			inWeaknesses = true;
		}
	}
	TIOK.SmithMobGenerator.weaknesses = weaknesses;
	console.log('Weaknesses', weaknesses);

	// Find the Species templates.
	// Defines species-related stats and describes linked Moves and Forms.
	// Stat values in these templates are percentage multipliers.  I.e. 100 attack means 100% of base value, 150 attack means 150% of base value.
	// Unique traits get added, duplicate traits get combined.
	let species = [];
	let inSpecies = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inSpecies) {
			if (mob.name === '--End Species') {
				break;
			}
			species.push(mob);
		} else if (mob.name === '--Start Species') {
			inSpecies = true;
		}
	}
	TIOK.SmithMobGenerator.species = species;
	console.log('Species', species);

	// Find the Moves templates.
	// Defines the movesets for the various tiers of each species.
	// Stat values in these templates are ignored.
	// Traits in these templates are ignored.
	let moves = [];
	let inMoves = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inMoves) {
			if (mob.name === '--End Moves') {
				break;
			}
			moves.push(mob);
		} else if (mob.name === '--Start Moves') {
			inMoves = true;
		}
	}
	TIOK.SmithMobGenerator.moves = moves;
	console.log('Moves', moves);

	// Find the Forms templates.
	// Defines the assets and possible names for each species.
	// Stat values in these templates are ignored.
	// Traits in these templates are ignored.
	let forms = [];
	let inForms = false;
	for (let i = 1; i < $dataEnemies.length; ++i) {
		const mob = $dataEnemies[i];
		if (inForms) {
			if (mob.name === '--End Forms') {
				break;
			}
			forms.push(mob);
		} else if (mob.name === '--Start Forms') {
			inForms = true;
		}
	}
	TIOK.SmithMobGenerator.forms = forms;
	console.log('Forms', forms);
};

TIOK.SmithMobGenerator.generateMobOfTier = function(tier, size) {
	// Generate the fully assembled, $dataEnemies-compatible object now.
	// Worst case, it would end up being something like 800 entries.  Probably less.
	const base = TIOK.SmithMobGenerator.baseTemplates[tier];
	const species = TIOK.SmithMobGenerator.getRandomSpecies();
	const moves = TIOK.SmithMobGenerator.getMoves(tier, species.name)
	const form = TIOK.SmithMobGenerator.getRandomForm(species);
	const specialization = TIOK.SmithMobGenerator.getRandomSpecialization();
	const element = TIOK.SmithMobGenerator.getRandomElement();
	const weakness = TIOK.SmithMobGenerator.getRandomWeakness();
	const name = TIOK.SmithMobGenerator.getRandomName(form);

	// Start by cloning the base template.
	const mob = JSON.parse(JSON.stringify(base));

	// Name
	mob.name = name;

	// Attacks and abilities.
	mob.actions = JSON.parse(JSON.stringify(moves.actions));

	// Appearance.
	let eyeColor = 'Green';
	const notes = weakness.note.split('\n');
	for (let ni = 0; ni < notes.length; ++ni) {
		const note = notes[ni];
		if (note.startsWith('EyeColor:')) {
			eyeColor = note.substr(9);
		}
	}
	mob.battlerName = form.name + eyeColor + size;
	// Custom field.  Used to index into the sprite sheet.
	mob.eyeColor = eyeColor;
	// Custom field.  Used to pick a sprite sheet when generating mob events on maps.
	mob.spriteSheet = form.name + size;

	// Stats
	for (let si = 0; si < form.params.length; ++si) {
		const base = mob.params[si];
		const speciesMultiplier = species.params[si] / 100;
		const elementMultiplier = element.params[si] / 100;
		const specializationMultiplier = specialization.params[si] / 100;

		mob.params[si] = Math.round(base * speciesMultiplier * elementMultiplier * specializationMultiplier);
	}

	// Traits
	const finalTraits = [];

	// Hit Rate
	function isTraitHitRate(trait) { return trait.code === 22 && trait.dataId === 0; }
	let hitRate = mob.traits.find(isTraitHitRate).value;
	const speciesHitTrait = species.traits.find(isTraitHitRate);
	if (speciesHitTrait) { hitRate = hitRate + speciesHitTrait.value; }
	finalTraits.push({code: 22, dataId: 0, value: hitRate});

	// Crit Rate
	function isTraitCritRate(trait) { return trait.code === 22 && trait.dataId === 2; }
	let critRate = 0;
	const speciesCritTrait = species.traits.find(isTraitCritRate);
	if (speciesCritTrait) { critRate = critRate + speciesCritTrait.value; }
	finalTraits.push({code: 22, dataId: 2, value: critRate});

	// Evasion Rate
	function isTraitEvasionRate(trait) { return trait.code === 22 && trait.dataId === 1; }
	let evasionRate = mob.traits.find(isTraitEvasionRate).value;
	const speciesEvasionTrait = species.traits.find(isTraitEvasionRate);
	if (speciesEvasionTrait) { evasionRate = evasionRate + speciesEvasionTrait.value; }
	finalTraits.push({code: 22, dataId: 1, value: evasionRate});

	// Magic Evasion Rate
	function isTraitMagicEvasionRate(trait) { return trait.code === 22 && trait.dataId === 4; }
	let magicEvasionRate = 0;
	const speciesMagicEvasionTrait = species.traits.find(isTraitMagicEvasionRate);
	if (speciesMagicEvasionTrait) { magicEvasionRate = magicEvasionRate + speciesMagicEvasionTrait.value; }
	finalTraits.push({code: 22, dataId: 4, value: magicEvasionRate});

	// Regeneration
	function isTraitRegenRate(trait) { return trait.code === 22 && trait.dataId === 7; }
	let regenRate = 0;
	const speciesRegenTrait = species.traits.find(isTraitRegenRate);
	if (speciesRegenTrait) { regenRate = regenRate + speciesRegenTrait.value; }
	finalTraits.push({code: 22, dataId: 7, value: regenRate});

	// Attack Element
	function isTraitAttackElement(trait) { return trait.code === 31; }
	let attackElement = mob.traits.find(isTraitAttackElement); // Physical by default.
	const attackElementTrait = element.traits.find(isTraitAttackElement);
	if (attackElementTrait) { attackElement = attackElementTrait; } // Overridden if an attack element was specified.
	finalTraits.push(JSON.parse(JSON.stringify(attackElement)));

	// Defense Element(s)
	function isTraitDefenseElement(trait) { return trait.code === 11; }
	const defenseElements = {};
	element.traits.forEach((trait) => {
		if (isTraitDefenseElement(trait)) {
			defenseElements[trait.dataId] = JSON.parse(JSON.stringify(trait));
		}
	});
	weakness.traits.forEach((trait) => {
		if (isTraitDefenseElement(trait)) {
			if (defenseElements[trait.dataId]) {
				// Weak AND strong to the same element.
				// Make sure it's at least a LITTLE bit of a benefit to aim at the element.
				defenseElements[trait.dataId].value = Math.max(defenseElements[trait.dataId].value * trait.value, 1.3);
			} else {
				// Only weak.
				defenseElements[trait.dataId] = JSON.parse(JSON.stringify(trait));
			}
		}
	});
	finalTraits.push(...Object.values(defenseElements));

	// Debuffs
	function isTraitDebuff(trait) { return trait.code === 13; }
	element.traits.forEach((trait) => {
		if (isTraitDebuff(trait)) {
			finalTraits.push(JSON.parse(JSON.stringify(trait)));
		}
	});

	mob.traits = finalTraits;

	return mob;
}

TIOK.SmithMobGenerator.getRandomSpecies = function() {
	const index = Math.floor(Math.random() * TIOK.SmithMobGenerator.species.length);
	return TIOK.SmithMobGenerator.species[index];
}

TIOK.SmithMobGenerator.getMoves = function(tier, speciesName) {
	const movesName = speciesName + ' ' + tier;

	for (let mi = 0; mi < TIOK.SmithMobGenerator.moves.length; ++mi) {
		const moves = TIOK.SmithMobGenerator.moves[mi];
		if (moves.name === movesName) {
			return moves;
		}
	}

	console.error('Unabled to find Moves with name "' + movesName + '"');
	return undefined;
}

TIOK.SmithMobGenerator.getRandomForm = function(species) {
	const speciesName = species.name;

	// Find all forms matching this species.
	const validForms = [];
	for (let fi = 0; fi < TIOK.SmithMobGenerator.forms.length; ++fi) {
		const form = TIOK.SmithMobGenerator.forms[fi];
		if (form.name.startsWith(speciesName)) {
			validForms.push(form);
		}
	}

	// Pick one (if any exist).
	if (validForms.length > 0) {
		return validForms[Math.floor(Math.random() * validForms.length)];
	} else {
		console.error('Unable to find any valid Forms for species "' + speciesName + '"');
		return undefined;
	}
}

TIOK.SmithMobGenerator.getRandomSpecialization = function() {
	// 50% of mobs are non-specialized.
	if (Math.random() < 0.5) {
		// The first specialization entry is "None".
		return TIOK.SmithMobGenerator.specializations[0];
	}

	// +1 so we skip the "None" specialization.
	const index = 1 + Math.floor(Math.random() * (TIOK.SmithMobGenerator.specializations.length - 1));
	return TIOK.SmithMobGenerator.specializations[index];
}

TIOK.SmithMobGenerator.getRandomElement = function() {
	// 50% of mobs are non-elemental.
	if (Math.random() < 0.5) {
		// The first element entry is "None".
		return TIOK.SmithMobGenerator.elements[0];
	}

	// +1 so we skip the "None" element.
	const index = 1 + Math.floor(Math.random() * (TIOK.SmithMobGenerator.elements.length - 1));
	return TIOK.SmithMobGenerator.elements[index];
}

TIOK.SmithMobGenerator.getRandomWeakness = function() {
	// 50% of mobs have no weaknesses.
	if (Math.random() < 0.5) {
		// The first weakness entry is "None".
		return TIOK.SmithMobGenerator.weaknesses[0];
	}

	// +1 so we skip the "None" weakness.
	const index = 1 + Math.floor(Math.random() * (TIOK.SmithMobGenerator.weaknesses.length - 1));
	return TIOK.SmithMobGenerator.weaknesses[index];
}

TIOK.SmithMobGenerator.getRandomName = function(form) {
	// Parse Names out of the Note, then pick one.
	const names = [];
	const notes = form.note.split('\n');
	for (let ni = 0; ni < notes.length; ++ni) {
		const note = notes[ni];
		if (note.startsWith('Name:')) {
			names.push(note.substr(5));
		}
	}

	if (names.length > 0) {
		return names[Math.floor(Math.random() * names.length)];
	} else {
		console.error('Unable to find any valid Names for form "' + form.name + '"');
		return 'MISSINGNO';
	}
}

TIOK.SmithMobGenerator.createMobEvents = function() {
	// Where should we spawn the mobs?
	const spawnerX = $gameVariables._data[11] || 0;
	const spawnerY = $gameVariables._data[12] || 0;
	// What map region should we reference for possible mobs?
	const spawnerRegion = $gameVariables._data[13] || 1;
	// Miniboss desired?
	const spawnMiniboss = $gameVariables._data[14] ? true : false;
	// Loner, Pack, or Swarm?
	const groupSize = Math.random();
	const isLoner = spawnMiniboss || groupSize < 0.45; // 45% chance of single mob.
	const isPack = !isLoner && groupSize < 0.8; // 35% chance of small pack.
	const isSwarm = !isLoner && !isPack; // 20% chance of large swarm.

	const possibleMobs = TIOK.CustomSave.mobsByRegion[spawnerRegion];

	const isRareMob = Math.random() > 0.9; // 10% chance of rare mob.

	let chosenMob = null;
	let numMobs = 1;
	if (spawnMiniboss) {
		chosenMob = isRareMob ? possibleMobs.minibossRare : possibleMobs.minibossCommon;
	} else if (isLoner) {
		chosenMob = isRareMob ? possibleMobs.lonerRare : possibleMobs.lonerCommon;
	} else if (isPack) {
		chosenMob = isRareMob ? possibleMobs.packRare : possibleMobs.packCommon;
		numMobs = Math.floor(Math.random() * 3) + 3; // 3-5 mobs.
	} else if (isSwarm) {
		chosenMob = isRareMob ? possibleMobs.swarmRare : possibleMobs.swarmCommon;
		numMobs = Math.floor(Math.random() * 6) + 5; // 5-10 mobs.
	}

	for (let mi = 0; mi < numMobs; ++mi) {
		const mobEvent = new Mob_Event(chosenMob, spawnerX, spawnerY);
		$gameMap._events[$gameMap._events.length] = mobEvent;

		const spriteset = SceneManager._scene._spriteset;

		const sId = spriteset._characterSprites.length;
		spriteset._characterSprites[sId] = new Sprite_Character(mobEvent);
		spriteset._characterSprites[sId].update(); // To remove occasional full-spriteset visible issue
		spriteset._tilemap.addChild(spriteset._characterSprites[sId]);
	}
}

//-----------------------------------------------------------------------------
// Mob_Event
//
// Subclass of Game_Event that provides custom mob AI.

function Mob_Event() {
    this.initialize(...arguments);
}

Mob_Event.prototype = Object.create(Game_Event.prototype);
Mob_Event.prototype.constructor = Mob_Event;

Mob_Event.prototype.initialize = function(mobData, spawnerX, spawnerY) {
	const myEventId = $gameMap._events.length;
	let eyeIndex;
	switch(mobData.eyeColor) {
		case "Green": eyeIndex = 0; break;
		case "Red": eyeIndex = 1; break;
		case "Yellow": eyeIndex = 2; break;
		case "Blue": eyeIndex = 3; break;
		case "Purple": eyeIndex = 4; break;
		default: eyeIndex = 0; break;
	}

	this._mobData = mobData;
	this._spawnerX = spawnerX;
	this._spawnerY = spawnerY;

	// Rather than referencing $dataMap._events, we create a new custom event.
	this._eventData = {
		id: myEventId,
		meta: {},
		name: "TemplateMob",
		note: "",
		x: spawnerX,
		y: spawnerY,
		pages: [
			{
				conditions: {
					actorId: 1, actorValid: false,
					itemId: 1, itemValid: false,
					selfSwitchCh: "A", selfSwitchValid: false,
					switch1Id: 1, switch1Valid: false,
					switch2Id: 1, switch2Valid: false,
					variableId: 1, 	variableValid: false, variableValue: 0
				},
				directionFix: false,
				image: {
					characterIndex: eyeIndex,
					characterName: mobData.spriteSheet,
					direction: 2,
					pattern: 0,
					tileId: 0
				},
				list: [
					{code: 250, indent: 0, parameters: [{name: "Blow1", volume: 90, pitch: 100, pan: 0}]}, 		// Play SE
					{code: 355, indent: 0, parameters: [`$dataTroops[12].members[0].enemyId = ${mobData.id};`]},// Run arbitrary script (change the monster in the Random Battle encounter)
					{code: 301, indent: 0, parameters: [0, 12, false, true]},									// Battle Processing - Troop 12: Random Battle
					{code: 601, indent: 0, parameters: []},														// Start "Battle Won" handler
					{code: 250, indent: 1, parameters: [{name: "Sheep", volume: 90, pitch: 100, pan: 0}]}, 		// Play SE
					{code: 214, indent: 1, parameters: []}, 													// Erase this mob since it's dead.
					// TODO: Grant rewards on combat win.
					{code: 0, indent: 1, parameters: []}, 														// End "Battle Won" handler
					{code: 603, indent: 0, parameters: []},														// Start "Battle Lost" handler
					{code: 353, indent: 1, parameters: []}, 													// Game Over
					{code: 0, indent: 1, parameters: []}, 														// End "Battle Lost" handler
					{code: 604, indent: 0, parameters: []},														// End of Battle Processing
					{code: 0, indent: 0, parameters: []} 														// End Script
				],
				moveFrequency: 3,
				moveRoute: {
					list: [{code: 0, parameters: []}],
					repeat: true,
					skippable: false,
					wait: false
				},
				moveSpeed: 3,
				moveType: 2, // Approach the Player
				priorityType: 1, // Same as Player
				stepAnime: false,
				through: false,
				trigger: 2, // Event touch
				walkAnime: true
			}
		]
	}

    Game_Event.prototype.initialize.call(this, $gameMap._mapId, myEventId);
};

Mob_Event.prototype.event = function() {
	return this._eventData;
}

})()}