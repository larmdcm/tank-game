"use strict";

class GameMapDesign
{
	blocks = {};

	constructor (options)
	{
		this.selectBlockType = options.defaultBlockType;

		this.curBlock  = GameMapBlock.create({
			blockType: this.selectBlockType
		});

		this.designInput = options.designInput;


		this.container  = options.container;

		this.containerWidth  = this.container.clientWidth;
		this.containerHeight = this.container.clientHeight;

		let container   = this.container
		  , designInput = this.designInput
		  , self        = this
		  , switchBtnClick = function () {
			 arrSlice(options.switchBlocks).forEach((block) => {
			 	block.classList.remove('map-switch-block-active');
			 })
			 this.classList.add('map-switch-block-active');
			 self.switchBlockChange(this.dataset.type);
		  }
		  , getDataTypeSwitchBtn = (type) => {
		  	  for (let k in options.switchBlocks) {
		  	  	  if (options.switchBlocks[k].dataset.type == type) {
			  	  	  	return options.switchBlocks[k];
		  	  	  }
		  	  }
		  	  return false;
		  };

		
		for (let k in designInput) {
			designInput[k].addEventListener('change',function () {
				self.changeCurSelectBlock(this);
			});
		}

		document.addEventListener('keydown',(e) => {
			if ([TANK_KEY_CODE_DOWN,TANK_KEY_CODE_UP,TANK_KEY_CODE_LEFT,TANK_KEY_CODE_RIGHT].includes(e.keyCode)) {
				this.keyMoveCurBlockObject(e);
			}
			switch (e.keyCode) {
					case TANK_KEY_CODE_DELETE:
					this.removeBlock(this.curSelectBlock.ident);
					this.curSelectBlock.block.remove();
				break;
					case TANK_KEY_CODE_A: // A
					var btn = getDataTypeSwitchBtn('select');
					btn && switchBtnClick.call(btn);
				break;
					case TANK_KEY_CODE_D: // D
					var btn = getDataTypeSwitchBtn('delete');
					btn && switchBtnClick.call(btn);
				break;
					case TANK_KEY_CODE_S:
					this.unSelectBlock();
				break;
			}

			isFunc(options.switchBlockBtnKeyBind) && options.switchBlockBtnKeyBind(e.keyCode,(type) => {
				let btn = getDataTypeSwitchBtn(type);
				btn && switchBtnClick.call(btn);
			});
		});

		arrSlice(options.switchBlocks).forEach((block) => {
			block.addEventListener("click",switchBtnClick);
		});

		GameEvent.on('map-block-mousedown',(e,diffPos,{block,gameBlock}) => {
			if (this.selectBlockType == 'delete') {
				this.removeBlock(gameBlock.ident);
				gameBlock.block.remove();
			} else if (this.selectBlockType == 'select') {
				this.setSelectBlock(gameBlock);
				let move = (e) => {
					let pos = new Position(e.clientX - diffPos.x,e.clientY - diffPos.y);
					pos = this.checkBoundaryPos(block,pos);

					this.changeCurSelectBlockPos(pos);
				};
				let up = (e) => {
					container.removeEventListener('mousemove',move);
					container.removeEventListener('mouseup',up);
				};
				container.addEventListener('mousemove',move);
				container.addEventListener('mouseup', up);
			}
		});

		container.addEventListener('mousemove',(e) => {
			let x = e.clientX - container.offsetLeft - this.curBlock.width / 2
			  , y = e.clientY - container.offsetTop - this.curBlock.height / 2;

			if (this.selectBlockType != 'select' && this.selectBlockType != 'delete') {
				this.curBlock && this.curBlock.setPos(x,y).move().show(container);

				designInput.zIndex.value  = this.curBlock.block.style.zIndex;
				designInput.posX.value    = x;
				designInput.posY.value    = y;
			}
		});

		container.addEventListener('mouseup', (e) => {
			if (this.selectBlockType != 'select' && this.selectBlockType != 'delete') {
				let block = GameMapBlock.create({
					blockType: this.selectBlockType
				})
				, x = e.clientX - container.offsetLeft - block.width / 2
				, y = e.clientY - container.offsetTop - block.height / 2;

				block.setPos(this.checkBoundaryPos(block.block,new Position(x,y))).move().show(container);

				this.setBlock(block.ident,block);
			}
		});
	}

	generateMap ()
	{
		let generateMapObject = [];

		arrSlice(Object.values(this.blocks)).forEach((block) => {
			generateMapObject.push({
				x: block.x,
				y: block.y,
				zIndex: block.zIndex,
				blockType: block.blockType
			});
		});

		return generateMapObject;
	}

