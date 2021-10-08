//=============================================================================
// TIOK_SmithCraftingUI.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds a custom scene for the Smith crafting system.

@command showCraftingUI
@text 'Show Crafting UI'
@ desc 'Attempts to show the Smith Crafting UI.  If unable, an error dialog will be shown.'

@author TIOK

@help 
============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 10.04.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SmithCraftingUI = true;

var TIOK = TIOK || {};
TIOK.SmithCraftingUI = TIOK.SmithCraftingUI || {
	currentLocation: 'anvil', // 'anvil' | 'furnace' | 'grindstone'

	// These are the values we directly update on each crafting tick or action.
	currentShape: 0, // How complete the item is.
	currentHeat: 0, // How hot the ore is.
	currentPolish: 0, // How "polished" (sharpened/smoothed) the item is.
};

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

console.warn('ZZZ LOADING TIOK_SmithCraftingUI');

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand('TIOK_SmithCraftingUI', 'showCraftingUI' , function(args) {
	// TODO: Add any transition animations.
	SceneManager.push(SmithCraftingScene);

	// Reset crafting state.
	TIOK.SmithCraftingUI.currentHeat = 0;
	TIOK.SmithCraftingUI.currentLocation = 'anvil';
});

//=============================================================================
// SmithCraftingScene
//=============================================================================
function SmithCraftingScene() {
    this.initialize.apply(this, arguments);
}
SmithCraftingScene.prototype = Object.create(Scene_Base.prototype);
SmithCraftingScene.prototype.constructor = SmithCraftingScene;

SmithCraftingScene.prototype.initialize = function() {
	Scene_Base.prototype.initialize.call(this);
}

SmithCraftingScene.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();

	this.createAnvil();
	this.createFurnace();
	this.createGrindstone();

	this.createHeatGauge();
	this.createShapeGauge();
	this.createPolishGauge();
};

SmithCraftingScene.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
	this.adjustBackground();
    this.startFadeIn(24, false);
};

SmithCraftingScene.prototype.createBackground = function() {
    this._backSprite = new Sprite(
        ImageManager.loadBattleback1('Fort2')
    );
    this.addChild(this._backSprite);
};

SmithCraftingScene.prototype.createAnvil = function() {
    this._anvilSprite = new Sprite(
        ImageManager.loadBitmap('img/smith/','CraftingAnvil')
    );
	this._anvilSprite.x = Graphics.width / 2;
    this._anvilSprite.y = Graphics.height / 2;
    this._anvilSprite.anchor.x = 0.5;
    this._anvilSprite.anchor.y = 0.5;

    this.addChild(this._anvilSprite);
};

SmithCraftingScene.prototype.createFurnace = function() {
    this._furnaceSprite = new Sprite(
        ImageManager.loadBitmap('img/smith/','CraftingFurnace')
    );
	this._furnaceSprite.x = 25;
    this._furnaceSprite.y = Graphics.height / 2 - 100;
    this._furnaceSprite.anchor.x = 0;
    this._furnaceSprite.anchor.y = 0.5;

    this.addChild(this._furnaceSprite);
};

SmithCraftingScene.prototype.createGrindstone = function() {
    this._grindstoneSprite = new Sprite(
        ImageManager.loadBitmap('img/smith/','CraftingGrindstone')
    );
	this._grindstoneSprite.x = Graphics.width - 25;
    this._grindstoneSprite.y = Graphics.height / 2 - 50;
    this._grindstoneSprite.anchor.x = 1.0;
    this._grindstoneSprite.anchor.y = 0.5;

    this.addChild(this._grindstoneSprite);
};

SmithCraftingScene.prototype.createHeatGauge = function() {
    this._heatGauge = new Sprite_HeatGauge();
    this.addChild(this._heatGauge);
};

SmithCraftingScene.prototype.createShapeGauge = function() {
    this._shapeGauge = new Sprite_ShapeGauge();
    this.addChild(this._shapeGauge);
};

SmithCraftingScene.prototype.createPolishGauge = function() {
    this._polishGauge = new Sprite_PolishGauge();
    this.addChild(this._polishGauge);
};

SmithCraftingScene.prototype.adjustBackground = function() {
    this.scaleSprite(this._backSprite);
    this.centerSprite(this._backSprite);
};

SmithCraftingScene.prototype.update = function() {
	Scene_Base.prototype.update.call(this);

	// TODO: Heat and Polish changes?
}

//=============================================================================
// Sprite_HeatGauge
//=============================================================================
function Sprite_HeatGauge() {
    this.initialize.apply(this, arguments);
}
Sprite_HeatGauge.prototype = Object.create(Sprite.prototype);
Sprite_HeatGauge.prototype.constructor = Sprite_HeatGauge;

Sprite_HeatGauge.prototype.initialize = function () {
	this._bitmap = new Bitmap(150, 70);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this._displayedValue = -1;
	this.contentsOpacity = 255;
	this.opacity = 255;

	this.move(75, 25);
};

