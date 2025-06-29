import './styles.scss';

class ThereminApp extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100vw;
					height: 100vh;
					overflow: hidden;
				}
				.theremin-area {
					width: 100vw;
					height: 100vh;
					position: relative;
					background: linear-gradient(135deg, #222 60%, #444 100%);
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
			</style>
			<div class="theremin-area">
				<div class="label">Move mouse to play (L/R: pitch, U/D: volume)</div>
			</div>
		`;

		this._audioCtx = null;
		this.oscillator = null;
		this.gainNode = null;

		this._animationFrameId = null;
		this._targetFreq = 440;
		this._targetGain = 0.5;
		this._currentFreq = 440;
		this._currentGain = 0.5;

		// Bind event handlers to ensure correct 'this' context
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
	}

	// Linear interpolation helper function
	lerp(a, b, t) {
		return a + (b - a) * t;
	}

	connectedCallback() {
		this.thereminArea = this.shadowRoot.querySelector('.theremin-area');
		this.thereminArea.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);

		const animate = () => {
			if (this.oscillator && this.gainNode) {
				this._currentFreq = this.lerp(this._currentFreq, this._targetFreq, 0.1);
				this._currentGain = this.lerp(this._currentGain, this._targetGain, 0.1);

				console.log(this._currentGain, this._currentFreq);

				this.oscillator.frequency.value = this._currentFreq;
				this.gainNode.gain.value = this._currentGain;
			}
			this._animationFrameId = requestAnimationFrame(animate);
		};

		this._updateTarget = (x, y, width, height) => {
			const minFreq = 40;
			const maxFreq = 2000;
			this._targetFreq = minFreq + (x / width) * (maxFreq - minFreq);

			const minGain = 0.01;
			const maxGain = 1.0;
			this._targetGain = maxGain - (y / height) * (maxGain - minGain);
		};

		this.handleMouseMove = (e) => {
			const rect = this.thereminArea.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const width = rect.width;
			const height = rect.height;
			this._updateTarget(x, y, width, height);
		};

		this._animationFrameId = requestAnimationFrame(animate);
	}

	disconnectedCallback() {
		this.thereminArea.removeEventListener('mousedown', this.handleMouseDown);
		this.thereminArea.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
		this.stopOscillator();
	}

	handleMouseDown(e) {
		if (!this._audioCtx) {
			const AudioCtx = window.AudioContext || window['webkitAudioContext'];
			this._audioCtx = new AudioCtx();
			this.startOscillator();
		} else if (this._audioCtx.state === 'suspended') {
			this._audioCtx.resume();
		}
		this.thereminArea.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mousemove', this.handleMouseMove);
		this.handleMouseMove(e);
	}

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

	handleMouseUp(e) {
		this.thereminArea.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
	}
}

customElements.define('theremin-app', ThereminApp);
