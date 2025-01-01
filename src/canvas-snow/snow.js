function snow({ canvas, flakes = 100, speed, size, opacity, precision, swaySpeed, swayAmplitude }) {
	// Consts
	const ctx = canvas.getContext('2d');
	const snowflakes = [];

	// Variables
	let rect = canvas.getBoundingClientRect();
	let canvasWidth = rect.width;
	let canvasHeight = rect.height;
	let numberOfSnowflakes = Math.floor((canvasWidth / 1000) * flakes);
	let speedNaomralizeNr = canvasHeight / precision.y;

	function mapSeedToRange({ seed, min, max }) {
		return min + (max - min) * seed;
	}

	function resizeCanvas() {
		rect = canvas.getBoundingClientRect();
		canvasWidth = rect.width;
		canvasHeight = rect.height;
		numberOfSnowflakes = Math.floor((canvasWidth / 1000) * flakes);
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		speedNaomralizeNr = canvasHeight / precision.y;
	}

	function createSnowflakes() {
		for (let i = 0; i < numberOfSnowflakes; i++) {
			createSnowflake();
		}
	}

	function createSnowflake() {
		const seed = Math.random();

		snowflakes.push({
			x: Math.random() * precision.x,
			y: Math.random() * precision.y,
			radius: mapSeedToRange({ seed: seed, min: size.min, max: size.max }),
			speed: mapSeedToRange({ seed: seed, min: speed.min, max: speed.max }),
			opacity: mapSeedToRange({ seed: seed, min: opacity.min, max: opacity.max }),
			sway: Math.random() * 2 * Math.PI,
			swaySpeed: mapSeedToRange({ seed: seed, min: swaySpeed.min, max: swaySpeed.max }),
			swayAmplitude: mapSeedToRange({ seed: seed, min: swayAmplitude.min, max: swayAmplitude.max }),
		});
	}

	function adjustNumberOfSnowflakes() {
		if (numberOfSnowflakes > snowflakes.length) {
			const diff = numberOfSnowflakes - snowflakes.length;
			for (let i = 0; i < diff; i++) {
				createSnowflake();
			}
		} else if (numberOfSnowflakes < snowflakes.length) {
			const diff = snowflakes.length - numberOfSnowflakes;
			for (let i = 0; i < diff; i++) {
				snowflakes.pop();
			}
		}
	}

	function drawSnowflakes() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const snowflake of snowflakes) {
			const x = (canvasWidth / precision.x) * snowflake.x + Math.sin(snowflake.sway) * snowflake.swayAmplitude;
			const y = (canvasHeight / precision.y) * snowflake.y;
			ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
			ctx.beginPath();
			ctx.arc(x, y, snowflake.radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function updateSnowflakes() {
		for (const snowflake of snowflakes) {
			console.log('speedNaomralizeNr', speedNaomralizeNr);

			const nomralizedSpeed = snowflake.speed / speedNaomralizeNr;

			snowflake.y += nomralizedSpeed;
			snowflake.sway += snowflake.swaySpeed;
			if (snowflake.y > precision.y + snowflake.radius) {
				snowflake.y = 0 - snowflake.radius;
				snowflake.x = Math.random() * precision.x;
				snowflake.sway = Math.random() * 2 * Math.PI;
			}
		}
	}

	function animateSnowflakes() {
		adjustNumberOfSnowflakes();
		drawSnowflakes();
		updateSnowflakes();
		requestAnimationFrame(animateSnowflakes);
	}

	window.addEventListener('resize', resizeCanvas);
	resizeCanvas();
	createSnowflakes();
	animateSnowflakes();
}

export { snow };
