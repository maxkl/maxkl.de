(function (window, document) {
	'use strict';

	var REFRESH_INTERVAL = 100;
	var RECONNECT_DELAY = 1000;

	var TYPE_TELLID = 1;
	var TYPE_POS = 2;
	var TYPE_NOPOS = 3;
	var TYPE_UPDATE = 4;

	function clamp(v, min, max) {
		return v < min ? min : v > max ? max : v;
	}

	var socket = null;
	var reportInterval;
	var mouseX = 0;
	var mouseY = 0;
	var posKnown = false;
	var clientId;

	var adj = ['wild', 'strange', 'weird', 'colourful', 'happy', 'sad', 'cheerful', 'quirky', 'curious', 'interested', 'green', 'blue', 'yellow', 'purple', 'pink', 'pale', 'fat', 'skinny', 'lonely', 'bald', 'old', 'speedy'];
	var thing = ['broom', 'weasel', 'fox', 'flower', 'shoe', 'mike', 'thing', 'wizard', 'wanderer', 'eagle', 'mouse', 'cat', 'tiger', 'giraffe', 'cursor', 'pointer', 'pencil', 'ball', 'uncle', 'aunt', 'guy', 'gal'];

	var clients = {};

	function Cursor(e) {
		this.e = e;
	}

	function randomName() {
		var a = adj[Math.floor(Math.random() * adj.length)];
		var b = thing[Math.floor(Math.random() * thing.length)];
		return a + ' ' + b;
	}

	function createSocket() {
		socket = new WebSocket('wss://maxkl.de/mice');
		socket.binaryType = 'arraybuffer';

		socket.addEventListener('close', function (evt) {
			console.log('Connection closed:' + evt.reason + ' (' + evt.code + ')');
			clearInterval(reportInterval);
			setTimeout(createSocket, RECONNECT_DELAY);
		});

		socket.addEventListener('error', function (evt) {
			console.log('error:', evt);
		});

		socket.addEventListener('open', function (evt) {
			console.log('Connection established');
			reportInterval = setInterval(reportPos, REFRESH_INTERVAL);
		});

		socket.addEventListener('message', function (evt) {
			var message = evt.data;

			if(Object.prototype.toString.call(message) === '[object ArrayBuffer]') {
				var data = new DataView(message);
				var type = data.getUint8(0);
				switch(type) {
					case TYPE_TELLID:
						clientId = data.getUint16(1);
						console.log('client id:', clientId);
						break;
					case TYPE_UPDATE:
						var count = (message.byteLength - 1) / 6;
						if(Math.floor(count) !== count) {
							console.error('Invalid UPDATE message length:', message.byteLength);
							return;
						}
						var newClientPositions = {};
						var offset = 1;
						for(var i = 0; i < count; i++) {
							var id = data.getUint16(offset);
							offset += 2;
							var x = data.getUint16(offset) / 65535;
							offset += 2;
							var y = data.getUint16(offset) / 65535;
							offset += 2;
							if(id !== clientId) {
								newClientPositions[id] = [x, y];
							}
						}

						for(var id in clients) {
							if(clients.hasOwnProperty(id)) {
								var client = clients[id];

								if(!newClientPositions.hasOwnProperty(id)) {
									client.e.parentNode.removeChild(client.e);
									delete clients[id];
									continue;
								}

								var pos = newClientPositions[id];
								client.e.style.left = Math.round(pos[0] * 1000) / 10 + '%';
								client.e.style.top = Math.round(pos[1] * 1000) / 10 + '%';
							}
						}

						for(var id in newClientPositions) {
							if(newClientPositions.hasOwnProperty(id)) {
								var pos = newClientPositions[id];

								if(!clients.hasOwnProperty(id)) {
									var e = document.createElement('div');
									e.className = 'cursor';
									var l = document.createElement('div');
									l.textContent = randomName();
									e.appendChild(l);
									e.style.left = Math.round(pos[0] * 1000) / 10 + '%';
									e.style.top = Math.round(pos[1] * 1000) / 10 + '%';
									document.body.appendChild(e);
									var client = new Cursor(e);
									clients[id] = client;
								}
							}
						}
						break;
					default:
						console.error('Unknown message type:', type);
				}
			} else {
				console.error('Message of invalid type:', message);
			}
		});
	}

	var isTouch = false;

	window.addEventListener('touchstart', function (evt) {
		isTouch = true;
	});

	window.addEventListener('mousemove', function (evt) {
		if(isTouch) {
			posKnown = false;
		} else {
			posKnown = true;
			mouseX = evt.clientX / window.innerWidth;
			mouseY = evt.clientY / window.innerHeight;

			if(!socket) {
				createSocket();
			}
		}

		isTouch = false;
	});

	window.addEventListener('mouseout', function (evt) {
		posKnown = false;
	});

	function reportPos() {
		if(!socket || socket.readyState !== WebSocket.OPEN) {
			return;
		}

		let buffer;
		if(posKnown) {
			buffer = new ArrayBuffer(5);
			var data = new DataView(buffer);
			data.setUint8(0, TYPE_POS);
			data.setUint16(1, clamp(65535 * mouseX, 0, 65535));
			data.setUint16(3, clamp(65535 * mouseY, 0, 65535));
		} else {
			buffer = new ArrayBuffer(1);
			var data = new DataView(buffer);
			data.setUint8(0, TYPE_NOPOS);
		}
		socket.send(buffer);
	}
})(window, document);
