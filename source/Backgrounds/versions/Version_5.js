export default class Version_5 {
	static #canvas = null;
	static #ctx = null;
	static #particles = [];

	/////////// APis

	static init(canvas, ctx) {
		Version_5.#canvas = canvas;
		Version_5.#ctx = ctx;

		// Create particles
		Version_5.#particles = [];
		for (let i = 0; i < 14; i++) Version_5.#particles.push(new Particle(Version_5.#canvas));

		Version_5.#set_up_canvas();
		Version_5.#build();
	}

	/////////// Helpers

	static #set_up_canvas(){
		Version_5.#canvas.style = `
            filter: blur(85px) contrast(130%) saturate(110%) brightness(1.1);
            opacity: 1;
		`;
	}

	static #build() {
		const time = Date.now() * 0.001;
		Version_5.#ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
		Version_5.#ctx.fillRect(0, 0, Version_5.#canvas.width, Version_5.#canvas.height);

		// Update and draw particles
		for (const particle of Version_5.#particles) {
			particle.update(time, Version_5.#canvas);
			particle.draw(Version_5.#ctx);
		}

		// Use bind to maintain the correct context
		requestAnimationFrame(() => Version_5.#build());
	}
}

class Particle {
	constructor(canvas) {
		this.reset(canvas);

		// Gigantic radius that extends beyond visible screen
		this.baseRadius = Math.random() * 300 + 450;
		this.radiusVariation = Math.random() * 150 + 100;

		// Sophisticated animation parameters
		this.pulseSpeed = Math.random() * 0.005 + 0.001;
		this.colorShift = Math.random() * 0.006 + 0.001;

		// Organic motion parameters
		this.phaseX = Math.random() * Math.PI * 2;
		this.phaseY = Math.random() * Math.PI * 2;
		this.amplitude = Math.random() * 2 + 0.5;

		// Curated color palette (designer-selected)
		this.hueOptions = [
			225, // Violet blue
			260, // Purple
			190, // Cyan
			350, // Magenta
			160, // Emerald
		];
		this.hue = this.hueOptions[Math.floor(Math.random() * this.hueOptions.length)];

		// Intelligent distribution that accounts for composition
		const margin = 300;
		const centerBias = Math.random() > 0.5; // 50% chance to bias toward center

		if (centerBias) {
			// Position closer to center for focal interest
			const angle = Math.random() * Math.PI * 2;
			const distance = Math.random() * canvas.width * 0.3;
			this.x = canvas.width / 2 + Math.cos(angle) * distance;
			this.y = canvas.height / 2 + Math.sin(angle) * distance;
		} else {
			// Position anywhere including off-screen
			this.x = Math.random() * (canvas.width + margin*2) - margin;
			this.y = Math.random() * (canvas.height + margin*2) - margin;
		}
	}

	reset(canvas) {
		// Keep existing position if already set
		if (this.x === undefined) {
			const margin = 300;
			this.x = Math.random() * (canvas.width + margin*2) - margin;
			this.y = Math.random() * (canvas.height + margin*2) - margin;
		}

		// Ultra-slow, deliberate movement with direction intent
		const angle = Math.random() * Math.PI * 2;
		const speed = Math.random() * 0.15 + 0.05;
		this.vx = Math.cos(angle) * speed;
		this.vy = Math.sin(angle) * speed;

		// Refined color parameters
		this.saturation = 65 + Math.random() * 25;
		this.lightness = 55 + Math.random() * 15;
		this.opacity = 0.7 + Math.random() * 0.3;

		this.life = 1;
	}

	update(time, canvas) {
		// Sophisticated motion with organic easing
		this.x += this.vx + Math.sin(time * 0.12 + this.phaseX) * this.amplitude * 0.08;
		this.y += this.vy + Math.cos(time * 0.08 + this.phaseY) * this.amplitude * 0.08;

		// Minimal friction with slight conservation of momentum
		this.vx *= 0.998;
		this.vy *= 0.998;

		// Complex radius pulsing with overlapping frequencies
		this.radius = this.baseRadius +
					  Math.sin(time * this.pulseSpeed) * this.radiusVariation * 0.8 +
					  Math.sin(time * this.pulseSpeed * 1.7) * this.radiusVariation * 0.2;

		// Sophisticated color shifting with harmonics
		this.hue = (this.hue + this.colorShift + Math.sin(time * 0.05) * 0.2) % 360;

		// Smart offscreen handling with partial visibility
		const margin = this.radius;
		if (this.x < -margin * 0.7) this.x = canvas.width + margin * 0.3;
		if (this.x > canvas.width + margin * 0.7) this.x = -margin * 0.3;
		if (this.y < -margin * 0.7) this.y = canvas.height + margin * 0.3;
		if (this.y > canvas.height + margin * 0.7) this.y = -margin * 0.3;
	}

	draw(ctx) {
		// Professional-grade gradient with multiple stops for depth
		const gradient = ctx.createRadialGradient(
			this.x, this.y, 0,
			this.x, this.y, this.radius
		);

		// Designer-crafted gradient with precise opacity and color transitions
		gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity * 0.6})`);
		gradient.addColorStop(0.3, `hsla(${(this.hue + 15) % 360}, ${this.saturation - 3}%, ${this.lightness - 2}%, ${this.opacity * 0.5})`);
		gradient.addColorStop(0.6, `hsla(${(this.hue + 30) % 360}, ${this.saturation - 8}%, ${this.lightness - 5}%, ${this.opacity * 0.3})`);
		gradient.addColorStop(0.8, `hsla(${(this.hue + 50) % 360}, ${this.saturation - 12}%, ${this.lightness - 8}%, ${this.opacity * 0.1})`);
		gradient.addColorStop(1, `hsla(${(this.hue + 70) % 360}, ${this.saturation - 15}%, ${this.lightness - 10}%, 0)`);

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = gradient;
		ctx.fill();
	}
}
