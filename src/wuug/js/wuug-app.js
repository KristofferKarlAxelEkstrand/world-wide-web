import { getNoteArray } from './get-note-array.js';

class SpecialOscilator extends OscillatorNode {}

class WuugApp extends HTMLElement {
	constructor() {
		super();

		this.mainFrequency = 440;

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
		this.oscillatorTwoGain.connect(this.mixer);

		this.mixer.connect(this.filter);
		this.filter.connect(this.amp);
		this.amp.connect(this.audioCtx.destination);

		// Start oscillators
		this.oscillatorOne.start();
		this.oscillatorTwo.start();

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
		this.heldNotes = new Set();
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
							if (!this.heldNotes.has(data1)) {
								this.heldNotes.add(data1);
								if (this.heldNotes.size === 1) {
									this.openFilter();
								}
							}
						}
						if (command === 0x80 || (command === 0x90 && data2 === 0)) {
							// note off
							this.heldNotes.delete(data1);
							if (this.heldNotes.size === 0) {
								this.closeFilter();
							} else {
								// Optionally update frequency to another held note
								const nextNote = this.heldNotes.values().next().value;
								const freq = 440 * Math.pow(2, (nextNote - 69) / 12);
								this.mainFrequency = freq;
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
			this.oscillatorOne.frequency.value = this.mainFrequency;
			this.oscillatorTwo.frequency.value = this.mainFrequency + 1;
			if (this.currentNote !== null) {
				this.querySelector('.note-display').textContent = `Frequency: ${this.currentNote.toFixed(2)} Hz`;
			}
			requestAnimationFrame(animate);
		};
		animate();
	}

	openFilter() {
		this.currentNote = this.mainFrequency;

		const now = this.audioCtx.currentTime;
		const filterFreq = this.filter.frequency;
		filterFreq.cancelScheduledValues(now);
		filterFreq.setTargetAtTime(2000, now, 0.15); // smooth attack to 2000Hz
		filterFreq.setTargetAtTime(1000, now + 0.3, 0.2); // smooth decay to 1000Hz

		if (this.envelopeTimeout) clearTimeout(this.envelopeTimeout);
	}

	closeFilter() {
		const now = this.audioCtx.currentTime;
		const filterFreq = this.filter.frequency;
		filterFreq.cancelScheduledValues(now);
		filterFreq.setTargetAtTime(200, now, 0.15); // smooth release to 200Hz
	}
}

customElements.define('wuug-app', WuugApp);
