//=============================================================================
// TIOK_ItemSelectFilters.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds a timer that counts up instead of down.

@author TIOK

@help 
============================================================================
 Notetags
============================================================================
Item Notetags:

<ItemType:string>

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
Imported.TIOK_Timer = true;

var TIOK = TIOK || {};
TIOK.Timer = TIOK.Timer || {};

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

console.warn('ZZZ LOADING TIOK_Timer');

//=============================================================================
// Sprite_Timer
//=============================================================================
function Sprite_Timer() {
    this.initialize.apply(this, arguments);
}
Sprite_Timer.prototype = Object.create(Sprite.prototype);
Sprite_Timer.prototype.constructor = Sprite_Timer;

Sprite_Timer.prototype.initialize = function() {
	this._bitmap = new Bitmap(150, 30);
	Sprite.prototype.initialize.call(this, this._bitmap);
	this.contentsOpacity = 255;
	this.opacity = 255;
	this._warningTime = 9999999;
	this._failureTime = 9999999;

	this.reset();

	this.move(Graphics.width - 20 - this._bitmap.width, 20);
};

Sprite_Timer.prototype.setWarningTime = function(seconds)  {
	this._warningTime = seconds;
}

Sprite_Timer.prototype.setFailureTime = function(seconds)  {
	this._failureTime = seconds;
}

Sprite_Timer.prototype.update = function() {
    this.updateClock();
}

Sprite_Timer.prototype.start = function() {
    this._running = true;
}

Sprite_Timer.prototype.stop = function() {
    this._running = false;
}

Sprite_Timer.prototype.reset = function() {
    this._running = false;
	this._ticks = 0;
	this._displayedValue = -1;
}

Sprite_Timer.prototype.getValue = function() {
    return this._displayedValue;
}

Sprite_Timer.prototype.updateClock = function () {
	if (this._running) {
		this._ticks += 1;
	}

	const seconds = Math.floor(this._ticks / 60);
	if (this._displayedValue !== seconds) {
		this._displayedValue = seconds;
		this.drawClock();
	}
};

Sprite_Timer.prototype.drawClock = function() {
	const seconds = this._displayedValue % 60;
	const minutes = Math.floor(this._displayedValue / 60) % 60;
	const hours = Math.floor(this._displayedValue / 3600);

	let text = ':' + seconds.toString().padStart(2, '0');
	if (minutes > 0 || hours > 0) {
		text = minutes.toString() + text;
		if (hours > 0) {
			text = hours.toString() + ':' + text.padStart(5, '0');
		}
	}

	const b = this._bitmap;
	b.clear();

	// Clock text.
	b.fontSize = 28;
	if (this._displayedValue < this._warningTime) {
		b.textColor = '#ffffff';
	} else if (this._displayedValue < this._failureTime) {
		b.textColor = '#ffff00';
	} else {
		b.textColor = '#ff0000';
	}
	b.drawText(text, 0, 0, b.width, b.height, 'right');

	// Debug border.
	b.strokeRect(0, 0, b.width, b.height, '#000000');
}

TIOK.Timer.create = function() {
	return new Sprite_Timer();
}

})()}