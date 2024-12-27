class Site {
	constructor() {
		this._gridSizeHelper;
		this.updateScreenWidth = this.updateScreenWidth.bind(this);
		window.addEventListener('resize', this.updateScreenWidth);
		document.addEventListener('DOMContentLoaded', this.updateScreenWidth);
		this.updateScreenWidth(); // Call it initially to set up the initial value
	}

	set gridSizeHelper(value) {
		this._gridSizeHelper = value;
	}

	get gridSizeHelper() {
		return this._gridSizeHelper;
	}

	updateScreenWidth() {
		const screenWidth = window.innerWidth;
		const bodyWidth = document.body.clientWidth;
		const scrollbarWidth = screenWidth - bodyWidth;
		document.documentElement.style.setProperty(
			'--scrollbar-width',
			`${scrollbarWidth}px`
		);
		document.documentElement.style.setProperty(
			'--screen-width',
			`${bodyWidth}px`
		);
	}
}

const site = new Site();

export default site;
