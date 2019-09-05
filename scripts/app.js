"use strict";

class Game
{
	playerIdentName   = 'player';
	enemyIdentName    = 'enemy';
	buildingIdentName = 'building';

	static start (options)
	{
		if (!Game.instance) {
			Game.instance = new Game(options);
		}
		return Game.instance;
	}

	static getInstance ()
	{
		return Game.instance;
	}

	addIdentList (name,ident)
	{
		if (!this.identList[name]) {
			this.identList[name] = [];
		}
		this.identList[name].push(ident);
	}

	getIdentList (name)
	{
		if (!this.identList[name]) {
			this.identList[name] = [];
		}
		return this.identList[name];
	}
	removeIdentList (name,index)
	{
		this.identList[name].splice(index,1);
	}

	constructor (options)
	{
		this.options = options;

		this.identList = {};

		document.addEventListener('keydown',(e) => {
			GameEvent.trigger('game-keydown',e.keyCode,e);
		});
		document.addEventListener('keyup',(e) => {
			GameEvent.trigger('game-keyup',e.keyCode,e);
		});

		GameEvent.on('collision-check',(ident) => {
			// 玩家
			if (ident.includes(this.playerIdentName)) {
				// 遍历敌人列表检测
				[].slice.call(this.getIdentList(this.enemyIdentName)).forEach((enemyIdnet,index) => {
					let result = Collider.rectangularDetection(ident,enemyIdnet);
						result.check && result.destroy(2,() => {
							result.objectOne.remove();
							result.objectTwo.remove();
							this.removeIdentList(this.enemyIdentName,index);
							Animation.create({
								images () {
									let images = [];
									for (let i = 1; i <= 8; i++) {
										images.push("./images/animation/" + "blast" + i + ".gif");
									}	
									return images;	
								},
								beforeFn () {
									Voice.create('./voice/blast.wav').play(function () {
										this.destroy();
									});
								},
								playPosition () {
									return new Position(result.objectTwo.object.x - 35,result.objectTwo.object.y - 35);
								}
							}).play(function () {
								this.destroy();
							});
					});
				});
		       // 遍历建筑物检测
		      	arrSlice(this.getIdentList(this.buildingIdentName)).forEach((buildingIdent,index) => {
		      		let result = Collider.rectangularDetection(ident,buildingIdent);
		      		if (result.check) {
		      			let checkObject = result.objectOne.object
		      			   , pos = checkObject.getPos();
  						switch (checkObject.direction) {
								case TANK_DIRECTION_UP:
								pos.y += checkObject.speed;
							break;
								case TANK_DIRECTION_DOWN:
								pos.y -= checkObject.speed;
							break;
								case TANK_DIRECTION_LEFT:
								pos.x += checkObject.speed;
							break;
								case TANK_DIRECTION_RIGHT:
								pos.x -= checkObject.speed;
							break;
						}
						if (ident.includes('bullet')) {
				      		Collider.remove(buildingIdent);
							this.removeIdentList(this.buildingIdentName,index);
							let objectTwo = result.objectTwo;
							result.objectOne.remove();
							// 可击破物体
							if (objectTwo.object.blockType == 'wall') {
								objectTwo.remove();
							}
						} else {
							checkObject.setPos(pos).move();
						}
		      		}
		      	});
			}
		});
	}

	run () 
	{
		// 初始化地图
		HttpRequest.get("./map/map.json").then((jsonMap) => {
			let gameApp = this;
			
			GameMap.init({
				container: this.getContainer()
			}).readMap(jsonMap,function (block) {
				if (['iron','wall'].includes(block.blockType)) {
					gameApp.addIdentList(gameApp.buildingIdentName,block.ident);
					Collider.add(block.ident,new CollisionObject({
						object: block,
						elemt: block.block
					}));
				}
			});

			let playerDirections = {};
			playerDirections[TANK_KEY_CODE_W] = TANK_DIRECTION_UP;
			playerDirections[TANK_KEY_CODE_S] = TANK_DIRECTION_DOWN;
			playerDirections[TANK_KEY_CODE_A] = TANK_DIRECTION_LEFT;
			playerDirections[TANK_KEY_CODE_D] = TANK_DIRECTION_RIGHT;

			let player = new PlayerTank({
				directionImage: [
					'./images/up.gif','./images/down.gif','./images/left.gif','./images/right.gif'
				],
				directions: playerDirections,
				initPos: new Position(392,519),
				ident: this.playerIdentName + '-tank'
			});
			this.addIdentList(this.playerIdentName,player.ident);
			player.draw();
			Collider.add(player.ident,new CollisionObject({
				object: player,
				elemt: player.tank
			}));

			for (let i = 1; i <= 0; i++) {
				let enemy = new EnemyTank({
					directionImage: [
						'./images/up.gif','./images/down.gif','./images/left.gif','./images/right.gif'
					],
					initPos: new Position(random(100,1000),random(100,600)),
					ident: this.enemyIdentName + "-tank-" + i
				});
				this.addIdentList(this.enemyIdentName,enemy.ident);
				enemy.draw();
				Collider.add(enemy.ident,new CollisionObject({
					object: enemy,
					elemt: enemy.tank
				}));
			}
		});

	}

	getContainer ()
	{
		return this.options.container;
	}
}

class BaseTank extends Position
{
	speed = 10;
	direction = TANK_DIRECTION_UP;
	directionImage = [];
	attackTime = 0;
	width = 60;
	height = 60;

	constructor (options)
	{
		super(options.initPos.x,options.initPos.y);
		this.container = Game.getInstance().getContainer();
		this.directionImage  = options.directionImage;
		this.containerWidth  = this.container.clientWidth;
		this.containerHeight = this.container.clientHeight;
		this.ident  = options.ident;
		this.tank   = this.create();
		this.container.appendChild(this.tank);
	}

