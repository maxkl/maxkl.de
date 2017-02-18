/**
 * Copyright: (c) 2017 Max Klein
 * License: MIT
 */

const WebSocket = require('ws');

const REFRESH_INTERVAL = 100;
const TIMEOUT = 5000;

const TYPE_TELLID = 1;
const TYPE_POS = 2;
const TYPE_NOPOS = 3;
const TYPE_UPDATE = 4;

function Client(id, socket) {
	this.socket = socket;
	this.id = id;
	this.lastUpdate = Date.now();
	this.posKnown = false;
	this.x = 0;
	this.y = 0;
}

module.exports = function (app, db) {
	const wss = new WebSocket.Server({
		server: app.get('server'),
		path: '/mice'
	});

	let nextId = 0;
	const clients = [];

	let interval = null;

	wss.on('connection', function (socket) {
		const client = new Client(nextId, socket);
		nextId++;

		clients.push(client);

		// console.log('connected:', client.id);

		socket.on('close', function (code, reason) {
			// console.log('disconnected:', client.id, code, reason);
			const index = clients.indexOf(client);
			if(index !== -1) {
				clients.splice(index, 1);
			} else {
				console.error('Client not in clients array:', client.id, clients);
			}

			if(clients.length === 0) {
				clearInterval(interval);
				interval = null;
			}
		});

		socket.on('error', function (err) {
			console.error(err);
		});

		socket.on('message', function (message) {
			// console.log('update by ' + client.id + ':', message);

			client.lastUpdate = Date.now();
			if(Buffer.isBuffer(message)) {
				if(message.length < 1) {
					console.error('Empty message by', client.id);
					return;
				}

				const type = message.readUInt8(0);
				switch(type) {
					case TYPE_POS:
						if(message.length < 5) {
							console.error('Invalid message length:', message);
							return;
						}

						client.posKnown = true;
						client.x = message.readUInt16BE(1);
						client.y = message.readUInt16BE(3);
						break;
					case TYPE_NOPOS:
						if(message.length !== 1) {
							console.error('Invalid message length:', message);
							return;
						}

						client.posKnown = false;
						break;
					default:
						console.error('Unknown message type:', type);
				}
			}
		});

		var message = Buffer.alloc(3);
		message.writeUInt8(TYPE_TELLID, 0);
		message.writeUInt16BE(client.id, 1);
		socket.send(message);

		if(interval === null) {
			interval = setInterval(update, REFRESH_INTERVAL);
		}
	});

	function update() {
		const data = [];
		for(let i = 0; i < clients.length; i++) {
			const client = clients[i];
			if(client.posKnown) {
				data.push([
					client.id,
					client.x,
					client.y
				]);
			}
		}

		const message = Buffer.alloc(1 + data.length * 6);
		message.writeUInt8(TYPE_UPDATE, 0);
		let offset = 1;
		for(let i = 0; i < data.length; i++) {
			const item = data[i];
			message.writeUInt16BE(item[0], offset);
			offset += 2;
			message.writeUInt16BE(item[1], offset);
			offset += 2;
			message.writeUInt16BE(item[2], offset);
			offset += 2;
		}

		// console.log('update:', message);

		for(let i = 0; i < clients.length; i++) {
			const client = clients[i];

			if(Date.now() - client.lastUpdate > TIMEOUT) {
				client.posKnown = false;
			}

			client.socket.send(message);
		}
	}
};
