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
	pendingAdditive: null,
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
	SceneManager._scene.startFadeOut(30);
	setTimeout(() => {
		SceneManager.push(SmithCraftingScene);
	}, 500);

	// Reset crafting state.
	TIOK.SmithyManager.reset();
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

	TIOK.SmithCraftingUI.scene = this;

	// Set up manager callbacks.
	TIOK.SmithyManager.onCanTakeAction(this.handleCanTakeAction.bind(this));
}

SmithCraftingScene.prototype.create = function() {
    Scene_Base.prototype.create.call(this);

	this.precacheVariables();

    this.createBackground();

	this.createAnvil();
	this.createFurnace();
	this.createGrindstone();

	this.createCraftedItemSprite();

	this.createCrate();

	this.createHeatGauge();
	this.createShapeGauge();
	this.createPolishGauge();

	this.createTimer();

	this.createWindowLayer();
	this.createCommandWindow();
	this.createAdditiveWindow();
	this.createResultsWindow();
};

SmithCraftingScene.prototype.precacheVariables = function () {
	// Load this nice and early so it is ready before we need it.
	this._ghostBitmap = ImageManager.loadFace('NPC_OldSmith');
}

SmithCraftingScene.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
	this.adjustBackground();
    this.startFadeIn(24, false);

	TIOK.SmithyManager.start();
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

SmithCraftingScene.prototype.createCrate = function() {
    this._crateBackSprite = new Sprite(
        ImageManager.loadBitmap('img/smith/','CraftingCrateBack')
    );
	this._crateBackSprite.x = 25;
    this._crateBackSprite.y = Graphics.height - 25;
    this._crateBackSprite.anchor.x = 0.0;
    this._crateBackSprite.anchor.y = 1.0;

    this.addChild(this._crateBackSprite);

	// Put the Additive sprite in between the front and back of the crate so it can rise out of the crate!
	this.createAdditiveSprite();

	this._crateFrontSprite = new Sprite(
        ImageManager.loadBitmap('img/smith/','CraftingCrateFront')
    );
	this._crateFrontSprite.x = 25;
    this._crateFrontSprite.y = Graphics.height - 25;
    this._crateFrontSprite.anchor.x = 0.0;
    this._crateFrontSprite.anchor.y = 1.0;

    this.addChild(this._crateFrontSprite);
};

SmithCraftingScene.prototype.createCraftedItemSprite = function() {
    this._craftedItemSprite = new Sprite_CraftedItem();
    this.addChild(this._craftedItemSprite);
};

SmithCraftingScene.prototype.createAdditiveSprite = function() {
    this._additiveSprite = new Sprite_CraftingAdditive();
    this.addChild(this._additiveSprite);
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

SmithCraftingScene.prototype.createTimer = function() {
	const pattern = TIOK.getSelectedPattern();
    this._timer = TIOK.Timer.create();
	this._timer.setWarningTime(pattern.par);
	this._timer.setFailureTime(pattern.par * 1.5);
	this.addChild(this._timer);
};

SmithCraftingScene.prototype.createCommandWindow = function() {
    const commandWindow = new Window_SmithyCommand();
    this.addWindow(commandWindow);
    this._commandWindow = commandWindow;
};

SmithCraftingScene.prototype.createAdditiveWindow = function() {
    const additiveWindow = new Window_AdditiveSelector();
    this.addWindow(additiveWindow);
    this._additiveWindow = additiveWindow;
};

SmithCraftingScene.prototype.createResultsWindow = function() {
    const resultsWindow = new Window_SmithyResults();
    this._resultsWindow = resultsWindow;
};

SmithCraftingScene.prototype.openCommandWindow = function() {
	this._commandWindow.setup();
	this._commandWindow.show();
	this._commandWindow.activate();
	this._commandWindow.open();
}

SmithCraftingScene.prototype.openAdditiveSelector = function() {
	this._additiveWindow.show();
	this._additiveWindow.activate();
	this._additiveWindow.open();
}

SmithCraftingScene.prototype.openResultsWindow = function() {
	this.addWindow(this._resultsWindow);
	this._timer.stop();
	this._commandWindow.close();

	TIOK.SmithyManager.pause();

	this._resultsWindow.setup();
	this._resultsWindow.show();
}

SmithCraftingScene.prototype.performHammerStrike = function() {
	function hitIt() {
		// TODO: Maybe an animation and sound effect first?
		TIOK.SmithyManager.triggerHammerStrike();
	}

	if (TIOK.SmithyManager.getCurrentLocation() !== 'anvil') {
		// If we're not at the anvil, get there.
		this._craftedItemSprite.moveToAnvil(hitIt.bind(this));
	} else {
		// Already at anvil, so queue up the hammer event.
		hitIt();
	}
}

SmithCraftingScene.prototype.moveItemToFurnace = function() {
	this._craftedItemSprite.moveToFurnace();
}

SmithCraftingScene.prototype.moveItemToGrindstone = function() {
	this._craftedItemSprite.moveToGrindstone();
}

SmithCraftingScene.prototype.moveAdditiveToAnvil = function() {
	this._additiveSprite.moveToAnvil();
}

SmithCraftingScene.prototype.handleCanTakeAction = function() {
	this.openCommandWindow();
	// A little redundant to do this each time.
	this._timer.start();
}

SmithCraftingScene.prototype.update = function() {
	Scene_Base.prototype.update.call(this);

	TIOK.SmithyManager.update();
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

	this._ore = TIOK.getSelectedOre();

	this.move(75, 25);
};

Sprite_HeatGauge.prototype.update = function() {
    this.updateHeat();
}

Sprite_HeatGauge.prototype.updateHeat = function () {
	if (this._displayedValue !== TIOK.SmithyManager.currentHeat) {
		this._displayedValue = TIOK.SmithyManager.currentHeat;
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
	const clerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color1), TIOK.Utils.hex2rgb(color2), rate));
	b.gradientFillRect(1, 36, (b.width - 2) * rate, 33, color1, clerp, false);

	// Heat border indicators.

	// HeatEnough
	// TODO: Detect if this indicator is unlocked.
	let unlocked = true;
	if (unlocked) {
		const xPos = (this._ore.heatEnough / 10000) * (b.width - 2);
		b.strokeRect(xPos, 35, 1, b.height, '#ff00ff');
	}
	// HeatGood
	// TODO: Detect if this indicator is unlocked.
	unlocked = true;
	if (unlocked) {
		const xPos = (this._ore.heatGood / 10000) * (b.width - 2);
		b.strokeRect(xPos, 35, 1, b.height, '#ff00ff');
	}
	// HeatTooMuch
	// TODO: Detect if this indicator is unlocked.
	unlocked = true;
	if (unlocked) {
		const xPos = (this._ore.heatTooMuch / 10000) * (b.width - 2);
		b.strokeRect(xPos, 35, 1, b.height, '#ff00ff');
	}
	// HeatMelting
	// TODO: Detect if this indicator is unlocked.
	unlocked = true;
	if (unlocked) {
		const xPos = (this._ore.heatMelting / 10000) * (b.width - 2);
		b.strokeRect(xPos, 35, 1, b.height, '#ff00ff');
	}
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
	this._pattern = TIOK.getSelectedPattern();
	this._displayedValue = -1;
	this._barAnimDelta = 0;
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
	if (this._displayedValue !== TIOK.SmithyManager.currentShape) {
		if (this._barAnimDelta === 0) {
			// This is the first tick after a shape change, so set up the change animation.
			if (this._displayedValue > TIOK.SmithyManager.currentShape) {
				// Shape loss is smaller and immediate, so no actual animation.
				this._displayedValue = TIOK.SmithyManager.currentShape;
			} else {
				// Shape gain comes from hammering, so we animate it across a few frames.
				this._barAnimDelta = Math.ceil((TIOK.SmithyManager.currentShape - this._displayedValue) / 5);
			}
		} else {
			// The change animation is already running, so just progress it.
			this._displayedValue = Math.min(TIOK.SmithyManager.currentShape, this._displayedValue + this._barAnimDelta);
			if (this._displayedValue === TIOK.SmithyManager.currentShape) {
				// Anim complete.  No more delta.
				this._barAnimDelta = 0;

				// Is the crafting session complete?
				if (this._displayedValue >= this._pattern.shape) {
					TIOK.SmithCraftingUI.scene.openResultsWindow();
				}
			}
		}
		this.drawGauge();
	}
};

