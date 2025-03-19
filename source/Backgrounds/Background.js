// Usage:
// <x-background>
// {
	// "version": 1,
	// "colors": [],
	// "parent_selector": "container.x_background_1",
	// "z_index": -1
// }
// </x-background>

export default class Background extends HTMLElement {
	#JSON = {};

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "closed" });
		this.#JSON = JSON.parse(this.innerHTML).constructor === Object ? JSON.parse(this.innerHTML) : {};
		this.replaceChildren();

		let gradient_colors = '';
		if(this.#JSON["colors"]) gradient_colors = `linear-gradient(45deg, ${this.#JSON["colors"].join(", ")})`;
		else gradient_colors = `linear-gradient(45deg, rgba(0, 255, 100, 0.1), rgba(255, 0, 100, 0.1), rgba(100, 0, 255, 0.1))`;

		console.log(gradient_colors);


		this.shadow.innerHTML = `
			<style>
				:host{
					pointer-events: none;

					display: block;
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
					background: ${gradient_colors};
					mix-blend-mode: overlay;
					pointer-events: none;
				}
			</style>
			<canvas></canvas>
			<div></div>
		`;


		this.#init_canvas();
		this.#style_parent_element();
		this.#load_version_file();
	}

	#init_canvas = ()=>{
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
	}

	#style_parent_element = ()=>{
		if (!( "parent_selector" in this.#JSON)) return;

		const parent_element = document.querySelector(this.#JSON["parent_selector"]);

		if (!parent_element) return;

		this.shadow.querySelector('style').textContent += `
			:host{
				position: absolute;
				inset: 0;
				${"z_index" in this.#JSON ? `z-index: ${this.#JSON["z_index"]};` : ''}
			}
		`;

		parent_element.style = `
			position: relative;
			overflow: hidden;
		`;
	}

	#load_version_file = async ()=>{
		try {
			const module = await import(`./versions/Version_${this.#JSON["version"]}.js`);
			module.default.init(this.canvas, this.ctx);
		}

		catch (error) {
			console.warn(`Background: ${error}`);
		}
	}
}

window.customElements.define('x-background', Background);
