//=============================================================================
// TIOK_ItemSelectFilters.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Allows the user to add additional conditions when filtering items for the SelectItem command.

@author TIOK

@command setItemSelectFilterPattern
@text 'SetFilter:pattern'
@ desc 'Sets the custom item type filter to "pattern".'

@command setItemSelectFilterOre
@text 'SetFilter:ore'
@ desc 'Sets the custom item type filter to "ore".'

@command setItemSelectFilterNone
@text 'ClearFilter'
@ desc 'Clears the custom item type filter.  Default RMMZ logic will be used.'

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
Imported.TIOK_ItemSelectFilters = true;

var TIOK = TIOK || {};
TIOK.ItemSelectFilters = TIOK.ItemSelectFilters || {
	currentItemType: '',
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

console.warn('ZZZ LOADING TIOK_ItemSelectFilters');

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand('TIOK_ItemSelectFilters', 'setItemSelectFilterPattern' , function(args) {
	TIOK.ItemSelectFilters.currentItemType = 'pattern';
});
PluginManager.registerCommand('TIOK_ItemSelectFilters', 'setItemSelectFilterOre' , function(args) {
	TIOK.ItemSelectFilters.currentItemType = 'ore';
});
PluginManager.registerCommand('TIOK_ItemSelectFilters', 'setItemSelectFilterNone' , function(args) {
	TIOK.ItemSelectFilters.currentItemType = '';
});

//=============================================================================
// Window_EventItem
//=============================================================================
var _Window_EventItem_includes = Window_EventItem.prototype.includes;
Window_EventItem.prototype.includes = function(item) {
	const includedByDefault = _Window_EventItem_includes(item);

	// If no custom filter is set, use the system default.
	if (TIOK.ItemSelectFilters.currentItemType === '') {
		return includedByDefault;
	}

	// If the system filter excludes the item (item type), we exclude it too.
	if (!includedByDefault) {
		return false;
	}

	const notes = item.note.split('\n');
	const itemTypeNote = notes.find((note) => { return note.startsWith('ItemType:'); });
	const itemType = itemTypeNote ? itemTypeNote.substr(9) : '';

	// If the ItemType note does not match the currentItemType, we don't want this item.
	if (itemType !== TIOK.ItemSelectFilters.currentItemType) {
		return false;
	}

	switch (itemType) {
		case 'ore':
			const selectedPatternId = $gameVariables._data[7];
			if (selectedPatternId) {
				const patternData = TIOK.SmithItemGenerator.patterns.find((pattern) => { return pattern.index === selectedPatternId; });
				const minOreRank = patternData.oreRank;
				const supportedOreRanks = getRanksAtOrAbove(minOreRank);
				const oreRank = notes.find((note) => { return note.startsWith('Rank')}).substr(5);

				return supportedOreRanks.includes(oreRank);
			} else {
				// If there's no selected pattern, then no ore is valid.
				return false;
			}
			return true;
	}

	return true;
};

Window_EventItem.prototype.isEnabled = function(item) {
	if (!item) {
		return false;
	}
	const notes = item.note.split('\n');
	const itemTypeNote = notes.find((note) => { return note.startsWith('ItemType:'); });
	const itemType = itemTypeNote ? itemTypeNote.substr(9) : '';

	switch (itemType) {
		case 'ore':
			// Check that the user has enough of this item to craft the currently selected pattern.
			const selectedPatternId = $gameVariables._data[7];
			if (selectedPatternId) {
				const patternData = TIOK.SmithItemGenerator.patterns.find((pattern) => { return pattern.index === selectedPatternId; });
				const oreNeeded = patternData.oreCount;
				const oreOwned = $gameParty._items && $gameParty._items[item.id] ? $gameParty._items[item.id] : 0;

				return oreOwned >= oreNeeded;
			} else {
				// If there's no selected pattern, then no ore is valid.
				return false;
			}
		default: 
			return true;
	}
};

function getRanksAtOrAbove(lowestRank) {
	const possibleRanks = {
		S: ['S'],
		A: ['S','A'],
		B: ['S','A','B'],
		C: ['S','A','B','C'],
		D: ['S','A','B','C','D'],
		E: ['S','A','B','C','D','E'],
	}

	return possibleRanks[lowestRank];
}

})()}