Sprite_ShapeGauge.prototype.drawGauge = function() {
	var color1 = '#228822';
	var color2 = '#22ff22';
	var rate = this._displayedValue / this._pattern.shape;

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
	this._pattern = TIOK.getSelectedPattern();
	this._displayedValue = -1;
	this.contentsOpacity = 255;
	this.opacity = 255;

	this.move(Graphics.width - 225, 60);
};

Sprite_PolishGauge.prototype.update = function() {
    this.updatePolish();
}

Sprite_PolishGauge.prototype.updatePolish = function () {
	if (this._displayedValue !== TIOK.SmithyManager.currentPolish) {
		this._displayedValue = TIOK.SmithyManager.currentPolish;
		this.drawGauge();
	}
};

Sprite_PolishGauge.prototype.drawGauge = function() {
	var color1 = '#4682c4';
	var color2 = '#43464b';

	const b = this._bitmap;
	b.clear();

	// Letter on the left of the bar.
	const gaugeText = this._pattern && this._pattern.isArmor ? 'Polish' : 'Sharpness';
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText(gaugeText, 0, 0, b.width, 28, 'center');

	// Bar background.
	b.gradientFillRect(0, 35, b.width, 35, '#11111180', '#11111180', false);

	// Bar border.
	b.strokeRect(0, 35, b.width, 35, '#000000');

	// Bar progress.
	const preTargetRate = (Math.min(this._pattern.polish, this._displayedValue)) / this._pattern.polish;
	const postTargetRate = (Math.max(0, this._displayedValue - this._pattern.polish)) / (1000 - this._pattern.polish);
	const preClerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color2), TIOK.Utils.hex2rgb(color1), preTargetRate));
	const postClerp = TIOK.Utils.rgb2hex(TIOK.Utils.interpolateColor(TIOK.Utils.hex2rgb(color1), TIOK.Utils.hex2rgb(color2), postTargetRate));
	b.gradientFillRect(1, 36, (b.width - 2) * (this._pattern.polish / 1000) * preTargetRate, 33, color2, preClerp, false);
	b.gradientFillRect(1 + (b.width - 2) * (this._pattern.polish / 1000), 36, (b.width - 2) * ((1000 - this._pattern.polish) / 1000) * postTargetRate, 33, color1, postClerp, false);

	// Target polish level.
	const xTarget = Math.floor((this._pattern.polish / 1000) * b.width);
	b.strokeRect(xTarget, 35, 2, 35, '#000000');
}

//=============================================================================
// Sprite_CraftedItem
//=============================================================================
function Sprite_CraftedItem() {
    this.initialize.apply(this, arguments);
}
Sprite_CraftedItem.prototype = Object.create(Sprite.prototype);
Sprite_CraftedItem.prototype.constructor = Sprite_CraftedItem;

Sprite_CraftedItem.prototype.initialize = function () {
	this._bitmap = new Bitmap(150, 150);
	this._pattern = TIOK.getSelectedPattern();
	this._ore = TIOK.getSelectedOre();
	this._ingotBitmap = ImageManager.loadBitmap('img/smith/', 'ShapeIngot');
	this._partialBitmap = ImageManager.loadBitmap('img/smith/', `Shape${this._pattern.image}Partial`);
	this._completeBitmap = ImageManager.loadBitmap('img/smith/', `Shape${this._pattern.image}Complete`);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this.anchor.x = 0.5;
    this.anchor.y = 0.5;
	this.contentsOpacity = 255;
	this.opacity = 255;
	this._location = 'anvil';
	this._xOffset = 0;
	this._yOffset = 0;
	this._shape = 'none';

	// Pre-calculated positions to simplify animation.
	const anvilPos = { x: Graphics.width / 2 + 10, y: Graphics.height / 2 - 30};
	const furnacePos = { x: 195, y: Graphics.height / 2 - 100};
	const grindstonePos = { x: Graphics.width - 150, y: Graphics.height / 2 - 110};

	// Pre-built animations so we can just trigger them by name.
	this._animAnvilToFurnace = TIOK.SpriteAnimation.position(this, anvilPos.x, furnacePos.x, anvilPos.y, furnacePos.y, 45);
	this._animAnvilToGrindstone = TIOK.SpriteAnimation.position(this, anvilPos.x, grindstonePos.x, anvilPos.y, grindstonePos.y, 45);
	this._animFurnaceToAnvil = TIOK.SpriteAnimation.position(this, furnacePos.x, anvilPos.x, furnacePos.y, anvilPos.y, 45);
	this._animFurnaceToGrindstone = TIOK.SpriteAnimation.position(this, furnacePos.x, grindstonePos.x, furnacePos.y, grindstonePos.y, 45);
	this._animGrindstoneToAnvil = TIOK.SpriteAnimation.position(this, grindstonePos.x, anvilPos.x, grindstonePos.y, anvilPos.y, 45);
	this._animGrindstoneToFurnace = TIOK.SpriteAnimation.position(this, grindstonePos.x, furnacePos.x, grindstonePos.y, furnacePos.y, 45);

	this.move(anvilPos.x, anvilPos.y);
};

