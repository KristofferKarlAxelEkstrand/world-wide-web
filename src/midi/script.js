import './styles.css';

class MidiSynth {
	constructor() {
		this.activeOscillators = {};
		this.audioCtx = null;
		this.init();
	}

	async init() {
		if (!navigator.requestMIDIAccess) {
			console.log('Web MIDI API not supported in this browser');
			return;
		}
		try {
			const midiAccess = await navigator.requestMIDIAccess();
			this.handleMidiAccess(midiAccess);
		} catch {
			console.log('Could not access MIDI devices');
		}
	}

	handleMidiAccess(midiAccess) {
		const inputs = Array.from(midiAccess.inputs.values());
		if (inputs.length === 0) {
			console.log('No MIDI devices connected');
			return;
		}
		console.log('MIDI device(s) connected');
		inputs.forEach((input, idx) => {
			console.log(`Device ${idx + 1}: ${input.name} [id: ${input.id}]`);
		});

		// Use the first device by default
		this.setInput(inputs[2]);
	}

	setInput(input) {
		if (!input) return;
		console.log(`Using MIDI device: ${input.name}`);
		input.onmidimessage = this.handleMidiMessage.bind(this);
	}

	handleMidiMessage(message) {
		const [status, note, velocity] = message.data;
		if (this.isNoteOn(status, velocity)) {
			this.noteOn(note);
		} else if (this.isNoteOff(status, velocity)) {
			this.noteOff(note);
		}
	}

	isNoteOn(status, velocity) {
		return (status & 0xf0) === 0x90 && velocity > 0;
	}

	isNoteOff(status, velocity) {
		return (status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0);
	}

	noteOn(note) {
		// Stop any existing oscillator for this note before starting a new one
		if (this.activeOscillators[note]) {
			this.stopBeep(this.activeOscillators[note]);
			delete this.activeOscillators[note];
		}
		this.activeOscillators[note] = this.playBeep(note);
		console.log(`Note on: ${note}`);
	}

	noteOff(note) {
		if (this.activeOscillators[note]) {
			this.stopBeep(this.activeOscillators[note]);
			delete this.activeOscillators[note];
			console.log(`Note off: ${note}`);
		}
	}

	playBeep(note) {
		if (!this.audioCtx) {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			this.audioCtx = new AudioCtx();
		}
		const oscillator = this.audioCtx.createOscillator();
		const gain = this.audioCtx.createGain();
		oscillator.type = 'sawtooth';
		gain.gain.value = 0.1;

		const frequency = 440 * Math.pow(2, (note - 69) / 12);
		oscillator.frequency.value = frequency;

		oscillator.connect(gain);
		gain.connect(this.audioCtx.destination);
		oscillator.start();

		return { oscillator, gain };
	}

	stopBeep({ oscillator }) {
		oscillator.stop();
	}
}

class SynthInterface extends HTMLElement {
	constructor() {
		super();
		this.synth = new MidiSynth();
		this.userHasInteracted = false;
	}

	connectedCallback() {
		this.render();
	}

	render() {
		this.innerHTML = `
			<div class="synth-interface">
				<h1>MIDI Synthesizer</h1>
				<p>Connect a MIDI device to play notes.</p>
			</div>
		`;

		window.addEventListener('pointerdown', this.onUserGesture);
		window.addEventListener('keydown', this.onUserGesture);
	}

	onUserGesture() {
		this.userHasInteracted = true;
		window.removeEventListener('pointerdown', this.onUserGesture);
		window.removeEventListener('keydown', this.onUserGesture);
	}
}
customElements.define('synth-interface', SynthInterface);
