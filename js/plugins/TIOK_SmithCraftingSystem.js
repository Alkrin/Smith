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

//-----------------------------------------------------------------------------
// SmithyManager
//
// The static class that manages state for the Smithy crafting system.

function SmithyManager() {
    throw new Error('This is a static class');
}

SmithyManager._turnCountdown = 0; // How many ticks before the user will be permitted to take an action.
SmithyManager._canTakeActionCallbacks = [];

SmithyManager._currentLocation = 'anvil', // 'anvil' | 'furnace' | 'grindstone' | 'moving'

// These are the values we directly update on each crafting tick or action.
SmithyManager.currentShape = 0, // How complete the item is.
SmithyManager.currentHeat = 0, // How hot the ore is.
SmithyManager.currentPolish = 0, // How "polished" (sharpened/smoothed) the item is.

SmithyManager.additives = [], // Additives that have been added to the current crafting run.
SmithyManager.flux = null, // The flux that has been applied to the current crafting run (or null for none).

SmithyManager.reset = function() {
	this.clearAllCallbacks();

	this._turnCountdown = 0;

	this._currentLocation = 'anvil';

    this.currentShape = 0;
	this.currentHeat = 0;
	this.currentPolish = 0;

	this.additives = [];
	this.flux = null;

	this._running = false;

	// Pre-cache variables that we will use in the update loop.
	this._heatPerTick = TIOK.getFireHeat();
	this._pattern = TIOK.getSelectedPattern();
	this._ore = TIOK.getSelectedOre();
};

SmithyManager.isRunning = function() {
	return this._running;
}

SmithyManager.start = function() {
	this._running = true;
}

SmithyManager.pause = function() {
	this._running = false;
}

SmithyManager.update = function() {
	// Stop with all the updates when paused (or finished).
	if (!this._running) {
		return;
	}

	// Player turn countdown.
	if (this._turnCountdown >= 0) {
		this._turnCountdown -= 1;

		if (this._turnCountdown < 0) {
			this._canTakeActionCallbacks.forEach((callback) => { callback(); });
		}
	}

	// Heat update.
	if (this._currentLocation === 'furnace') {
		this.currentHeat = Math.min(this.currentHeat + this._heatPerTick, 10000);
	} else if (this._currentLocation === 'grindstone') {
		this.currentHeat = Math.max(0, this.currentHeat - 2);
	} else { // On the anvil or moving between locations.
		this.currentHeat = Math.max(0, this.currentHeat - 1);
	}
	if (this.currentHeat > this._ore.heatMelting) {
		// If the ore is melting, we lose shape and polish every tick!
		this.currentShape = Math.max(this.currentShape - 0.1, 0);	
		this.currentPolish = Math.max(this.currentPolish - 1, 0);	
	}

	// Polish update.
	if (this._currentLocation === 'grindstone') {
		this.currentPolish = Math.min(this.currentPolish + 1, 1000);
	}
}

SmithyManager.triggerHammerStrike = function() {
	let hammerRate = 1.0;
	// Is the ore too hot or cold to work with?
	if (this.currentHeat <= this._ore.heatEnough || this.currentHeat >= this._ore.heatMelting) { 
		hammerRate = 0; 
	// Is the ore workable, but cold?
	} else if (this.currentHeat <= this._ore.heatGood) {
		hammerRate = (this.currentHeat - this._ore.heatEnough) / (this._ore.heatGood - this._ore.heatEnough);
	// Is the ore workable, but hot?
	} else if (this.currentHeat >= this._ore.heatTooMuch) {
		hammerRate = (this._ore.heatMelting - this.currentHeat) / (this._ore.heatMelting - this._ore.heatTooMuch);
	}
	const hammerAmount = Math.max(10 * hammerRate, hammerRate > 0 ? 1 : 0);
	this.currentShape = Math.min(this.currentShape + hammerAmount, this._pattern.shape);
	this.currentPolish = Math.max(this.currentPolish - 100, 0);
	this.currentHeat = Math.max(this.currentHeat - 25, 0);
}

SmithyManager.restartTurnTimer = function() {
	// Reset countdown until user's next action.
	// This is modified by the player's speed, so higher speed makes crafting faster too!
	this._turnCountdown = 180 - $gameActors.actor(1).agi;
}

SmithyManager.triggerItemIsOnAnvil = function() {
	this._currentLocation = 'anvil';
}

SmithyManager.triggerItemIsOnFurnace = function() {
	this._currentLocation = 'furnace';
}

SmithyManager.triggerItemIsOnGrindstone = function() {
	this._currentLocation = 'grindstone';
}

SmithyManager.triggerItemIsMoving = function() {
	this._currentLocation = 'moving';
}

SmithyManager.clearAllCallbacks = function() {
	this._canTakeActionCallbacks = [];
}

SmithyManager.onCanTakeAction = function(callback) {
	this._canTakeActionCallbacks.push(callback);
}

SmithyManager.getCurrentLocation = function() {
	return this._currentLocation;
}


// Make the manager accessible outside of this file.
TIOK.SmithyManager = SmithyManager;

})()}