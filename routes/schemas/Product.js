class Product {
	constructor() {
		this._id = '';
		this.name = '';
		this.description = '';
		this.richDescription = '';
		this.image = '';
		this.images = [];
		this.brand = '';
		this.price = 0;
		this.category = '';
		this.countInStock = 0;
		this.rating = 0;
		this.isFeatured = false;
		this.dateCreated = new Date();
	}
}

module.exports = Product;