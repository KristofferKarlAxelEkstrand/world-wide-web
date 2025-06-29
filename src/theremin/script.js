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

		this.audioCtx = null;
		this.oscillator = null;
		this.gainNode = null;

		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseDown = this.handleMouseDown.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
	}

	connectedCallback() {
		this.thereminArea = this.shadowRoot.querySelector('.theremin-area');
		this.thereminArea.addEventListener('mousedown', this.handleMouseDown);
		window.addEventListener('mouseup', this.handleMouseUp);
	}

	disconnectedCallback() {
		this.thereminArea.removeEventListener('mousedown', this.handleMouseDown);
		this.thereminArea.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
		this.stopOscillator();
	}

	handleMouseDown(e) {
		// Create or resume AudioContext on user gesture
		if (!this.audioCtx) {
			const AudioCtx = window.AudioContext || window['webkitAudioContext'];
			this.audioCtx = new AudioCtx();
			this.startOscillator();
		} else if (this.audioCtx.state === 'suspended') {
			this.audioCtx.resume();
		}
		this.thereminArea.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mousemove', this.handleMouseMove);
		this.handleMouseMove(e);
		// Set gain to audible
		if (this.gainNode) {
			this.gainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
		}
	}

	handleMouseMove(e) {
		const rect = this.thereminArea.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const width = rect.width;
		const height = rect.height;

		const minFreq = 200;
		const maxFreq = 2000;
		const freq = minFreq + (x / width) * (maxFreq - minFreq);

		const minGain = 0.01;
		const maxGain = 1.0;
		const gain = maxGain - (y / height) * (maxGain - minGain);

		if (this.oscillator && this.gainNode) {
			this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
			this.gainNode.gain.setValueAtTime(gain, this.audioCtx.currentTime);
		}
	}

	startOscillator() {
		if (this.oscillator) return;
		this.oscillator = this.audioCtx.createOscillator();
		this.gainNode = this.audioCtx.createGain();
		this.oscillator.type = 'sawtooth';
		this.oscillator.connect(this.gainNode);
		this.gainNode.connect(this.audioCtx.destination);
		this.gainNode.gain.value = 0.5;
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

		if (this.gainNode && this.audioCtx) {
			// this.gainNode.gain.linearRampToValueAtTime(0.0, this.audioCtx.currentTime + 0.1);
		}
	}
}

customElements.define('theremin-app', ThereminApp);
