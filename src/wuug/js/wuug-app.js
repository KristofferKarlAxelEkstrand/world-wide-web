class WuugApp extends HTMLElement {
	constructor() {
		super();

		this.state = {
			oscillators: {
				sub: {
					frequency: 440,
					type: 'sine',
					gain: 0.5,
					chaos: 0.1,
				},
				one: {
					frequency: 440,
					type: 'sawtooth',
					gain: 0.5,
					chaos: 0.1,
				},
				two: {
					frequency: 440,
					type: 'sawtooth',
					gain: 0.5,
					chaos: 0.1,
				},
			},
		};

		this.audioCtx = new (window.AudioContext || window['webkitAudioContext'])();

		// Oscillators

		this.oscillatorSub = this.audioCtx.createOscillator();

		/* ONE ----------------------------------------------- */

		/* Vars */
		this.oscillatorOne_TargetFrequency = 440;
		this.oscillatorOne_MainFrequency = 440;
		this.oscillatorOne_PitchValue = 0;
		this.oscillatorOne_FinePitchValue = 0;
		this.oscillatorOne_Unstable = 1;
		this.oscillatorOne_S_Gain = 0.5;

		/* Oscillator */
		this.oscillatorOne = this.audioCtx.createOscillator();
		this.oscillatorOne.type = 'sawtooth';
		this.oscillatorOne.frequency.value = this.oscillatorOne_MainFrequency;

		/* Gain */
		this.oscillatorOne_Gain = this.audioCtx.createGain();
		this.oscillatorOne_Gain.gain.value = 0.5;
		this.oscillatorOne.connect(this.oscillatorOne_Gain);

		/* TWO ----------------------------------------------- */

		/* Vars */
		this.oscillatorTwo_TargetFrequency = 440;
		this.oscillatorTwo_MainFrequency = 440;
		this.oscillatorTwo_PitchValue = 0;
		this.oscillatorTwo_FinePitchValue = 0;
		this.oscillatorTwo_Unstable = 1;
		this.oscillatorTwo_S_Gain = 0.5;

		/* Oscillator */
		this.oscillatorTwo = this.audioCtx.createOscillator();
		this.oscillatorTwo.type = 'sawtooth';
		this.oscillatorTwo.frequency.value = this.oscillatorTwo_MainFrequency;

		/* Gain */
		this.oscillatorTwo_Gain = this.audioCtx.createGain();
		this.oscillatorTwo_Gain.gain.value = 0.5;
		this.oscillatorTwo.connect(this.oscillatorTwo_Gain);

		/* Mixer ----------------------------------------------- */

		this.mixer = this.audioCtx.createGain();
		this.mixer.gain.value = 0.4;

		/* Mixer ----------------------------------------------- */

		this.filter = this.audioCtx.createBiquadFilter();
		this.filter.type = 'lowpass';
		this.filter.frequency.value = 1000;
		this.filter.Q.value = 1;

		/* AMP ----------------------------------------------- */

		this.amp = this.audioCtx.createGain();
		this.amp.gain.value = 1;

		// Oscillator start will be triggered after user interaction
		this.oscillatorsStarted = false;

		this.startOscillators = () => {
			if (!this.oscillatorsStarted) {
				this.oscillatorOne.start();
				this.oscillatorTwo.start();
				this.oscillatorsStarted = true;
			}
		};

		// State
		this.currentNote = null;
		this.waveShaperOscillators = this.audioCtx.createWaveShaper();
		this.waveShaperOscillators.curve = new Float32Array(256).map((_, i) => {
			const x = i / 128 - 1;
			return Math.tanh(1.2 * x); // softer soft clipping
		});
		this.waveShaperOscillators.oversample = '2x';

		this.waveShaperFilter = this.audioCtx.createWaveShaper();

		const curve = new Float32Array(256);
		for (let i = 0; i < 256; ++i) {
			const x = (i / 255) * 2 - 1;
			curve[i] = Math.tanh(0.7 * x); // softer curve
		}
		this.waveShaperFilter.curve = curve;
		this.waveShaperFilter.oversample = '2x';

		// Connect nodes

		this.oscillatorOne_Gain.connect(this.mixer);
		this.oscillatorTwo_Gain.connect(this.mixer);
		this.mixer.connect(this.waveShaperOscillators);
		this.waveShaperOscillators.connect(this.filter);
		this.filter.connect(this.waveShaperFilter);
		this.waveShaperFilter.connect(this.amp);
		this.amp.connect(this.audioCtx.destination);
	}

	#linearInterpolation = (a, b, t) => a + (b - a) * t;

	inputSetter(varName, value) {
		this[varName] = value;
	}

	connectedCallback() {
		window.addEventListener('pointerdown', this.resumeAndStart);
		window.addEventListener('keydown', this.resumeAndStart);

		const oscillatorControls = [
			{
				prefix: 'oscillatorOne',
				label: 'Oscillator 1',
			},
			{
				prefix: 'oscillatorTwo',
				label: 'Oscillator 2',
			},
		];

		const controlDefs = [
			{ key: 'PitchValue', min: -24, max: 24, value: 0, step: 1, label: 'Pitch' },
			{ key: 'FinePitchValue', min: -1, max: 1, value: 0, step: 0.01, label: 'Fine pitch' },
			{ key: 'S_Gain', min: 0, max: 1, value: 0.5, step: 0.01, label: 'Gain' },
			{ key: 'Unstable', min: 0, max: 300, value: 1, step: 0.01, label: 'Unstable' },
		];

		this.innerHTML = oscillatorControls
			.map(
				(osc) =>
					`<div class="oscillator-controls">
				${controlDefs.map((def) => `<wuug-nr-input data-variable="${osc.prefix}_${def.key}" min="${def.min}" max="${def.max}" value="${def.value}" step="${def.step}" label="${osc.label} ${def.label}"></wuug-nr-input>`).join('\n')}
			</div>`
			)
			.join('\n');

		this.heldNotes = new Set();
		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then((midiAccess) => {
				for (let input of midiAccess.inputs.values()) {
					input.onmidimessage = (msg) => {
						const [status, data1, data2] = msg.data;
						const command = status & 0xf0;
						if (command === 0x90 && data2 > 0) {
							const freq = 440 * Math.pow(2, (data1 - 69) / 12);

							this.oscillatorOne_TargetFrequency = freq * (1 + (Math.random() - 0.5) * 0.02);
							this.oscillatorTwo_TargetFrequency = freq * (1 + (Math.random() - 0.5) * 0.02);

							if (!this.heldNotes.has(data1)) {
								this.heldNotes.add(data1);
								if (this.heldNotes.size === 1) {
									this.openFilter();
								}
							}
						}
						if (command === 0x80 || (command === 0x90 && data2 === 0)) {
							this.heldNotes.delete(data1);
							if (this.heldNotes.size === 0) {
								this.closeFilter();
							} else {
								const nextNote = this.heldNotes.values().next().value;
								const freq = 440 * Math.pow(2, (nextNote - 69) / 12);
								this.oscillatorOne_TargetFrequency = freq * (1 + (Math.random() - 0.5) * 0.02);
								this.oscillatorTwo_TargetFrequency = freq * (1 + (Math.random() - 0.5) * 0.02);
							}
						}
					};
				}
			});
		} else {
			this.querySelector('.note-display').textContent = 'Web MIDI not supported';
		}

		this.envelopeTimeout = null;

		const animate = () => {
			this.oscillatorOne_MainFrequency = this.#linearInterpolation((this.oscillatorOne_MainFrequency += (Math.random() - 0.5) * this.oscillatorOne_Unstable), this.oscillatorOne_TargetFrequency, 0.9);
			this.oscillatorTwo_MainFrequency = this.#linearInterpolation((this.oscillatorTwo_MainFrequency += (Math.random() - 0.5) * this.oscillatorTwo_Unstable), this.oscillatorTwo_TargetFrequency, 0.9);

			const oscillatorOneTotalPitch = this.oscillatorOne_PitchValue + this.oscillatorOne_FinePitchValue;
			this.frequencyOscillatorOne = this.oscillatorOne_MainFrequency * Math.pow(2, oscillatorOneTotalPitch / 12);
			this.oscillatorOne.frequency.setTargetAtTime(this.frequencyOscillatorOne, this.audioCtx.currentTime, 0.01);
			this.oscillatorOne_Gain.gain.setTargetAtTime(this.oscillatorOne_S_Gain, this.audioCtx.currentTime, 0.01);

			const oscillatorTwoTotalPitch = this.oscillatorTwo_PitchValue + this.oscillatorTwo_FinePitchValue;
			this.frequencyOscillatorTwo = this.oscillatorTwo_MainFrequency * Math.pow(2, oscillatorTwoTotalPitch / 12);
			this.oscillatorTwo.frequency.setTargetAtTime(this.frequencyOscillatorTwo, this.audioCtx.currentTime, 0.01);
			this.oscillatorTwo_Gain.gain.setTargetAtTime(this.oscillatorTwo_S_Gain, this.audioCtx.currentTime, 0.01);

			requestAnimationFrame(animate);
		};
		animate();
	}

	resumeAndStart = () => {
		this.audioCtx.resume().then(() => {
			this.startOscillators();
		});
		window.removeEventListener('pointerdown', this.resumeAndStart);
		window.removeEventListener('keydown', this.resumeAndStart);
	};

	openFilter() {
		this.currentNote = this.oscillatorOne_MainFrequency;

		const now = this.audioCtx.currentTime;
		const filterFreq = this.filter.frequency;
		filterFreq.cancelScheduledValues(now);
		filterFreq.setTargetAtTime(2000, now, 0.05); // smooth attack to 2000Hz
		filterFreq.setTargetAtTime(400, now + 0.1, 0.05); // smooth decay to 1000Hz

		if (this.envelopeTimeout) clearTimeout(this.envelopeTimeout);
	}

	closeFilter() {
		const now = this.audioCtx.currentTime;
		const filterFreq = this.filter.frequency;
		filterFreq.cancelScheduledValues(now);
		filterFreq.setTargetAtTime(40, now, 0.1); // smooth release to 200Hz
	}
}

