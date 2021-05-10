var User = require('./User');

class Order {
	constructor() {
		this._id = '';
		this.orderItems = [];
		this.shippingAddress1 = '';
		this.shippingAddress2 = '';
		this.city = '';
		this.zip = '';
		this.country = '';
		this.phone = '';
		this.status = '';
		this.totalPrice = 0;
		this.user = '';
		this.dateOrdered = new Date();
	}
}