
(function (window, document) {
	'use strict';

	var TWO_PI = Math.PI * 2;

	function Point(x, y) {
		this.x = x;
		this.y = y;
	}

	function Alien(pos, v, angle, rotSpeed, maxRadius, img, imgOffsetX, imgOffsetY, eyeX, eyeY, eyeCircleRadius, eyeRadius, eyeAngle) {
		this.pos = pos;
		this.v = v;
		this.angle = angle;
		this.rotSpeed = rotSpeed;
		this.maxRadius = maxRadius;

		this.img = img;
		this.imgOffsetX = imgOffsetX;
		this.imgOffsetY = imgOffsetY;

		this.eyeX = eyeX;
		this.eyeY = eyeY;
		this.eyeCircleRadius = eyeCircleRadius;
		this.eyeRadius = eyeRadius;
		this.eyeAngle = eyeAngle;
	}

	function preRenderAlien(color) {
		var canvas = document.createElement('canvas');

		var mainRadius = 25;
		var headRadius = 20;
		var borderWidth = 2;

		var w = mainRadius * 2 + borderWidth;
		var h = mainRadius * 4 + borderWidth / 2;
		var cx = w / 2;
		var cy = mainRadius * 2 + borderWidth / 2;

		canvas.width = w;
		canvas.height = h;

		var ctx = canvas.getContext('2d');

		// Body
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(cx, cy + mainRadius, mainRadius, 0, TWO_PI);
		ctx.fill();

		// Head
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(cx, cy - headRadius, headRadius, 0, TWO_PI);
		ctx.fill();

		// Eye
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(cx, cy - headRadius - headRadius / 4, headRadius / 2, 0, TWO_PI);
		ctx.fill();

		// Helmet
		ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = borderWidth;
		ctx.beginPath();
		ctx.arc(cx, cy - mainRadius, mainRadius, 0, TWO_PI);
		ctx.fill();
		ctx.stroke();

		var img = new Image();
		img.src = canvas.toDataURL();

		return {
			img: img,
			maxRadius: Math.max(w, h) / 2,
			offX: -w / 2,
			offY: -h / 2,
			eyeX: 0,
			eyeY: -headRadius - headRadius / 4,
			eyeCircleRadius: headRadius / 4,
			eyeRadius: headRadius / 4
		};
	}

	function randomAlien(w, h) {
		var color = 'hsl(' + Math.floor(Math.random() * 361) + ',80%,40%)';
		var r = preRenderAlien(color);
		var maxRadius = r.maxRadius;

		var dir = Math.floor(Math.random() * 4);
		var rv = Math.random();
		var x, y, a;
		if(dir == 0) {
			x = maxRadius + rv * (w - 2 * maxRadius);
			y = -maxRadius;
			a = Math.PI / 2;
		} else if(dir == 1) {
			x = w + maxRadius;
			y = maxRadius + rv * (h - 2 * maxRadius);
			a = Math.PI;
		} else if(dir == 2) {
			x = maxRadius + rv * (w - 2 * maxRadius);
			y = h + maxRadius;
			a = Math.PI * 3 / 2;
		} else {
			x = -maxRadius;
			y = maxRadius + rv * (h - 2 * maxRadius);
			a = 0;
		}

		var pos = new Point(x, y);
		var moveAngle = a + (Math.random() * 2 - 1) * Math.PI * 0.4;
		var moveSpeed = 30 + Math.random() * 40;
		var v = new Point(moveSpeed * Math.cos(moveAngle), moveSpeed * Math.sin(moveAngle));

		var angle = (Math.random() * 2 - 1) * Math.PI;
		var rotSpeed = (Math.random() * 2 - 1) * 1;

		var eyeAngle = Math.random() * TWO_PI;

		return new Alien(pos, v, angle, rotSpeed, maxRadius, r.img, r.offX, r.offY, r.eyeX, r.eyeY, r.eyeCircleRadius, r.eyeRadius, eyeAngle);
	}

	function randomCountdown() {
		return 12 + Math.random() * 4;
	}

	function LostInSpace(wrapper) {
		this.wrapper = wrapper;
		this.canvas = null;
		this.ctx = null;
		this.bgCanvas = null;
		this.bgCtx = null;

		this.initialized = false;
		this.animFrame = null;
		this.lastTimestamp = 0;
		this.pendingBgUpdate = false;
		this.countdown = 0;
		this.alienApproaching = false;

		this.stars = [];
		this.aliens = [];

		var self = this;

		this.boundUpdate = function (timestamp) {
			self.update(timestamp);
		};
	}

	LostInSpace.prototype.resize = function () {
		var w = this.wrapper.clientWidth;
		var h = this.wrapper.clientHeight;

		var ctx = this.ctx;
		var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStoreRatio =
			ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
		var ratio = devicePixelRatio / backingStoreRatio;
		var scale = backingStoreRatio / devicePixelRatio;

		var sw = w * ratio;
		var sh = h * ratio;

		this.canvas.width = sw;
		this.canvas.height = sh;
		this.canvas.style.width = w + 'px';
		this.canvas.style.height = h + 'px';
		this.bgCanvas.width = sw;
		this.bgCanvas.height = sh;
		this.bgCanvas.style.width = w + 'px';
		this.bgCanvas.style.height = h + 'px';

		this.width = sw;
		this.height = sh;

		this.pendingBgUpdate = true;

		return this;
	};

	LostInSpace.prototype.init = function () {
		if(this.initialized) return this;

		this.wrapper.classList.add('lost-in-space');
		this.wrapper.innerHTML = '';

		var bgCanvas = document.createElement('canvas');
		this.wrapper.appendChild(bgCanvas);
		this.bgCanvas = bgCanvas;
		this.bgCtx = bgCanvas.getContext('2d');

		var canvas = document.createElement('canvas');
		this.wrapper.appendChild(canvas);
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');

		this.countdown = 2;
		this.alienApproaching = true;

		this.resize();

		var self = this;

		this.updateBackground();

		this.initialized = true;

		return this;
	};

	LostInSpace.prototype.play = function () {
		if(this.animFrame) return this;

		this.lastTimestamp = 0;
		this.animFrame = requestAnimationFrame(this.boundUpdate);

		return this;
	};

	LostInSpace.prototype.pause = function () {
		if(!this.animFrame) return this;

		cancelAnimationFrame(this.animFrame);
		this.animFrame = null;

		return this;
	};

	LostInSpace.prototype.updateBackground = function () {
		this.pendingBgUpdate = false;

		var ctx = this.bgCtx;

		var stars = this.stars;

		var chunkSize = 100;
		var starsPerChunk = 5;

		function genChunk() {
			var chunk = [];
			var n = starsPerChunk;
			while(n--) {
				chunk.push(new Point(Math.random() * chunkSize, Math.random() * chunkSize));
			}
			return chunk;
		}

		var xChunks = Math.ceil(this.width / chunkSize);
		var yChunks = Math.ceil(this.height / chunkSize);
		var xDiff = xChunks - (stars.length > 0 ? stars[0].length : 0);
		var yDiff = yChunks - stars.length;
		console.log(xDiff, yDiff);
		if(xDiff || yDiff) {
			if(yDiff < 0) {
				stars.length = yChunks;
			} else if(yDiff > 0) {
				for(var i = 0; i < yDiff; i++) {
					stars.push([]);
				}
			}

			for(var i = 0; i < yChunks; i++) {
				var row = stars[i];
				var len = row.length;
				if(len > xChunks) {
					row.length = xChunks;
				} else if(len < xChunks) {
					var diff = xChunks - len;
					for(var j = 0; j < diff; j++) {
						row.push(genChunk());
					}
				}
			}
		}

		ctx.clearRect(0, 0, this.width, this.height);

		ctx.beginPath();

		for(var y = 0; y < stars.length; y++) {
			var row = stars[y];
			for(var x = 0; x < row.length; x++) {
				var chunk = row[x];
				var n = chunk.length;
				while(n--) {
					var star = chunk[n];
					ctx.rect(x * chunkSize + star.x, y * chunkSize + star.y, 2, 2);
				}
			}
		}

		ctx.fillStyle = '#fff';
		ctx.fill();
	};

	LostInSpace.prototype.update = function (timestamp) {
		this.animFrame = requestAnimationFrame(this.boundUpdate);

		if(this.pendingBgUpdate) {
			this.updateBackground();
		}

		var deltaTime = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0;
		this.lastTimestamp = timestamp;

		if(this.countdown > 0) {
			this.countdown -= deltaTime;
		} else if(this.alienApproaching) {
			this.alienApproaching = false;
			this.aliens.push(randomAlien(this.width, this.height));
		}

		var ctx = this.ctx;

		ctx.clearRect(0, 0, this.width, this.height);

		var n = this.aliens.length;
		while(n--) {
			var alien = this.aliens[n];

			ctx.save();

			ctx.translate(alien.pos.x, alien.pos.y);
			ctx.rotate(alien.angle);

			ctx.drawImage(alien.img, alien.imgOffsetX, alien.imgOffsetY);

			ctx.fillStyle = '#000';
			ctx.beginPath();
			var a = -alien.angle + alien.eyeAngle;
			ctx.arc(alien.eyeX + Math.cos(a) * alien.eyeCircleRadius, alien.eyeY + Math.sin(a) * alien.eyeCircleRadius, alien.eyeRadius, 0, TWO_PI);
			ctx.fill();

			ctx.restore();

			alien.angle += alien.rotSpeed * deltaTime;
			alien.pos.x += alien.v.x * deltaTime;
			alien.pos.y += alien.v.y * deltaTime;

			if(alien.pos.x + alien.maxRadius < 0 || alien.pos.x - alien.maxRadius > this.width ||
				alien.pos.y + alien.maxRadius < 0 || alien.pos.y - alien.maxRadius > this.height) {
				this.aliens.splice(n, 1);
				this.alienApproaching = true;
			}
		}
	};

	var wrapper = document.createElement('div');
	wrapper.className = 'bg';
	document.body.insertBefore(wrapper, document.body.firstChild);

	var lostInSpace = new LostInSpace(wrapper).init();

	window.addEventListener('resize', function () {
		lostInSpace.resize();
	});

	setTimeout(function () {
		lostInSpace.play();
		document.body.classList.add('light');
		wrapper.classList.add('visible');
	}, 1000);

})(window, document);
