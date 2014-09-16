'use strict';

var miniGame = {}

miniGame.canvas, miniGame.ctx, miniGame.running;
miniGame.keysDown = {};

miniGame.utility = {
	doBoxesIntersect: function(rect1, rect2) {
		if(typeof rect1 === "undefined" || typeof rect2 === "undefined"){ return false; }
		if (rect1.x < rect2.x + rect2.sprite.width / 2 &&
	   	rect1.x + rect1.sprite.width / 2 > rect2.x &&
	   	rect1.y < rect2.y + rect2.sprite.height / 2 &&
	   	rect1.sprite.height / 2 + rect1.y > rect2.y) {
	    	return true;
		}
		return false;
	}
}

miniGame.assetManager = {
	assets: {},
	loadAsset: function(key, asset){
		var image = new Image();
		image.src = asset;
		this.assets[key] = image;
	},
	loadAssets: function(){
		miniGame.assetManager.loadAsset('ship', 'images/minigame_sprites/ship.png');
		miniGame.assetManager.loadAsset('lives', 'images/minigame_sprites/hud_ship.png');
		miniGame.assetManager.loadAsset('explosion', 'images/minigame_sprites/explosion.png');
		miniGame.assetManager.loadAsset('bullet', 'images/minigame_sprites/bullet.png');
		miniGame.assetManager.loadAsset('asteroid', 'images/minigame_sprites/asteroid.png');
	},
	getAsset: function(key){
		return this.assets[key];
	},
	removeAsset: function(key){
		delete this.assets[key];
	}
}

miniGame.player = {
	x: 0,
	y: 100,
	width: 32,
	height: 32,
	speed: 200,
	sprite: miniGame.assetManager.getAsset('ship'),
	bullets: [],
	fireTimer: Date.now(),
	invincibilityTimer: Date.now(),
	invincibilityDelay: 3000,
	fireSpeed: 100,
	startHealth: 100,
	health: 100,
	invincible: false,
	opacity: 1,
	score: 0,
	init: function(){
		miniGame.player.sprite = miniGame.assetManager.getAsset('ship');
	},
	moveLeft: function(delta) {
		this.x -= this.speed * delta;
	},
	moveRight: function(delta){
		this.x += this.speed * delta;
	},
	moveUp: function(delta){
		this.y -= this.speed * delta;
	},
	moveDown: function(delta){
		this.y += this.speed * delta;
	},
	move: function(delta) {
		if (65 in miniGame.keysDown) { this.moveLeft(delta); }
	    if (87 in miniGame.keysDown) { this.moveUp(delta); }
	    if (68 in miniGame.keysDown) { this.moveRight(delta); }
	    if (83 in miniGame.keysDown) { this.moveDown(delta); }
	    if (16 in miniGame.keysDown) { this.fire(); }
	},
	fire: function(){
		var fireDelta = Date.now() - this.fireTimer;
		if(fireDelta > this.fireSpeed) {
			miniGame.bulletFactory.generate();
			this.fireTimer = Date.now();
		}
	},
	damage: function(amount){
		if(this.health <= 0){
			miniGame.running = false;
		} else {
			this.health -= amount;
			this.invincible = true;
			this.opacity = .4;
		}
	},
	handleInvincibility: function(){
		var invDelta = Date.now() - this.invincibilityTimer;
		if(invDelta > this.invincibilityDelay){
			this.invincible = false;
			this.opacity = 1;
			this.invincibilityTimer = Date.now();
		}
	},
	windowCollision: function(){
		/* top and left collisions */
		if(this.x < 0) { this.x = 0; }
		if(this.y < 0) { this.y = 0; }
		/* bottom and left collisions */
		if(this.x >= (miniGame.canvas.width - this.sprite.width) / 2) { 
			this.x = (miniGame.canvas.width - this.sprite.width) / 2; 
		}
		if(this.y >= (miniGame.canvas.height - this.sprite.height) / 2) { 
			this.y = (miniGame.canvas.height - this.sprite.height) / 2; 
		}
	},
	asteroidCollision: function() {
		for(var i=0; i<miniGame.asteroidFactory.asteroids.length; i++){
			if(miniGame.utility.doBoxesIntersect(this, miniGame.asteroidFactory.asteroids[i])) {
				if(!this.invincible){
					miniGame.explosionFactory.generate(this.x - 5, this.y - 5);
					this.damage(miniGame.asteroidFactory.dp);
				}	
			}
		}

	},
	update: function(delta){
		this.move(delta);
		this.windowCollision();
		this.handleInvincibility();
		this.asteroidCollision();
	}, 
	render: function(){
		/* render ship */
		if(miniGame.running){
			miniGame.drawSprite(this.sprite, (0.5 + this.x) << 0, (0.5 + this.y) << 0, 0, 0, 
				this.sprite.width, this.sprite.height, this.opacity);
		}
	}
}

