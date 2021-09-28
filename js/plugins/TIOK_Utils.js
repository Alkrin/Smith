//=============================================================================
// TIOK_Utils.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds enhancements with no other dependencies.

@author TIOK

@command forceNextItemSelectPositionBottom
@text ForceNextItemSelectPositionBottom
@ desc 'Forces the next ItemSelect command to display its window at the bottom of the screen.'

@command forceNextItemSelectMandatory
@text ForceNextItemSelectMandatory
@ desc 'Forces the next ItemSelect window to display with no cancel button.'

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
Imported.TIOK_Utils = true;

var TIOK = TIOK || {};
TIOK.Utils = TIOK.Utils || {
	forceItemSelectPositionBottom: false,
	forceItemSelectMandatory: false,
};

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand('TIOK_Utils', 'forceNextItemSelectPositionBottom' , function(args) {
	TIOK.Utils.forceItemSelectPositionBottom = true;
});

PluginManager.registerCommand('TIOK_Utils', 'forceNextItemSelectMandatory' , function(args) {
	TIOK.Utils.forceItemSelectMandatory = true;
});

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

console.warn('ZZZ LOADING TIOK_Utils');

Bitmap.prototype.drawRectOutline = function(x, y, width, height, lineWidth, color) {
	for (let i = 0; i < lineWidth; ++i) {
		this.strokeRect(x + i, y + i, width - 2*i, height - 2*i, color);	
	}
}

var _Window_EventItem_updatePlacement = Window_EventItem.prototype.updatePlacement;
Window_EventItem.prototype.updatePlacement = function() {
	if (TIOK.Utils.forceItemSelectPositionBottom) {
		this.y = Graphics.boxHeight - this.height;
	} else {
		_Window_EventItem_updatePlacement.call(this);
	}
};

var _Window_EventItem_updateCancelButton = Window_EventItem.prototype.updateCancelButton;
Window_EventItem.prototype.updateCancelButton = function() {
	if (TIOK.Utils.forceItemSelectMandatory) {
		// Cancel button is not visible be default, so leave it that way.
		return;
	} else {
		_Window_EventItem_updateCancelButton.call(this);
	}
};

var _Window_EventItem_placeCancelButton = Window_EventItem.prototype.placeCancelButton;
Window_EventItem.prototype.placeCancelButton = function() {
	console.log('PlaceCancelButton()');
    if (TIOK.Utils.forceItemSelectPositionBottom) {
		console.log('ForceBottom');
		if (this._cancelButton) {
			const spacing = 8;
			const button = this._cancelButton;
			button.x = this.width - button.width - spacing;
			button.y = -button.height - spacing;
		}
	} else {
		console.log('DefaultPosition');
		_Window_EventItem_placeCancelButton.call(this);
	}
};

var _Window_EventItem_close = Window_EventItem.prototype.close;
Window_EventItem.prototype.close = function() {
	_Window_EventItem_close.call(this);
	TIOK.Utils.forceItemSelectMandatory = false;
	TIOK.Utils.forceItemSelectPositionBottom = false;
};

})()}