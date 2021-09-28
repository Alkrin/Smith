//=============================================================================
// TIOK_BalanceMeter.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds a "Balance" gauge to battlers.  Uses TP under the hood.

@param Gauge Text Font Size
@desc This is the font size of the texts.
@default 18

@param >>> Balance Gauge <<<

@param Balance Gauge Duration
@desc How long it takes for the Balance Gauge to animate changes.
@default 30

@param Balance Gauge Width
@desc This is the width in pixels for Balance Gauges.
@default 100

@param Balance Gauge Height
@desc This is the height in pixels for Balance Gauges.
@default 18

@param Balance Color 1
@desc This is the text color used for the 1st part of TP Gauges.
@default '#0000ff'

@param Balance Color 2
@desc This is the text color used for the 2nd part of TP Gauges.
@default '#ff0000'

@param Balance Gauge X Padding
@desc Moves the Balance Gauge left or right.
@default 0

@param Balance Gauge Y Padding
@desc Moves the Balance Gauge up or down.
@default 0

@author TIOK

@help 
============================================================================
 Notetags
============================================================================
Class and Enemy Notetags:

<Hide Balance Gauge>

<Show Balance Gauge>

<Balance Gauge Width: x>

<BalanceGauge Height: x>

<BalanceGauge Back Color: x>

<BalanceGauge Color 1: x>

<BalanceGauge Color 2: x>

<BalanceGauge X Padding: x>

<BalanceGauge Y Padding: y>

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
Imported.TIOK_BalanceMeter = true;

var TIOK = TIOK || {};
TIOK.BalanceMeter = TIOK.BalanceMeter || {};

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

console.warn('ZZZ LOADING TIOK_BalanceMeter');

//=============================================================================
// Classes
//=============================================================================
function Window_VisualBalanceGauge() {
    this.initialize.apply(this, arguments);
}
	
//=============================================================================
// Plugin Parameters
//=============================================================================
// We use this to simplify access to the params in later code.  Not strictly necessary.
var parameters = PluginManager.parameters('TIOK_BalanceMeter');
TIOK.BalanceMeter.Params = {
	fontSize: Number(parameters['Gauge Text Font Size']),
	balanceGaugeDuration: Number(parameters['Balance Gauge Duration']),
	balanceGaugeWidth: Number(parameters['Balance Gauge Width']),
	balanceGaugeHeight: Number(parameters['Balance Gauge Height']),
	balanceGaugeColor1: parameters['Balance Color 1'],
	balanceGaugeColor2: parameters['Balance Color 2'],
	balanceGaugeXPadding: Number(parameters['Balance Gauge X Padding']),
	balanceGaugeYPadding: Number(parameters['Balance Gauge Y Padding'])
};

var params = TIOK.BalanceMeter.Params;

//=============================================================================
// Sprite_Battler
//=============================================================================
var _Sprite_Battler_update = Sprite_Battler.prototype.update;
Sprite_Battler.prototype.update = function () {
	_Sprite_Battler_update.call(this);
	this.createVisualBalanceGaugeWindow();
};

Sprite_Battler.prototype.createVisualBalanceGaugeWindow = function () {
	if (this._createdVisualBalanceGaugeWindow) {
		return;
	}
	if (!this._battler) {
		return;
	}
	this._createdVisualBalanceGaugeWindow = true;
	this._visualBalanceGauge = new Window_VisualBalanceGauge();
	this._visualBalanceGauge.setBattler(this);
	this.parent.parent.addChild(this._visualBalanceGauge);
};

//=============================================================================
// Window_VisualBalanceGauge
//=============================================================================
Window_VisualBalanceGauge.prototype = Object.create(Sprite.prototype);
Window_VisualBalanceGauge.prototype.constructor = Window_VisualBalanceGauge;

Window_VisualBalanceGauge.prototype.initialize = function () {
	this._opacitySpeed = 255 / params.balanceGaugeDuration;
	this._dropSpeed = 0;
	this._visibleCounter = 0;
	this._bitmap = new Bitmap(params.balanceGaugeWidth, params.balanceGaugeHeight);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this._battler = null;
	this._requestRefresh = true;
	this._currentBalanceValue = -1;
	this._displayedValue = -1;
	this.contentsOpacity = 255;
	this.opacity = 255;
};