	create ()
	{
		let tank = document.createElement('div');
		tank.style.width  = this.width + 'px';
		tank.style.height = this.height + 'px';
		tank.style.position = 'absolute';
		tank.style.zIndex = 2;
		tank.style.left = this.x + 'px';
		tank.style.top 	= this.y + 'px';
		return tank;
	}

	draw ()
	{
		this.tank.style.background = 'url('+ this.directionImage[this.direction] +')';
		switch (this.direction) {
				case TANK_DIRECTION_UP:
				this.y -= this.speed;
			break;
				case TANK_DIRECTION_DOWN:
				this.y += this.speed;
			break;
				case TANK_DIRECTION_LEFT:
				this.x -= this.speed;
			break;
				case TANK_DIRECTION_RIGHT:
				this.x += this.speed;
			break;
		}

		if (this.x < 0) {
			this.x = 0;
		}
		if (this.x > (this.containerWidth - this.tank.clientWidth)) {
			this.x = this.containerWidth - this.tank.clientWidth;
		}
		
		if (this.y < 0) {
			this.y = 0
		}
		if (this.y > (this.containerHeight - this.tank.clientHeight)) {
			this.y = this.containerHeight - this.tank.clientHeight;
		}

		this.move();
	}

	move ()
	{
		this.tank.style.left = this.x + 'px';
		this.tank.style.top  = this.y + 'px';
	}

	launch ()
	{
		let pos    = this.getPos()
		  , newPos = new Position(0,0);
		switch (this.direction) {
				case TANK_DIRECTION_UP:
				newPos.x = pos.x + 22;
				newPos.y = pos.y - 23;
			break;
				case TANK_DIRECTION_DOWN:
				newPos.x = pos.x + 21;
				newPos.y = pos.y + 63;
			break;
				case TANK_DIRECTION_LEFT:
				newPos.x = pos.x - 20;
				newPos.y = pos.y + 22;
			break;
				case TANK_DIRECTION_RIGHT:
				newPos.x = pos.x + 65;
				newPos.y = pos.y + 22;
			break;
		}
		let timestamp = Date.parse(new Date());

		if (!this.attackVoice) {
			this.attackVoice = Voice.create('./voice/fire.wav');
		}
		
		if (this.attackTime == 0 || timestamp > (this.attackTime + 100)) {
			this.attackVoice.play();
			let bullet = new Bullet(this.container,this.ident + "-" + createObjectIdent());
			bullet.setPos(newPos).create(this.direction);
			Collider.add(bullet.ident,new CollisionObject({
				object: bullet,
				elemt: bullet.tankmissile
			}));
			bullet.launch();

		}

		this.attackTime = timestamp;
	}
}

class PlayerTank extends BaseTank
{
	directions = {};

	constructor (options)
	{
		super(options);

		this.directions = options.directions;
		this.tank.className = 'player-tank';

		GameEvent.on('game-keyup',(keyCode) => {
			switch (keyCode) {
					// 发射子弹
					case TANK_KEY_CODE_J:
					this.launch();
				break;			
			}
		});
		GameEvent.on('game-keydown',(keyCode) => {
			switch (keyCode) {
				default:
				// 移动
				keyCode in this.directions && this.draw(this.directions[keyCode]);		
			}
		});
	}
	draw (direction = TANK_DIRECTION_UP)
	{
		this.direction = direction;
		super.draw();
		GameEvent.trigger('collision-check',this.ident);
	}
}

class EnemyTank extends BaseTank
{
	constructor (options)
	{
		super(options);
		this.tank.className = 'enemy-tank';
	}
}

class Bullet extends Position
{
	speed = 1;
	width = 15;
	height = 15;
	isCheck = true;

	constructor (container,ident)
	{
		super(0,0);
		this.container = container;
		this.ident 	   = ident + '-bullet';
	}

	launch ()
	{
		this.container.appendChild(this.tankmissile);

		let move = () => {
			let pos = this.getPos();
			switch (this.direction) {
					case TANK_DIRECTION_UP:
					pos.y -= this.speed;
				break;
					case TANK_DIRECTION_DOWN:
					pos.y += this.speed;
				break;
					case TANK_DIRECTION_LEFT:
					pos.x -= this.speed;
				break;
					case TANK_DIRECTION_RIGHT:
					pos.x += this.speed;
				break;
			}
			this.setPos(pos);
			pos = this.getPos();
			if (pos.x < 0 || pos.x > this.container.clientWidth || pos.y < 0 || pos.y > this.container.clientHeight) {
				this.tankmissile.parentNode && this.tankmissile.parentNode.removeChild(this.tankmissile);
				return;
			}
			this.tankmissile.style.left = pos.x + 'px';
			this.tankmissile.style.top  = pos.y + 'px';
			// 碰撞检测
			this.isCheck && GameEvent.trigger('collision-check',this.ident);
			requestAnimationFrame(move);
		};
		move();
	}

	remove ()
	{
		this.isCheck = false;
		this.tankmissile.parentNode && this.tankmissile.parentNode.removeChild(this.tankmissile);
	}

	create (direction)
	{
		let tankmissile = document.createElement('div');
		tankmissile.style.width  = this.width + 'px';
		tankmissile.style.height = this.height + 'px';
		tankmissile.style.position = 'absolute';
		tankmissile.style.zIndex = 1;
		tankmissile.style.background = 'url(./images/tankmissile.gif)';
		tankmissile.style.left = this.x + 'px';
		tankmissile.style.top  = this.y + 'px';
		tankmissile.className = 'bullet';
		this.tankmissile = tankmissile;
		this.direction   = direction;
		return this;
	}
}