miniGame.bulletFactory = {
	bullets: [],
	generate: function(){
		var tmpBullet = {
			sprite: miniGame.assetManager.getAsset('bullet'),
			x: miniGame.player.x + (miniGame.player.sprite.width / 2),
			y: (miniGame.player.sprite.height / 4) + miniGame.player.y - 2,
			speed: 350
		}
		this.bullets.push(tmpBullet);
	},
	update: function(delta) {
		for(var i=0; i<this.bullets.length; i++) {
			this.bullets[i].x += this.bullets[i].speed * delta;
			if(this.bullets[i].x > miniGame.canvas.width + this.bullets[i].sprite.width){
				this.bullets.splice(i, 1);
			}
		}
	},
	render: function(){
		for(var i=0; i<this.bullets.length; i++) {
			miniGame.drawSprite(this.bullets[i].sprite, this.bullets[i].x, this.bullets[i].y);
		}
	}

}

miniGame.asteroidFactory = {
	asteroids: [],
	createTime: 300,
	asteroidTimer: Date.now(),
	dp: 20,
	generate: function(){
		var asteroidDelta = Date.now() - this.asteroidTimer;
		if(asteroidDelta > this.createTime && miniGame.running){
			var tmpSprite = miniGame.assetManager.getAsset('asteroid');
			var tmpAsteroid = {
				sprite: miniGame.assetManager.getAsset('asteroid'),
				x: miniGame.canvas.width + 15,
				y: Math.floor(Math.random() * miniGame.canvas.height),
				speed: 200, 
				health: 100
			}
			this.asteroids.push(tmpAsteroid);
			this.asteroidTimer = Date.now();
		}
	},
	bulletCollision: function(){
		for(var i=0; i<this.asteroids.length; i++){
			/* only take it to O(n^2) if bullet is on the screen */
			if(this.asteroids[i].x < miniGame.canvas.width){
				for(var y=0; y<miniGame.bulletFactory.bullets.length; y++){
					if(miniGame.utility.doBoxesIntersect(this.asteroids[i], miniGame.bulletFactory.bullets[y])){
						this.damage(this.asteroids[i]);
						var bullX = miniGame.bulletFactory.bullets[y].x;
						var bullY = miniGame.bulletFactory.bullets[y].y - 15;
						miniGame.explosionFactory.generate(bullX, bullY)
						miniGame.bulletFactory.bullets.splice(y, 1);
					}
				}
			}
		}
	},
	update: function(delta){
		this.generate();
		this.bulletCollision();
		for(var i=0; i<this.asteroids.length; i++) {
			this.asteroids[i].x -= this.asteroids[i].speed * delta;
			if(this.asteroids[i].x < -10){
				this.asteroids.splice(i, 1);
			}
		}
	},
	render: function(){
		for(var i=0; i<this.asteroids.length; i++) {
			miniGame.drawSprite(this.asteroids[i].sprite, this.asteroids[i].x, this.asteroids[i].y);
		}
	},
	remove: function(asteroid){
		var ast = this.asteroids.indexOf(asteroid)
		this.asteroids.splice(ast, 1);
	},
	damage: function(asteroid){
		if(asteroid.health <= 0){
			this.remove(asteroid);
			miniGame.player.score += 20;
		} else {
			asteroid.health -= 20;
			miniGame.player.score += 5;
		}
	}
}

miniGame.explosionFactory = {
	explosions: [],
	frames: 25,
	generate: function(x, y){
		var tmpSprite = miniGame.assetManager.getAsset('explosion');
		var tmpExp = {
			x: x,
			y: y,
			frames: this.frames,
			currFrame: 0,
			sprite: tmpSprite,
			frameWidth: 50,
			frameHeight: 50,
			frameDelay: 100,
			frameTimer: Date.now(),
			isAlive: true,
			advanceFrame: function(){
				if(this.currFrame === this.frames - 1) { this.isAlive = false; }
				var frameDelta = Date.now() - this.frameTimer;
				if(frameDelta > this.frameDelay && this.isAlive){
					this.currFrame++;	
				}
			}
		}

		this.explosions.push(tmpExp);
	},
	update: function(){
		for(var i=0; i<this.explosions.length; i++){
			this.explosions[i].advanceFrame();
		}
	},
	render: function(){
		for(var i=0; i<this.explosions.length; i++){
			if(this.explosions[i].isAlive) { 
				var clipX = (this.explosions[i].currFrame % 5) * 50;
	            var clipY = Math.floor( (this.explosions[i].currFrame / 250) * 50) * 50;
				miniGame.drawSprite(this.explosions[i].sprite, this.explosions[i].x, this.explosions[i].y, 
					clipX, clipY, 50, 50);
			} else {
				this.remove(this.explosions[i].isAlive);
			}
		}
	},
	remove: function(explosion){
		var exp = this.explosions.indexOf(explosion)
		this.explosions.splice(exp, 1);
	}
}

