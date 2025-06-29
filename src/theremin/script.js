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
	oscillator = null;
	gainNode = null;

	_notes = getNoteArray();

	_animationFrameId = null;
	_targetFreq = 440;
	_targetGain = 0.5;
	_currentFreq = 440;
	_currentGain = 0.5;

	constructor() {
		super();

		this._settings = {
			range: {
				min: this._notes[0],
				max: this._notes[this._notes.length - 1],
			},
			smoothingFactors: {
				frequency: 0.2,
				gain: 0.2,
			},
			vibrato: {
				base: {
					frequency: 5,
					amplitude: 0.1,
				},
				expression: {
					frequency: 5,
					amplitude: 0.1,
				},
			},
		};

		this.innerHTML = `
			<style>
				
			</style>
			<div class="theremin-settings">
				<div class="theremin-settings-group">
					Volume
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
				vibrato volume range
			</div>
			<div class="theremin-xy-pad">
				<div class="label">Move mouse to play (L/R: pitch, U/D: volume)</div>


				<div class="note-matrix">
				</div>

				<div class="indicator" style="top:50%;left:50%;">
					<div class="indicator-label"></div>
				</div>
			</div>
		`;

		// style="display:inline-block;margin:2px;padding:2px 6px;background:#222;color:#fff;border-radius:3px;font-size:0.85rem;"
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
		this.indicatorLabel = this.querySelector('.indicator-label');

		this.thereminXYPad.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);

		this._animationFrameId = requestAnimationFrame(this.animate);
	}

	animate = () => {
		if (this.oscillator && this.gainNode) {
			this._currentFreq = this.linearInterpolation(this._currentFreq, this._targetFreq, 0.2);
			this._currentGain = this.linearInterpolation(this._currentGain, this._targetGain, 0.2);
			this.oscillator.frequency.setTargetAtTime(this._targetFreq, this._audioCtx.currentTime, 0.05);
			this.gainNode.gain.setTargetAtTime(this._targetGain, this._audioCtx.currentTime, 0.05);
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
		const label = this.indicatorLabel;
		if (!area || !indicator || !label) return;
		const width = area.clientWidth;
		const height = area.clientHeight;

		const x = ((this._currentFreq - minFreq) / (maxFreq - minFreq)) * width;
		const y = ((maxGain - this._currentGain) / (maxGain - minGain)) * height;

		indicator.style.left = `${x}px`;
		indicator.style.top = `${y}px`;
		label.textContent = `Freq: ${this._currentFreq.toFixed(1)} Hz, Gain: ${this._currentGain.toFixed(2)}`;
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
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			this._audioCtx = new AudioCtx();
			this.startOscillator();
		} else if (this._audioCtx.state === 'suspended') {
			this._audioCtx.resume();
		}
		this.thereminXYPad.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mousemove', this.handleMouseMove);
		this.handleMouseMove(e);
	};

	startOscillator() {
		if (this.oscillator) return;
		this.oscillator = this._audioCtx.createOscillator();
		this.gainNode = this._audioCtx.createGain();
		this.oscillator.type = 'sawtooth';
		this.oscillator.connect(this.gainNode);
		this.gainNode.connect(this._audioCtx.destination);
		this.gainNode.gain.value = 0;
		this.oscillator.start();
	}

	stopOscillator() {
		if (!this.oscillator) return;
		this.oscillator.stop();
		this.oscillator.disconnect();
		this.gainNode.disconnect();
		this.oscillator = null;
		this.gainNode = null;
	}

	handleMouseUp = () => {
		this.thereminXYPad.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
	};
}

customElements.define('theremin-app', ThereminApp);
