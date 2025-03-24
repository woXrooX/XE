export default class Version_5 {
	static #canvas = null;
	static #ctx = null;
	static #particle_objects = [];

	/////////// APis

	static init(canvas, ctx) {
		Version_5.#canvas = canvas;
		Version_5.#ctx = ctx;

		Version_5.#set_up_canvas();
		Version_5.#generate_particles();
		Version_5.#build();
	}

	/////////// Helpers

	static #set_up_canvas(){
		Version_5.#canvas.style = `
            filter: blur(85px) contrast(130%) saturate(110%) brightness(1.1);
            opacity: 1;
		`;
	}

	static #generate_particles(){
		Version_5.#particle_objects = [];
		for (let i = 0; i < 14; i++) Version_5.#particle_objects.push(new Particle(Version_5.#canvas, Version_5.#ctx));
	}

	static #build() {
		Version_5.#ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
		Version_5.#ctx.fillRect(0, 0, Version_5.#canvas.width, Version_5.#canvas.height);

		Version_5.#draw_particles();

		requestAnimationFrame(() => Version_5.#build());
	}

	static #draw_particles(){
		const time = Date.now() * 0.001;
		for (const particle of Version_5.#particle_objects) {
			particle.update(time);
			particle.draw();
		}
	}
}

class Particle {
	#canvas = null;
	#ctx = null;

	constructor(canvas, ctx) {
		this.#canvas = canvas;
		this.#ctx = ctx;

		this.reset();

		// Gigantic radius that extends beyond visible screen
		this.base_radius = Math.random() * 300 + 450;
		this.radius_variation = Math.random() * 150 + 100;

		// Sophisticated animation parameters
		this.pulse_speed = Math.random() * 0.005 + 0.001;
		this.color_shift = Math.random() * 0.006 + 0.001;

		// Organic motion parameters
		this.phase_x = Math.random() * Math.PI * 2;
		this.phase_y = Math.random() * Math.PI * 2;
		this.amplitude = Math.random() * 2 + 0.5;

		// Curated color palette (designer-selected)
		this.hue_options = [
			225, // Violet blue
			260, // Purple
			190, // Cyan
			350, // Magenta
			160, // Emerald
		];
		this.hue = this.hue_options[Math.floor(Math.random() * this.hue_options.length)];

		// Intelligent distribution that accounts for composition
		const margin = 300;

		// 50% chance to bias toward center
		const centerBias = Math.random() > 0.5;

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

	/////////// APis

	update(time) {
		// Sophisticated motion with organic easing
		this.x += this.vx + Math.sin(time * 0.12 + this.phase_x) * this.amplitude * 0.08;
		this.y += this.vy + Math.cos(time * 0.08 + this.phase_y) * this.amplitude * 0.08;

		// Minimal friction with slight conservation of momentum
		this.vx *= 0.998;
		this.vy *= 0.998;

		// Complex radius pulsing with overlapping frequencies
		this.radius = this.base_radius +
					  Math.sin(time * this.pulse_speed) * this.radius_variation * 0.8 +
					  Math.sin(time * this.pulse_speed * 1.7) * this.radius_variation * 0.2;

		// Sophisticated color shifting with harmonics
		this.hue = (this.hue + this.color_shift + Math.sin(time * 0.05) * 0.2) % 360;

		// Smart offscreen handling with partial visibility
		const margin = this.radius;
		if (this.x < -margin * 0.7) this.x = this.#canvas.width + margin * 0.3;
		if (this.x > this.#canvas.width + margin * 0.7) this.x = -margin * 0.3;
		if (this.y < -margin * 0.7) this.y = this.#canvas.height + margin * 0.3;
		if (this.y > this.#canvas.height + margin * 0.7) this.y = -margin * 0.3;
	}

	draw() {
		// Professional-grade gradient with multiple stops for depth
		const gradient = this.#ctx.createRadialGradient(
			this.x, this.y, 0,
			this.x, this.y, this.radius
		);

		// Designer-crafted gradient with precise opacity and color transitions
		gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity * 0.6})`);
		gradient.addColorStop(0.3, `hsla(${(this.hue + 15) % 360}, ${this.saturation - 3}%, ${this.lightness - 2}%, ${this.opacity * 0.5})`);
		gradient.addColorStop(0.6, `hsla(${(this.hue + 30) % 360}, ${this.saturation - 8}%, ${this.lightness - 5}%, ${this.opacity * 0.3})`);
		gradient.addColorStop(0.8, `hsla(${(this.hue + 50) % 360}, ${this.saturation - 12}%, ${this.lightness - 8}%, ${this.opacity * 0.1})`);
		gradient.addColorStop(1, `hsla(${(this.hue + 70) % 360}, ${this.saturation - 15}%, ${this.lightness - 10}%, 0)`);

		this.#ctx.beginPath();
		this.#ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		this.#ctx.fillStyle = gradient;
		this.#ctx.fill();
	}

	/////////// Helpers

	reset() {
		// Keep existing position if already set
		if (this.x === undefined) {
			const margin = 300;
			this.x = Math.random() * (this.#canvas.width + margin*2) - margin;
			this.y = Math.random() * (this.#canvas.height + margin*2) - margin;
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
	}
}
