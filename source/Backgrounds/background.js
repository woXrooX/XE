import v1 from "./Versions/v1.js";

export default class Background extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({ mode: "closed" });

        // Style element
        const style = document.createElement("style");
        style.textContent = `
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
        `;
        this.shadow.appendChild(style);

        // Canvas element
        this.canvas = document.createElement("canvas");
        this.div_element = document.createElement("div");
        this.ctx = this.canvas.getContext("2d");

        this.shadow.appendChild(this.canvas);
        this.shadow.appendChild(this.div_element);

        // Set initial canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Set canvas size on resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

		// Background Version 1
		v1.build(this.ctx, this.canvas, this.particles);
    }
}



window.customElements.define('x-background', Background);

window.x["Background"] = Background;
