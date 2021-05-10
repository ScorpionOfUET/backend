class User {
	constructor() {
		this._id = '';
		this.name = '';
		this.email = '';
		this.passwordHash = '';
		this.street = '';
		this.apartment = '';
		this.city = '';
		this.zip = '';
		this.country = '';
		this.phone = '';
		this.isAdmin = false;
	}
}

module.exports = User;