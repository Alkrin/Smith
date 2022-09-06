//=============================================================================
// TIOK_CustomSave.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Provides easy access to custom save state.

@author TIOK

@help 
============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 08.23.2022
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_CustomSave = true;

var TIOK = TIOK || {};
TIOK.CustomSave = TIOK.CustomSave || {};

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

console.warn('ZZZ LOADING TIOK_CustomSave');


var _DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
	const contents = _DataManager_makeSaveContents();

	contents.customSave = TIOK.CustomSave;

    return contents;
};

var _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	_DataManager_extractSaveContents(contents);

	TIOK.CustomSave = {
		...TIOK.CustomSave,
		...contents.customSave
	}
};

})()}