import site from './site.js';

class HeroText extends HTMLElement {
	constructor() {
		super();
	}

	static get observedAttributes() {
		return ['data-grid-size'];
	}

	connectedCallback() {
		console.log('HeroText connected');
		site.gridSizeHelper.addConnectedElement(this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'data-grid-size') {
			this.updateGridHeight(newValue);
		}
	}

	updateGridHeight(gridSize) {
		console.log('updateGridHeight', gridSize);
		const innerDiv = this.querySelector('div');

		const gridRowStart = 4;
		const contentHeight = innerDiv.scrollHeight;

		const rowSpan = Math.ceil(contentHeight / gridSize);
		this.style.setProperty('--grid-row-end', rowSpan + gridRowStart);
	}

	set gridSize(value) {
		this.setAttribute('data-grid-size', value);
	}
}

customElements.define('hero-text', HeroText);
