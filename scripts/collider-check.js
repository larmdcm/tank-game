// 碰撞检测
function colliderCheck (ident,identName) {
	// 遍历敌人列表检测
	[].slice.call(this.getIdentList(this[identName])).forEach((enemyIdnet,index) => {
		let result = Collider.rectangularDetection(ident,enemyIdnet);
			result.check && result.destroy(2,() => {
				result.objectOne.remove();
				result.objectTwo.remove();
				this.removeIdentList(this[identName],result.objectTwo.object.ident);
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
				let objectTwo = result.objectTwo;
				result.objectOne.remove();
				// 可击破物体
				if (objectTwo.object.blockType == 'wall') {
		      		Collider.remove(buildingIdent);
					objectTwo.remove();
					this.removeIdentList(this.buildingIdentName,objectTwo.object.ident);
				}
			} else {
				checkObject.setPos(pos).move();
			}
		}
	});	
}