import './styles.scss';
import Cart from './js/cart.js';
const cart = new Cart();
console.log(cart.getProducts());

const products = [
	{
		sku: 'AK1',
		name: 'Product 1',
		price: 19.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is a great product.',
	},
	{
		sku: 'AK2',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK3',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK4',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK5',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK6',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK7',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
	{
		sku: 'AK8',
		name: 'Product 2',
		price: 29.99,
		image: 'https://via.placeholder.com/150',
		description: 'This is another great product.',
	},
];

class ProductCardList extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		this.render();
	}
	render() {
		this.innerHTML = `

				${products
					.map(
						(product) => `
					<product-card data-sku="${product.sku}">
						<picture>
							<img src="${product.image}" alt="${product.name}" width="200" height="200"/>
						</picture>
						<div class="content">
							<h2>${product.name}</h2>
							<p>Price: $${product.price.toFixed(2)}</p>
							<quantity-selector class="quantity-selector"></quantity-selector>
						</div>
					</product-card>
				`
					)
					.join('')}

		`;
	}
}

customElements.define('product-card-list', ProductCardList);

class ProductCard extends HTMLElement {
	constructor() {
		super();
	}
}
customElements.define('product-card', ProductCard);

class QuantitySelector extends HTMLElement {
	constructor() {
		super();
		this.innerHTML = `

			<div class="quantity-selector">
				<button type="button" class="quantity-decrease">-</button>
				<input class="quantity-input" type="number" value="0" min="0"/>
				<button type="button" class="quantity-increase">+</button>
				<button class="add-to-cart">Add to cart</button>
			</div>
		`;
	}

	connectedCallback() {
		const input = this.querySelector('.quantity-input');
		const decrease = this.querySelector('.quantity-decrease');
		const increase = this.querySelector('.quantity-increase');

		decrease.addEventListener('click', () => {
			let value = parseInt(input.value, 10);
			if (value > 0) input.value = value - 1;
		});

		increase.addEventListener('click', () => {
			let value = parseInt(input.value, 10);
			input.value = value + 1;
		});
	}
}
customElements.define('quantity-selector', QuantitySelector);