Sprite_CraftedItem.prototype.update = function() {
	this.updateShape();
}

Sprite_CraftedItem.prototype.moveToAnvil = function(callback) {
	const fullCallback = () => {
		if (callback) {
			callback();
		}
		TIOK.SmithyManager.triggerItemIsOnAnvil();
	}
	switch(TIOK.SmithyManager.getCurrentLocation()) {
		case 'anvil': // Already there!
			break;
		case 'furnace':
			this._animFurnaceToAnvil.start(fullCallback, true);
			break;
		case 'grindstone':
			this._animGrindstoneToAnvil.start(fullCallback, true);
			break;
	}
	TIOK.SmithyManager.triggerItemIsMoving();
}

Sprite_CraftedItem.prototype.moveToFurnace = function(callback) {
	const fullCallback = () => {
		if (callback) {
			callback();
		}
		TIOK.SmithyManager.triggerItemIsOnFurnace();
	}
	switch(TIOK.SmithyManager.getCurrentLocation()) {
		case 'anvil':
			this._animAnvilToFurnace.start(fullCallback, true);
			break;
		case 'furnace': // Already there!
			break;
		case 'grindstone':
			this._animGrindstoneToFurnace.start(fullCallback, true);
			break;
	}
	TIOK.SmithyManager.triggerItemIsMoving();
}

Sprite_CraftedItem.prototype.moveToGrindstone = function(callback) {
	const fullCallback = () => {
		if (callback) {
			callback();
		}
		TIOK.SmithyManager.triggerItemIsOnGrindstone();
	}
	switch(TIOK.SmithyManager.getCurrentLocation()) {
		case 'anvil':
			this._animAnvilToGrindstone.start(fullCallback, true);
			break;
		case 'furnace':
			this._animFurnaceToGrindstone.start(fullCallback, true);
			break;
		case 'grindstone': // Already there!
			break;
	}
	TIOK.SmithyManager.triggerItemIsMoving();
}

Sprite_CraftedItem.prototype.updateShape = function () {
	// Check Shape against breakpoints.  Change shape and trigger a redraw if we have crossed a threshold.
	let newShape = 'Ingot';
	const shapeRate = TIOK.SmithyManager.currentShape / this._pattern.shape;

	if (shapeRate < 0.3) {
		newShape = 'Ingot';
	} else if (shapeRate < 0.7) {
		newShape = 'Partial';
	} else {
		newShape = 'Complete';
	}

	if (newShape !== this._shape) {
		this._shape = newShape;
		this.redraw();
	}
};

Sprite_CraftedItem.prototype.redraw = function () {
	const b = this._bitmap;
	b.clear();

	if (this._shape === 'Ingot') {
		b.blt(this._ingotBitmap, 0, 0, this._ingotBitmap.width, this._ingotBitmap.height, (b.width - this._ingotBitmap.width) / 2, (b.height - this._ingotBitmap.height) / 2);
	} else if (this._shape === 'Partial') {
		b.blt(this._partialBitmap, 0, 0, this._partialBitmap.width, this._partialBitmap.height, (b.width - this._partialBitmap.width) / 2, (b.height - this._partialBitmap.height) / 2);
	} else if (this._shape === 'Complete') {
		b.blt(this._completeBitmap, 0, 0, this._completeBitmap.width, this._completeBitmap.height, (b.width - this._completeBitmap.width) / 2, (b.height - this._completeBitmap.height) / 2);
	}
	this.updateBlendColor();
};

Sprite_CraftedItem.prototype.updateBlendColor = function () {
	// TODO: Interpolate color from ore and additives (if any).
	const oreColor = this._ore.color;
	oreColor.push(128); // Alpha
	this.setBlendColor(oreColor);
}

//=============================================================================
// Sprite_CraftingAdditive
//=============================================================================
function Sprite_CraftingAdditive() {
    this.initialize.apply(this, arguments);
}
Sprite_CraftingAdditive.prototype = Object.create(Sprite.prototype);
Sprite_CraftingAdditive.prototype.constructor = Sprite_CraftingAdditive;

Sprite_CraftingAdditive.prototype.initialize = function () {
	this._bitmap = new Bitmap(75, 75);
	this._additive = null;
	Sprite.prototype.initialize.call(this, this._bitmap);
	this.anchor.x = 0.5;
    this.anchor.y = 0.5;
	this.contentsOpacity = 255;
	this.opacity = 255;

	// Pre-calculated positions to simplify animation.
	const anvilPos = { x: Graphics.width / 2 + 10, y: Graphics.height / 2 - 30};
	this._cratePos = { x: 126, y: Graphics.height - 120};
	const halfwayPos = { x: 126, y: Graphics.height - 270};

	this._animCrateToAnvil = TIOK.SpriteAnimation.sequence([
		// Move up out of the crate.
		TIOK.SpriteAnimation.position(this, this._cratePos.x, halfwayPos.x, this._cratePos.y, halfwayPos.y, 25),
		// Move over to the anvil.
		TIOK.SpriteAnimation.position(this, halfwayPos.x, anvilPos.x, halfwayPos.y, anvilPos.y, 35, 40),
		// Once we're at the anvil, shrink and fade away.
		TIOK.SpriteAnimation.parallel([
			TIOK.SpriteAnimation.scale(this, 1, 0.5, 30, 15),
			TIOK.SpriteAnimation.opacity(this, 255, 0, 30, 15),
		])
	]);

	this.move(this._cratePos.x, this._cratePos.y);
};

