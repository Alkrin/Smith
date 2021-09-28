//=============================================================================
// TIOK_SmithSmithyUI.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds the Smithy UI for use in Smith.

@author TIOK

@help 

============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 09.25.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SmithSmithyUI = true;

var TIOK = TIOK || {};
TIOK.SmithSmithyUI = TIOK.SmithSmithyUI || {};

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

console.warn('ZZZ LOADING TIOK_SmithSmithyUI');

//=============================================================================
// Scene_Map
//=============================================================================
var _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
	_Scene_Map_update.call(this);

	this.createSmithyUI();
};

Scene_Map.prototype.createSmithyUI = function() {
	// If we already created it, we're done.
	if (this._patternSelection) {
		return;
	}
	this._patternSelection = new Sprite_PatternSelection();
	this.addChild(this._patternSelection);

	this._oreSelection = new Sprite_OreSelection();
	this.addChild(this._oreSelection);
}

//=============================================================================
// Sprite_PatternSelection
//=============================================================================
function Sprite_PatternSelection() {
    this.initialize.apply(this, arguments);
}
Sprite_PatternSelection.prototype = Object.create(Sprite.prototype);
Sprite_PatternSelection.prototype.constructor = Sprite_PatternSelection;

Sprite_PatternSelection.prototype.initialize = function () {
	this._bitmap = new Bitmap(375, 50);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this.contentsOpacity = 255;
	this.opacity = 255;

	this._displayedPattern = null;

	this._iconBitmap = ImageManager.loadBitmap('img/smith/', 'IconPattern');
	this._iconBitmapGrey = ImageManager.loadBitmap('img/smith/', 'IconPatternGrey');

	this.move(50, 50);
};

Sprite_PatternSelection.prototype.update = function() {
	this.updateVisibility();
    this.updatePatternSelection();
}

Sprite_PatternSelection.prototype.updateVisibility = function() {
	// Only show when in a Smithy location.
	if ($gameSwitches._data[13]) {
		this.opacity = 255;
	} else {
		this.opacity = 0;
	}
}

Sprite_PatternSelection.prototype.updatePatternSelection = function() {
	// Check if there is a currently selected pattern or not.
	const selectedPatternId = $gameVariables._data[7];
	const selectionChanged =
		(this._displayedPattern === null) ||
		(this._displayedPattern && !selectedPatternId) ||
		(!this._displayedPattern && selectedPatternId);

	if (selectionChanged) {
		this.drawPatternSelection();
		this._displayedPattern = selectedPatternId;
	}
}

Sprite_PatternSelection.prototype.drawPatternSelection = function() {
	const b = this._bitmap;
	b.clear();

	const selectedPattern = TIOK.getSelectedPattern();

	// Bar background.
	b.gradientFillRect(0, 0, b.height, b.height, '#11111180', '#11111180', false);

	// Bar border.
	// TODO: Replace this with an asset at some point.
	b.drawRectOutline(0, 0, b.height, b.height, 5, '#000000');
	if (selectedPattern) {
		b.drawRectOutline(1, 1, b.height - 2, b.height - 2, 3, '#22ff11');
		b.fontSize = 22;
		b.textColor = '#ffffff';
		b.drawText(selectedPattern.name.substr(9), b.height + 5, 0, 300, b.height, 'left');
		b.blt(this._iconBitmap, 0, 0, 40, 40, 5, 5);
	} else {
		b.blt(this._iconBitmapGrey, 0, 0, 40, 40, 5, 5);
	}
}

//=============================================================================
// Sprite_OreSelection
//=============================================================================
function Sprite_OreSelection() {
    this.initialize.apply(this, arguments);
}
Sprite_OreSelection.prototype = Object.create(Sprite.prototype);
Sprite_OreSelection.prototype.constructor = Sprite_OreSelection;

Sprite_OreSelection.prototype.initialize = function () {
	this._bitmap = new Bitmap(375, 50);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this.contentsOpacity = 255;
	this.opacity = 255;

	this._displayedOre = null;

	this._iconBitmap = ImageManager.loadBitmap('img/smith/', 'IconOre');
	this._iconBitmapGrey = ImageManager.loadBitmap('img/smith/', 'IconOreGrey');

	this.move(50, 110);
};

Sprite_OreSelection.prototype.update = function() {
	this.updateVisibility();
    this.updateOreSelection();
}

Sprite_OreSelection.prototype.updateVisibility = function() {
	// Only show when in a Smithy location.
	if ($gameSwitches._data[13]) {
		this.opacity = 255;
	} else {
		this.opacity = 0;
	}
}

Sprite_OreSelection.prototype.updateOreSelection = function() {
	// Check if there is a currently selected pattern or not.
	const selectedOreId = $gameVariables._data[8];
	const selectionChanged =
		(this._displayedOre === null) ||
		(this._displayedOre && !selectedOreId) ||
		(!this._displayedOre && selectedOreId);

	if (selectionChanged) {
		this.drawOreSelection();
		this._displayedOre = selectedOreId;
	}
}

Sprite_OreSelection.prototype.drawOreSelection = function() {
	const b = this._bitmap;
	b.clear();

	const selectedOre = TIOK.getSelectedOre();

	// Bar background.
	b.gradientFillRect(0, 0, b.height, b.height, '#11111180', '#11111180', false);

	// Bar border.
	// TODO: Replace this with an asset at some point.
	b.drawRectOutline(0, 0, b.height, b.height, 5, '#000000');
	if (selectedOre) {
		b.drawRectOutline(1, 1, b.height - 2, b.height - 2, 3, '#22ff11');
		b.fontSize = 22;
		b.textColor = '#ffffff';	
		b.drawText(selectedOre.name.replace(' Ore', ''), b.height + 5, 0, 300, b.height, 'left');
		b.blt(this._iconBitmap, 0, 0, 40, 40, 5, 5);
	} else {
		b.blt(this._iconBitmapGrey, 0, 0, 40, 40, 5, 5);
	}
}

})()}