Sprite_HeatGauge.prototype.update = function() {
    this.updateHeat();
}

Sprite_HeatGauge.prototype.updateHeat = function () {
	if (this._displayedValue !== TIOK.SmithCraftingUI.currentHeat) {
		this._displayedValue = TIOK.SmithCraftingUI.currentHeat;
		this.drawGauge();
	}
};

Sprite_HeatGauge.prototype.drawGauge = function() {
	var color1 = '#880000';
	var color2 = '#ffff00';
	var rate = this._displayedValue / 10000; // Cap of 10,000 takes about 20 seconds to fill at the lowest flame level.

	const b = this._bitmap;
	b.clear();

	// Letter on the left of the bar.
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText('Heat', 0, 0, b.width, 28, 'center');

	// Bar background.
	b.gradientFillRect(0, 35, b.width, 35, '#11111180', '#11111180', false);

	// Bar border.
	b.strokeRect(0, 35, b.width, 35, '#000000');

	// Bar progress.
	const clerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color1), TIOK.Utils.hex2rgb(color2), rate))
	b.gradientFillRect(1, 36, (b.width - 2) * rate, 33, color1, clerp, false);
}

//=============================================================================
// Sprite_ShapeGauge
//=============================================================================
function Sprite_ShapeGauge() {
    this.initialize.apply(this, arguments);
}
Sprite_ShapeGauge.prototype = Object.create(Sprite.prototype);
Sprite_ShapeGauge.prototype.constructor = Sprite_ShapeGauge;

Sprite_ShapeGauge.prototype.initialize = function () {
	this._bitmap = new Bitmap(150, 70);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this._displayedValue = -1;
	this.contentsOpacity = 255;
	this.opacity = 255;

	this.x = Graphics.width / 2;
    this.y = 42;
    this.anchor.x = 0.5;
};

Sprite_ShapeGauge.prototype.update = function() {
    this.updateShape();
}

Sprite_ShapeGauge.prototype.updateShape = function () {
	if (this._displayedValue !== TIOK.SmithCraftingUI.currentShape) {
		this._displayedValue = TIOK.SmithCraftingUI.currentShape;
		this.drawGauge();
	}
};

Sprite_ShapeGauge.prototype.drawGauge = function() {
	var color1 = '#228822';
	var color2 = '#22ff22';
	var rate = this._displayedValue / 10000;

	const b = this._bitmap;
	b.clear();

	// Letter on the left of the bar.
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText('Shape', 0, 0, b.width, 28, 'center');

	// Bar background.
	b.gradientFillRect(0, 35, b.width, 35, '#11111180', '#11111180', false);

	// Bar border.
	b.strokeRect(0, 35, b.width, 35, '#000000');

	// Bar progress.
	const clerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color1), TIOK.Utils.hex2rgb(color2), rate))
	b.gradientFillRect(1, 36, (b.width - 2) * rate, 33, color1, clerp, false);
}

//=============================================================================
// Sprite_PolishGauge
//=============================================================================
function Sprite_PolishGauge() {
    this.initialize.apply(this, arguments);
}
Sprite_PolishGauge.prototype = Object.create(Sprite.prototype);
Sprite_PolishGauge.prototype.constructor = Sprite_PolishGauge;

Sprite_PolishGauge.prototype.initialize = function () {
	this._bitmap = new Bitmap(150, 70);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this._displayedValue = -1;
	this.contentsOpacity = 255;
	this.opacity = 255;

	this.move(Graphics.width - 225, 60);
};

Sprite_PolishGauge.prototype.update = function() {
    this.updateHeat();
}

Sprite_PolishGauge.prototype.updateHeat = function () {
	if (this._displayedValue !== TIOK.SmithCraftingUI.currentPolish) {
		this._displayedValue = TIOK.SmithCraftingUI.currentPolish;
		this.drawGauge();
	}
};

Sprite_PolishGauge.prototype.drawGauge = function() {
	var color1 = '#4682b4';
	var color2 = '#43464b';
	var rate = this._displayedValue / 10000; // Cap of 10,000 takes about 20 seconds to fill at the lowest flame level.

	const b = this._bitmap;
	b.clear();

	// Letter on the left of the bar.
	const pattern = TIOK.getSelectedPattern();
	const gaugeText = pattern && pattern.isArmor ? 'Polish' : 'Sharpness';
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText(gaugeText, 0, 0, b.width, 28, 'center');

	// Bar background.
	b.gradientFillRect(0, 35, b.width, 35, '#11111180', '#11111180', false);

	// Bar border.
	b.strokeRect(0, 35, b.width, 35, '#000000');

	// Bar progress.
	const clerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color1), TIOK.Utils.hex2rgb(color2), rate))
	b.gradientFillRect(1, 36, (b.width - 2) * rate, 33, color1, clerp, false);
}

})()}