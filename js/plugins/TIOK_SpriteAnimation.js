//=============================================================================
// TIOK_SpriteAnimation.js
//=============================================================================
/*:
@target mz

@plugindesc v1.0 Adds standardized animations for use with Sprite objects.

@author TIOK

@help 
============================================================================
 Terms of Use
============================================================================
May not be used by anyone other than TIOK.

============================================================================
 Changelog
============================================================================
Version 1.0: 11.29.2021
 - Release!
*/

//=============================================================================
// Namespaces
//=============================================================================
var Imported = Imported || {};
Imported.TIOK_SpriteAnimation = true;

var TIOK = TIOK || {};
TIOK.SpriteAnimation = TIOK.SpriteAnimation || {};

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

console.warn('ZZZ LOADING TIOK_SpriteAnimation');

//=============================================================================
// SpriteAnimation
//=============================================================================
function SpriteAnimation() {
    this.initialize.apply(this, arguments);   
}
SpriteAnimation.prototype = Object.create({});
SpriteAnimation.prototype.constructor = SpriteAnimation;

SpriteAnimation.prototype.initialize = function(aSprite, targetProp, fromValue, toValue, duration, delay) {
	this._sprite = aSprite;
	this._targetProp = targetProp;
	this._fromValue = fromValue;
	this._toValue = toValue;
	this._duration = duration;
	this._delay = delay;

	this._running = false;
	this._complete = false;
	// This one keeps track of actual progress.
	this._tick = 0;

	// Hook the sprite's update function.
	const _oldUpdate = aSprite.update; // This should return Sprite.prototype.update, or else someone else's hooked equivalent.
	// We override "sprite.update" instead of "sprite.prototype.update" because we are only changing this one Sprite's update, not all Sprites'.
	aSprite.update = () => {
		_oldUpdate.call(aSprite); // The sprite does whatever it was originally going to do.
		this.update(); // And then it applies any SpriteAnimation updates afterward.
	}
}

SpriteAnimation.prototype.isRunning = function() {
	return this._running;
}

SpriteAnimation.prototype.start = function(completionCallback, reset = false) {
	if (reset) {
		this._complete = false;
		this._tick = 0;
	} else {
		if (this._complete) {
			// Attempted to start a completed animation without resetting it!  Just tell them we're done.
			console.warn('Attempted to start an animation that was already completed without using the RESET flag.');
			if (completionCallback) {
				completionCallback();
			}
			return;
		}
	}
	this._running = true;
	this._completionCallback = completionCallback;
}

SpriteAnimation.prototype.pause = function() {
	this._running = false;
}

SpriteAnimation.prototype.stop = function() {
	if (this._complete) {
		return;
	}

	// Push the animation to its final state.
	this._tick = this._delay + this._duration - 1;
	// The manual update forces the sprite to update to its post-animation targetProp value
	// and then triggers this.complete() for cleanup.
	this.update();
}

SpriteAnimation.prototype.complete = function() {
	this._running = false;
	this._complete = true;
	
	// Fire completion callback.
	if (this._completionCallback) {
		this._completionCallback();
	}
}

SpriteAnimation.prototype.update = function() {
	if (this._running) {
		this._tick += 1;
		if (this._tick >= this._delay) {
			// Calculate progress rate.
			const rate = (this._tick - this._delay) / this._duration;
			// Interpolate between values.
			const newValue = this._fromValue + (this._toValue - this._fromValue) * rate;
			// Apply interpolated value to the targetProp.
			const props = this._targetProp.split('.');
			if (props.length === 1) {
				this._sprite[this._targetProp] = newValue;
			} else if (props.length === 2) {
				this._sprite[props[0]][props[1]] = newValue;
			}

			// If we're done, stop.
			if (this._tick >= this._delay + this._duration) {
				this.complete();
			}
		}
	}
}

// Generator functions.
SpriteAnimation.opacity = function(aSprite, fromOpacity, toOpacity, duration = 60, delay = 0) {
	return new SpriteAnimation(aSprite, 'opacity', fromOpacity, toOpacity, duration, delay);
}
SpriteAnimation.position = function(aSprite, fromX, toX, fromY, toY, duration = 60, delay = 0) {
	const anims = [];
	if (fromX !== toX) {
		anims.push(new SpriteAnimation(aSprite, 'x', fromX, toX, duration, delay));
	}
	if (fromY !== toY) {
		anims.push(new SpriteAnimation(aSprite, 'y', fromY, toY, duration, delay));
	}
	if (anims.length > 0) {
		return new SpriteAnimationParallel(anims);
	} else {
		// If there are no differences, just return a placeholder so durations and delays can be applied.
		return new SpriteAnimation(aSprite, 'x', fromX, toX, duration, delay);
	}
}
SpriteAnimation.scale = function(aSprite, fromScale, toScale, duration = 60, delay = 0) {
	return new SpriteAnimationParallel([
		new SpriteAnimation(aSprite, 'scale.x', fromScale, toScale, duration, delay),
		new SpriteAnimation(aSprite, 'scale.y', fromScale, toScale, duration, delay),
	]);
}
SpriteAnimation.parallel = function(animationArray) {
	return new SpriteAnimationParallel(animationArray);
}
SpriteAnimation.sequence = function(animationArray) {
	return new SpriteAnimationSequence(animationArray);
}

