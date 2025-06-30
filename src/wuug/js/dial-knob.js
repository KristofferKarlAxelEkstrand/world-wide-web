class DialKnob extends HTMLElement {
	static observedAttributes = ['min', 'max', 'step', 'value'];

	#dragging = false;
	#min = 0;
	#max = 100;
	#step = 1;
	#value = 50;
	#settingGroup = this.getAttribute('setting-group') || 'x';
	#settingName = this.getAttribute('setting-name') || 'y';
	#svg = null;
	#svgDot = null;
	#startY = 0;
	#startValue = 0;
	#thereminApp = this.closest('wuug-app');

	constructor() {
		super();
		this.innerHTML = `
			<svg viewBox="0 0 128 128">
				<circle cx="64" cy="64" r="64" class="svg-knob"/>
				<circle id="dot" class="svg-knob-dot"
					cx="64"
					cy="24"
					r="10"
					fill="#fff"/>
			</svg>
		`;
		this.#svg = this.querySelector('svg');
		this.#svgDot = this.querySelector('#dot');
		this.#svg.addEventListener('mousedown', this.#onDown);
		this.#svg.addEventListener('touchstart', this.#onDown, { passive: false });
		this.#updateFromAttributes();
		this.#draw();
	}

	connectedCallback() {
		this.#updateFromAttributes();
		this.#draw();
	}

	disconnectedCallback() {
		this.#svg.removeEventListener('mousedown', this.#onDown);
		this.#svg.removeEventListener('touchstart', this.#onDown);
		window.removeEventListener('mousemove', this.#onMove);
		window.removeEventListener('mouseup', this.#onUp);
		window.removeEventListener('touchmove', this.#onMove);
		window.removeEventListener('touchend', this.#onUp);
	}

	attributeChangedCallback() {
		this.#updateFromAttributes();
		this.#draw();
	}

	#updateFromAttributes() {
		this.#min = Number(this.getAttribute('min')) ?? 0;
		this.#max = Number(this.getAttribute('max')) ?? 100;
		this.#step = Number(this.getAttribute('step')) ?? 1;
		this.#settingGroup = this.getAttribute('setting-group') || 'vibrato';
		this.#settingName = this.getAttribute('setting-name') || 'frequency';
		this.#value = this.hasAttribute('value') ? Number(this.getAttribute('value')) : this.#value;
	}

	set value(val) {
		const v = Math.min(this.#max, Math.max(this.#min, Number(val)));
		if (v !== this.#value) {
			this.#value = v;
			this.setAttribute('value', v);
			this.#draw();
			this.dispatchEvent(new CustomEvent('change', { detail: { value: this.#value } }));
			this.#thereminApp.updateSetting({
				group: this.#settingGroup,
				name: this.#settingName,
				value: this.#value,
			});
		}
	}
	get value() {
		return this.#value;
	}

	#onDown = (e) => {
		e.preventDefault();
		this.#dragging = true;
		this.#startY = (e.touches ? e.touches[0] : e).clientY;
		this.#startValue = this.value;
		window.addEventListener('mousemove', this.#onMove);
		window.addEventListener('mouseup', this.#onUp);
		window.addEventListener('touchmove', this.#onMove, { passive: false });
		window.addEventListener('touchend', this.#onUp);
	};

	#onMove = (e) => {
		if (!this.#dragging) return;
		const y = (e.touches ? e.touches[0] : e).clientY;
		let v = this.#startValue + ((this.#startY - y) / 150) * (this.#max - this.#min);
		v = Math.round(v / this.#step) * this.#step;
		v = Math.max(this.#min, Math.min(this.#max, v));
		this.value = v;
	};

	#onUp = () => {
		this.#dragging = false;
		window.removeEventListener('mousemove', this.#onMove);
		window.removeEventListener('mouseup', this.#onUp);
		window.removeEventListener('touchmove', this.#onMove);
		window.removeEventListener('touchend', this.#onUp);
	};

	#draw() {
		const t = (this.value - this.#min) / (this.#max - this.#min || 1);
		const angle = -135 + t * 270;
		this.#svgDot.setAttribute('transform', `rotate(${angle} 64 64)`);
	}
}
customElements.define('dial-knob', DialKnob);