miniGame.hud = {
	score: 0,
	ship: null,
	drawText: function(){
			miniGame.drawText('Score: ' + miniGame.player.score, 10, 15, 16);
	},
	drawLives: function(){
		var startX = 250;
		var startY = 1;
		var padding = 10;
		var numLives = miniGame.player.health / miniGame.asteroidFactory.dp;
		for(var i=0; i<numLives; i++){
			miniGame.drawSprite(miniGame.hud.ship, startX, startY, 0, 0, 16, 16, 1);
			startX += padding;
		}
	},
	render: function(){
		miniGame.hud.drawText();
		miniGame.hud.drawLives();
	},
	init: function(){
		
		miniGame.hud.ship = miniGame.assetManager.getAsset('lives');
	}
}

miniGame.drawSprite = function(imageObject, x, y, sx, sy, sw, sh, opacity, rotation, scale){
    var w = sw || imageObject.width;
    var h = sh || imageObject.height;
    sx = sx || 0;
    sy = sy || 0;
    opacity = opacity || 1;
    miniGame.ctx.save();
    miniGame.ctx.translate(x, y);
    //miniGame.ctx.rotate(rotation);
    //miniGame.ctx.scale(scale, scale);
    miniGame.ctx.globalAlpha = opacity;
    miniGame.ctx.drawImage(imageObject, sx, sy, w, h, x, y, w, h);
    miniGame.ctx.restore();
}

miniGame.drawText = function(str, x, y, size){
	miniGame.ctx.fillStyle = "white";
	miniGame.ctx.font = /*"bold " + */size + "px Arial";
	miniGame.ctx.fillText(str, x, y);
}

miniGame.initGame = function() {
	miniGame.canvas = document.getElementById('canvas');
	miniGame.ctx 	= miniGame.canvas.getContext('2d');

	miniGame.canvas.width = 800;
	miniGame.canvas.height = 430;

	miniGame.running = true;

	window.addEventListener('keydown', function(e) {
    	miniGame.keysDown[e.keyCode] = true;
	});
	window.addEventListener('keyup', function(e) {
    	delete miniGame.keysDown[e.keyCode];
	});
	miniGame.assetManager.loadAssets();
	miniGame.player.init();
	miniGame.hud.init();
	miniGame.gameLoop.time = Date.now();
	setInterval(miniGame.levelManager.currLevel, 10);
	//window.requestAnimationFrame(miniGame.gameLoop.run);
}



miniGame.titleScreen = {
	isActive: true,
	update: function(delta){
		if (13 in miniGame.keysDown) { miniGame.titleScreen.isActive = false; }
	},
	render: function(){
		miniGame.ctx.clearRect(0, 0, canvas.width, canvas.height);
		miniGame.drawText('Blowin Shit Up', 230, 200, 32);
		miniGame.drawText('Press enter to start', 240, 220, 16);
	},
	run: function(){
		if(miniGame.titleScreen.isActive){
			miniGame.titleScreen.update((Date.now() - miniGame.gameLoop.time) / 1000);
			miniGame.titleScreen.render();
			miniGame.gameLoop.time = Date.now();
		} else {
			return -1;
		}
	}
}

miniGame.gameOver = {
	isActive: true,
	update: function(delta){

	},
	render: function(){
		miniGame.ctx.clearRect(0, 0, canvas.width, canvas.height);
		miniGame.drawText('Game Over.', 230, 200, 24);
	},
	run: function(){
		miniGame.gameOver.update((Date.now() - miniGame.gameLoop.time) / 1000);
		miniGame.gameOver.render();
		miniGame.gameLoop.time = Date.now();
	}
}

miniGame.gameLoop = {

	update: function(delta){
		miniGame.player.update(delta);
		miniGame.bulletFactory.update(delta);
		miniGame.asteroidFactory.update(delta);
		miniGame.explosionFactory.update();
	},


	render: function(){
		miniGame.ctx.clearRect(0, 0, canvas.width, canvas.height);
		miniGame.player.render();
		miniGame.hud.render();
		miniGame.bulletFactory.render();
		miniGame.asteroidFactory.render();
		miniGame.explosionFactory.render();
	},
	run: function(){
		if(miniGame.running){
			miniGame.gameLoop.update((Date.now() - miniGame.gameLoop.time) / 1000);
			miniGame.gameLoop.render();
			miniGame.gameLoop.time = Date.now();
			//window.requestAnimationFrame(run);
		} else {
			return -1;
		}
	}

}

miniGame.levelManager = {
	state: [miniGame.gameOver.run, miniGame.gameLoop.run, miniGame.titleScreen.run],
	currLevel: function(){
		var top = miniGame.levelManager.state[miniGame.levelManager.state.length - 1];
		if(top() === -1) {
			miniGame.levelManager.state.pop();
		}
	},
	currState: function(){

	}

}

