export default class v1 {

	static build(ctx, canvas) {
		// Create particles only on first run
		this.particles = Array(50).fill().map(() => new Particle(canvas, ctx));

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Create flowing color background
		const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
		const time = Date.now() * 0.001;
		gradient.addColorStop(0, `hsl(${Math.sin(time) * 60 + 120}, 70%, 50%)`);
		gradient.addColorStop(0.5, `hsl(${Math.cos(time * 0.8) * 60 + 240}, 70%, 50%)`);
		gradient.addColorStop(1, `hsl(${Math.sin(time * 0.6) * 60 + 360}, 70%, 50%)`);

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Update and draw particles
		for (const particle of this.particles) {
			particle.update(canvas);
			particle.draw(ctx);
		}

		// Request next frame with the same context and parameters
		requestAnimationFrame(() => this.build(ctx, canvas));
	}
}

class Particle {
	constructor(canvas, ctx) {
		this.canvas = canvas;
		this.reset(canvas);
		this.radius = Math.random() * 4 + 1;
	}

	reset(canvas) {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.vx = (Math.random() - 0.5) * 2;
		this.vy = (Math.random() - 0.5) * 2;
		this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
		this.life = 1;
	}

	update(canvas) {
		this.x += this.vx;
		this.y += this.vy;

		// Add friction
		this.vx *= 0.99;
		this.vy *= 0.99;

		// Regenerate particles that move offscreen
		if (this.x < 0 || this.x > canvas.width ||
			this.y < 0 || this.y > canvas.height) {
			this.reset(canvas);
		}
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}
