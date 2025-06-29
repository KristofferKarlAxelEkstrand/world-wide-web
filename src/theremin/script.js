import './styles.scss';

function getNoteArray() {
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const notes = [];

	for (let midi = 12; midi <= 120; midi++) {
		const octave = Math.floor(midi / 12) - 1;
		const name = noteNames[midi % 12] + octave;
		const frequency = 440 * Math.pow(2, (midi - 69) / 12);
		notes.push({ midi, name, frequency });
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

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
					height: 30rem;
		

					overflow: hidden;
				}
				.theremin-area {
					width: 100%;
					height: 100%;
					position: relative;
					background-color: #ff3300;
					cursor: crosshair;
				}
				.label {
					position: absolute;
					top: 10px;
					left: 10px;
					color: #fff;
					font-family: sans-serif;
					background: rgba(0,0,0,0.4);
					padding: 4px 8px;
					border-radius: 4px;
					font-size: 1rem;
					z-index: 10;
				}
				.indicator {
					position: absolute;
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background: rgba(255,255,255,0.7);
					border: 2px solid #fff;
					box-shadow: 0 0 8px #fff8;
					display: flex;
					align-items: center;
					justify-content: center;
					pointer-events: none;
					transform: translate(-50%, -50%);
					z-index: 20;
				}
				.indicator-label {
					position: absolute;
					top: 36px;
					left: 50%;
					transform: translateX(-50%);
					color: #fff;
					font-size: 0.85rem;
					background: rgba(0,0,0,0.5);
					padding: 2px 6px;
					border-radius: 4px;
					white-space: nowrap;
					pointer-events: none;
				}
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

			<div class="theremin-area">
				<div class="label">Move mouse to play (L/R: pitch, U/D: volume)</div>
				<div class="indicator" style="top:50%;left:50%;">
					<div class="indicator-label"></div>
				</div>
			</div>
		`;
	}

	lerp = (a, b, t) => a + (b - a) * t;

	connectedCallback() {
		this.thereminArea = this.shadowRoot.querySelector('.theremin-area');
		this.indicator = this.shadowRoot.querySelector('.indicator');
		this.indicatorLabel = this.shadowRoot.querySelector('.indicator-label');
		this.thereminArea.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);

		this._updateTarget = (x, y, width, height) => {
			const minFreq = this._settings.range.min.frequency,
				maxFreq = this._settings.range.max.frequency;
			this._targetFreq = minFreq + (x / width) * (maxFreq - minFreq);

			const minGain = 0.01,
				maxGain = 1.0;
			this._targetGain = maxGain - (y / height) * (maxGain - minGain);
		};

		this.handleMouseMove = (e) => {
			const rect = this.thereminArea.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			this._updateTarget(x, y, rect.width, rect.height);
		};

		const animate = () => {
			if (this.oscillator && this.gainNode) {
				this._currentFreq = this.lerp(this._currentFreq, this._targetFreq, 0.2);
				this._currentGain = this.lerp(this._currentGain, this._targetGain, 0.2);
				this.oscillator.frequency.setTargetAtTime(this._targetFreq, this._audioCtx.currentTime, 0.05);
				this.gainNode.gain.setTargetAtTime(this._targetGain, this._audioCtx.currentTime, 0.05);
			}
			this.updateIndicator();
			this._animationFrameId = requestAnimationFrame(animate);
		};
		this._animationFrameId = requestAnimationFrame(animate);
	}

	updateIndicator() {
		const minFreq = this._settings.range.min.frequency,
			maxFreq = this._settings.range.max.frequency;
		const minGain = 0,
			maxGain = 1.0;
		const area = this.thereminArea;
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
		this.thereminArea?.removeEventListener('mousedown', this.handleMouseDown);
		this.thereminArea?.removeEventListener('mousemove', this.handleMouseMove);
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
		this.thereminArea.addEventListener('mousemove', this.handleMouseMove);
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
		this.thereminArea.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
	};
}

customElements.define('theremin-app', ThereminApp);
