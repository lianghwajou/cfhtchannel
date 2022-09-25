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
			let client = createClient({url: this.#url});
			client.on('error', (err) => debug('Redis Client Error', err));
			await client.connect();
			this.#client = client;
			debug("Redis connected");
		}
	}

	async retrieve (key) {
		await this.#connect();
		let value = await this.#client.get(key);
		debug("retrieve key: %o value %o", key, value);
		return new Context(key, value);
	}

	async store (context) {
		await this.#connect();
		await this.#client.set(context.key, JSON.stringify(context));
		debug("store key: %o value %o", context.key, JSON.stringify(context));
	}
}

exports.Session = Session;
