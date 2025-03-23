export default class Version_3 {
	static #canvas = null;
	static #ctx = null;
	static #particles = [];

	/////////// APis

	static init(canvas, ctx) {
		Version_3.#canvas = canvas;
		Version_3.#ctx = ctx;

		// Create particles
		Version_3.#particles = [];
		for (let i = 0; i < 40; i++) Version_3.#particles.push(new Particle(Version_3.#canvas));

		Version_3.#set_up_canvas();
		Version_3.#build();
	}

	/////////// Helpers

	static #set_up_canvas(){
		Version_3.#canvas.style = `
			filter: blur(65px) contrast(130%) brightness(1.3);
			opacity: 0.9;
		`;
	}

	static #build() {
		const time = Date.now() * 0.001;
		Version_3.#ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
		Version_3.#ctx.fillRect(0, 0, Version_3.#canvas.width, Version_3.#canvas.height);

		// Update and draw particles
		for (const particle of Version_3.#particles) {
			particle.update(time, Version_3.#canvas);
			particle.draw(Version_3.#ctx);
		}

		// Use bind to maintain the correct context
		requestAnimationFrame(() => Version_3.#build());
	}
}

class Particle {
	constructor(canvas) {
		this.reset(canvas);
		// Even larger radius with wider distribution to fill the canvas
		this.baseRadius = Math.random() * 150 + 120;
		this.radiusVariation = Math.random() * 50 + 30;
		this.pulseSpeed = Math.random() * 0.02 + 0.01;
		this.colorShift = Math.random() * 0.01 + 0.005;

		// Set unique phase for organic motion
		this.phaseX = Math.random() * Math.PI * 2;
		this.phaseY = Math.random() * Math.PI * 2;
		this.amplitude = Math.random() * 2 + 1;
		this.hue = Math.random() * 360;
	}

	reset(canvas) {
		// Only reset position if constructor hasn't set it yet
		if (this.x === undefined) {
			this.x = Math.random() * canvas.width;
			this.y = Math.random() * canvas.height;
		}

		// Slower, more gentle movement
		this.vx = (Math.random() - 0.5) * 0.6;
		this.vy = (Math.random() - 0.5) * 0.6;

		// More saturation and lightness variation for richer colors
		this.saturation = 85 + Math.random() * 15;  // Increased saturation
		this.lightness = 55 + Math.random() * 25;   // Brighter colors

		this.life = 1;
		this.hue = Math.random() * 360;
	}

	update(time, canvas) {
		// Add slight organic waviness to motion
		this.x += this.vx + Math.sin(time * 0.3 + this.phaseX) * this.amplitude * 0.2;
		this.y += this.vy + Math.cos(time * 0.2 + this.phaseY) * this.amplitude * 0.2;

		// Gentle friction
		this.vx *= 0.99;
		this.vy *= 0.99;

		// Pulse the radius for organic feel
		this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed) * this.radiusVariation;

		// Shift colors over time
		this.hue = (this.hue + this.colorShift) % 360;

		// Wrap around screen edges for seamless movement
		if (this.x < -this.radius) this.x = canvas.width + this.radius;
		if (this.x > canvas.width + this.radius) this.x = -this.radius;
		if (this.y < -this.radius) this.y = canvas.height + this.radius;
		if (this.y > canvas.height + this.radius) this.y = -this.radius;
	}

	draw(ctx) {
		// Create a radial gradient for each particle
		const gradient = ctx.createRadialGradient(
			this.x, this.y, 0,
			this.x, this.y, this.radius
		);

		gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.8)`);
		gradient.addColorStop(0.6, `hsla(${(this.hue + 40) % 360}, ${this.saturation - 10}%, ${this.lightness - 5}%, 0.4)`);
		gradient.addColorStop(1, `hsla(${(this.hue + 80) % 360}, ${this.saturation - 20}%, ${this.lightness - 10}%, 0.1)`);

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = gradient;
		ctx.fill();
	}
}
