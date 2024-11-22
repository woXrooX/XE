export default class Pie extends HTMLElement {
	#data;
	#canvas;
	#ctx;

	#tooltip;
	#parent_element;

	#total_value;

	#text_color;
	#font_size;
	#font_family;
	#hue;

	#x_center;
	#y_center;
	#pie_radius;
	#padding = 20;
	#hover_grow = 20;

	#pie_slices;

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
			div#pie_tooltip{
				position: absolute;
				display: none;
				background-color: rgba(0, 0, 0, 0.7);
				color: white;
				padding: 5px;
				border-radius: 5px;
				pointer-events: none;
				font-size: ${this.#font_size}px;
			}
		`;
		this.shadow.appendChild(style);

		// Tooltip element
		this.#tooltip = document.createElement('div');
		this.#tooltip.setAttribute("id", "pie_tooltip");
		this.shadow.appendChild(this.#tooltip);

		// Canvas element
		this.shadow.appendChild(document.createElement("canvas"));
		this.#canvas = this.shadow.querySelector("canvas");
		this.#ctx = this.#canvas.getContext('2d');

		this.#resizeObserver()
	}

	////// APIs
	#resizeObserver(){
		const resizeObserver = new ResizeObserver(this.#init);
		resizeObserver.observe(this.#parent_element);
	}

	#init = ()=>{
		this.#pie_slices = [];
		this.#total_value = 0;

		this.#text_color = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary") || 'black';
		this.#hue = this.#data["hue"] || '230';

		this.#set_up_canvas();
		this.#set_values();

		this.#draw_full_chart();

		this.#pie_hover();
	}


	////// Helpers
	#set_up_canvas(){
		this.#canvas.width = this.#parent_element.getBoundingClientRect().width;
		this.#canvas.height = this.#parent_element.getBoundingClientRect().height;
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		if("background" in this.#data) this.#canvas.style.background = this.#data["background"];
	}

	#set_values(){
		"font_family" in this.#data ? this.#font_family = this.#data["font_family"] : this.#font_family = "Quicksand";
		"font_size" in this.#data ? this.#font_size = this.#data["font_size"] : this.#font_size = 16;

		this.#x_center = this.#canvas.width / 2;
		this.#y_center = this.#canvas.height / 2;

		this.#pie_radius = Math.min(this.#canvas.width, this.#canvas.height) / 3;

		for(const item of this.#data["data"]) this.#total_value += item["value"];

		// Slice objct
		let start_angle = 0;
		for(const item of this.#data["data"]){
			// Pie Slice Angle Formula
			// radians value | 2rad = 360deg | rad x 180/PI = degree; arc works with rads
			let slice_angle = (item["value"] / this.#total_value) * 2 * Math.PI;
			this.#pie_slices.push({
				start: start_angle,
				end: start_angle + slice_angle,
				label: item["label"],
				value: item["value"],
				hovered: false
			})
			start_angle += slice_angle;
		}

		// sort data & give color from max to min
		let sorted_data = [...this.#data["data"]].sort((a, b) => b.value - a.value);
		let used_slices = new Set(); // To keep track of slices already used for coloring

		for(let i = 0; i < sorted_data.length; i++){
			for(const slice of this.#pie_slices){
				if (slice["value"] === sorted_data[i]["value"] && !used_slices.has(slice)) {
					const saturation = 20 + (60 / (this.#data["data"].length - 1)) * i;
					const lightness = 20 + (60 / (this.#data["data"].length - 1)) * i;

					slice["color"] = {"hue": this.#hue, "saturation": saturation, "lightness": lightness}
					
					used_slices.add(slice);
					break;
				}
			}
		}
	}

	#draw_full_chart(){
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		for(const slice of this.#pie_slices) this.#draw_slice(slice);

		if("labels" in this.#data && this.#data["labels"] === true) this.#draw_lables();

		if("title" in this.#data) this.#draw_title();
	}


	// Helpers to draw full chart
	#draw_title(){
		this.#ctx.font = `${this.#font_size + 10}px ${this.#font_family}`;
		this.#ctx.textAlign = "center";
		this.#ctx.textBaseline = "top";
		this.#ctx.fillStyle = this.#text_color;
		this.#ctx.fillText(this.#data["title"], this.#x_center, this.#padding);
	}

	#draw_lables(){
		this.#ctx.font = `${this.#font_size}px ${this.#font_family}`;
		this.#ctx.textAlign = "left";
		this.#ctx.textBaseline = "top";
		this.#ctx.globalAlpha = 1;

		let y = this.#padding;
		for (const slice of this.#pie_slices) {
			this.#ctx.beginPath();
			this.#ctx.roundRect(this.#padding, y, 30, this.#font_size, 5);
			this.#ctx.fillStyle = `hsl(${slice.color.hue}deg, ${slice.color.saturation}%, ${slice.color.lightness}%)`;
			this.#ctx.fill();

			this.#ctx.fillStyle = this.#text_color;
			this.#ctx.fillText(`${slice["label"]}: ${slice["value"]}`, 60, y);

			y += 30;
		}
	}

	#draw_slice(slice){
		this.#ctx.beginPath();

		this.#ctx.moveTo(this.#x_center, this.#y_center);
		this.#ctx.arc(this.#x_center, this.#y_center, this.#pie_radius + (slice.hovered ? this.#hover_grow : 0), slice.start, slice.end);
		this.#ctx.closePath();

		this.#ctx.globalAlpha = slice.hovered ? 1 : 0.8;
		this.#ctx.fillStyle = `hsl(${slice.color.hue}deg, ${slice.color.saturation}%, ${slice.color.lightness}%)`;
		this.#ctx.fill();
	}


	// Hover detect
	#pie_hover(){
		this.#canvas.addEventListener("mousemove", event => {
			const rect = this.#canvas.getBoundingClientRect();
			const x = event.clientX - rect.left - this.#x_center;
			const y = event.clientY - rect.top - this.#y_center;
			const mouse_angle = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
			const distance = Math.sqrt(x * x + y * y);

			let needs_redraw = false;
			let hovered_slice = null;
			for(const slice of this.#pie_slices){
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

			if(needs_redraw) this.#draw_full_chart();
		})
	}
}

window.customElements.define('x-pie-chart', Pie);
