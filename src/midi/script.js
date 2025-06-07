import './styles.css';

if (navigator.requestMIDIAccess) {
	navigator.requestMIDIAccess().then(
		(midiAccess) => {
			const inputs = Array.from(midiAccess.inputs.values());
			if (inputs.length > 0) {
				console.log('MIDI device(s) connected');
				inputs.forEach((input, idx) => {
					console.log(`Device ${idx + 1}: ${input.name} [id: ${input.id}]`);
				});
				const input = inputs[2];
				console.log(`Using MIDI device: ${input.name}`);

				// Track active notes
				const activeOscillators = {};

				input.onmidimessage = (message) => {
					const [status, note, velocity] = message.data;

					// Note on
					if ((status & 0xf0) === 0x90 && velocity > 0) {
						if (!activeOscillators[note]) {
							activeOscillators[note] = playBeep(note);
							console.log(`Note on: ${note}`);
						}
					}
					// Note off (either 0x80 or 0x90 with velocity 0)
					if ((status & 0xf0) === 0x80 || ((status & 0xf0) === 0x90 && velocity === 0)) {
						if (activeOscillators[note]) {
							stopBeep(activeOscillators[note]);
							delete activeOscillators[note];
							console.log(`Note off: ${note}`);
						}
					}
				};
			} else {
				console.log('No MIDI devices connected');
			}
		},
		() => {
			console.log('Could not access MIDI devices');
		}
	);
} else {
	console.log('Web MIDI API not supported in this browser');
}

function playBeep(note) {
	const AudioCtx = window.AudioContext || window.webkitAudioContext;
	const ctx = new AudioCtx();
	const oscillator = ctx.createOscillator();
	const gain = ctx.createGain();
	oscillator.type = 'sawtooth';
	gain.gain.value = 0.1;

	const frequency = 440 * Math.pow(2, (note - 69) / 12);
	oscillator.frequency.value = frequency;

	oscillator.connect(gain);
	gain.connect(ctx.destination);
	oscillator.start();

	return { ctx, oscillator };
}

function stopBeep({ ctx, oscillator }) {
	oscillator.stop();
	ctx.close();
}