	readJsonMap (jsonMap)
	{
		if (isStr(jsonMap)) {
			jsonMap = JSON.parse(jsonMap);
		}

		arrSlice(this.container.childNodes).forEach((node) => {
			if (node.nodeType == 1) {
				if (this.curBlock && this.curBlock.ident == node.dataset.ident) {
					return;
				}
				node.parentNode && node.parentNode.removeChild(node);		
			}
		});

		this.clearBlock();

		arrSlice(jsonMap).forEach((block,index) => {
			let gameBlock = GameMapBlock.create({
				blockType: block.blockType
			})
			, x = block.x
			, y = block.y;

			gameBlock.setIdent(index).setPos(this.checkBoundaryPos(gameBlock.block,new Position(x,y))).move().show(this.container);

			this.setBlock(gameBlock.ident,gameBlock);
		});
	}

	switchBlockChange (type)
	{
		this.curBlock.remove();
		this.selectBlockType = type;

		if (type != 'select' && type != 'delete') {
			this.curBlock = GameMapBlock.create({
				blockType: this.selectBlockType
			});	
		}
	}

	changeCurSelectBlock (input)
	{
		if (!this.curSelectBlock) {
			return;
		}
		let block = this.getBlock(this.curSelectBlock.ident);
		block[input.dataset.attr] = input.value;
		this.setBlock(this.curSelectBlock.ident,block);

		this.curSelectBlock[input.dataset.attr] 	 = input.value;
		this.curSelectBlock.block.style[input.name]  = input.value + input.dataset.company;
	}

	setSelectBlock (gameBlock)
	{
		if (this.curSelectBlock && this.curSelectBlock.block) {
			this.curSelectBlock.block.classList.remove('map-block-active');
		}
		this.curSelectBlock = gameBlock;
		this.curSelectBlock.block.classList.add('map-block-active');
		this.setDesignInputVal();
	}

	unSelectBlock ()
	{
		if (this.curSelectBlock) {
			this.curSelectBlock.block.classList.remove('map-block-active');
		}
		this.curSelectBlock = {
			zIndex: 1,
			x: 0,
			y: 0
		};

		this.setDesignInputVal();
	}

	setDesignInputVal ()
	{
		this.designInput.zIndex.value  = this.curSelectBlock.zIndex;
		this.designInput.posX.value    = this.curSelectBlock.x;
		this.designInput.posY.value    = this.curSelectBlock.y;
	}

	keyMoveCurBlockObject (e)
	{
		if (this.selectBlockType != 'select') return;

		let pos = new Position().setPos(this.curSelectBlock.getPos());

		switch (e.keyCode)
		{
				case TANK_KEY_CODE_DOWN:
				pos.y -= 1;
			break;
				case TANK_KEY_CODE_UP:
				pos.y += 1;
			break;
				case TANK_KEY_CODE_LEFT:
				pos.x -= 1;
			break;
				case TANK_KEY_CODE_RIGHT:
				pos.x += 1;
			break;
		}

		pos = this.checkBoundaryPos(this.curSelectBlock.block,pos);

		this.changeCurSelectBlockPos(pos);
	}

	changeCurSelectBlockPos (pos)
	{
		arrSlice(['x','y']).forEach((name) => {
			this.changeCurSelectBlock({
				name: name == 'x' ? 'left' : 'top',
				value: pos[name],
				dataset: {
					attr: name,
					company: 'px'
				},
			});
		});
		this.setDesignInputVal();
	}

	checkBoundaryPos (block,pos)
	{
		if (pos.x < 0) {
			pos.x = 0;
		}
		if (pos.x > (this.containerWidth - block.clientWidth)) {
			pos.x = this.containerWidth - block.clientWidth;
		}
		
		if (pos.y < 0) {
			pos.y = 0
		}
		if (pos.y > (this.containerHeight - block.clientHeight)) {
			pos.y = this.containerHeight - block.clientHeight;
		}
		return pos;
	}

	getBlock (ident)
	{
		return this.blocks[ident];
	}

	setBlock (ident,block)
	{
		this.blocks[ident] = block;
		return this;
	}

	removeBlock (ident)
	{
		delete this.blocks[ident];
		return this;
	}

	clearBlock ()
	{
		this.blocks = {};
		return this;
	}

	static init (options)
	{
		return new GameMapDesign(options);
	}
}