Sprite_CraftingAdditive.prototype.update = function() {
	this.updateAssets();
}

Sprite_CraftingAdditive.prototype.moveToAnvil = function(callback) {
	this._animCrateToAnvil.start(() => {
		this.move(this._cratePos.x, this._cratePos.y);
		this.opacity = 255;
		this.scale.x = 1;
		this.scale.y = 1;
	}, true);
}

Sprite_CraftingAdditive.prototype.updateAssets = function () {
	const newAdditive = TIOK.SmithCraftingUI.pendingAdditive;
	if (newAdditive !== this._additive) {
		this._additive = newAdditive;
		if (newAdditive) {
			this.numLoadedBitmaps = 0;
			this._backgroundBitmap = ImageManager.loadBitmap('img/smith/additives/', `Additive${this._additive.image}Background`);
			this._backgroundBitmap.addLoadListener(this._onSubBitmapLoad.bind(this));
			this._foregroundBitmap = ImageManager.loadBitmap('img/smith/additives/', `Additive${this._additive.image}Foreground`);
			this._foregroundBitmap.addLoadListener(this._onSubBitmapLoad.bind(this));
			this._outlineBitmap = ImageManager.loadBitmap('img/smith/additives/', `Additive${this._additive.image}Outline`);
			this._outlineBitmap.addLoadListener(this._onSubBitmapLoad.bind(this));
		} else {
			this.redraw();
		}
	}
};

Sprite_CraftingAdditive.prototype._onSubBitmapLoad = function(bitmapLoaded) {
	this.numLoadedBitmaps += 1;
    if (this.numLoadedBitmaps >= 3) {
		this.redraw();
	}
};


Sprite_CraftingAdditive.prototype.redraw = function () {
	const b = this._bitmap;
	b.clear();

	if (this._additive) {
		b.blt(this._backgroundBitmap, 0, 0, this._backgroundBitmap.width, this._backgroundBitmap.height, 0, 0);
		b.blt(this._foregroundBitmap, 0, 0, this._foregroundBitmap.width, this._foregroundBitmap.height, 0, 0);
		b.blt(this._outlineBitmap, 0, 0, this._outlineBitmap.width, this._outlineBitmap.height, 0, 0);
	}

	this.updateBlendColor();
};

Sprite_CraftingAdditive.prototype.updateBlendColor = function () {
	// TODO: Do I need to make foreground and background into separate sprites so that I can colorize them individually?

	// const oreColor = this._ore.color;
	// oreColor.push(128); // Alpha
	// this.setBlendColor(oreColor);
}

//=============================================================================
// Window_SmithyCommand
//=============================================================================
function Window_SmithyCommand() {
    this.initialize(...arguments);
}
Window_SmithyCommand.prototype = Object.create(Window_Command.prototype);
Window_SmithyCommand.prototype.constructor = Window_SmithyCommand;

Window_SmithyCommand.prototype.initialize = function() {
	const ww = 192;
    const wh = 200;
    const wx = Graphics.boxWidth - ww - 10;
    const wy = Graphics.boxHeight - wh - 10;

    Window_Command.prototype.initialize.call(this, new Rectangle(wx, wy, ww, wh));
    this.openness = 0;
    this.deactivate();

	this.setHandler('Hammer', this.onHammer.bind(this));
	this.setHandler('Heat Up', this.onHeatUp.bind(this));
	this.setHandler('Polish', this.onPolish.bind(this));
	this.setHandler('Additives', this.onAdditives.bind(this));
};

Window_SmithyCommand.prototype.makeCommandList = function() {
	const pattern = TIOK.getSelectedPattern();
	const polishText = pattern && pattern.isArmor ? 'Polish' : 'Sharpen';
    this.addCommand('Hammer', 'Hammer');
    this.addCommand('Heat Up', 'Heat Up', TIOK.SmithyManager.getCurrentLocation() !== 'furnace');
	this.addCommand(polishText, 'Polish', TIOK.SmithyManager.getCurrentLocation() !== 'grindstone');
	this.addCommand('Additives', 'Additives', TIOK.SmithyManager.getCurrentLocation() === 'anvil' && 
	                (TIOK.SmithyManager.additives.length < pattern.maxAdditives || TIOK.SmithyManager.flux == null));
};

Window_SmithyCommand.prototype.setup = function() {
    this.refresh();
    this.forceSelect(0);
    this.activate();
    this.open();
};

Window_SmithyCommand.prototype.onHammer = function() {
	this.finalizeAction();

	TIOK.SmithCraftingUI.scene.performHammerStrike();
}

Window_SmithyCommand.prototype.onHeatUp = function() {
	this.finalizeAction();

	TIOK.SmithCraftingUI.scene.moveItemToFurnace();
}

Window_SmithyCommand.prototype.onPolish = function() {
	this.finalizeAction();
	// Move item to grindstone.
	TIOK.SmithCraftingUI.scene.moveItemToGrindstone();
}

Window_SmithyCommand.prototype.onAdditives = function() {
	TIOK.SmithCraftingUI.scene.openAdditiveSelector();
}

Window_SmithyCommand.prototype.finalizeAction = function() {
	TIOK.SmithyManager.restartTurnTimer();

	// Hide the menu until the user can act.
	this.close();
}

//=============================================================================
// Window_AdditiveSelector
//=============================================================================
function Window_AdditiveSelector() {
    this.initialize(...arguments);
}
Window_AdditiveSelector.prototype = Object.create(Window_ItemList.prototype);
Window_AdditiveSelector.prototype.constructor = Window_AdditiveSelector;

Window_AdditiveSelector.prototype.initialize = function() {
	const ww = 500;
    const wh = 400;
    const wx = 10;
    const wy = Graphics.boxHeight - wh - 10;
    Window_ItemList.prototype.initialize.call(this, new Rectangle(wx, wy, ww, wh));

	this.openness = 0;
    this.deactivate();

	this.createCancelButton();
	this.setHandler("ok", this.onOk.bind(this));
	this.setHandler("cancel", this.onCancel.bind(this));
};

