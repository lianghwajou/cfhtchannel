const debug = require('debug')('app:context');
const { Dialog } = require('./dialog');

class Context {

	data;

	// obj is json
	constructor (key, value) {
		if (value) {
			// JSON has no type info so we rehydrate manually
			this.data = JSON.parse(value).data;
			if (this.data.obj.dialog) {
				this.data.obj.dialog = new Dialog(this.data.obj.dialog);
			}
		} else {
			this.data = {};
			this.data.obj = {};
			this.data.key = key;
		}
	}

	get key() {
		return this.data.key;
	}

	getProp (prop) {
		debug(`get prop:${prop} this.data.obj:`,this.data.obj);
		return this.data.obj[prop];
	}

	setProp (prop, value) {
		this.data.obj[prop] = value;
		debug(`set prop:${prop} this.data.obj:`,this.data.obj);
	}

	// toJSON() {
	// 	return JSON.stringify(this.data);
	// }
}

exports.Context = Context;