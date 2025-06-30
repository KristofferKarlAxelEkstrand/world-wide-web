import './styles.scss';

function getNoteArray() {
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const notes = [];
	for (let midi = 12; midi <= 120; midi++) {
		const arrayIndex = midi - 12;
		const octave = Math.floor(midi / 12) - 1;
		const name = noteNames[midi % 12] + octave;
		const frequency = 440 * Math.pow(2, (midi - 69) / 12);
		notes.push({ arrayIndex, midi, name, frequency });
	}
	return notes;
}

class ThereminApp extends HTMLElement {
	#audioCtx = null;
	#oscillator = null;
	#gainNode = null;
	#notes = getNoteArray();

	#animationFrameId = null;

	#targetFreq = 0;
	#currentFreq = 0;

	#targetGain = 0;
	#currentGain = 0;

	#targetGainMapped = 0;
	#currentGainMapped = 0;

	#lfo = null;
	#lfoGain = null;

	#noteMatrix = this.querySelector('.note-matrix');

	#settings = null;

	constructor() {
		super();

		this.#settings = {
			volume: {
				volume: 0.5,
			},
			range: {
				min: this.#notes[12],
				max: this.#notes[49],
			},
			rangeHz: {
				min: 0,
				max: 0,
			},
			smoothingFactors: {
				pitch: 0.2,
				gain: 0.2,
			},
			vibrato: {
				frequency: 6.7,
				amplitude: 3,
			},
			vibratoExpression: {
				frequency: 5,
				amplitude: 12.6,
			},
		};

