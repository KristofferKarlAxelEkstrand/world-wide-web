import './styles.css';
import { particles } from './particles.js';

const canvas = document.getElementById('canvas');

particles({
	canvas: canvas,
	instances: 400,
	speed: {
		min: 0.1,
		max: 6,
	},
	size: {
		min: 1,
		max: 4,
	},
	opacity: {
		min: 0.2,
		max: 0.8,
	},
});
