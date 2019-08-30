"use strict";

const TANK_DIRECTION_UP    = 0;
const TANK_DIRECTION_DOWN  = 1;
const TANK_DIRECTION_LEFT  = 2;
const TANK_DIRECTION_RIGHT = 3;

const TANK_KEY_CODE_W      = 87;
const TANK_KEY_CODE_S      = 83;
const TANK_KEY_CODE_A      = 65;
const TANK_KEY_CODE_D      = 68;
const TANK_KEY_CODE_J      = 74;

const TANK_KEY_CODE_DOWN   = 38;
const TANK_KEY_CODE_UP     = 40;
const TANK_KEY_CODE_LEFT   = 37;
const TANK_KEY_CODE_RIGHT  = 39;

const TANK_KEY_CODE_DELETE = 46;

class GameEvent
{
	static on (name,callback) 
	{
		if (!GameEvent.events) {
			GameEvent.events = {};
		}
		if (!GameEvent.events[name]) {
			GameEvent.events[name] = [];
		}
		return GameEvent.events[name].push(callback);
	}

	static trigger (name)
	{
		return GameEvent.events[name] && GameEvent.events[name].forEach((callback) => {
			callback.apply(window,[].slice.call(arguments).splice(1))
		});
	}
}

class Voice
{
	constructor (src)
	{
		this.audio = document.createElement('audio');
		this.audio.setAttribute('src',src);
		this.isPlay = false;
		document.body.appendChild(this.audio);

		this.playEndedCallback = function () {};

		this.audio.addEventListener('ended',() => {
			this.playEndedCallback.call(this,this)
		});
	}

	play (callback)
	{
		if (isFunc(callback)) {
			this.playEndedCallback = callback;
		}
		this.isPlay = true;
		this.audio.play();
		return this;
	}

	pause ()
	{
		this.isPlay = false;
		return this.audio.pause();
	}

	destroy ()
	{
		this.isPlay && this.pause();
		this.audio.parentNode.removeChild(this.audio);
	}


	static create (src)
	{
		return new Voice(src);
	}
}

class Position 
{
	x = 0;
	y = 0;

	constructor (x = 0,y = 0)
	{
		this.x = x;
		this.y = y;
	}

	setPos (x = 0,y = 0)
	{
		if (typeof x === 'object') {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x;
			this.y = y;
		}
		return this;
	}

	getPos ()
	{
		return new Position(this.x,this.y);
	}
}


class Animation
{
	isLoop = false;
	isPlayLoad = false;
	curPlayIndex  = 0;
	images = [];
	playTime = 150;
	asyncLoadCount = 0;
	playState = 0;
	beforeFn = function () {};

	constructor (options)
	{		
		this.optImages    = isFunc(options.images) ? options.images() : options.images;
		this.isPlayLoad   = isUfe(options.isPlayLoad) ? false : options.isPlayLoad;
		this.isLoop       = isUfe(options.isLoop) ? false : options.isLoop;
		if (!isUfe(options.playTime)) {
			this.playTime = options.playTime;
		}

		if (!isUfe(options.beforeFn) && isFunc(options.beforeFn)) {
			this.beforeFn = options.beforeFn;
		}

		this.playImage = this.createPlayImage(isFunc(options.playPosition) ? options.playPosition() : options.playPosition);

		if (this.isPlayLoad) {
			this.isLoop ? this.playLoop() : this.play();
		}
	}

	playLoop (second = -1,callback = null)
	{
		if (second == -1) {
			return this.play(this.playLoop);
		}
		if (second <= 0) {
			return callback && callback.call(this,this);
		}
		return this.play(() => {
			this.playLoop(--second,callback);
		});
	}

	load (callback)
	{
		return new Promise((resolve,reject) => {
			if (this.optImages.length == this.asyncLoadCount) {
				return resolve(callback);
			}
			this.loadImage(this.optImages,(image) => {
				this.images.push(image);
				this.asyncLoadCount++;
				if (this.optImages.length == this.asyncLoadCount) {
					resolve(callback);
				}
			});
		}).then((callback) => {
			callback && callback.call(this);
		});
	}

