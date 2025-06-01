function particles({ canvas, instances = 1, speed }) {
	const ctx = canvas.getContext('2d');
	const particles = [];

	const mapSeedToRange = ({ seed, min, max }) => min + (max - min) * seed;

	const getState = () => {
		const rect = canvas.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		const center = { x: width / 2, y: height / 2 };
		const vc = {
			xmin: -width / 2,
			xmax: width / 2,
			ymin: -height / 2,
			ymax: height / 2,
		};
		const particles = { nr: Math.floor((width / 1000) * instances) };

		return { width, height, center, vc, particles };
	};

	let state = getState();

	const calculateState = () => {
		state = getState();
		canvas.width = state.width;
		canvas.height = state.height;
	};

	const createParticle = () => {
		const angle = Math.random() * 2 * Math.PI;
		const radius = 0;
		const speedVal = mapSeedToRange({ seed: Math.random(), min: speed.min, max: speed.max });

		return {
			angle,
			radius,
			speed: speedVal,
			age: 0,
			size: 0.5 + Math.random() * 2,
		};
	};

	const createParticles = () => {
		particles.length = 0;
		for (let i = 0; i < state.particles.nr; i++) {
			particles.push(createParticle());
		}
	};

	const draw = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach(({ angle, radius, size, age }) => {
			const x = state.center.x + Math.cos(angle) * radius;
			const y = state.center.y + Math.sin(angle) * radius;
			ctx.fillStyle = 'rgba(255, 255, 255, 1)';
			ctx.beginPath();
			ctx.arc(x, y, size * age, 0, Math.PI * 2);
			ctx.fill();
		});
	};

	const update = () => {
		particles.forEach((particle, index) => {
			particle.age += 0.011574123;

			const ageFactor = 1 + particle.age;
			particle.radius += particle.speed * ageFactor;

			const x = Math.cos(particle.angle) * particle.radius;
			const y = Math.sin(particle.angle) * particle.radius;

			if (x < state.vc.xmin || x > state.vc.xmax || y < state.vc.ymin || y > state.vc.ymax) {
				particles[index] = createParticle();
			}
		});
	};

	const animate = () => {
		draw();
		update();
		requestAnimationFrame(animate);
	};

	window.addEventListener('resize', () => {
		calculateState();
		createParticles();
	});
	calculateState();
	createParticles();
	animate();
}

export { particles };
