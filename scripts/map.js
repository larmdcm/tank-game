"use strict";

class GameMap
{
	constructor (options)
	{
		this.container = options.container;
	}

	readMap (jsonMap)
	{
		
	}

	static init (options)
	{
		if (!GameMap.instance) {
			GameMap.instance = new GameMap(options);
		}
		return GameMap.instance;
	}

	static getInstance ()
	{
		return GameMap.instance;
	}
}

class GameMapBlock extends Position
{
	static blockType = {
		// 草
		grass: {
			width: 60,
			height: 60,
			src: './images/map/grass.png'
		},
		// 铁
		iron: {
			width: 30,
			height: 30,
			src: './images/map/iron.gif'
		},
		// 砖
		wall: {
			width: 30,
			height: 30,
			src: './images/map/wall.gif'
		},
		// 水
		water: {
			width: 60,
			height: 60,
			src: './images/map/water.gif'
		},
		// 基地
		base: {
			width: 40,
			height: 40,
			src: './images/map/base.png'
		},
		// 敌人
		enemy: {
			width: 60,
			height: 60,
			src: './images/map/enemy.gif'
		}
	};
	isAppend = false;
	constructor (options)
	{
		super(options.x,options.y);

		this.blockType = isUfe(options.blockType) ? 'grass' : options.blockType;
		this.block     = this.createBlock();
	}

	show (container)
	{
		this.block.style.display = 'block';
		if (!this.isAppend) {
			container.appendChild(this.block);
			this.isAppend = true;
		}
		return this;
	}
	
	hide ()
	{
		this.block.style.display = 'none';
	}

	remove ()
	{
		this.block.parentNode && this.block.parentNode.removeChild(this.block);
	}

	createBlock ()
	{
		let img   = document.createElement('img');
		let block = GameMapBlock.blockType[this.blockType];
		let self  = this;
		this.width  = block.width;
		this.height = block.height;
		this.ident  = 'map-block-' + createObjectIdent();
		this.zIndex = 1;

		img.style.width   = block.width + 'px';
		img.style.height  = block.height + 'px';
		img.style.display = 'none';

		img.style.position = 'absolute';
		img.style.left     = this.x + 'px';
		img.style.top      = this.y + 'px';
		img.src            = block.src;
		img.style.zIndex   = this.zIndex;

		img.dataset.ident  = this.ident;

		img.addEventListener('click',() => {
			GameEvent.trigger('map-block-click',this);
		});

		img.addEventListener('mousedown', function (e) {
			if (this.innerHTML.trim().length == 0) e.preventDefault();
			let diffX = e.clientX - this.offsetLeft;
			let diffY = e.clientY - this.offsetTop;
			GameEvent.trigger('map-block-mousedown',e,new Position(diffX,diffY),{
				block: this,
				gameBlock: self
			});
		});

		return img;
	}

	setZindex (index)
	{
		this.zIndex = index;
		this.block.style.zIndex = this.zIndex;
		return this;
	}

	move () 
	{
		this.block.style.left     = this.x + 'px';
		this.block.style.top      = this.y + 'px';
		return this;
	}

	setIdent (ident)
	{
		this.ident  = 'map-block-' + ident;
		return this;
	}

	static create (options)
	{
		return new GameMapBlock(options);
	}
}