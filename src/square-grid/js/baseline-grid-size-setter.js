import site from './site.js';

class BaselineGridSizeSetter extends HTMLElement {
	constructor() {
		super();
		this._connectedElements = [];
		this.handleResize = this.handleResize.bind(this);
		this.handlePageLoad = this.handlePageLoad.bind(this);
	}

	connectedCallback() {
		site.gridSizeHelper = this;
		window.addEventListener('resize', this.handleResize);
		document.addEventListener('DOMContentLoaded', this.handlePageLoad);
		this.handleResize();
	}

	disconnectedCallback() {
		window.removeEventListener('resize', this.handleResize);
	}

	handleResize() {
		const computed = getComputedStyle(this);
		const width = computed.width;
		const gridSize = parseFloat(width);

		console.log('resizesss', gridSize);

		this._connectedElements.forEach((e) => {
			e.gridSize = gridSize;
		});
	}

	handlePageLoad() {
		console.log('Page loaded');
		// Add your code here to handle the page load event
		this.handleResize(); // Optionally call handleResize to ensure initial setup
	}

	addConnectedElement(e) {
		this._connectedElements.push(e);
	}
}

customElements.define('baseline-grid-size-setter', BaselineGridSizeSetter);
