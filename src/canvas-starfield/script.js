import './styles.css';
import { starfieldCanvas } from './starfield-canvas.js';

const canvas = document.getElementById('snowCanvas');

starfieldCanvas({
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
