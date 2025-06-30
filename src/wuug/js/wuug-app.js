import { getNoteArray } from './get-note-array.js';

class SpecialOscilator extends OscillatorNode {}

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

		this.mainFrequency = 440;
		this.targetFrequency = 440;
		this.pitchValue = 0; // Default pitch multiplier

		this.audioCtx = new (window.AudioContext || window?.webkitAudioContext)();

		// Oscillators

		this.oscillatorSub = this.audioCtx.createOscillator();

		this.oscillatorOne = this.audioCtx.createOscillator();
		this.oscillatorOne.type = 'sawtooth';
		this.oscillatorOne.frequency.value = this.mainFrequency;
		this.oscillatorOneGain = this.audioCtx.createGain();
		this.oscillatorOneGain.gain.value = 0.5;
		this.oscillatorOne.connect(this.oscillatorOneGain);

		this.oscillatorTwo = this.audioCtx.createOscillator();
		this.oscillatorTwo.type = 'sawtooth';
		this.oscillatorTwo.frequency.value = this.mainFrequency;
		this.oscillatorTwoGain = this.audioCtx.createGain();
		this.oscillatorTwoGain.gain.value = 0.5;
		this.oscillatorTwo.connect(this.oscillatorTwoGain);

		// Mixer
		this.mixer = this.audioCtx.createGain();
		this.mixer.gain.value = 0.4;

		// Filter
		this.filter = this.audioCtx.createBiquadFilter();
		this.filter.type = 'lowpass';
		this.filter.frequency.value = 1000;
		this.filter.Q.value = 1;

		// Amp (always on)
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
		// Even softer tube distortion curve
		const curve = new Float32Array(256);
		for (let i = 0; i < 256; ++i) {
			const x = (i / 255) * 2 - 1;
			curve[i] = Math.tanh(0.7 * x); // softer curve
		}
		this.waveShaperFilter.curve = curve;
		this.waveShaperFilter.oversample = '2x';

		// Connect nodes

		this.oscillatorOneGain.connect(this.mixer);
		this.oscillatorTwoGain.connect(this.mixer);
		this.mixer.connect(this.waveShaperOscillators);
		this.waveShaperOscillators.connect(this.filter);
		this.filter.connect(this.waveShaperFilter);
		this.waveShaperFilter.connect(this.amp);
		this.amp.connect(this.audioCtx.destination);
	}

	#linearInterpolation = (a, b, t) => a + (b - a) * t;

	connectedCallback() {
		window.addEventListener('pointerdown', this.resumeAndStart);
		window.addEventListener('keydown', this.resumeAndStart);

		this.innerHTML = `
			<div class="controls">
				<button id="play">Play</button>
				<button id="stop">Stop</button>
			</div>
			<div class="oscillator-controls">
				<label>
					Pitch:
					<input type="range" id="osc1-pitch" min="-24" max="24" value="0" step="1">
					<span id="osc1-pitch-value">440</span> Hz
				</label>
				<label>
					Fine pitch:
					<input type="range" id="osc1-pitch-fine" min="-1" max="1" value="0" step="0.01">
					<span id="osc1-pitch-value">440</span> Hz
				</label>
				<label>
					Volume:
					<input type="range" id="osc1-volume" min="0" max="1" value="0.5" step="0.01">
					<span id="osc1-volume-value">0.5</span>
				</label>
			</div>
		`;

		// Sticky zero for pitch slider
		const osc1Pitch = this.querySelector('#osc1-pitch');
		osc1Pitch.addEventListener('input', (e) => {
			let value = parseFloat(e.target.value);
			// If near zero, snap to zero
			if (Math.abs(value) < 0.2) {
				value = 0;
				e.target.value = 0;
			}
			this.pitchValue = value;
			const adjustedFreq = this.mainFrequency * Math.pow(2, value / 12);
			this.querySelector('#osc1-pitch-value').textContent = adjustedFreq.toFixed(2);
		});

		const oscOnePitch = this.querySelector('#osc1-pitch');
		oscOnePitch.addEventListener('input', (e) => {
			const pitchValue = parseFloat(e.target.value); // This is already -12 to +12
			this.pitchValue = pitchValue; // Use directly, don't add 1

			// Calculate the actual frequency with the pitch offset
			const adjustedFreq = this.mainFrequency * Math.pow(2, this.pitchValue / 12);
		});

		// MIDI support
		this.heldNotes = new Set();
		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then((midiAccess) => {
				for (let input of midiAccess.inputs.values()) {
					input.onmidimessage = (msg) => {
						const [status, data1, data2] = msg.data;
						const command = status & 0xf0;
						if (command === 0x90 && data2 > 0) {
							const freq = 440 * Math.pow(2, (data1 - 69) / 12);

							this.targetFrequency = freq;

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
								this.targetFrequency = freq;
							}
						}
					};
				}
			});
		} else {
			this.querySelector('.note-display').textContent = 'Web MIDI not supported';
		}
		const playButton = this.querySelector('#play');
		const stopButton = this.querySelector('#stop');

		this.envelopeTimeout = null;

		const animate = () => {
			this.mainFrequency = this.#linearInterpolation(this.mainFrequency, this.targetFrequency, 0.9);

			this.frequencyOscillatorOne = this.mainFrequency * Math.pow(2, this.pitchValue / 12);
			this.oscillatorOne.frequency.setTargetAtTime(this.frequencyOscillatorOne, this.audioCtx.currentTime, 0.01);

			// Smoothly ramp oscillatorTwo's frequency to mainFrequency over 0.1 seconds
			this.oscillatorTwo.frequency.setTargetAtTime(this.mainFrequency, this.audioCtx.currentTime, 0.01);

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
		this.currentNote = this.mainFrequency;

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