Window_AdditiveSelector.prototype.onCancel = function() {
    this.close();
	this.deactivate()
	TIOK.SmithCraftingUI.scene._commandWindow.activate();
};

Window_AdditiveSelector.prototype.onOk = function() {
	const item = this.item();
	const itemId = item ? item.id : 0;
	const additive = TIOK.getAdditiveById(itemId);
	if (additive) {
		if (additive.family === 'flux') {
			TIOK.SmithyManager.flux = additive;
		} else {
			TIOK.SmithyManager.additives.push(additive);
		}
		TIOK.SmithCraftingUI.scene.moveAdditiveToAnvil();
		TIOK.SmithCraftingUI.pendingAdditive = additive;
	}
    this.close();
	this.deactivate();
	TIOK.SmithCraftingUI.scene._commandWindow.finalizeAction();
};

Window_AdditiveSelector.prototype.maxCols = function() {
    return 1;
};

Window_AdditiveSelector.prototype.includes = function(item) {
	// Determines what items are shown (though they may be disabled).
	const isBasicItem = DataManager.isItem(item) && item.itypeId === 1;
	if (!isBasicItem) {
		return false;
	}

	const additive = TIOK.getAdditiveById(item.id);
	if (!additive) {
		return false;
	}

	return true;
};

Window_AdditiveSelector.prototype.isEnabled = function(item) {
	const additive = TIOK.getAdditiveById(item.id);
    // Can only select an additive you are skilled enough to use.
	if (!additive || additive.minSkill > TIOK.getBlacksmithingSkill()) {
		return false;
	}

	if (additive.family === 'flux') {
		// Flux is valid only if no flux has been selected yet.
		return TIOK.SmithyManager.flux === null;
	} else {
		// Other additives are valid if there is an additive slot free for the selected pattern.  Yes, you can use the same additive twice.
		const pattern = TIOK.getSelectedPattern();
		if (!pattern) {
			return false;
		}
		return TIOK.SmithyManager.additives.length < pattern.maxAdditives;
	}
};

Window_AdditiveSelector.prototype.drawItem = function(index) {
    const item = this.itemAt(index);
    if (item) {
        const rect = this.itemLineRect(index);
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, rect.width);
		this.drawItemTier(item, rect);
        this.changePaintOpacity(1);
    }
};

Window_AdditiveSelector.prototype.drawItemTier = function(item, rect) {
	const additive = TIOK.getAdditiveById(item.id);
	if (additive) {
		this.drawText(additive.rank, rect.x + rect.width - 30, rect.y, 30);
	}
};

Window_AdditiveSelector.prototype.createCancelButton = function() {
    if (ConfigManager.touchUI) {
        this._cancelButton = new Sprite_Button("cancel");
        this._cancelButton.visible = false;
		this._cancelButton.x = this.width - this._cancelButton.width;
		this._cancelButton.y = -8 - this._cancelButton.height;
        this.addChild(this._cancelButton);
    }
};

Window_AdditiveSelector.prototype.show = function() {
	this.refresh();
    this.scrollTo(0, 0);
	this.forceSelect(0);
    this.activate();
	this.open();
	this._cancelButton.visible = true;
};

//=============================================================================
// Window_SmithyResults
//=============================================================================
function Window_SmithyResults() {
    this.initialize(...arguments);
}
Window_SmithyResults.prototype = Object.create(Window_Base.prototype);
Window_SmithyResults.prototype.constructor = Window_SmithyResults;

Window_SmithyResults.prototype.initialize = function(rect) {
	const ww = 550;
	const wh = 430;
	const wx = (Graphics.width - ww) / 2;
	const wy = (Graphics.height - wh) / 2;
    Window_Base.prototype.initialize.call(this, new Rectangle(wx, wy, ww, wh));
	this.openness = 0;
    this.deactivate();

	const button = new Sprite_Button('ok');
	button.setClickHandler(this.onButtonOk.bind(this));
	button.move(this.width - button.width, this.height + 5);
    this.addChild(button);
};

Window_SmithyResults.prototype.onButtonOk = function() {
    this.processOk();
};

Window_SmithyResults.prototype.processOk = function() {
    this.close();

	TIOK.SmithCraftingUI.scene.startFadeOut(30);
	setTimeout(() => {
		// Unselect Pattern and Ore.
		$gameVariables._data[7] = 0;
		$gameVariables._data[8] = 0;

		SceneManager.pop();
		SceneManager._nextScene.startFadeIn(30);
	}, 500);
};

Window_SmithyResults.prototype.setup = function() {
	this.calculateRatesAndRankings();
	this.calculateOutput();
	this.updateInventory();
	this.grantXP();
	this.redraw();
}

Window_SmithyResults.prototype.calculateRatesAndRankings = function() {
	const pattern = TIOK.getSelectedPattern();
	const ore = TIOK.getSelectedOre();

	// Calculate actual success rate.
	// Base rate.
	let successRate = pattern.successRate;
	// Blacksmithing skill.
	successRate += TIOK.getBlacksmithingSkill();
	// Ore modifier.
	successRate += ore.successRate;
	// Flux modifier.
	if (TIOK.SmithyManager.flux) {
		successRate += TIOK.SmithyManager.flux.successRate;
	}
	// Additive modifiers.
	TIOK.SmithyManager.additives.forEach((additive) => {
		successRate += additive.successRate;
	});


	// Time ranking.
	const timeRate = TIOK.SmithCraftingUI.scene._timer.getValue() / pattern.par;
	let timeRank = 'F';
	if (timeRate < 0.5) {
		timeRank = 'S';
		successRate += 5;
	} else if (timeRate < 1) {
		timeRank = 'A';
	} else if (timeRate < 1.2) {
		timeRank = 'B';
		successRate -= 5;
	} else if (timeRate < 1.3) {
		timeRank = 'C';
		successRate -= 10;
	} else if (timeRate < 1.4) {
		timeRank = 'D';
		successRate -= 15;
	} else if (timeRate < 1.5) {
		timeRank = 'E';
		successRate -= 20;
	} else {
		timeRank = 'F';
		successRate -= 25;
	}

	// Sharpness ranking.
	const polishDelta = Math.abs(TIOK.SmithyManager.currentPolish - pattern.polish);
	let polishRank = 'F';
	if (polishDelta < 20) {
		polishRank = 'S';
		successRate += 5;
	} else if (polishDelta < 60) {
		polishRank = 'A';
	} else if (polishDelta < 80) {
		polishRank = 'B';
		successRate -= 5;
	} else if (polishDelta < 100) {
		polishRank = 'C';
		successRate -= 10;
	} else if (polishDelta < 125) {
		polishRank = 'D';
		successRate -= 15;
	} else if (polishDelta < 150) {
		polishRank = 'E';
		successRate -= 20;
	} else {
		polishRank = 'F';
		successRate -= 25;
	}

	// Luck ranking.
	const luck = successRate - Math.random() * 100;
	let luckRank = 'F';
	if (luck >= 50) {
		luckRank = 'S';
	} else if ( luck >= 0) {
		luckRank = 'A';
	} else if ( luck >= -10) {
		luckRank = 'B';
	} else if ( luck >= -20) {
		luckRank = 'C';
	} else if ( luck >= -30) {
		luckRank = 'D';
	} else if ( luck >= -40) {
		luckRank = 'E';
	} else {
		luckRank = 'F';
	}

	this._successRate = successRate;
	this._timeRank = timeRank;
	this._polishRank = polishRank;
	this._luckRank = luckRank;
};

