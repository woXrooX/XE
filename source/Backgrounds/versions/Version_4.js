export default class Version_4 {
	static #canvas = null;
	static #ctx = null;
	static #particles = [];

	/////////// APis

	static init(canvas, ctx) {
		Version_4.#canvas = canvas;
		Version_4.#ctx = ctx;

		// Create particles
		Version_4.#particles = [];
		for (let i = 0; i < 12; i++) Version_4.#particles.push(new Particle(Version_4.#canvas));

		Version_4.#set_up_canvas();
		Version_4.#build();
	}

	/////////// Helpers

	static #set_up_canvas(){
		Version_4.#canvas.style = `
			filter: blur(85px) contrast(130%) brightness(1.3);
			opacity: 0.9;
		`;
	}

	static #build() {
		const time = Date.now() * 0.001;
		Version_4.#ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
		Version_4.#ctx.fillRect(0, 0, Version_4.#canvas.width, Version_4.#canvas.height);

		// Update and draw particles
		for (const particle of Version_4.#particles) {
			particle.update(time, Version_4.#canvas);
			particle.draw(Version_4.#ctx);
		}

		// Use bind to maintain the correct context
		requestAnimationFrame(() => Version_4.#build());
	}
}

class Particle {
	constructor(canvas) {
		this.reset(canvas);

		// Gigantic radius that extends beyond visible screen
		this.baseRadius = Math.random() * 300 + 450;
		this.radiusVariation = Math.random() * 150 + 100;

		// Subtle animation parameters
		this.pulseSpeed = Math.random() * 0.006 + 0.002;
		this.colorShift = Math.random() * 0.008 + 0.002;

		// Organic motion parameters
		this.phaseX = Math.random() * Math.PI * 2;
		this.phaseY = Math.random() * Math.PI * 2;
		this.amplitude = Math.random() * 2.5 + 0.5;

		// Curated color palette (Apple-inspired)
		this.hueOptions = [
			210, // iOS blue
			280, // Purple
			190, // Mint green
			330, // Pink/rose
			35,  // Gold
		];
		this.hue = this.hueOptions[Math.floor(Math.random() * this.hueOptions.length)];

		// Distribute particles to include off-screen areas
		const margin = 300;
		this.x = Math.random() * (canvas.width + margin*2) - margin;
		this.y = Math.random() * (canvas.height + margin*2) - margin;
	}

	reset(canvas) {
		// Keep existing position if already set
		if (this.x === undefined) {
			const margin = 300;
			this.x = Math.random() * (canvas.width + margin*2) - margin;
			this.y = Math.random() * (canvas.height + margin*2) - margin;
		}

		// Ultra-slow, deliberate movement (Apple-like)
		this.vx = (Math.random() - 0.5) * 0.2;
		this.vy = (Math.random() - 0.5) * 0.2;

		// Refined color parameters
		this.saturation = 70 + Math.random() * 20;
		this.lightness = 60 + Math.random() * 15;

		this.life = 1;
	}

	update(time, canvas) {
		// Extremely subtle motion with easing
		this.x += this.vx + Math.sin(time * 0.15 + this.phaseX) * this.amplitude * 0.1;
		this.y += this.vy + Math.cos(time * 0.1 + this.phaseY) * this.amplitude * 0.1;

		// Minimal friction for very smooth transitions
		this.vx *= 0.997;
		this.vy *= 0.997;

		// Gentle radius pulsing
		this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed) * this.radiusVariation;

		// Subtle color shifting
		this.hue = (this.hue + this.colorShift) % 360;

		// Handle offscreen with large margins
		const margin = this.radius;
		if (this.x < -margin) this.x = canvas.width + margin/3;
		if (this.x > canvas.width + margin) this.x = -margin/3;
		if (this.y < -margin) this.y = canvas.height + margin/3;
		if (this.y > canvas.height + margin) this.y = -margin/3;
	}

	draw(ctx) {
		// Enhanced gradient with multiple stops for more depth
		const gradient = ctx.createRadialGradient(
			this.x, this.y, 0,
			this.x, this.y, this.radius
		);

		// Apple-inspired gradient with multiple color transitions
		gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.75)`);
		gradient.addColorStop(0.4, `hsla(${(this.hue + 20) % 360}, ${this.saturation - 5}%, ${this.lightness - 2}%, 0.5)`);
		gradient.addColorStop(0.7, `hsla(${(this.hue + 40) % 360}, ${this.saturation - 10}%, ${this.lightness - 5}%, 0.3)`);
		gradient.addColorStop(1, `hsla(${(this.hue + 60) % 360}, ${this.saturation - 15}%, ${this.lightness - 10}%, 0.1)`);

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = gradient;
		ctx.fill();
	}
}
