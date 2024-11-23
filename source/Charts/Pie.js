export default class Pie extends HTMLElement {
	#data;
	#canvas;
	#ctx;

	#tooltip;
	#parent_element;

	#text_color = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");
	#font_family = "Quicksand";
	#hue = "230deg";

	#x_center;
	#y_center;
	#pie_radius;
	#padding = 20;
	#hover_grow = 20;

	#total_value = 0;
	#slices = [];

	constructor(){
		super();

		this.shadow = this.attachShadow({ mode: 'closed' });
		this.#data = JSON.parse(this.innerHTML);
		this.#parent_element = this.parentNode;

		// Style element
		const style = document.createElement('style');
		style.textContent = `
			canvas{
				max-width: 100dvw;
				max-height: 100dvh;
			}
			div#XE_charts_pie_tooltip{
				position: absolute;
				display: none;
				background-color: rgba(0, 0, 0, 0.7);
				color: white;
				padding: 5px;
				border-radius: 5px;
				pointer-events: none;
				font-size: 0.6em;
			}
		`;
		this.shadow.appendChild(style);

		// Tooltip element
		this.#tooltip = document.createElement('div');
		this.#tooltip.setAttribute("id", "XE_charts_pie_tooltip");
		this.shadow.appendChild(this.#tooltip);

		// Canvas element
		this.#canvas = document.createElement("canvas");
		this.shadow.appendChild(this.#canvas);
		this.#ctx = this.#canvas.getContext('2d');

		this.#resize_observer()
	}

	////// APIs
	#resize_observer(){
		const resize_observer_object = new ResizeObserver(this.#init);
		resize_observer_object.observe(this.#parent_element);
	}

	#init = ()=>{
		this.#set_up_canvas();
		this.#init_values();
		this.#init_slices();
		this.#init_draw_canvas();
		this.#init_on_hover_pie();
	}

	////// Helpers
	#set_up_canvas(){
		this.#canvas.width = this.#parent_element.getBoundingClientRect().width;
		this.#canvas.height = this.#parent_element.getBoundingClientRect().height;
	}

	#init_values(){
		if("text_color" in this.#data) this.#text_color = this.#data["text_color"];
		if("hue" in this.#data) this.#hue = this.#data["hue"];
		if("font_family" in this.#data) this.#font_family = this.#data["font_family"];
		if("background" in this.#data) this.#canvas.style.background = this.#data["background"];

		this.#x_center = this.#canvas.width / 2;
		this.#y_center = this.#canvas.height / 2;
		this.#pie_radius = Math.min(this.#canvas.width, this.#canvas.height) / 3;
	}

	#init_slices(){
		this.#total_value = 0;
		const sorted_slice_values = [];

		for(const slice of this.#data["pie"]){
			this.#total_value += slice["value"];
			sorted_slice_values.push(slice["value"]);
		}

		sorted_slice_values.sort((a, b) => b - a);


		this.#slices = [];
		let start_angle = 0;

		for(const slice of this.#data["pie"]){
			const slice_angle = (slice["value"] / this.#total_value) * 2 * Math.PI;

			let color;
			const index_of_this_value = sorted_slice_values.indexOf(slice["value"]);
			const saturation = 20 + (60 / (this.#data["pie"].length - 1)) * index_of_this_value;
			const lightness = 20 + (60 / (this.#data["pie"].length - 1)) * index_of_this_value;
			color = `hsl(${this.#hue}, ${saturation}%, ${lightness}%)`;

			this.#slices.push({
				start: start_angle,
				end: start_angle + slice_angle,
				label: slice["label"],
				value: slice["value"],
				color: color,
				hovered: false
			});
			start_angle += slice_angle;
		}
	}

	#init_draw_canvas(){
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		this.#draw_slices();
		this.#draw_title();
		this.#draw_legends();
	}

	#draw_slices(){
		for(const slice of this.#slices){
			this.#ctx.beginPath();

			this.#ctx.moveTo(this.#x_center, this.#y_center);
			this.#ctx.arc(this.#x_center, this.#y_center, this.#pie_radius + (slice.hovered ? this.#hover_grow : 0), slice.start, slice.end);
			this.#ctx.closePath();

			this.#ctx.globalAlpha = slice["hovered"] ? 1 : 0.8;
			this.#ctx.fillStyle = slice["color"];
			this.#ctx.fill();

			this.#ctx.globalAlpha = 1;
			this.#ctx.lineWidth = 2;
			this.#ctx.strokeStyle = "white";
			this.#ctx.stroke();
		}
	}

	#draw_title(){
		if(!("title" in this.#data)) return;

		this.#ctx.font = `1.5em ${this.#font_family}`;
		this.#ctx.textAlign = "center";
		this.#ctx.textBaseline = "top";
		this.#ctx.fillStyle = this.#text_color;
		this.#ctx.fillText(this.#data["title"], this.#x_center, this.#padding);
	}

	#draw_legends(){
		if(!("legends" in this.#data) || this.#data["legends"] !== true) return;

		this.#ctx.font = `0.6em ${this.#font_family}`;
		this.#ctx.textAlign = "left";
		this.#ctx.textBaseline = "top";
		this.#ctx.globalAlpha = 1;

		let y = this.#padding;
		for(const slice of this.#slices){
			this.#ctx.beginPath();
			this.#ctx.roundRect(this.#padding, y, 30, 20, 5);
			this.#ctx.fillStyle = slice["color"];
			this.#ctx.fill();

			this.#ctx.fillStyle = this.#text_color;
			this.#ctx.fillText(`${slice["label"]}: ${slice["value"]}`, 60, y+5);

			y += 30;
		}
	}

	#init_on_hover_pie(){
		this.#canvas.addEventListener("mousemove", (event)=>{
			const rect = this.#canvas.getBoundingClientRect();
			const x = event.clientX - rect.left - this.#x_center;
			const y = event.clientY - rect.top - this.#y_center;
			const mouse_angle = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
			const distance = Math.sqrt(x * x + y * y);

			let needs_redraw = false;
			let hovered_slice = null;
			for(const slice of this.#slices){
				const is_hovered = distance <= this.#pie_radius && mouse_angle >= slice.start && mouse_angle < slice.end;

				if(slice.hovered !== is_hovered){
					slice.hovered = is_hovered;
					needs_redraw = true;
				}

				if(is_hovered == true) hovered_slice = slice;
			}

			if(hovered_slice != null){
				let tooltip_height = this.#tooltip.getBoundingClientRect().height;
				this.#tooltip.style.display = 'block';
				this.#tooltip.style.left = event.pageX + 'px';
				this.#tooltip.style.top = event.pageY - tooltip_height - 5 + 'px';
				this.#tooltip.textContent = `${hovered_slice.label}: ${hovered_slice.value}`;
			}else this.#tooltip.style.display = 'none';

			if(needs_redraw) this.#init_draw_canvas();
		});
	}
}

window.customElements.define('x-pie-chart', Pie);
