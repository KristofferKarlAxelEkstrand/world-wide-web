class Cart {
	constructor() {
		this.cart = [];
	}

	addProduct(product) {
		this.cart.push(product);
	}

	getProducts() {
		return this.cart;
	}
}

export default Cart;
