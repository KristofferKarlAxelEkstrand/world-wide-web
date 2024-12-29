import './styles.css';
import { snowCanvas } from './snow-canvas.js';

const canvas = document.getElementById('snowCanvas');

snowCanvas({
	canvas: canvas,
	flakes: 100,
	speed: {
		min: 0.1,
		max: 4,
	},
	size: {
		min: 1,
		max: 4,
	},
	opacity: {
		min: 0.2,
		max: 0.8,
	},
	precision: {
		x: 2000,
		y: 2000,
	},
});
