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
	let additive = null;
	Object.values(TIOK.SmithItemGenerator.additives).find((additivesByRank) => {
		additive = additivesByRank.find((item) => {
			return item.index === additiveId;
		});
		return additive;
	});
	return additive;
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

SmithyManager._tutorialStep = -1; // By default, we are not in the tutorial.

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

	this._tutorialStep = -1;

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
	if (this._tutorialStep !== -1) {
		this.updateTutorial();
	}
	// Stop with all the updates when paused (or finished).
	if (!this._running) {
		return;
	}

	// Player turn countdown.
	if (this._turnCountdown >= 0 && (this._tutorialStep === -1 || this.tutorialAllowAction)) {
		this._turnCountdown -= 1;

		if (this._turnCountdown < 0) {
			this._canTakeActionCallbacks.forEach((callback) => { callback(); });
		}
	}

	// Heat update.
	const heatChangeAllowed = this._tutorialStep === -1 || this.tutorialAllowHeatChange;
	if (heatChangeAllowed) {
		if (this._currentLocation === 'furnace') {
			this.currentHeat = Math.min(this.currentHeat + this._heatPerTick, 10000);
		} else if (this._currentLocation === 'grindstone') {
			this.currentHeat = Math.max(0, this.currentHeat - 2);
		} else { // On the anvil or moving between locations.
			this.currentHeat = Math.max(0, this.currentHeat - 1);
		}
	}
	if (this.currentHeat > this._ore.heatMelting) {
		// If the ore is melting, we lose shape and polish every tick!
		this.currentShape = Math.max(this.currentShape - 0.1, 0);	
		this.currentPolish = Math.max(this.currentPolish - 1, 0);	
	}

	// Polish update.
	const polishChangeAllowed = this._tutorialStep === -1 || this.tutorialAllowPolishChange;
	if (polishChangeAllowed) {
		if (this._currentLocation === 'grindstone') {
			this.currentPolish = Math.min(this.currentPolish + 1, 1000);
		}
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

SmithyManager._tutorialWaitCount = 0;
SmithyManager.tutorialAllowAction = false;
SmithyManager.tutorialAllowHammer = false;
SmithyManager.tutorialAllowFurnace = false;
SmithyManager.tutorialAllowPolish = false;
SmithyManager.tutorialAllowAdditives = false;
SmithyManager.tutorialAllowHeatChange = false;
SmithyManager.tutorialAllowPolishChange = false;

SmithyManager.startTutorial = function() {
	this._tutorialStep = 0;
}

SmithyManager.updateTutorial = function() {
	// If we are explicitly waiting... wait!
	if (this._tutorialWaitCount > 0) {
		this._tutorialWaitCount -= 1;
		return;
	}

	// If we are waiting for the user to take a particular action, don't progress the tutorial just yet.
	if (this.isTutorialWaitingOnUser()) {
		return;
	}

	switch(this._tutorialStep++) {
		case 0: {
			this.showGhostMessage('I\'ll walk you through the process of smithing.\\|\nYou\'ll probably be doing this a lot from now on,\\|\nso pay attention!');
			break;
		}
		case 1: {
			this.tutorialShowAnvil = true;
			this._tutorialWaitCount = 60;
			break;
		}
		case 2: {
			this.tutorialShowAnvil = false;
			this.showGhostMessage('I\'m sure it\'s overly obvious, \\.but this is\nthe anvil.\\|  You put metal here and hit it!');
			break;
		}
		case 3: {
			this.tutorialShowCraftedItem = true;
			this._tutorialWaitCount = 60;
			break;
		}
		case 4: {
			this.tutorialShowCraftedItem = false;
			this.showGhostMessage('Of course, if the metal is too cold,\\. then\nit won\'t change shape very much.\\|\nSo first we need to heat it up!');
			break;
		}
		case 5: {
			this.tutorialShowFurnace = true;
			this._tutorialWaitCount = 60;
			break;
		}
		case 6: {
			this.tutorialShowFurnace = false;
			this.showGhostMessage('This is the furnace.\\|  Go ahead and\nthrow the ore in,\\. will you?');
			break;
		}
		case 7: {
			this.tutorialAllowHeatChange = true;
			this.tutorialAllowFurnace = true;
			this.tutorialAllowAction = true;
			this.tutorialWaitForItemInFurnace = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
		case 8: {
			this.tutorialAllowFurnace = false;
			this.tutorialAllowAction = false;
			this.tutorialWaitForItemInFurnace = false;
			this.tutorialShowHeatGauge = true;
			this._tutorialWaitCount = 720;
			break;
		}
		case 9: {
			this.pause();
			this.tutorialAllowHeatChange = false;
			this.showGhostMessage('When the ore is hot enough, we take it\nback to the anvil and start hammering.');
			break;
		}
		case 10: {
			this.tutorialAllowHammer = true;
			this.tutorialAllowAction = true;
			this.tutorialWaitForItemOnAnvil = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
		case 11: {
			this.pause();
			this.tutorialAllowHammer = false;
			this.tutorialAllowAction = false;
			this.tutorialWaitForItemOnAnvil = false;
			this.tutorialShowShapeGauge = true;
			this._tutorialWaitCount = 60;
			break;
		}
		case 12: {
			this.showGhostMessage('It will take a few hits,\\. but all you need\nto do is pound the metal into shape.\n\\.Note that you lose heat when not in the furnace!');
			break;
		}
		case 13: {
			this.tutorialAllowHammer = true;
			this.tutorialAllowFurnace = true;
			this.tutorialAllowHeatChange = true;
			this.tutorialAllowAction = true;
			this.tutorialWaitForHalfDone = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
		case 14: {
			this.pause();
			this.tutorialAllowHammer = false;
			this.tutorialAllowFurnace = false;
			this.tutorialAllowHeatChange = false;
			this.tutorialAllowAction = false;
			this.tutorialWaitForHalfDone = false;
			this._tutorialWaitCount = 60;
			break;
		}
		case 15: {
			this.showGhostMessage('One more thing.\\|  That beaten lump of metal\ncould use a little polish.\nWhat say we throw it on the grindstone?');
			break;
		}
		case 16: {
			this.tutorialShowGrindstone = true;
			this.tutorialAllowPolish = true;
			this.tutorialAllowAction = true;
			this.tutorialAllowHeatChange = true;
			this.tutorialAllowPolishChange = true;
			this.tutorialWaitForItemOnGrindstone = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
		case 17: {
			this.tutorialWaitForItemOnGrindstone = false;
			this.tutorialShowPolishGauge = true;
			this.tutorialAllowPolish = false;
			this.tutorialAllowAction = false;
			this._tutorialWaitCount = 500;
			break;
		}
		case 18: {
			this.pause();
			this.tutorialAllowHeatChange = false;
			this.tutorialAllowPolishChange = false;
			this.showGhostMessage('I should warn you that hammering undoes the\npolishing a bit, so you\'ll have to balance all\nthree tools to get your weapon just right.');
			break;
		}
		case 19: {
			this.showGhostMessage('That\'s about it, I think.\\|  Let\'s see how\n you do on your own now!');
			break;
		}
		case 20: {
			this.tutorialAllowHammer = true;
			this.tutorialAllowFurnace = true;
			this.tutorialAllowPolish = true;
			this.tutorialAllowAction = true;
			this.tutorialAllowHeatChange = true;
			this.tutorialAllowPolishChange = true;
			this.tutorialWaitForAlmostDone = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
		case 21: {
			this.pause();
			this.tutorialAllowAction = false;
			this.tutorialAllowHeatChange = false;
			this.tutorialWaitForAlmostDone = false;
			this._tutorialWaitCount = 60;
			break;
		}
		case 22: {
			this.tutorialShowCrate = true;
			this.showGhostMessage('Oh!\\. I almost forgot!\\|  If you find\ncertain special additives, you can include\nthem to give your gear magical bonuses!');
			break;
		}
		case 23: {
			this.tutorialShowTimer = true;
			this.showGhostMessage('And finally, the faster you go, the better.\\|\nSince this was your first time, I didn\'t want\nto stress you out.\\\nKeep an eye on that clock!');
			break;
		}
		case 24: {
			this.showGhostMessage('One last hit should do it.\\|\nHammer that thing and let\'s see how you did!');
			break;
		}
		case 25: {
			this.tutorialAllowHammer = true;
			this.tutorialAllowFurnace = true;
			this.tutorialAllowPolish = true;
			this.tutorialAllowAdditives = true;
			this.tutorialAllowAction = true;
			this.tutorialAllowHeatChange = true;
			this.tutorialAllowPolishChange = true;
			this._turnCountdown = 30;
			this.start();
			break;
		}
	}
}

SmithyManager.isTutorialWaitingOnUser = function() {
	// If we are showing a message, wait for the user to close it.
	if ($gameMessage.hasText()) {
		return true;
	}

	if (this.tutorialWaitForItemInFurnace && this._currentLocation !== 'furnace') {
		return true;
	}

	if (this.tutorialWaitForItemOnAnvil && this._currentLocation !== 'anvil') {
		return true;
	}

	if (this.tutorialWaitForHalfDone && this.currentShape < this._pattern.shape / 2) {
		return true;
	}

	if (this.tutorialWaitForItemOnGrindstone && this._currentLocation !== 'grindstone') {
		return true;
	}

	if (this.tutorialWaitForAlmostDone && this.currentShape < this._pattern.shape * 0.79) {
		return true;
	}

	return false;
}

SmithyManager.showGhostMessage = function(text) {
	$gameMessage.setSpeakerName('\\C[17]\\FS[32]Blacksmith\'s Ghost');
	$gameMessage.setFaceImage('NPC_OldSmith', 0);
	$gameMessage.add(text);
}


// Make the manager accessible outside of this file.
TIOK.SmithyManager = SmithyManager;

})()}