;(function() {
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

/*miniGame.assetManager = {
	assets: {},
	loadAsset: function(key, asset){
        var self = this;
		var image = new Image();
		image.src = asset;
		self.assets[key] = image;
	},
	loadAssets: function(){
        var self = this;
		self.loadAsset('ship', 'images/minigame_sprites/ship.png');
		self.loadAsset('lives', 'images/minigame_sprites/hud_ship.png');
		self.loadAsset('explosion', 'images/minigame_sprites/explosion.png');
		self.loadAsset('bullet', 'images/minigame_sprites/bullet.png');
		self.loadAsset('asteroid', 'images/minigame_sprites/asteroid.png');
	},
	getAsset: function(key){
        var self = this;
		return self.assets[key];
	},
	removeAsset: function(key){
        var self = this;
		delete self.assets[key];
	}
}
*/
function assetManager() {
    var self = this;
    self.assets = {};
}

assetManager.prototype.loadAsset = function(key, asset) {
    var self = this;
    var image = new Image();
    image.src = asset;
    self.assets[key] = image;
}

assetManager.prototype.loadAssets = function(assets){
    var self = this;
    assets.map(function(a) { self.assets.push(a); } );
}

assetManager.prototype.getAsset = function(key){
    var self = this;
    return self.assets[key];
}

assetManager.prototype.removeAsset = function(key){
    var self = this;
    delete self.assets[key];
}

miniGame.player = {
	x: 0,
	y: 100,
	width: 32,
	height: 32,
	speed: 200,
    /* create a class for player and pass this into the constructor */
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
        var self = this;
		self.x -= self.speed * delta;
	},
	moveRight: function(delta){
        var self = this;
		self.x += self.speed * delta;
	},
	moveUp: function(delta){
        var self = this;
		self.y -= self.speed * delta;
	},
	moveDown: function(delta){
        var self = this;
		self.y += self.speed * delta;
	},
	move: function(delta) {
        var self = this;
		if (65 in miniGame.keysDown) { self.moveLeft(delta); }
	    if (87 in miniGame.keysDown) { self.moveUp(delta); }
	    if (68 in miniGame.keysDown) { self.moveRight(delta); }
	    if (83 in miniGame.keysDown) { self.moveDown(delta); }
	    if (16 in miniGame.keysDown) { self.fire(); }
	},
	fire: function(){
        var self = this;
		var fireDelta = Date.now() - self.fireTimer;
		if(fireDelta > self.fireSpeed) {
			miniGame.bulletFactory.generate();
			self.fireTimer = Date.now();
		}
	},
	damage: function(amount){
        var self = this;
		if(self.health <= 0){
			miniGame.running = false;
		} else {
			self.health -= amount;
			self.invincible = true;
			self.opacity = .4;
		}
	},
	handleInvincibility: function(){
        var self = this;
		var invDelta = Date.now() - self.invincibilityTimer;
		if(invDelta > self.invincibilityDelay){
			self.invincible = false;
			self.opacity = 1;
			self.invincibilityTimer = Date.now();
		}
	},
	windowCollision: function(){
        var self = this;
		/* top and left collisions */
		if(self.x < 0) { self.x = 0; }
		if(self.y < 0) { self.y = 0; }
		/* bottom and left collisions */
		if(self.x >= (miniGame.canvas.width - self.sprite.width) / 2) { 
			self.x = (miniGame.canvas.width - self.sprite.width) / 2; 
		}
		if(self.y >= (miniGame.canvas.height - self.sprite.height) / 2) { 
			self.y = (miniGame.canvas.height - self.sprite.height) / 2; 
		}
	},
	asteroidCollision: function() {
        var self = this;
		for(var i=0; i<miniGame.asteroidFactory.asteroids.length; i++){
			if(miniGame.utility.doBoxesIntersect(self, miniGame.asteroidFactory.asteroids[i])) {
				if(!self.invincible){
					miniGame.explosionFactory.generate(self.x - 5, self.y - 5);
					self.damage(miniGame.asteroidFactory.dp);
				}	
			}
		}

	},
	update: function(delta){
        var self = this;
		self.move(delta);
		self.windowCollision();
		self.handleInvincibility();
		self.asteroidCollision();
	}, 
	render: function(){
        var self = this;
		/* render ship */
		if(miniGame.running){
			miniGame.drawSprite(self.sprite, (0.5 + self.x) << 0, (0.5 + self.y) << 0, 0, 0, 
				self.sprite.width, self.sprite.height, self.opacity);
		}
	}
}

miniGame.bulletFactory = {
	bullets: [],
	generate: function(){
        var sef = this;
		var tmpBullet = {
            /* create a bullet factory class and pass this asset into constructor */
			sprite: miniGame.assetManager.getAsset('bullet'),
			x: miniGame.player.x + (miniGame.player.sprite.width / 2),
			y: (miniGame.player.sprite.height / 4) + miniGame.player.y - 2,
			speed: 350
		}
		self.bullets.push(tmpBullet);
	},
	update: function(delta) {
        var self = this;
		for(var i=0; i<self.bullets.length; i++) {
			self.bullets[i].x += self.bullets[i].speed * delta;
			if(self.bullets[i].x > miniGame.canvas.width + self.bullets[i].sprite.width){
				self.bullets.splice(i, 1);
			}
		}
	},
	render: function(){
        var self = this;
		for(var i=0; i<self.bullets.length; i++) {
			miniGame.drawSprite(self.bullets[i].sprite, self.bullets[i].x, self.bullets[i].y);
		}
	}

}

miniGame.asteroidFactory = {
	asteroids: [],
	createTime: 300,
	asteroidTimer: Date.now(),
	dp: 20,
	generate: function(){
        var self = this;
		var asteroidDelta = Date.now() - self.asteroidTimer;
		if(asteroidDelta > self.createTime && miniGame.running){
            /* create class and pass into constructor */
			var tmpSprite = miniGame.assetManager.getAsset('asteroid');
			var tmpAsteroid = {
				sprite: miniGame.assetManager.getAsset('asteroid'),
				x: miniGame.canvas.width + 15,
				y: Math.floor(Math.random() * miniGame.canvas.height),
				speed: 200, 
				health: 100
			}
			self.asteroids.push(tmpAsteroid);
			self.asteroidTimer = Date.now();
		}
	},
	bulletCollision: function(){
        var self = this;
		for(var i=0; i<self.asteroids.length; i++){
			/* only take it to O(n^2) if bullet is on the screen */
			if(self.asteroids[i].x < miniGame.canvas.width){
				for(var y=0; y<miniGame.bulletFactory.bullets.length; y++){
					if(miniGame.utility.doBoxesIntersect(self.asteroids[i], miniGame.bulletFactory.bullets[y])){
						self.damage(self.asteroids[i]);
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
        var self = this;
		self.generate();
		self.bulletCollision();
		for(var i=0; i<self.asteroids.length; i++) {
			self.asteroids[i].x -= self.asteroids[i].speed * delta;
			if(self.asteroids[i].x < -10){
				self.asteroids.splice(i, 1);
			}
		}
	},
	render: function(){
        var self = this;
		for(var i=0; i<self.asteroids.length; i++) {
			miniGame.drawSprite(self.asteroids[i].sprite, self.asteroids[i].x, self.asteroids[i].y);
		}
	},
	remove: function(asteroid){
        var self = this;
		var ast = self.asteroids.indexOf(asteroid)
		self.asteroids.splice(ast, 1);
	},
	damage: function(asteroid){
        var self = this;
		if(asteroid.health <= 0){
			self.remove(asteroid);
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
        var self = this;
		var tmpSprite = miniGame.assetManager.getAsset('explosion');
		var tmpExp = {
			x: x,
			y: y,
			frames: self.frames,
			currFrame: 0,
			sprite: tmpSprite,
			frameWidth: 50,
			frameHeight: 50,
			frameDelay: 100,
			frameTimer: Date.now(),
			isAlive: true,
			advanceFrame: function(){
                var self = this;
				if(self.currFrame === self.frames - 1) { self.isAlive = false; }
				var frameDelta = Date.now() - self.frameTimer;
				if(frameDelta > self.frameDelay && self.isAlive){
					self.currFrame++;	
				}
			}
		}

		self.explosions.push(tmpExp);
	},
	update: function(){
        var self = this;
		for(var i=0; i<self.explosions.length; i++){
			self.explosions[i].advanceFrame();
		}
	},
	render: function(){
        var self = this;
		for(var i=0; i<self.explosions.length; i++){
			if(self.explosions[i].isAlive) { 
				var clipX = (self.explosions[i].currFrame % 5) * 50;
	            var clipY = Math.floor( (self.explosions[i].currFrame / 250) * 50) * 50;
				miniGame.drawSprite(self.explosions[i].sprite, self.explosions[i].x, self.explosions[i].y, 
					clipX, clipY, 50, 50);
			} else {
				self.remove(self.explosions[i].isAlive);
			}
		}
	},
	remove: function(explosion){
        var self = this;
		var exp = self.explosions.indexOf(explosion)
		self.explosions.splice(exp, 1);
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
    /* this slows down drawing routine */
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
])();
