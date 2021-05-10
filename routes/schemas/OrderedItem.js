var Product = require('./Product');

class OrderedItem {
	constructor() {
		this._id = '';
		this.product = '';
		this.quantity = 0;
	}		
}

module.exports = OrderedItem;