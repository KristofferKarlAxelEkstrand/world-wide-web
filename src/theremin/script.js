import './styles.scss';

class ThereminApp extends HTMLElement {
	_audioCtx = null;
	oscillator = null;
	gainNode = null;

	_animationFrameId = null;
	_targetFreq = 440;
	_targetGain = 0.5;
	_currentFreq = 440;
	_currentGain = 0.5;

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
	}

	lerp = (a, b, t) => a + (b - a) * t;

	connectedCallback() {
		this.thereminArea = this.shadowRoot.querySelector('.theremin-area');
		this.thereminArea.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);

		this._updateTarget = (x, y, width, height) => {
			const minFreq = 40,
				maxFreq = 2000;
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
				this._currentFreq = this.lerp(this._currentFreq, this._targetFreq, 0.1);
				this._currentGain = this.lerp(this._currentGain, this._targetGain, 0.1);
				this.oscillator.frequency.setTargetAtTime(this._targetFreq, this._audioCtx.currentTime, 0.05);
				this.gainNode.gain.setTargetAtTime(this._targetGain, this._audioCtx.currentTime, 0.05);
			}
			this._animationFrameId = requestAnimationFrame(animate);
		};
		this._animationFrameId = requestAnimationFrame(animate);
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
