function starfieldCanvas({ canvas, stars = 1000, speed, size, opacity }) {
	const ctx = canvas.getContext('2d');
	const starfield = [];

	function getState() {
		let state = {};
		let rect = canvas.getBoundingClientRect();
		state.width = rect.width;
		state.height = rect.height;
		state.pre = {};
		state.pre.width = {};
		state.pre.width.min = -state.width / 2;
		state.pre.width.max = state.width / 2;
		state.pre.width.min = -state.width / 2;
		state.pre.width.max = state.width / 2;
		state.center = {};
		state.center.x = state.width / 2;
		state.center.y = state.height / 2;
		state.stars = {};
		state.stars.nr = Math.floor((state.width / 1000) * stars);
		return state;
	}

	let state = getState();

	function mapSeedToRange({ seed, min, max }) {
		return min + (max - min) * seed;
	}

	function resizeCanvas() {
		state = getState();
		canvas.width = state.width;
		canvas.height = state.height;
	}

	function createStars() {
		for (let i = 0; i < state.stars.nr; i++) {
			createStar();
		}
	}

	function createStar() {
		const seed = Math.random();
		const angle = Math.random() * 2 * Math.PI;

		starfield.push({
			x: 0,
			y: 0,
			initialRadius: mapSeedToRange({ seed: seed, min: size.min, max: size.max }),
			speed: mapSeedToRange({ seed: seed, min: speed.min, max: speed.max }),
			opacity: mapSeedToRange({ seed: seed, min: opacity.min, max: opacity.max }),
			angle: angle,
			distance: 0,
		});
	}

	function adjustNumberOfStars() {
		if (state.stars.nr > starfield.length) {
			const diff = state.stars.nr - starfield.length;
			for (let i = 0; i < diff; i++) {
				createStar();
			}
		} else if (state.stars.nr < starfield.length) {
			const diff = starfield.length - state.stars.nr;
			for (let i = 0; i < diff; i++) {
				starfield.pop();
			}
		}
	}

	function drawStars() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const star of starfield) {
			const distance = Math.sqrt((star.x - state.center.x) ** 2 + (star.y - state.center.y) ** 2);
			const radius = star.initialRadius * (distance / Math.max(state.width, state.height));
			const x = star.x + state.center.x;

			ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
			ctx.beginPath();
			ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function updateStars() {
		for (const star of starfield) {
			star.x += Math.cos(star.angle) * star.speed;
			star.y += Math.sin(star.angle) * star.speed;

			if (star.x < 0 || star.x > state.width || star.y < 0 || star.y > state.height) {
				star.x = 0;
				star.y = 0;
				star.angle = Math.random() * 2 * Math.PI;
				star.distance = 0;
			} else {
				star.distance = Math.sqrt(star.x ** 2 + star.y ** 2);
			}
		}
	}

	function animateStars() {
		adjustNumberOfStars();
		drawStars();
		updateStars();
		requestAnimationFrame(animateStars);
	}

	window.addEventListener('resize', resizeCanvas);

	resizeCanvas();
	createStars();
	animateStars();
}

export { starfieldCanvas };
