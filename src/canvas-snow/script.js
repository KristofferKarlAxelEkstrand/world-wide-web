import './styles.css';
import { snow } from './snow.js';

const canvas = document.getElementById('snowCanvas');

snow({
	canvas: canvas,
	flakes: 100,
	speed: {
		min: 0.1,
		max: 2,
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
	swaySpeed: {
		min: 0,
		max: 0.06,
	},
	swayAmplitude: {
		min: 0.2,
		max: 2,
	},
});