Window_SmithyResults.prototype.calculateOutput = function () {
	const pattern = TIOK.getSelectedPattern();
	const ore = TIOK.getSelectedOre();

	// Based on attempted recipe and LuckRank, calculate what the user got at the end.
	// That means an item (or reclaimed ore on failure) and XP.
	let xpRate = 1.0;
	let ranksLost = 0;
	switch(this._luckRank) {
		case 'S': // Success, bonus XP.
			xpRate = 1.5;
			break;
		case 'A': // Success, full XP.
			xpRate = 1.0;
			break;
		case 'B': // Lose one rank.
			xpRate = 0.8;
			ranksLost = 1;
			break;
		case 'C': // Lose two ranks.
			xpRate = 0.6;
			ranksLost = 2;
			break;
		case 'D': // Lose three ranks.
			xpRate = 0.4;
			ranksLost = 3;
			break;
		case 'E': // Lose four ranks.
			xpRate = 0.2;
			ranksLost = 4;
			break;
		case 'F': // Lose five ranks.
			xpRate = 0.1;
			ranksLost = 5;
			break;
	}

	this._xpEarned = this.getBaseXP() * xpRate;

	const resultRank = reduceRank(ore.rank, ranksLost);
	this._resultRank = resultRank;

	this._oreReturned = 0;
	
	if (extendedRanks.indexOf(resultRank) >= extendedRanks.indexOf('F')) {
		// If rank is F or lower, you don't get an item.
		let oreReturnRate = 1.0;
		switch(resultRank) {
			case 'F':
				oreReturnRate = 0.8;
				break;
			case 'G':
				oreReturnRate = 0.6;
				break;
			case 'H':
				oreReturnRate = 0.4;
				break;
			case 'I':
				oreReturnRate = 0.2;
				break;
			case 'J':
				oreReturnRate = 0.1;
				break;
		}
		// You'll get at least one ore back, no matter how badly you did.
		this._oreReturned = Math.max(Math.ceil(pattern.oreCount * oreReturnRate), 1);
	} else {
		// Any rank between S and E gives you an item.
		let firstAdditiveFamily = null;
		let firstAdditiveRank = null;
		let secondAdditiveFamily = null;
		let secondAdditiveRank = null;
		if (TIOK.SmithyManager.additives.length > 0) {
			const firstAdditive = TIOK.SmithyManager.additives[0];
			firstAdditiveFamily = firstAdditive.family;
			firstAdditiveRank = reduceRank(firstAdditive.rank, ranksLost);
			let hasFirstAdditive = extendedRanks.indexOf(firstAdditiveRank) <= extendedRanks.indexOf('E');

			if (TIOK.SmithyManager.additives.length > 1) {
				const secondAdditive = TIOK.SmithyManager.additives[1];

				if (hasFirstAdditive) {
					secondAdditiveFamily = secondAdditive.family;
					secondAdditiveRank = reduceRank(secondAdditive.rank, ranksLost);
				} else {
					firstAdditiveFamily = secondAdditive.family;
					firstAdditiveRank = reduceRank(secondAdditive.rank, ranksLost);
				}
			}

			hasFirstAdditive = firstAdditiveRank && extendedRanks.indexOf(firstAdditiveRank) <= extendedRanks.indexOf('E');
			const hasSecondAdditive = secondAdditiveRank && extendedRanks.indexOf(secondAdditiveRank) <= extendedRanks.indexOf('E');

			if (!hasFirstAdditive) {
				firstAdditiveFamily = null;
				firstAdditiveRank = null;
			}
			if (!hasSecondAdditive) {
				secondAdditiveFamily = null;
				secondAdditiveRank = null;
			}
		}
		this._itemCrafted = TIOK.SmithItemGenerator.createItem(pattern, ore, resultRank, firstAdditiveFamily, firstAdditiveRank, secondAdditiveFamily, secondAdditiveRank);
	}
};

const baseCraftingXP = {
	S: 500,
	A: 400,
	B: 300,
	C: 200,
	D: 100,
	E: 50,
	F: 25
}
Window_SmithyResults.prototype.getBaseXP = function () {
	const pattern = TIOK.getSelectedPattern();

	return baseCraftingXP[pattern.oreRank];
};

const extendedRanks = ['S','A','B','C','D','E','F','G','H','I','J'];
const reduceRank = function(baseRank, reduction) {
	const baseIndex = extendedRanks.indexOf(baseRank);
	const finalIndex = baseIndex + reduction;
	return extendedRanks[finalIndex];
}

