//=============================================================================
// TIOK_EventMover.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Repositions map events closer to the player.

@author TIOK

@command repositionEvent
@text 'RepositionEvents(eventID, eventID, eventID...)'
@ desc 'If any of the specified events are too far away, move them closer to the player.'

@arg eventID_1
@text
@ desc

@arg eventID_2
@text
@ desc

@arg eventID_3
@text
@ desc

@arg eventID_4
@text
@ desc

@arg eventID_5
@text
@ desc

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
Version 1.0: 12.27.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_EventMover = true;

var TIOK = TIOK || {};
TIOK.EventMover = TIOK.EventMover || {};

//=============================================================================
// Plugin Commands
//=============================================================================

PluginManager.registerCommand('TIOK_EventMover', 'repositionEvent' , function(args) {
	const event1 = Number(args.eventID_1);
	const event2 = Number(args.eventID_2);
	const event3 = Number(args.eventID_3);
	const event4 = Number(args.eventID_4);
	const event5 = Number(args.eventID_5);

	const events = [];
	if ($gameMap._events[event1]) { events.push($gameMap._events[event1]); }
	if ($gameMap._events[event2]) { events.push($gameMap._events[event2]); }
	if ($gameMap._events[event3]) { events.push($gameMap._events[event3]); }
	if ($gameMap._events[event4]) { events.push($gameMap._events[event4]); }
	if ($gameMap._events[event5]) { events.push($gameMap._events[event5]); }

	const playerX = $gamePlayer.x;
	const playerY = $gamePlayer.y;

	const eventsToMove = [];
	events.forEach((event) => {
		if ($gameMap.distance(playerX, playerY, event.x, event.y) > 10) {
			eventsToMove.push(event);
		}
	});

	console.log('Events, EventsToMove', events, eventsToMove)

	// If nothing needs to move, we're done!
	if (eventsToMove.length <= 0) {
		return;
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	const minX = Math.max(0, playerX - 7);
	const maxX = Math.min($gameMap.width() - 1, playerX + 7);
	const minY = Math.max(0, playerY - 7);
	const maxY = Math.min($gameMap.height() - 1, playerY + 7);

	eventsToMove.forEach((eventToMove) => {
		// For efficiency, we aren't calculating every possible square.  Rather, we will try a few times, and if we
		// don't find a good spot, we'll give up until the next cycle.
		for (let i = 0; i < 5; ++i) {
			const newX = getRandomInt(minX, maxX);
			const newY = getRandomInt(minY, maxY);

			// Does the location have a region assigned?  If not, events can't spawn there.
			if ($gameMap.regionId(newX, newY) == 0) {
				continue;
			}

			// Events should not be too close to the player.
			if ($gameMap.distance(playerX, playerY, newX, newY) < 5) {
				continue;
			}

			// Events should not be too close to each other.
			let tooClose = false;
			for (let j = 0; j < events.length && !tooClose; ++j) {
				const otherEvent = events[j];
				// Ignore self.  
				if (otherEvent.eventId() == eventToMove.eventId()) {
					continue;
				}
				if ($gameMap.distance(newX, newY, otherEvent.x, otherEvent.y) < 3) {
					tooClose = true;
				}
			}
			if (tooClose) {
				continue;
			}

			// Has region, not too close to player, not too close to other events.  Should be good!
			eventToMove.locate(newX, newY);
			break;
		}
	});
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

console.warn('ZZZ LOADING TIOK_EventMover');



})()}