// Make it available outside of this file.
TIOK.SpriteAnimation = SpriteAnimation;

//=============================================================================
// SpriteAnimationParallel
//=============================================================================
function SpriteAnimationParallel() {
    this.initialize.apply(this, arguments);
}
SpriteAnimationParallel.prototype = Object.create({});
SpriteAnimationParallel.prototype.constructor = SpriteAnimationParallel;

SpriteAnimationParallel.prototype.initialize = function(animationArray) {
	this._animations = animationArray;

	this._running = false;
	this._complete = false;
	this._completedAnimations = animationArray.map((_) => { return false; });
}

SpriteAnimationParallel.prototype.isRunning = function() {
	return this._running;
}

SpriteAnimationParallel.prototype.start = function(completionCallback, reset = false) {
	if (reset) {
		this._complete = false;
		this._completedAnimations = this._animations.map((_) => { return false; });
	} else {
		if (this._complete) {
			// Attempted to start a completed parallel animation without resetting it!  Just tell them we're done.
			console.warn('Attempted to start a parallel animation that was already completed without using the RESET flag.');
			if (completionCallback) {
				completionCallback();
			}
			return;
		}
	}
	this._running = true;
	this._completionCallback = completionCallback;

	this._animations.forEach((animation, index) => {
		// (Re)start any animations that haven't been completed yet.
		if (!this._completedAnimations[index]) {
			animation.start(this.onSingleAnimationComplete.bind(this, index), reset);
		}
	});
}

SpriteAnimationParallel.prototype.onSingleAnimationComplete = function(animationIndex) {
	this._completedAnimations[animationIndex] = true;

	const allComplete = this._completedAnimations.reduce((previousAreDone, currentIsDone) => { return previousAreDone && currentIsDone; });
	if (allComplete) {
		this._complete = true;
		this.complete();
	}
}

SpriteAnimationParallel.prototype.complete = function() {
	this._running = false;
	this._complete = true;
	
	// Fire completion callback.
	if (this._completionCallback) {
		this._completionCallback();
	}
}

SpriteAnimationParallel.prototype.pause = function() {
	if (!this._running) {
		return;
	}
	this._running = false;

	this._animations.forEach((animation, index) => {
		// Pause any animations that haven't been completed yet.
		if (!this._completedAnimations[index]) {
			animation.pause();
		}
	});
}

SpriteAnimationParallel.prototype.stop = function() {
	if (!this._running) {
		return;
	}

	this._running = false;

	this._animations.forEach((animation, index) => {
		// Stop all animations.
		if (!this._completedAnimations[index]) {
			animation.stop();
		}
	});
}

//=============================================================================
// SpriteAnimationSequence
//=============================================================================
function SpriteAnimationSequence() {
    this.initialize.apply(this, arguments);
}
SpriteAnimationSequence.prototype = Object.create({});
SpriteAnimationSequence.prototype.constructor = SpriteAnimationSequence;

SpriteAnimationSequence.prototype.initialize = function(animationArray) {
	this._animations = animationArray;

	this._running = false;
	this._complete = false;
	this._currentAnimationIndex = 0;
}

SpriteAnimationSequence.prototype.isRunning = function() {
	return this._running;
}

SpriteAnimationSequence.prototype.start = function(completionCallback, reset = false) {
	if (reset) {
		this._complete = false;
		this._currentAnimationIndex = 0;
	} else {
		if (this._complete) {
			// Attempted to start a completed parallel animation without resetting it!  Just tell them we're done.
			console.warn('Attempted to start a parallel animation that was already completed without using the RESET flag.');
			if (completionCallback) {
				completionCallback();
			}
			return;
		}
	}
	this._completionCallback = completionCallback;

	if (this._currentAnimationIndex < this._animations.length) {
		this._running = true;
		this._animations[this._currentAnimationIndex].start(this.onSingleAnimationComplete.bind(this), reset);
	} else {
		if (this._completionCallback) {
			this._completionCallback();
		}
	}
}

SpriteAnimationSequence.prototype.onSingleAnimationComplete = function() {
	if (!this._running) {
		return;
	}

	this._currentAnimationIndex += 1;

	if (this._currentAnimationIndex < this._animations.length) {
		// Not done yet, so move on to the next animation.
		this._animations[this._currentAnimationIndex].start(this.onSingleAnimationComplete.bind(this))
	} else {
		// Final animation complete.
		if (this._completionCallback) {
			this._completionCallback();
		}
		this._complete = true;
	}
}

SpriteAnimationSequence.prototype.pause = function() {
	if (!this._running) {
		return;
	}
	this._running = false;

	this._animations[this._currentAnimationIndex].pause();
}

SpriteAnimationSequence.prototype.stop = function() {
	if (!this._running) {
		return;
	}

	this._running = false;

	this._animations[this._currentAnimationIndex].stop();

	// If that stop() didn't trigger completion already, do it manually.
	if (!this._complete) {
		if (this._completionCallback) {
			this._completionCallback();
		}
		this._complete = true;
	}
}

})()}