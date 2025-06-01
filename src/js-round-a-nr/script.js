import './styles.css';

customElements.define(
	'js-round',
	class extends HTMLElement {
		connectedCallback() {
			const key = 'keyToConnect';
			this.innerHTML = `
				<slider-value data-shared-key="${key}">50</slider-value>
				<input is="slider-element" data-shared-key="${key}" type="range" min="1" max="100" value="50" step="1">
			`;
		}
	}
);

class SliderElement extends HTMLInputElement {
	constructor() {
		super();
		this.addEventListener('input', this._onInput);
	}

	connectedCallback() {
		this._valueEl = this.closest('js-round')?.querySelector(`slider-value[data-shared-key="${this.getAttribute('data-shared-key')}"]`);
		this._updateValue();
	}

	_onInput = () => {
		this._updateValue();
	};

	_updateValue() {
		if (this._valueEl) {
			this._valueEl.textContent = parseInt(this.value, 10);
		}
	}
}

customElements.define('slider-element', SliderElement, { extends: 'input' });

customElements.define('slider-value', class extends HTMLElement {});
