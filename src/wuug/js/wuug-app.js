import { getNoteArray } from './get-note-array.js';

class SpecialOscilator extends OscillatorNode {}

class WuugApp extends HTMLElement {
	constructor() {
		super();

		this.mainFrequency = 440;

		this.audioCtx = new (window.AudioContext || window?.webkitAudioContext)();

		// Oscillators

		this.oscillatorTwo = this.audioCtx.createOscillator();
		this.oscillatorSub = this.audioCtx.createOscillator();

		this.oscillatorOne = this.audioCtx.createOscillator();
		this.oscillatorOne.type = 'sawtooth';
		this.oscillatorOne.frequency.value = this.mainFrequency;
		this.oscillatorOneGain = this.audioCtx.createGain();
		this.oscillatorOneGain.gain.value = 0.5;
		this.oscillatorOne.connect(this.oscillatorOneGain);

		// Mixer
		this.mixer = this.audioCtx.createGain();
		this.mixer.gain.value = 0.75;

		// Filter
		this.filter = this.audioCtx.createBiquadFilter();
		this.filter.type = 'lowpass';
		this.filter.frequency.value = 1000;
		this.filter.Q.value = 1;

		// Amp (always on)
		this.amp = this.audioCtx.createGain();
		this.amp.gain.value = 1;

		// Connect nodes

		this.oscillatorOneGain.connect(this.mixer);
		this.mixer.connect(this.filter);
		this.filter.connect(this.amp);
		this.amp.connect(this.audioCtx.destination);

		// Start oscillators
		this.oscillatorOne.start();

		// State
		this.currentNote = null;
	}

	connectedCallback() {
		this.innerHTML = `
			<div class="controls">
				<button id="play">Play</button>
				<button id="stop">Stop</button>
			</div>
			<div class="note-display"></div>
		`;

		// MIDI support
		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then((midiAccess) => {
				for (let input of midiAccess.inputs.values()) {
					input.onmidimessage = (msg) => {
						const [status, data1, data2] = msg.data;
						const command = status & 0xf0;
						if (command === 0x90 && data2 > 0) {
							// note on
							const freq = 440 * Math.pow(2, (data1 - 69) / 12);
							this.mainFrequency = freq;
							this.openfilter();
						}
						if (command === 0x80 || (command === 0x90 && data2 === 0)) {
							// note off
							const stopButton = this.querySelector('#stop');
							this.closefilter();
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
			this.oscillatorOne.frequency.value = this.mainFrequency;
			if (this.currentNote !== null) {
				this.querySelector('.note-display').textContent = `Frequency: ${this.currentNote.toFixed(2)} Hz`;
			}
			requestAnimationFrame(animate);
		};
		animate();
	}

	openfilter() {
		this.currentNote = this.mainFrequency;

		// Envelope: quick attack, decay to sustain, release on stop
		const now = this.audioCtx.currentTime;
		const filterFreq = this.filter.frequency;
		filterFreq.cancelScheduledValues(now);
		filterFreq.setValueAtTime(200, now); // start value
		filterFreq.linearRampToValueAtTime(2000, now + 1); // attack
		filterFreq.linearRampToValueAtTime(1000, now + 0.3); // decay to sustain

		// Clear any pending release
		if (this.envelopeTimeout) clearTimeout(this.envelopeTimeout);
	}

	closefilter() {
		const now = this.audioCtx.currentTime;
		const filter = this.filter.frequency;
		filter.cancelScheduledValues(now);
		filter.setValueAtTime(filter.value, now);
		filter.linearRampToValueAtTime(200, now + 0.2); // release

		this.envelopeTimeout = setTimeout(() => {
			this.currentNote = null;
			this.querySelector('.note-display').textContent = '';
		}, 250);
	}
}

customElements.define('wuug-app', WuugApp);
