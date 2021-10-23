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

})()}