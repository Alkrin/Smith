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

	additives: [], // Additives that have been added to the current crafting run.
	flux: null, // The flux that has been applied to the current crafting run (or null for none).

	turnCountdown: 0,
	hammerPending: false,
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
	TIOK.SmithCraftingUI.currentShape = 0;
	TIOK.SmithCraftingUI.currentHeat = 0;
	TIOK.SmithCraftingUI.currentPolish = 0;
	TIOK.SmithCraftingUI.additives = [];
	TIOK.SmithCraftingUI.flux = null;
	TIOK.SmithCraftingUI.currentLocation = 'anvil';
	TIOK.SmithCraftingUI.turnCountdown = 0;
	TIOK.SmithCraftingUI.hammerPending = false;
	TIOK.SmithCraftingUI.pendingAdditive = null;
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

	TIOK.SmithCraftingUI._scene = this;
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
	// Pre-cache variables that we will use in the update loop.
	this._heat = TIOK.getFireHeat();
	this._pattern = TIOK.getSelectedPattern();
	this._ore = TIOK.getSelectedOre();
}

SmithCraftingScene.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
	this.adjustBackground();
    this.startFadeIn(24, false);

	this._running = true;
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
    this._timer = TIOK.Timer.create();
	this._timer.setWarningTime(this._pattern.par);
	this._timer.setFailureTime(this._pattern.par * 1.5);
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
	this._running = false;

	this._resultsWindow.setup();
	this._resultsWindow.show();
}

