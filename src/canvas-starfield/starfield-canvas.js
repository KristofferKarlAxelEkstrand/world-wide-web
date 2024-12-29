function starfieldCanvas({ canvas, flakes = 100, speed, size, opacity, precision }) {
	const ctx = canvas.getContext('2d');
	const snowflakes = [];
	let rect = canvas.getBoundingClientRect();
	let canvasWidth = rect.width;
	let canvasHeight = rect.height;
	let numberOfSnowflakes = Math.floor((canvasWidth / 1000) * flakes);

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
		});
	}

	function adjustNumberOfSnowflakes() {
		console.log('adjust', numberOfSnowflakes, snowflakes.length);
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
			const x = (canvasWidth / precision.x) * snowflake.x;
			const y = (canvasHeight / precision.y) * snowflake.y;
			ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
			ctx.beginPath();
			ctx.arc(x, y, snowflake.radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function updateSnowflakes() {
		for (const snowflake of snowflakes) {
			snowflake.y += snowflake.speed;
			if (snowflake.y > precision.y + snowflake.radius) {
				snowflake.y = 0 - snowflake.radius;
				snowflake.x = Math.random() * precision.x;
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

export { starfieldCanvas };
