import './styles.css';
import { particles } from './particles.js';

const canvas = document.getElementById('canvas');

particles({
	canvas: canvas,
	instances: 500,
	speed: {
		min: 1,
		max: 3,
	},
	size: {
		min: 1,
		max: 4,
	},
	opacity: {
		min: 0.2,
		max: 0.8,
	},
	agingSpeed: 0.011574123,
});