SmithCraftingScene.prototype.update = function() {
	Scene_Base.prototype.update.call(this);

	// Stop with all the updates once crafting is complete.
	if (!this._running) {
		return;
	}

	// Player turn countdown.
	if (TIOK.SmithCraftingUI.turnCountdown >= 0) {
		TIOK.SmithCraftingUI.turnCountdown -= 1;

		if (TIOK.SmithCraftingUI.turnCountdown < 0) {
			this.openCommandWindow();
			// A little redundant to do this each time
			this._timer.start();
		}
	}

	// Only add heat or polish if the CraftingItem is actually IN the location, instead of animating toward it.
	if (this._craftedItemSprite._movementCountdown === 0) {
		// Heat update.
		if (TIOK.SmithCraftingUI.currentLocation === 'furnace') {
			TIOK.SmithCraftingUI.currentHeat = Math.min(TIOK.SmithCraftingUI.currentHeat + this._heat, 10000);
		} else if (TIOK.SmithCraftingUI.currentLocation === 'anvil') {
			TIOK.SmithCraftingUI.currentHeat = Math.max(0, TIOK.SmithCraftingUI.currentHeat - 1);
		} else if (TIOK.SmithCraftingUI.currentLocation === 'grindstone') {
			TIOK.SmithCraftingUI.currentHeat = Math.max(0, TIOK.SmithCraftingUI.currentHeat - 2);
		}

		// Polish update.
		if (TIOK.SmithCraftingUI.currentLocation === 'grindstone') {
			TIOK.SmithCraftingUI.currentPolish = Math.min(TIOK.SmithCraftingUI.currentPolish + 1, 1000);
		}

		// Shape update.
		const currentHeat = TIOK.SmithCraftingUI.currentHeat;
		if (TIOK.SmithCraftingUI.hammerPending) {
			let hammerRate = 1.0;
			// Is the ore too hot or cold to work with?
			if (currentHeat <= this._ore.heatEnough || currentHeat >= this._ore.heatMelting) { 
				hammerRate = 0; 
			// Is the ore workable, but cold?
			} else if (currentHeat <= this._ore.heatGood) {
				hammerRate = (currentHeat - this._ore.heatEnough) / (this._ore.heatGood - this._ore.heatEnough);
			// Is the ore workable, but hot?
			} else if (currentHeat >= this._ore.heatTooMuch) {
				hammerRate = (this._ore.heatMelting - currentHeat) / (this._ore.heatMelting - this._ore.heatTooMuch);
			}
			const hammerAmount = Math.max(10 * hammerRate, hammerRate > 0 ? 1 : 0);
			TIOK.SmithCraftingUI.currentShape = Math.min(TIOK.SmithCraftingUI.currentShape + hammerAmount, this._pattern.shape);
			TIOK.SmithCraftingUI.currentPolish = Math.max(TIOK.SmithCraftingUI.currentPolish - 100, 0);
			TIOK.SmithCraftingUI.currentHeat = Math.max(currentHeat - 25, 0);
			// TODO: Animate hammer strike?
			// TODO: Play a hammer sound?
			TIOK.SmithCraftingUI.hammerPending = false;
		}
		if (currentHeat > this._ore.heatMelting) {
			// If the ore is melting, we lose shape and polish every tick!
			TIOK.SmithCraftingUI.currentShape = Math.max(TIOK.SmithCraftingUI.currentShape - 0.1, 0);	
			TIOK.SmithCraftingUI.currentPolish = Math.max(TIOK.SmithCraftingUI.currentPolish - 1, 0);	
		}
	}
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
	if (this._displayedValue !== TIOK.SmithCraftingUI.currentShape) {
		if (this._barAnimDelta === 0) {
			// This is the first tick after a shape change, so set up the change animation.
			if (this._displayedValue > TIOK.SmithCraftingUI.currentShape) {
				// Shape loss is smaller and immediate, so no actual animation.
				this._displayedValue = TIOK.SmithCraftingUI.currentShape;
			} else {
				// Shape gain comes from hammering, so we animate it across a few frames.
				this._barAnimDelta = Math.ceil((TIOK.SmithCraftingUI.currentShape - this._displayedValue) / 5);
			}
		} else {
			// The change animation is already running, so just progress it.
			this._displayedValue = Math.min(TIOK.SmithCraftingUI.currentShape, this._displayedValue + this._barAnimDelta);
			if (this._displayedValue === TIOK.SmithCraftingUI.currentShape) {
				// Anim complete.  No more delta.
				this._barAnimDelta = 0;

				// Is the crafting session complete?
				if (this._displayedValue >= this._pattern.shape) {
					TIOK.SmithCraftingUI._scene.openResultsWindow();
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
	if (this._displayedValue !== TIOK.SmithCraftingUI.currentPolish) {
		this._displayedValue = TIOK.SmithCraftingUI.currentPolish;
		this.drawGauge();
	}
};

Sprite_PolishGauge.prototype.drawGauge = function() {
	var color1 = '#4682c4';
	var color2 = '#43464b';

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
	this._movementDuration = 45;
	this._movementCountdown = 0;
	this._shape = 'none';

	// Pre-calculated positions to simplify animation.
	this._positions = {
		anvil: { x: Graphics.width / 2 + 10, y: Graphics.height / 2 - 30},
		furnace: { x: 195, y: Graphics.height / 2 - 100},
		grindstone: { x: Graphics.width - 150, y: Graphics.height / 2 - 110}
	}

	this.move(this._positions.anvil.x, this._positions.anvil.y);
};

Sprite_CraftedItem.prototype.update = function() {
    this.updatePosition();
	this.updateShape();
}

Sprite_CraftedItem.prototype.updatePosition = function () {
	// If we need to move, move!
	if (this._movementCountdown > 0) {
		this._movementCountdown -= 1;

		const rate = this._movementCountdown / this._movementDuration;
		const targetPos = this._positions[this._location];
		const newX = targetPos.x + this._xOffset * rate;
		const newY = targetPos.y + this._yOffset * rate;
		this.move(newX, newY);

		if (this._movementCountdown === 0) {
			// TODO: Trigger sound effects, animations, etc. for the final destination.
			if (this._location === 'anvil') {
				// Just got to the anvil, so queue up the hammer event.
				TIOK.SmithCraftingUI.hammerPending = true;
			}
		}
	}

	// If we're changing locations, set up the movement animation.
	if (this._location !== TIOK.SmithCraftingUI.currentLocation) {
		// Calculate the xOffset for animating motion between the old spot and the new one.
		const oldPos = this._positions[this._location];
		const newPos = this._positions[TIOK.SmithCraftingUI.currentLocation];
		this._xOffset = oldPos.x - newPos.x;
		this._yOffset = oldPos.y - newPos.y;
		// And declare that we are in the new location (or at least moving toward it).
		this._location = TIOK.SmithCraftingUI.currentLocation;
		this._movementCountdown = this._movementDuration;
	}
};

Sprite_CraftedItem.prototype.updateShape = function () {
	// Check Shape against breakpoints.  Change shape and trigger a redraw if we have crossed a threshold.
	let newShape = 'Ingot';
	const shapeRate = TIOK.SmithCraftingUI.currentShape / this._pattern.shape;

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
		b.blt(this._ingotBitmap, 0, 0, this._ingotBitmap.width, this._ingotBitmap.height, (b.width - this._ingotBitmap.width) / 2, (b.height - this._ingotBitmap.height) / 2)
	} else if (this._shape === 'Partial') {
		b.blt(this._partialBitmap, 0, 0, this._partialBitmap.width, this._partialBitmap.height, (b.width - this._partialBitmap.width) / 2, (b.height - this._partialBitmap.height) / 2)
	} else if (this._shape === 'Complete') {
		b.blt(this._completeBitmap, 0, 0, this._completeBitmap.width, this._completeBitmap.height, (b.width - this._completeBitmap.width) / 2, (b.height - this._completeBitmap.height) / 2)
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
	this._location = 'crate';
	this._xOffset = 0;
	this._yOffset = 0;
	this._movementDuration = 45;
	this._movementCountdown = 0;

	// Pre-calculated positions to simplify animation.
	this._positions = {
		anvil: { x: Graphics.width / 2 + 10, y: Graphics.height / 2 - 30},
		crate: { x: 126, y: Graphics.height - 120}
	}

	this.move(this._positions.crate.x, this._positions.crate.y);
};

Sprite_CraftingAdditive.prototype.update = function() {
    this.updatePosition();
	this.updateAssets();
}

Sprite_CraftingAdditive.prototype.updatePosition = function () {
	// If we need to move, move!
	if (this._movementCountdown > 0) {
		this._movementCountdown -= 1;

		const rate = this._movementCountdown / this._movementDuration;
		const targetPos = this._positions[this._location];
		const newX = targetPos.x + this._xOffset * rate;
		const newY = targetPos.y + this._yOffset * rate;
		this.move(newX, newY);

		if (this._movementCountdown === 0) {
			// TODO: Trigger sound effects, animations, etc. for the final destination.
			if (this._location === 'anvil') {
				// Got to the anvil, so the additive is no longer pending.
				TIOK.SmithCraftingUI.pendingAdditive = null;
			}
		}
	}

	// If we're changing locations, set up the movement animation.
	const newAdditive = TIOK.SmithCraftingUI.pendingAdditive;
	if (newAdditive !== this._additive) {
		if (newAdditive) {
			console.log('Initializing additive animation');
			// Calculate the xOffset for animating motion between the old spot and the new one.
			const oldPos = this._positions.crate;
			const newPos = this._positions.anvil;
			this._xOffset = oldPos.x - newPos.x;
			this._yOffset = oldPos.y - newPos.y;
			// And declare that we are in the new location (or at least moving toward it).
			this._location = 'anvil';
			this._movementCountdown = this._movementDuration;
		} else {
			// Hide the additive inside the crate.
			this._movementCountdown = 0;
			this._location = 'crate';
		}
	}
};

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
    this.addCommand('Heat Up', 'Heat Up', TIOK.SmithCraftingUI.currentLocation !== 'furnace');
	this.addCommand(polishText, 'Polish', TIOK.SmithCraftingUI.currentLocation !== 'grindstone');
	this.addCommand('Additives', 'Additives', TIOK.SmithCraftingUI.additives.length < pattern.maxAdditives || TIOK.SmithCraftingUI.flux == null);
};

Window_SmithyCommand.prototype.setup = function() {
    this.refresh();
    this.forceSelect(0);
    this.activate();
    this.open();
};

Window_SmithyCommand.prototype.onHammer = function() {
	this.finalizeAction();
	if (TIOK.SmithCraftingUI.currentLocation !== 'anvil') {
		// Move item to Anvil.
		TIOK.SmithCraftingUI.currentLocation = 'anvil';
	} else {
		// Already at anvil, so queue up the hammer event.
		TIOK.SmithCraftingUI.hammerPending = true;
	}
}

Window_SmithyCommand.prototype.onHeatUp = function() {
	this.finalizeAction();
	//  Move item to Furnace.
	TIOK.SmithCraftingUI.currentLocation = 'furnace';
	// TODO: Play furnace sound?
	// TODO: Animate flames?
}

Window_SmithyCommand.prototype.onPolish = function() {
	this.finalizeAction();
	// Move item to grindstone.
	TIOK.SmithCraftingUI.currentLocation = 'grindstone';
	// TODO: Play grindstone sound?
	// TODO: Animate sparks?
	// TODO: Animate wheel spinning?
}

Window_SmithyCommand.prototype.onAdditives = function() {
	TIOK.SmithCraftingUI._scene.openAdditiveSelector();
	// TODO: Maybe show something to indicate that the Command window is inactive?  Arrow pointing over?
}

Window_SmithyCommand.prototype.finalizeAction = function() {
	// Reset countdown until user's next action.
	// This is modified by the player's speed, so higher speed makes crafting faster too!
	TIOK.SmithCraftingUI.turnCountdown = 180 - $gameActors.actor(1).agi;

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
	TIOK.SmithCraftingUI._scene._commandWindow.activate();
};

Window_AdditiveSelector.prototype.onOk = function() {
	const item = this.item();
	const itemId = item ? item.id : 0;
	const additive = TIOK.getAdditiveById(itemId);
	console.log('AdditiveSelected', additive);
	if (additive) {
		if (additive.family === 'flux') {
			TIOK.SmithCraftingUI.flux = additive;
		} else {
			TIOK.SmithCraftingUI.additives.push(additive);
		}
		TIOK.SmithCraftingUI.pendingAdditive = additive;
	}
    this.close();
	this.deactivate();
	TIOK.SmithCraftingUI._scene._commandWindow.finalizeAction();
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
		return TIOK.SmithCraftingUI.flux === null;
	} else {
		// Other additives are valid if there is an additive slot free for the selected pattern.  Yes, you can use the same additive twice.
		const pattern = TIOK.getSelectedPattern();
		if (!pattern) {
			return false;
		}
		return TIOK.SmithCraftingUI.additives.length < pattern.maxAdditives;
	}
};

Window_AdditiveSelector.prototype.drawItem = function(index) {
    const item = this.itemAt(index);
    if (item) {
        const rect = this.itemLineRect(index);
        this.changePaintOpacity(this.isEnabled(item));
        this.drawItemName(item, rect.x, rect.y, rect.width);
		this.drawItemTier(item, rect);
		// TODO: Draw tier and family?
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
    Window_Base.prototype.initialize.call(this, new Rectangle(50, 50, 500, 300));
	this.opacity = 0;

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

	TIOK.SmithCraftingUI._scene.startFadeOut(30);
	setTimeout(() => {
		SceneManager.pop();
		SceneManager._nextScene.startFadeIn(30);
	}, 500);
};

Window_SmithyResults.prototype.setup = function() {
    // TODO: Calculate result and render it.
};

Window_SmithyResults.prototype.show = function() {
    this.opacity = 255;
};

})()}