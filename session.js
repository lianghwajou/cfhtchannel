const debug = require('debug')('app:session');
const { createClient } = require('redis');
const { Context } = require('./context');
// session key is telegram user id
class Session {

	#client;
	#url;

	constructor (clientUrl) {
		this.#url = clientUrl;
	}

	async #connect() {
		if (!this.#client) {
			let client = createClient(clientUrl);
			client.on('error', (err) => debug('Redis Client Error', err));
			await client.connect();
			this.#client = client;
		}
	}

	async retrieve (key) {
		await this.#connect();
		return new Context(key, await this.#client.get(key));
	}

	async store (context) {
		await this.#connect();
		await this.#client.set(context.key, context.json());
	}
}

exports.Session = Session;
