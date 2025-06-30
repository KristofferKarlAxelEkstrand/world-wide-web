import { getNoteArray } from './get-note-array.js';

class SpecialOscilator extends OscillatorNode {}

class WuugApp extends HTMLElement {
	constructor() {
		super();

		this.mainFrequency = 440;

		this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

		// Oscillators
		this.oscillatorOne = this.audioCtx.createOscillator();
		this.oscillatorTwo = this.audioCtx.createOscillator();
		this.oscillatorSub = this.audioCtx.createOscillator();

		this.oscillatorOne.type = 'sine';
		this.oscillatorOne.frequency.value = this.mainFrequency;

		// Mixer
		this.mixer = this.audioCtx.createGain();
		this.mixer.gain.value = 1;

		// Filter
		this.filter = this.audioCtx.createBiquadFilter();
		this.filter.type = 'lowpass';
		this.filter.frequency.value = 2000;

		// Amp (always on)
		this.amp = this.audioCtx.createGain();
		this.amp.gain.value = 1; //

		// Connect nodes
		this.oscillatorOne.connect(this.mixer);
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
						}
					};
				}
			});
		} else {
			this.querySelector('.note-display').textContent = 'Web MIDI not supported';
		}

		const animate = () => {
			this.oscillatorOne.frequency.value = this.mainFrequency;
			if (this.currentNote !== null) {
				this.querySelector('.note-display').textContent = `Frequency: ${this.currentNote.toFixed(2)} Hz`;
			}
			requestAnimationFrame(animate);
		};
		animate();
	}
}

customElements.define('wuug-app', WuugApp);
