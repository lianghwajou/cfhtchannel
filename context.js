const debug = require('debug')('app:context');

class Context {

	#data;

	// obj is json
	constructor (key, obj) {
		if (obj) {
			this.#data = JSON.parse(obj)
		} else {
			this.#data = {};
			this.#data.obj = {};
			this.#data.key = key;
		}
	}

	get key() {
		return this.#data.key;
	}

	json () {
		return JSON.stringify(this.#data);
	}

	getProp (prop) {
		return this.#data.obj[prop];
	}

	setProp (prop, value) {
		this.#data.obj[prop] = value;
	}
}

exports.Context = Context;