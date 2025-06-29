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
	_audioCtx = null;
	_oscillator = null;
	_gainNode = null;

	_notes = getNoteArray();

	_animationFrameId = null;
	_targetFreq = 440;
	_targetGain = 0;
	_targetGainMapped = 0;
	_currentFreq = 440;
	_currentGain = 0;
	_currentGainMapped = 0;

	_lfo = null;
	_lfoGain = null;

	setupLFO() {
		if (!this._audioCtx) return;
		this._lfo = this._audioCtx.createOscillator();
		this._lfoGain = this._audioCtx.createGain();

		const vibrato = this._settings.vibrato.base;
		this._lfo.type = 'sine';
		this._lfo.frequency.value = vibrato.frequency;
		this._lfoGain.gain.value = vibrato.amplitude * 50;

		this._lfo.connect(this._lfoGain);
		this._lfoGain.connect(this._oscillator.frequency);
		this._lfo.start();
	}

	stopLFO() {
		if (this._lfo) {
			this._lfo.stop();
			this._lfo.disconnect();
			this._lfo = null;
		}
		if (this._lfoGain) {
			this._lfoGain.disconnect();
			this._lfoGain = null;
		}
	}

	startOscillator() {
		if (this._oscillator) return;
		this._oscillator = this._audioCtx.createOscillator();
		this._gainNode = this._audioCtx.createGain();
		this._oscillator.type = 'sawtooth';
		this._oscillator.connect(this._gainNode);
		this._gainNode.connect(this._audioCtx.destination);
		this._gainNode.gain.value = 0;
		this._oscillator.start();
		this.setupLFO();
	}

	// Override stopOscillator to clean up LFO
	stopOscillator() {
		if (!this._oscillator) return;
		this.stopLFO();
		this._oscillator.stop();
		this._oscillator.disconnect();
		this._gainNode.disconnect();
		this._oscillator = null;
		this._gainNode = null;
	}

	constructor() {
		super();

		this._settings = {
			range: {
				min: this._notes[12],
				max: this._notes[48],
			},
			smoothingFactors: {
				frequency: 0.2,
				gain: 0.2,
			},
			vibrato: {
				base: {
					frequency: 5,
					amplitude: 2,
				},
				expression: {
					frequency: 6,
					amplitude: 5,
				},
			},
		};

		this.innerHTML = `
			<div class="theremin-settings">
				<div class="theremin-settings-group">
					Volume
					<div>
					Speed
					<dial-knob min="0" max="100" value="50" step="1" sizeRem="2"></dial-knob>

					</div>
				</div>
				<div class="theremin-settings-group">
					Vibrato
					<div>
					Speed
<dial-knob min="0" max="100" value="50" step="1" sizeRem="2"></dial-knob>
					</div>

										<div>
					Depth 
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value="0.5"
						style="width: 120px;"
						aria-label="Volume"
						oninput="this.getRootNode().host._targetGain = parseFloat(this.value)"
					/>
					</div>
				</div>
				<div class="theremin-settings-group">
					Range
				</div>

				<div class="theremin-settings-buttons">

					<button class="fullscreen-button">

				</div>



			</div>
			<div class="theremin-xy-pad">

				<div class="note-matrix"></div>
				<div class="indicator"></div>
			</div>
		`;
	}

	linearInterpolation = (a, b, t) => a + (b - a) * t;

	connectedCallback() {
		// Render note matrix based on settings.range.min and settings.range.max
		const noteMatrix = this.querySelector('.note-matrix');
		if (noteMatrix) {
			const minMidi = this._settings.range.min.midi;
			const maxMidi = this._settings.range.max.midi;
			const notesInRange = this._notes.filter((n) => n.midi >= minMidi && n.midi <= maxMidi);
			noteMatrix.innerHTML = notesInRange.map((n) => `<div class="note" data-midi="${n.midi}" data-note="${n.name}" >${n.name}</div>`).join('');
		}

		console.log('ThereminApp notes:', this._notes);

		this.thereminXYPad = this.querySelector('.theremin-xy-pad');
		this.indicator = this.querySelector('.indicator');

		this.thereminXYPad.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);

		this._animationFrameId = requestAnimationFrame(this.animate);
	}

	animate = () => {
		if (this._oscillator && this._gainNode) {
			this._currentFreq = this.linearInterpolation(this._currentFreq, this._targetFreq, 0.2);
			this._currentGain = this.linearInterpolation(this._currentGain, this._targetGain, 0.2);

			this._currentGainMapped = this.linearInterpolation(this._currentGainMapped, this._targetGainMapped, 0.2);

			if (this._lfo && this._lfoGain) {
				this._lfo.frequency.setTargetAtTime(this._settings.vibrato.base.frequency, this._audioCtx.currentTime, 0.05);
				this._lfoGain.gain.setTargetAtTime(this._settings.vibrato.base.amplitude, this._audioCtx.currentTime, 0.05);
			}

			this._oscillator.frequency.setTargetAtTime(this._currentFreq, this._audioCtx.currentTime, 0.05);

			this._gainNode.gain.setTargetAtTime(this._currentGainMapped, this._audioCtx.currentTime, 0.05);
		}
		this.updateIndicator();
		this._animationFrameId = requestAnimationFrame(this.animate);
	};

	_updateTarget = (x, y, width, height) => {
		const minFreq = this._settings.range.min.frequency,
			maxFreq = this._settings.range.max.frequency;

		this._targetFreq = minFreq + (x / width) * (maxFreq - minFreq);

		const minGain = 0.01,
			maxGain = 1.0;
		this._targetGain = maxGain - (y / height) * (maxGain - minGain);

		if (this._targetGain > 0.6) {
			this._targetGainMapped = 1;
		} else if (this._targetGain > 0.15) {
			this._targetGainMapped = (this._targetGain - 0.15) / (0.6 - 0.15);
		} else {
			this._targetGainMapped = 0;
		}
	};

	handleMouseMove = (e) => {
		const rect = this.thereminXYPad.getBoundingClientRect();

		let x = e.clientX - rect.left;
		if (x < 0) x = 0;
		if (x > rect.width) x = rect.width;

		let y = e.clientY - rect.top;
		if (y < 0) y = 0;
		if (y > rect.height) y = rect.height;

		console.log(x, y, rect.height, rect.width);
		this._updateTarget(x, y, rect.width, rect.height);
	};

	updateIndicator() {
		const minFreq = this._settings.range.min.frequency,
			maxFreq = this._settings.range.max.frequency;
		const minGain = 0,
			maxGain = 1.0;
		const area = this.thereminXYPad;
		const indicator = this.indicator;

		if (!area || !indicator) return;
		const width = area.clientWidth;
		const height = area.clientHeight;

		const x = ((this._currentFreq - minFreq) / (maxFreq - minFreq)) * width;
		const y = ((maxGain - this._currentGain) / (maxGain - minGain)) * height;

		indicator.style.left = `${x}px`;
		indicator.style.top = `${y}px`;
	}

	disconnectedCallback() {
		this.thereminXYPad?.removeEventListener('mousedown', this.handleMouseDown);
		this.thereminXYPad?.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
		this.stopOscillator();
		cancelAnimationFrame(this._animationFrameId);
	}

	handleMouseDown = (e) => {
		console.log('Mouse down on theremin area', e, this._settings);

		if (!this._audioCtx) {
			const AudioCtx = window.AudioContext || window['webkitAudioContext'];
			this._audioCtx = new AudioCtx();
			this.startOscillator();
		} else if (this._audioCtx.state === 'suspended') {
			this._audioCtx.resume();
		}
		this.thereminXYPad.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mousemove', this.handleMouseMove);
		this.handleMouseMove(e);
	};

	handleMouseUp = () => {
		this.thereminXYPad.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
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
	#svg = null;
	#svgDot = null;
	#startY = 0;
	#startValue = 0;

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
		this.#value = this.hasAttribute('value') ? Number(this.getAttribute('value')) : this.#value;
	}

	set value(val) {
		const v = Math.min(this.#max, Math.max(this.#min, Number(val)));
		if (v !== this.#value) {
			this.#value = v;
			this.setAttribute('value', v);
			this.#draw();
			this.dispatchEvent(new CustomEvent('change', { detail: { value: this.#value } }));
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
