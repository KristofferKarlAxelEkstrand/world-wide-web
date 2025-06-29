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
					Vibrato
					<div>
					Speed
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

	// (Removed duplicate startOscillator and stopOscillator methods)

	handleMouseUp = () => {
		this.thereminXYPad.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
	};
}

customElements.define('theremin-app', ThereminApp);