customElements.define('wuug-app', WuugApp);

class WuugNrInput extends HTMLElement {
	constructor() {
		super();
		this.wuug = this.closest('wuug-app');
	}

	connectedCallback() {
		const min = this.getAttribute('min') || '0';
		const max = this.getAttribute('max') || '100';
		const step = this.getAttribute('step') || '1';
		const value = this.getAttribute('value') || min;
		const label = this.getAttribute('label') || '';

		this.innerHTML = `
			<label class="wuug-nr-input-label">
				${label}
				<input class="wuug-nr-input-number" type="number" min="${min}" max="${max}" step="${step}" value="${value}">
			</label>
		`;

		const input = this.querySelector('.wuug-nr-input-number');
		input.addEventListener('input', (e) => {
			if (this.wuug && typeof this.wuug.inputSetter === 'function') {
				this.wuug.inputSetter(this.getAttribute('data-variable') || 'value', parseFloat(e.target.value));
			}
		});
	}

	static get observedAttributes() {
		return ['value'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'value') {
			const input = this.querySelector('.wuug-nr-input-number');
			if (input && input.value !== newValue) {
				input.value = newValue;
			}
		}
	}

	get value() {
		return this.getAttribute('value');
	}

	set value(val) {
		this.setAttribute('value', val);
	}
}

customElements.define('wuug-nr-input', WuugNrInput);
