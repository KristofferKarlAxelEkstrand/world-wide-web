function particles({ canvas, instances = 1, speed }) {
	const ctx = canvas.getContext('2d');
	const particles = [];

	function mapSeedToRange({ seed, min, max }) {
		return min + (max - min) * seed;
	}

	function getState() {
		let state = {};
		const rect = canvas.getBoundingClientRect();
		state.width = rect.width;
		state.height = rect.height;
		state.center = {};
		state.center.x = state.width / 2;
		state.center.y = state.height / 2;
		state.vc = {};
		state.vc.xmin = -state.width / 2;
		state.vc.xmax = state.width / 2;
		state.vc.ymin = -state.height / 2;
		state.vc.ymax = state.height / 2;
		state.particles = {};
		state.particles.nr = Math.floor((state.width / 1000) * instances);

		return state;
	}

	let state = getState();

	function calculateState() {
		state = getState();
		canvas.width = state.width;
		canvas.height = state.height;
	}

	function createParticles() {
		for (let i = 0; i < state.particles.nr; i++) {
			particles.push(createParticle());
		}
	}

	function createParticle() {
		console.log('createParticle');
		const seed = Math.random();
		const seedAngle = Math.random();
		const angle = mapSeedToRange({ seed: seedAngle, min: 0, max: 2 });

		let particle = {
			x: 0,
			y: 0,
			radius: 4,
			speed: mapSeedToRange({ seed: seed, min: speed.min, max: speed.max }),
			angle: angle,
		};

		return particle;
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach(({ x, y, radius }) => {
			const drawX = state.center.x + x;
			const drawY = state.center.y + y;
			ctx.fillStyle = 'rgba(255, 255, 255, 1)';
			ctx.beginPath();
			ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	function update() {
		particles.forEach((particle, index) => {
			const { angle, speed } = particle;
			const radianAngle = angle * Math.PI;

			particle.x += Math.cos(radianAngle) * speed;
			particle.y += Math.sin(radianAngle) * speed;

			if (particle.x < state.vc.xmin || particle.x > state.vc.xmax || particle.y < state.vc.ymin || particle.y > state.vc.ymax) {
				particles[index] = createParticle();
			}
		});
	}

	function animate() {
		draw();
		update();
		requestAnimationFrame(animate);
	}

	window.addEventListener('resize', calculateState);
	calculateState();
	createParticles();
	animate();
}

export { particles };
