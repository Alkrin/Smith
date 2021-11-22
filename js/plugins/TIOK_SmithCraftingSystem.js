//=============================================================================
// TIOK_SmithCraftingSystem.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Tracks all of the custom state related to the Smith crafting system

@author TIOK

@help 
============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 09.04.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SmithCraftingSystem = true;

var TIOK = TIOK || {};
TIOK.SmithCraftingSystem = TIOK.SmithCraftingSystem || {};

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

console.warn('ZZZ LOADING TIOK_SmithCraftingSystem');

TIOK.getBlacksmithingSkill = function() {
	return $gameActors.actor(1).atk;
}

TIOK.getSelectedPattern = function() {
	const selectedPatternId = $gameVariables._data[7];
	return TIOK.SmithItemGenerator.patterns.find((pattern) => { return pattern.index === selectedPatternId; });
}

TIOK.getSelectedOre = function() {
	const selectedOreId = $gameVariables._data[8];
	let selectedOre = null;

	Object.values(TIOK.SmithItemGenerator.ores).forEach((oresByRank) => {
		if (selectedOre) {
			return;
		}
		selectedOre = oresByRank.find((ore) => { return ore.index === selectedOreId; });
	});
	return selectedOre;
}

TIOK.getFireHeat = function() {
	const heat = $gameVariables._data[9];
	return heat;
}

TIOK.getAdditiveById = function(additiveId) {
	return TIOK.SmithItemGenerator.additives.find((additive) => { return additive.index === additiveId; });
}

TIOK.getOreById = function(oreId) {
	const ranks = ['S','A','B','C','D','E'];
	let finalOre = null;

	ranks.forEach((rank) => {
		const oreFound = TIOK.SmithItemGenerator.ores[rank].find((ore) => { return ore.index === oreId; });
		if (oreFound) {
			finalOre = oreFound;
		}
	});
	return finalOre;
}

TIOK.getPatternById = function(patternId) {
	return TIOK.SmithItemGenerator.patterns.find((pattern) => { return pattern.index === patternId; });
}

var _DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
	const contents = _DataManager_makeSaveContents();

	const firstGeneratedArmorIndex = $dataArmors.find((armor) => {
		return armor && armor.name === '--StartGeneratedArmors';
	}).id + 1;

	const firstGeneratedWeaponIndex = $dataWeapons.find((weapon) => {
		return weapon && weapon.name === '--StartGeneratedWeapons';
	}).id + 1;

	// Save crafted weapons.
	contents.smithCraftedWeapons = $dataWeapons.slice(firstGeneratedWeaponIndex);
	// Save crafted armors.
	contents.smithCraftedArmors = $dataArmors.slice(firstGeneratedArmorIndex);

    return contents;
};

var _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	_DataManager_extractSaveContents(contents);

	// Extract crafted weapons and push them into $gameWeapons.
	contents.smithCraftedWeapons.forEach((weapon) => {
		$dataWeapons[weapon.id] = weapon;
	});

	// Extract crafted armors and push them into $gameArmors.
	contents.smithCraftedArmors.forEach((armor) => {
		$dataArmors[armor.id] = armor;
	});
};

})()}