Window_VisualBalanceGauge.prototype.setBattler = function(battler) {
	if (this._battler !== battler) {
		this._battler = battler;
		this._currentBalanceValue = this._battler._battler ? this._battler._battler.tp : 0;
		this._displayedValue = this._battler._battler ? this._battler._battler.tp : 0;
	}
};

Window_VisualBalanceGauge.prototype.update = function() {
	this.updateWindowPosition();
    this.updateBalancePosition();
	this.updateOpacity();
    this.updateRefresh();
}

Window_VisualBalanceGauge.prototype.updateWindowPosition = function() {
    if (!this._battler) {
		return;
	}
    var battler = this._battler;
	const bx = battler.position.x;
	const by = battler.position.y;
    let newX = bx + params.balanceGaugeXPadding;
    newX -= Math.ceil(params.balanceGaugeWidth / 2);
    let newY = by + params.balanceGaugeYPadding - battler.height - 45;
	if (newX !== this.x || newY !== this.y) {
		this.move(newX, newY);
	}
};

Window_VisualBalanceGauge.prototype.updateOpacity = function() {
	if (this._battler._battler.hp <= 0) {
		this.opacity = 0;
	} else {
		this.opacity = 255;
	}
}

Window_VisualBalanceGauge.prototype.updateBalancePosition = function () {
	if (!this._battler) {
		return;
	}
	if (this._battler._battler.hp <= 0) {
		return;
	} 
	if (this._currentBalanceValue !== this._battler._battler.tp) {
		this._visibleCounter = params.balanceGaugeDuration;
		this._currentBalanceValue = this._battler._battler.tp;
		var difference = Math.abs(this._displayedValue - this._battler._battler.tp);
		this._dropSpeed = Math.ceil(difference / params.balanceGaugeDuration);
	}
	this.updateDisplayCounter();
};

Window_VisualBalanceGauge.prototype.updateDisplayCounter = function () {
	if (this._battler._battler.hp <= 0) {
		return;
	}
	if (this._currentBalanceValue === this._displayedValue) {
		return;
	}
	var d = this._dropSpeed;
	var c = this._currentBalanceValue;
	if (this._displayedValue > this._currentBalanceValue) {
		this._displayedValue = Math.max(this._displayedValue - d, c);
	} else if (this._displayedValue < this._currentBalanceValue) {
		this._displayedValue = Math.min(this._displayedValue + d, c);
	}
	this._requestRefresh = true;
};

Window_VisualBalanceGauge.prototype.updateRefresh = function() {
	if (this._requestRefresh) {
		this.refresh();
	}	
}

Window_VisualBalanceGauge.prototype.refresh = function () {
	if (this._battler._battler.hp <= 0) {
		return;
	}
	if (!this._battler._battler) {
		return;
	}
	this._requestRefresh = false;
	this.drawActorBalance();
};

Window_VisualBalanceGauge.prototype.drawActorBalance = function () {
	if (this._battler._battler.hp <= 0) {
		return;
	};
	
	this.drawGauge();
};

Window_VisualBalanceGauge.prototype.drawGauge = function() {
	var color1 = params.balanceGaugeColor1;
	var color2 = params.balanceGaugeColor2;
	var rate = this._displayedValue / 100;

	const b = this._bitmap;
	b.clear();

	// Letter on the left of the bar.
	b.fontSize = params.fontSize;
	b.textColor = '#ffffff';
	b.drawText('B', 0, 0, 44, params.fontSize, 'left');

	// Bar background.
	b.gradientFillRect(20, 0, b.width - 20, b.height, '#11111180', '#11111180', false);

	// Bar border.
	b.strokeRect(20, 0, b.width - 20, b.height, '#000000');

	// Bar progress.
	const clerp = rgb2hex(interpolateColor(hex2rgb(color1), hex2rgb(color2), rate))
	b.gradientFillRect(21, 1, (b.width - 22) * rate, b.height - 2, clerp, clerp, false);
}

// Converts a #ffffff hex string into an [r,g,b] array
var hex2rgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Inverse of the above
var rgb2hex = function(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

// Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
// Taken from the awesome ROT.js roguelike dev library at
// https://github.com/ondras/rot.js
var interpolateColor = function(color1, color2, factor) {
  if (arguments.length < 3) { factor = 0.5; }
  var result = color1.slice();
  for (var i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return result;
};

})()}