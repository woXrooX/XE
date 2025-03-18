export default class Background extends HTMLElement {
	#JSON = {};

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "closed" });
		this.#JSON = JSON.parse(this.innerHTML).constructor === Object ? JSON.parse(this.innerHTML) : {};
		this.replaceChildren();

		this.shadow.innerHTML = `
			<style>
				:host{
					display: inline-block;
					width: 100%;
					height: 100%;
					max-width: 100dvw;
					max-height: 100dvh;
				}
				canvas{
					filter: blur(40px) contrast(150%);
					opacity: 0.7;
				}
				div{
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: linear-gradient(45deg,
						rgba(0, 255, 100, 0.1),
						rgba(255, 0, 100, 0.1),
						rgba(100, 0, 255, 0.1));
					mix-blend-mode: overlay;
					pointer-events: none;
				}
			</style>
			<canvas></canvas>
			<div></div>
		`;

		this.canvas = this.shadow.querySelector("canvas");
		this.ctx = this.canvas.getContext("2d");

		// Set initial canvas size
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		// Set canvas size on resize
		window.addEventListener('resize', () => {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		});

		this.#load_version();
	}

	#load_version = async()=>{
		switch (this.#JSON["version"]) {
			case 1:
				await (await import(`./versions/Version_1.js`)).default.build(this.canvas, this.ctx);
				break;

			default:
				console.warning("Invalid action");
				break;
		}
	}
}

window.customElements.define('x-background', Background);