		this.#targetFreq = (this.#settings.range.min.frequency + this.#settings.range.max.frequency) / 2;
		this.#currentFreq = (this.#settings.range.min.frequency + this.#settings.range.max.frequency) / 2;
	}

	connectedCallback() {
		this.#updateRange();
		this.#updateNoteMatrix();

		this.thereminXYPad = this.querySelector('.theremin-xy-pad');
		this.indicator = this.querySelector('.indicator');

		this.thereminXYPad.addEventListener('mousedown', this.#handleMouseDown);
		window.addEventListener('mouseup', this.#handleMouseUp);

		this.thereminXYPad.addEventListener('touchstart', this.#handleTouchStart, { passive: false });
		window.addEventListener('touchend', this.#handleTouchEnd);

		this.#animationFrameId = requestAnimationFrame(this.#animate);
	}

	connectedCallback() {
		this.#updateRange();
		this.#updateNoteMatrix();

		this.thereminXYPad = this.querySelector('.theremin-xy-pad');
		this.indicator = this.querySelector('.indicator');

		this.thereminXYPad.addEventListener('mousedown', this.#handleMouseDown);
		window.addEventListener('mouseup', this.#handleMouseUp);

		this.#animationFrameId = requestAnimationFrame(this.#animate);
	}

	disconnectedCallback() {
		this.thereminXYPad?.removeEventListener('mousedown', this.#handleMouseDown);
		this.thereminXYPad?.removeEventListener('mousemove', this.#handleMouseMove);
		this.thereminXYPad?.removeEventListener('touchstart', this.#handleTouchStart);
		this.thereminXYPad?.removeEventListener('touchmove', this.#handleTouchMove);
		window.removeEventListener('mousemove', this.#handleMouseMove);
		window.removeEventListener('mouseup', this.#handleMouseUp);
		window.removeEventListener('touchmove', this.#handleTouchMove);
		window.removeEventListener('touchend', this.#handleTouchEnd);
		this.#stopOscillator();
		cancelAnimationFrame(this.#animationFrameId);
	}

	updateSetting({ value, group, name }) {
		if (!this.#settings.hasOwnProperty(group)) {
			this.#settings[group] = {};
		}
		if (!this.#settings[group].hasOwnProperty(name)) {
			this.#settings[group][name] = value;
		}
		this.#settings[group][name] = value;
	}

	#setupLFO() {
		if (!this.#audioCtx) return;
		this.#lfo = this.#audioCtx.createOscillator();
		this.#lfoGain = this.#audioCtx.createGain();

		const vibrato = this.#settings.vibrato;
		this.#lfo.type = 'sine';
		this.#lfo.frequency.value = vibrato.frequency;
		this.#lfoGain.gain.value = vibrato.amplitude * 50;

		this.#lfo.connect(this.#lfoGain);
		this.#lfoGain.connect(this.#oscillator.frequency);
		this.#lfo.start();
	}

	#stopLFO() {
		if (this.#lfo) {
			this.#lfo.stop();
			this.#lfo.disconnect();
			this.#lfo = null;
		}
		if (this.#lfoGain) {
			this.#lfoGain.disconnect();
			this.#lfoGain = null;
		}
	}

	#startOscillator() {
		if (this.#oscillator) return;
		this.#oscillator = this.#audioCtx.createOscillator();
		this.#oscillator.frequency.value = this.#currentFreq;
		this.#gainNode = this.#audioCtx.createGain();
		this.#oscillator.type = 'sawtooth';
		this.#oscillator.connect(this.#gainNode);
		this.#gainNode.connect(this.#audioCtx.destination);
		this.#gainNode.gain.value = 0;

		this.#oscillator.start();
		this.#setupLFO();
	}

	#stopOscillator() {
		if (!this.#oscillator) return;
		this.#stopLFO();
		this.#oscillator.stop();
		this.#oscillator.disconnect();
		this.#gainNode.disconnect();
		this.#oscillator = null;
		this.#gainNode = null;
	}

	#linearInterpolation = (a, b, t) => a + (b - a) * t;

	#updateNoteMatrix = () => {
		if (this.#noteMatrix) {
			const minMidi = this.#settings.range.min.midi;
			const maxMidi = this.#settings.range.max.midi;

			const notesInRange = this.#notes.filter((n) => n.midi >= minMidi && n.midi <= maxMidi);
			this.#noteMatrix.innerHTML = notesInRange.map((n) => `<div class="note" data-midi="${n.midi}" data-note="${n.name}" ></div>`).join('');
		}
	};

	#animate = () => {
		if (this.#oscillator && this.#gainNode) {
			this.#currentFreq = this.#linearInterpolation(this.#currentFreq, this.#targetFreq, 1 - this.#settings.smoothingFactors.pitch);
			this.#currentGain = this.#linearInterpolation(this.#currentGain, this.#targetGain, 1 - this.#settings.smoothingFactors.gain);

			this.#currentGainMapped = this.#linearInterpolation(this.#currentGainMapped, this.#targetGainMapped, 1 - this.#settings.smoothingFactors.gain);

			const mixRatio = this.#currentGain <= 0.7 ? 0 : (this.#currentGain - 0.7) / 0.3;

			const vibratoFreq = this.#settings.vibrato.frequency * (1 - mixRatio) + this.#settings.vibratoExpression.frequency * mixRatio;
			const vibratoAmplitude = this.#settings.vibrato.amplitude * (1 - mixRatio) + this.#settings.vibratoExpression.amplitude * mixRatio;

			if (this.#lfo && this.#lfoGain) {
				this.#lfo.frequency.setTargetAtTime(vibratoFreq, this.#audioCtx.currentTime, 0.05);
				this.#lfoGain.gain.setTargetAtTime(vibratoAmplitude, this.#audioCtx.currentTime, 0.05);
			}

			this.#oscillator.frequency.setTargetAtTime(this.#currentFreq, this.#audioCtx.currentTime, 0.05);

			this.#gainNode.gain.setTargetAtTime(this.#currentGainMapped * this.#settings.volume.volume, this.#audioCtx.currentTime, 0.05);
		}
		this.#updateIndicator();
		this.#animationFrameId = requestAnimationFrame(this.#animate);
	};

	#updateRange = () => {
		const minNoteIdx = this.#settings.range.min.arrayIndex;
		const maxNoteIdx = this.#settings.range.max.arrayIndex;
		const minIdx = Math.max(0, minNoteIdx - 1);
		const maxIdx = Math.min(this.#notes.length - 1, maxNoteIdx + 1);
		this.#settings.rangeHz.min = (this.#notes[minIdx].frequency + this.#notes[minNoteIdx].frequency) / 2;
		this.#settings.rangeHz.max = (this.#notes[maxNoteIdx].frequency + this.#notes[maxIdx].frequency) / 2;
	};

	#updateTarget = (x, y, width, height) => {
		this.#targetFreq = this.#settings.rangeHz.min + (x / width) * (this.#settings.rangeHz.max - this.#settings.rangeHz.min);

		const minGain = 0.01,
			maxGain = 1.0;
		this.#targetGain = maxGain - (y / height) * (maxGain - minGain);

		if (this.#targetGain > 0.6) {
			this.#targetGainMapped = 1;
		} else if (this.#targetGain > 0.15) {
			this.#targetGainMapped = (this.#targetGain - 0.15) / (0.6 - 0.15);
		} else {
			this.#targetGainMapped = 0;
		}
	};

	#handleMouseMove = (e) => {
		const rect = this.thereminXYPad.getBoundingClientRect();

		let x = e.clientX - rect.left;
		if (x < 0) x = 0;
		if (x > rect.width) x = rect.width;

		let y = e.clientY - rect.top;
		if (y < 0) y = 0;
		if (y > rect.height) y = rect.height;

		this.#updateTarget(x, y, rect.width, rect.height);
	};

	#handleTouchMove = (e) => {
		if (!e.touches || e.touches.length === 0) return;
		const touch = e.touches[0];
		const rect = this.thereminXYPad.getBoundingClientRect();

		let x = touch.clientX - rect.left;
		if (x < 0) x = 0;
		if (x > rect.width) x = rect.width;

		let y = touch.clientY - rect.top;
		if (y < 0) y = 0;
		if (y > rect.height) y = rect.height;

		this.#updateTarget(x, y, rect.width, rect.height);
	};

	#handleTouchStart = (e) => {
		if (!this.#audioCtx) {
			const AudioCtx = window.AudioContext || window['webkitAudioContext'];
			this.#audioCtx = new AudioCtx();
			this.#startOscillator();
		} else if (this.#audioCtx.state === 'suspended') {
			this.#audioCtx.resume();
		}
		this.thereminXYPad.addEventListener('touchmove', this.#handleTouchMove, { passive: false });
		window.addEventListener('touchmove', this.#handleTouchMove, { passive: false });
		this.#handleTouchMove(e);
	};

	#handleTouchEnd = () => {
		this.thereminXYPad.removeEventListener('touchmove', this.#handleTouchMove);
		window.removeEventListener('touchmove', this.#handleTouchMove);
	};

	#updateIndicator() {
		const minGain = 0,
			maxGain = 1.0;
		const area = this.thereminXYPad;
		const indicator = this.indicator;

		if (!area || !indicator) return;
		const width = area.clientWidth;
		const height = area.clientHeight;

		const x = ((this.#currentFreq - this.#settings.rangeHz.min) / (this.#settings.rangeHz.max - this.#settings.rangeHz.min)) * width;
		const y = ((maxGain - this.#currentGain) / (maxGain - minGain)) * height;

		indicator.style.left = `${x}px`;
		indicator.style.top = `${y}px`;
	}

	disconnectedCallback() {
		this.thereminXYPad?.removeEventListener('mousedown', this.#handleMouseDown);
		this.thereminXYPad?.removeEventListener('mousemove', this.#handleMouseMove);
		window.removeEventListener('mousemove', this.#handleMouseMove);
		window.removeEventListener('mouseup', this.#handleMouseUp);
		this.#stopOscillator();
		cancelAnimationFrame(this.#animationFrameId);
	}

	#handleMouseDown = (e) => {
		if (!this.#audioCtx) {
			const AudioCtx = window.AudioContext || window['webkitAudioContext'];
			this.#audioCtx = new AudioCtx();
			this.#startOscillator();
		} else if (this.#audioCtx.state === 'suspended') {
			this.#audioCtx.resume();
		}
		this.thereminXYPad.addEventListener('mousemove', this.#handleMouseMove);
		window.addEventListener('mousemove', this.#handleMouseMove);
		this.#handleMouseMove(e);
	};

	#handleMouseUp = () => {
		this.thereminXYPad.removeEventListener('mousemove', this.#handleMouseMove);
		window.removeEventListener('mousemove', this.#handleMouseMove);
	};
}

customElements.define('theremin-app', ThereminApp);

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
	#thereminApp = this.closest('theremin-app');

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