Window_SmithyResults.prototype.updateInventory = function () {
	// Take away used ore, flux, and additives.
	$gameParty.loseItem($dataItems[TIOK.getSelectedOre().index], TIOK.getSelectedPattern().oreCount);
	if (TIOK.SmithyManager.flux) {
		$gameParty.loseItem($dataItems[TIOK.SmithyManager.flux.index], 1);
	}
	if (TIOK.SmithyManager.additives.length > 0) {
		$gameParty.loseItem($dataItems[TIOK.SmithyManager.additives[0].index], 1);

		if (TIOK.SmithyManager.additives.length > 1) {
			$gameParty.loseItem($dataItems[TIOK.SmithyManager.additives[1].index], 1);
		}
	}
	

	// Grant the created item... or reclaimed ore as a consolation prize.
	if (this._itemCrafted) {
		$gameParty.gainItem(this._itemCrafted, 1);
	} else if (this._oreReturned) {
		$gameParty.gainItem($dataItems[TIOK.getSelectedOre().index], this._oreReturned);
	}
};

Window_SmithyResults.prototype.grantXP = function () {
	// Give the player XP.  If they level up, the message for it will appear after they leave the Crafting scene.
	$gameActors.actor(1).gainExp(this._xpEarned);
};

var _Game_Actor_displayLevelUp = Game_Actor.prototype.displayLevelUp;
Game_Actor.prototype.displayLevelUp = function(newSkills) {
	_Game_Actor_displayLevelUp.call(this, newSkills);

	$gameParty.gainItem($dataItems[34], 1);
    $gameMessage.add('Received \\C[2][Growth Crystal]\\C[0]!');
};

const rankColors = {
	S: '#aa22ff',
	A: '#00ff00',
	B: '#33cc00',
	C: '#669900',
	D: '#996600',
	E: '#cc3300',
	F: '#ff0000',
}

Window_SmithyResults.prototype.redraw = function () {
	const b = this.contents;
	b.clear();

	const pattern = TIOK.getSelectedPattern();
	const polishText = pattern && pattern.isArmor ? 'Polish:' : 'Sharpness:';

	const topOfItemSection = b.height - 100;
	const commentSectionHeight = 160;
	const topOfCommentSection = topOfItemSection - commentSectionHeight;

	// Black separator lines.
	b.gradientFillRect(0, 32, b.width, 5, '#000000', '#000000', false);
	b.gradientFillRect(b.width - 100, 0, 5, 77, '#000000', '#000000', false);
	b.gradientFillRect(b.width - 100, 72, 100, 5, '#000000', '#000000', false);
	b.gradientFillRect(0, topOfCommentSection, b.width, 5, '#000000', '#000000', false);
	b.gradientFillRect(0, topOfItemSection, b.width, 5, '#000000', '#000000', false);
	// White separator lines.
	b.gradientFillRect(1, 33, b.width - 2, 3, '#999999', '#999999', false);
	b.gradientFillRect(b.width - 99, 1, 3, 75, '#999999', '#999999', false);
	b.gradientFillRect(b.width - 99, 73, 98, 3, '#999999', '#999999', false);
	b.gradientFillRect(1, topOfCommentSection + 1, b.width - 2, 3, '#999999', '#999999', false);
	b.gradientFillRect(1, topOfItemSection + 1, b.width - 2, 3, '#999999', '#999999', false);

	// Rankings
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText('Performance', 0, 0, b.width - 100, 28, 'center');

	b.drawText('Time:', 0, 50, (b.width - 100) / 2 + 35, 24, 'right');
	b.drawText(polishText, 0, 80, (b.width - 100) / 2 + 35, 24, 'right');
	b.drawText('Luck:', 0, 110, (b.width - 100) / 2 + 35, 24, 'right');

	b.textColor = rankColors[this._timeRank];
	b.drawText(this._timeRank, (b.width - 100) / 2 + 45, 50, 50, 24, 'left');
	b.textColor = rankColors[this._polishRank];
	b.drawText(this._polishRank, (b.width - 100) / 2 + 45, 80, 50, 24, 'left');
	b.textColor = rankColors[this._luckRank];
	b.drawText(this._luckRank, (b.width - 100) / 2 + 45, 110, 50, 24, 'left');

	// XP
	b.fontSize = 28;
	b.textColor = '#ffffff';
	b.drawText('XP', b.width - 100, 0, 100, 28, 'center');
	b.drawText(this._xpEarned.toString(), b.width - 100, 40, 100, 28, 'center');

	// Comments from the Blacksmith's ghost!
	const ghostFace = TIOK.SmithCraftingUI.scene._ghostBitmap;
	b.blt(ghostFace, 0, 0, ImageManager.faceWidth, ImageManager.faceHeight, 0, topOfCommentSection + 10);
	b.fontSize = 28;
	b.textColor = '#ffffff';
	const commentLines = this.getComment();
	const commentX = ImageManager.faceWidth + 10;
	const maxCommentWidth = b.width - commentX;
	const commentLineSpacing = 4;
	const commentLineHeight = b.fontSize + commentLineSpacing;
	const commentHeight = commentLineHeight * commentLines.length - commentLineSpacing;
	const commentTop = topOfCommentSection + 10 + (commentSectionHeight - 15 - commentHeight) / 2;
	for (let li = 0; li < commentLines.length; ++li) {
		b.drawText((li === 0 ? '"' : '') + commentLines[li] + (li === commentLines.length - 1 ? '"' : ''), 
		           commentX, commentTop + commentLineHeight * li, maxCommentWidth, b.fontSize, 'center');
	}

	// Output (item / ore)
	b.fontSize = 28;
	b.textColor = '#ffffff';
	if (this._itemCrafted) {
		const descLines = this._itemCrafted.description.split('\n');
		const topInset = descLines.length > 1 ? 0 : 15;
		b.drawText(this._itemCrafted.name, 0, topOfItemSection + 10 + topInset, b.width, 28, 'center');
		b.fontSize = 24
		b.drawText(descLines[0], 0, topOfItemSection + 43 + topInset, b.width, 24, 'center');
		if (descLines.length > 1) {
			b.drawText(descLines[1], 0, topOfItemSection + 71, b.width, 24, 'center');
		}
	} else {
		b.textColor = '#ff7777';
		b.drawText('Crafting Failed!', 0, topOfItemSection + 10, b.width, 28, 'center');
		b.textColor = '#ffdddd';
		b.drawText(`You were able to retrieve ${this._oreReturned} ore.`, 0, topOfItemSection + 43, b.width, 28, 'center');
		b.drawText('Better luck next time!', 0, topOfItemSection + 71, b.width, 28, 'center');
	}
};