	play (callback)
	{
		this.load(() => {
			this.playState = 1;
			this.playOnce(callback);
		});
	}
    playOnce (callback)
    {
		if (this.curPlayIndex >= this.images.length || this.playState == 0) {
			this.curPlayIndex = 0;
			this.playState    = 0;
			return callback && callback.call(this,this);
		}
		this.playImage.src = this.__next().src;
		return setTimeout(() => {
			this.playOnce(callback);
		},this.playTime);
    }
	__next ()
	{
		if (this.curPlayIndex == 0) {
			this.playImage.style.display = 'block';
			this.beforeFn.call(this,this);
		}
		if (this.playState == 1) {
			return this.images[this.curPlayIndex++];
		}
		return this.images[this.curPlayIndex];
	}
	
	toggle ()
	{
		this.playState == 1 ? this.pause() : this.start();
	}

	start ()
	{
		this.playState = 1;
	}

	pause ()
	{
		this.playState = 2;
	}

	stop ()
	{
		this.playState = 0;
	}

	loadImage (images,callback)
	{	
		let tasks = [];

		arrSlice(isArray(images) ? images : [images]).forEach((src) => {
			let task = new Promise((resolve,reject) => {
				let image = new Image()
				 , result = {};
			    image.src = src;
				result = {
					image: image,
					src: src
				};    
				if (image.complete) {
					return resolve(result);
				}
				image.onload = () => {
					resolve(result);
				};

			});
			tasks.push(task);
		});

		return Promise.all(tasks).then((result) => {
			arrSlice(result).forEach((item) => {
				callback && callback.call(this,item.image);
			});
		});
	}

	createPlayImage (playPos)
	{
		if (playPos.constructor.name === 'Position') {
			let img = document.createElement('img');
			img.style.position = 'absolute';
			img.style.zIndex   = '9';
			img.style.left = playPos.x + 'px';
			img.style.top  = playPos.y + 'px';
			img.style.display = 'none';
			Game.getInstance().getContainer().appendChild(img);
			return img;
		}
		return playPos;
	}

	destroy ()
	{
		this.playImage.parentNode && this.playImage.parentNode.removeChild(this.playImage);
	}

	static create (options)
	{
		return new Animation(options);
	}
}

class Collider
{
	static add (ident,object)
	{
		if (!Collider.object) {
			Collider.object = {};
		}
		Collider.object[ident] = object;
	}

	static getObject (ident)
	{
		return Collider.object[ident];
	}

	static rectangularDetection (objectIdentOne,objectIdentTwo)
	{
		let objectOne = Collider.getObject(objectIdentOne)
		  , objectTwo = Collider.getObject(objectIdentTwo)
		  , check     = false;

		if (objectOne && objectTwo) {
			let x1 = objectOne.object.x
			  , w1 = objectOne.object.width
			  , x2 = objectTwo.object.x
			  , w2 = objectTwo.object.width;


			let y1 = objectOne.object.y
			, h1 = objectOne.object.height
			, y2 = objectTwo.object.y
			, h2 = objectTwo.object.height;


			check = !(
                ( ( y1 + h1 ) < ( y2 ) ) ||
                ( y1 > ( y2 + h2 ) ) ||
                ( ( x1 + w1 ) < x2 ) ||
                ( x1 > ( x2 + w2 ) )
            );

			// if (objectOne.object.direction == TANK_DIRECTION_LEFT || objectOne.object.direction == TANK_DIRECTION_RIGHT) {
			// 	check = Math.abs(((x1 + w1 / 2) - (x2 + w2 / 2))) < Math.abs((w1 + w2) / 2);
			// }
			// if (objectOne.object.direction == TANK_DIRECTION_UP || objectOne.object.direction == TANK_DIRECTION_DOWN) {
			// 	check = Math.abs(((y1 + h1 / 2) - (y2 + h2 / 2))) < Math.abs((h1 + h2) / 2);
			// }
			

		}

		return {
			check: check,
			objectOne: objectOne,
			objectTwo: objectTwo,
			destroy (number = 1,callback) {
				let destroyIdent = [objectIdentOne,objectIdentTwo];
				for (let i = 0; i < number; i++) {
					Collider.remove(destroyIdent[i]);
				}
				callback && callback();
			}
		};
	}

	static remove (ident)
	{
		delete Collider.object[ident];
	}
}

class CollisionObject
{
	constructor (options)
	{
		this.elemt  = options.elemt;
		this.object = options.object;
	}

	remove ()
	{
		this.elemt.parentNode.removeChild(this.elemt);
	}
}