const goodComments = [
	['Good job.', 'You actually made what you were', 'trying to make.'],
	['I like it.', 'You finally got the edges right.'],
	['There\'s nothing like the', 'smell of a hot forge.'],
	['If I still had hands,', 'I might applaud.'],
	['Well done!', 'Now do it a thousand more times.'],
	['After you save the world,', 'you might actually make', 'a decent blacksmith.'],
	['Mind if I say that', 'I made this one?'],
	['Hang that on the wall.', 'It\'s too pretty to use.'],
	['I might actually be willing','to trust my life to that one.'],
	['I am a GREAT teacher,', 'arent I?'],
	['Do tell people I', 'taught you everything', 'that you know.'],
	['A general would be proud', 'to wield that one.'],
	['Spectacular!', 'Look at how it shines.'],
	['That looks like dragon-slaying', 'gear to me!'],
	['Almost as good as I', 'could have done.'],
	['You could make a good', 'living like this.'],
	['I\'d hire you.'],
	['I\'d pay for that.'],
	['Clever trick you did', 'with the hammer there.'],
	['I wish I had made one', 'that nice before I died.'],
	['I didn\'t think it was possible.', 'You might have surpassed me.', 'Barely.', 'Once.'],
	['You made something impressive.'],
	['A fine piece of work,','but don\'t let it go to your head.'],
	['I admit it,', 'you\'re good at this.'],
	['Have you done this before?'],
	['Practice more like that', 'and you might reach perfection.'],
	['Congratulations!', 'Your countless failures', 'managed to teach you something.'],
	['I could have used an apprentice', 'like you when I was alive.'],
	['Perfectly balanced.', 'As all things should be.'],
];
const okayComments = [
	['Not bad.', 'I mean, not good either.'],
	['Last time I made one of those,', 'it was way better.'],
	['Maybe you could try', 'sharpening it next time?'],
	['Your heat control could', 'use some work.'],
	['Heat first, THEN hammer.', 'Maybe polish it a bit too.'],
	['I guess it\'s better than', 'being stabbed in the face.', 'Maybe.'],
	['At least it\'s shiny?'],
	['Try hitting it with your head','next time.  It might work better.'],
	['You\'re obviously not a dwarf.'],
	['Huh. You actually pulled that off.'],
	['Won\'t win a beauty pageant,', 'but it might do for adventuring.'],
	['Nice and sturdy,', 'but it\'s no masterpiece.'],
	['Tolerable.', 'A one-armed goblin might appreciate it.'],
	['Good enough for a henchman to use.'],
	['Try hitting your fingers less.'],
	['It doesn\'t look pretty, but it will do.'],
	['My arms are sore from', 'watching you flail that', 'poor hammer around.'],
	['You\'re doing well.', 'You might reach apprentice', 'level in a few years.'],
	['As mediocre as a low level', 'bureaucrat, but at least', 'twice as useful!'],
	['Well... it\'s the right size?'],
	['Almost as good as I', 'could have done.', 'When I was 10 years old.'],
	['It\'s impressive how you', 'completely ignored my advice.'],
	['Well, at least it matches',' your face.'],
	['As beautiful as my', 'mother-in-law\'s face.'],
	['It\'s like a finely aged wine,', 'post-digestion.'],
	['Sharp work,', 'but it was supposed to be smooth.'],
	['Worth less than the ore', 'it was mangled from.'],
	['You\'re planning to save', 'the world with THAT?'],
	['I liked that pattern.', 'Then I saw you murder it.'],
	['Try swinging faster next time.'],
	['Just like my grandma', 'used to make.'],
	['It\'s missing something...'],
];
const badComments = [
	['What is that,', 'a horseshoe?'],
	['Umm...', 'Maybe throw that away.'],
	['I would totally use that.', '', 'As a paperweight! Ha!'],
	['I feel bad for that ore.', 'Did you have to torture it?'],
	['That abomination is an insult', 'to blacksmiths everywhere.'],
	['If that were alive,', 'it would be beggin for us','to kill it.'],
	['Put that thing out of its misery.', 'It wouldn\'t want to live like this.'],
	['If you worked for me,', 'I\'d fire you.'],
	['Might be good enough to', 'prop the door open.'],
	['Last time I did work that good', 'I had the plague.', 'And two broken arms.'],
	['No, no, no.', 'You hold the OTHER end', 'of the hammer.'],
	['Show me how you did that again?', 'I want to remember what NOT to do.'],
	['I didn\'t ask you to make a spoon...'],
	['You\'re amazing!', 'I didn\'t think it was possible', 'to ruin metal like that.'],
	['Back to smithing school', 'for you, boy.'],
	['You keep practicing.', 'I\'m going to go cry a bit.'],
	['I\'d claw my eyes out,', 'if I still had eyes.'],
	['Sharpen the blade,', 'not the hilt!'],
	['Why is there a hole in that?', 'Were you making swiss cheese?'],
	['Toss that trash', 'before I toss my cookies.'],
	['Well done, student!', 'If you were trying to', 'disappoint me!'],
	['Did you sneeze when', 'you were shaping that?'],
	['Looks like my wife\'s food tasted.'],
	['Almost as good as I', 'could have done.', 'Left handed.', 'With my eyes closed.'],
	['That poor anvil got hammered...', 'for that?'],
	['It\'s like the town drunk:','hammered,', 'then tossed in the gutter.'],
	['I know what that is!', 'Abstract art!', 'Right?'],
	['Umm... spikes?', 'I don\'t think that','should have spikes.'],
	['I thought I was a ghost,', 'not in Hell.'],
	['Maybe consider a different career.'],
	['It\'s missing something.', 'Oh, right.  Competence.'],
	['A thousand monkeys pounding', 'on a thousand anvils', 'couldn\'t make gear that bad.'],
	['Aaaaah!', 'Make it go away!'],
];
Window_SmithyResults.prototype.getComment = function() {
	// BadComments for failures, Rank D, and Rank E.
	let comments = badComments;
	if (this._itemCrafted) {
		switch (this._luckRank) {
			case 'S':
			case 'A':
				comments = goodComments;
				break;
			case 'B':
			case 'C':
				comments = okayComments;
				break;
		}
	}

	const index = Math.floor(Math.random() * comments.length);
	return comments[index];
};

Window_SmithyResults.prototype.show = function() {
    this.activate();
	this.open();
};

})()}