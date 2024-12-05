export default class Bar_y extends HTMLElement {
	#data;
	#canvas;
	#ctx;
	#tooltip;

	#text_color = getComputedStyle(document.querySelector(":root")).getPropertyValue("--color-text-primary") || "black";
	#font_family = "Quicksand";
	#hue = "230deg";
	#x_axis_color = getComputedStyle(document.querySelector(":root")).getPropertyValue("--color-text-primary") || "black";
	#y_axis_color = getComputedStyle(document.querySelector(":root")).getPropertyValue("--color-text-primary") || "black";
	#rotated_labels = false;

	#max_value = 0;
	#padding = 20;
	#paddings = {};
	#y_axis_marker_count = 5;
	#y_axis_marker_gap = 0;
	#y_axis_step_value = 0;

	#bars = [];
	#total_value = 0;
	#bar_width = 60;
	#bar_gap = 10;
	#border_radius = 5;
	#bar_scale = 0;
	#canvas_DPI_width;
	#canvas_DPI_height;

	#parent_node_width;

	constructor(){
		super();

		this.shadow = this.attachShadow({ mode: "closed" });
		this.#data = JSON.parse(this.innerHTML);

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
				width: 100%;
				height: 100%;
			}
			div#XE_charts_bar_y_tooltip{
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
		this.#tooltip = document.createElement("div");
		this.#tooltip.setAttribute("id", "XE_charts_bar_y_tooltip");
		this.shadow.appendChild(this.#tooltip);

		// Canvas element
		this.#canvas = document.createElement("canvas");
		this.shadow.appendChild(this.#canvas);
		this.#ctx = this.#canvas.getContext("2d");

		this.#resize_observer();

		this.#init_on_hover_bar();
	}

	////// APIs
	#resize_observer(){
		const resize_observer_object = new ResizeObserver(this.#init);
		resize_observer_object.observe(this.parentNode);
	}

	#init = ()=>{
		this.#set_up_canvas();
		this.#init_values();
		this.#calculate_values();
		this.#init_bars();

		this.#draw_x_axis_grid_lines();

		this.#draw_bars();

		this.#draw_x_axis_line();
		this.#draw_x_axis_markers();

		this.#draw_y_axis_line();
		this.#draw_y_axis_markers();
	}

	////// Helpers
	#set_up_canvas(){
		const DPR = window.devicePixelRatio || 1;

		// First set CSS dimensions
		this.#canvas.style.width = '100%';
		this.#canvas.style.height = '100%';

		// Get the size in CSS pixels after CSS is applied
		const computed_style = getComputedStyle(this.#canvas);
		const css_width = parseFloat(computed_style.width);
		const css_height = parseFloat(computed_style.height);

		// Get the sizes before DPI scaling for calcs
		this.#canvas_DPI_width = css_width;
		this.#canvas_DPI_height = css_height;
		this.#parent_node_width = getComputedStyle(this.parentNode).width;

		// Adjust canvas buffer size for DPR
		this.#canvas.width = css_width * DPR;
		this.#canvas.height = css_height * DPR;

		// Scale the context for DPR
		this.#ctx.scale(DPR, DPR);
	}

	#init_values(){
		if("text_color" in this.#data) this.#text_color = this.#data["text_color"];
		if("hue" in this.#data) this.#hue = this.#data["hue"];
		if("font_family" in this.#data) this.#font_family = this.#data["font_family"];
		if("bar" in this.#data && "radius" in this.#data["bar"]) this.#border_radius = this.#data["bar"]["radius"];

		this.#paddings = {
			top: this.#padding,
			right: this.#canvas_DPI_width - this.#padding,
			bottom: this.#canvas_DPI_height - this.#padding,
			left: this.#padding
		};
	}

	#calculate_values(){
		let longest_label = this.#data["bars"][0]["label"];

		// Find max value and longest label name
		if(this.#max_value == 0) for(const bar of this.#data["bars"]){
			if(bar["value"] > this.#max_value) this.#max_value = bar["value"];
			if(bar["label"].length > longest_label.length) longest_label = bar["label"];
		}

		// Set font to measure width correctly
		this.#ctx.font = `1em ${this.#font_family}`;

		// Max value width as a text
		let max_numeric_value_text_width = this.#ctx.measureText(this.#max_value).width;

		// Longest label name width
		let longest_label_text_width = this.#ctx.measureText(longest_label).width;

		// Extract real area width of bars being drawed, remove paddings from 2 sides
		let raw_bar_area_height = this.#canvas_DPI_height - this.#padding * 2;

		// Bar gap, minimum good looking is 5
		this.#bar_gap = this.#parent_node_width * 0.01 > 5 ? this.#parent_node_width * 0.01 : 5;

		// If y_axis markers are true, make space
		if("y_axis" in this.#data && this.#data["y_axis"]["markers"] == true) this.#paddings["left"] += max_numeric_value_text_width + this.#padding;

		// Calc bar width, based on value after removing left-right padding, and gaps
		this.#bar_width = (this.#paddings["right"] - this.#paddings["left"] - this.#bar_gap) / this.#data["bars"].length;

		// Bar scale, needs to remove top and bottom padding (2x)
		this.#bar_scale = raw_bar_area_height / this.#max_value;

		if("x_axis" in this.#data && this.#data["x_axis"]["markers"] == true){
			let label_height = this.#ctx.measureText(longest_label).actualBoundingBoxAscent + this.#ctx.measureText(longest_label).actualBoundingBoxDescent;

			this.#paddings["bottom"] -= label_height + this.#padding;
			this.#bar_scale = (raw_bar_area_height - label_height - this.#padding) / this.#max_value;

			this.#rotated_labels = false;
			if(longest_label_text_width>= this.#bar_width) this.#rotated_labels = true;
			if(this.#rotated_labels == true){
				this.#paddings["bottom"] -= longest_label_text_width - label_height;
				this.#bar_scale = (raw_bar_area_height - longest_label_text_width - this.#padding) / this.#max_value;
			}
		}

		this.#y_axis_marker_gap = (this.#paddings["bottom"] - this.#paddings["top"]) / (this.#y_axis_marker_count - 1);
		this.#y_axis_step_value = this.#max_value / (this.#y_axis_marker_count - 1);

		// If sorted
		if(this.#data["sorted"] == true) this.#data["bars"].sort((a, b) => b["value"] - a["value"]);
	}

	#init_bars(){
		const sorted_bar_values = [];
		this.#total_value = 0;
		for(const bar of this.#data["bars"]){
			this.#total_value += bar["value"];
			sorted_bar_values.push(bar["value"]);
		}
		sorted_bar_values.sort((a, b) => b - a);

		this.#bars = [];
		for(let i = 0; i < this.#data["bars"].length; i++){
			// Prevent minus values
			let bar_value = this.#data["bars"][i]["value"] > 0 ? this.#data["bars"][i]["value"] : 0;

			let x = i * this.#bar_width + this.#bar_gap + this.#paddings["left"];
			let y = this.#paddings["bottom"] - (bar_value * this.#bar_scale);
			let height = bar_value * this.#bar_scale;
			let width = this.#bar_width - this.#bar_gap;

			const index_of_this_value = sorted_bar_values.indexOf(this.#data["bars"][i]["value"]);
			const saturation = 20 + (60 / (this.#data["bars"].length)) * index_of_this_value;
			const lightness = 20 + (60 / (this.#data["bars"].length)) * index_of_this_value;

			let bar_percentage = ((this.#data["bars"][i]["value"] / this.#total_value) * 100).toFixed(1);

			let display_value = '';
			if("values" in this.#data["bar"]){
				if(this.#data["bar"]["values"]["numeric"] == true && this.#data["bar"]["values"]["percentage"] == true) display_value = `${this.#data["bars"][i]["value"]} (${bar_percentage})%`;
				else if(this.#data["bar"]["values"]["percentage"] == true) display_value = `${bar_percentage}%`;
				else if(this.#data["bar"]["values"]["numeric"] == true) display_value = `${this.#data["bars"][i]["value"]}`;
			}

			this.#bars.push({
				x: x,
				y: y,
				width: width,
				height: height,
				label: this.#data["bars"][i]["label"],
				value: this.#data["bars"][i]["value"],
				display_value: display_value,
				color: `hsl(${this.#hue}, ${saturation}%, ${lightness}%)`,
				radius: this.#border_radius
			});
		}
	}

	#draw_bars(){
		for(const bar of this.#bars){
			this.#ctx.beginPath()
			this.#ctx.fillStyle = bar["color"];
			this.#ctx.strokeStyle = bar["color"];
			this.#ctx.roundRect(bar["x"], bar["y"], bar["width"], bar["height"], this.#border_radius);
			this.#ctx.fill()
			this.#ctx.stroke()
			this.#ctx.closePath()
		}
	}

	#draw_x_axis_line(){
		if(!("x_axis" in this.#data) || this.#data["x_axis"]["line"] == false) return;

		this.#ctx.beginPath();
		this.#ctx.setLineDash([this.#data["x_axis"]["line_dash"] || 0]);
		this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings["right"], this.#paddings.bottom);

		this.#ctx.strokeStyle = this.#data["x_axis"]["color"] || this.#x_axis_color;
		this.#ctx.lineWidth = 2;
		this.#ctx.stroke();
	}

	#draw_x_axis_markers(){
		if(!("x_axis" in this.#data) || this.#data["x_axis"]["markers"] == false) return;

		for (const bar of this.#bars) {
			let x = bar["x"] + this.#bar_width/2;
			let y = bar["y"] + bar["height"] + this.#padding;

			this.#ctx.textBaseline = "middle";
			this.#ctx.textAlign = "right";
			this.#ctx.font = `1em ${this.#font_family}`;
			this.#ctx.fillStyle = this.#text_color;

			if(this.#rotated_labels == true){
				this.#ctx.save();
				this.#ctx.translate(x - this.#bar_gap, y);
				this.#ctx.rotate(Math.PI / 2);
				this.#ctx.textAlign = "left";
				this.#ctx.fillText(bar["label"], 0, 0);
				this.#ctx.restore();
			}

			else{
				this.#ctx.textAlign = "center";
				this.#ctx.fillText(bar["label"], x, y);
			}
			x += this.#bar_width;
		}
	}

	#draw_x_axis_grid_lines(){
		if(!("grid" in this.#data)) return;

		this.#ctx.setLineDash([this.#data["grid"]["line_dash"] || 0]);
		this.#ctx.lineWidth = 0.5;
		this.#ctx.strokeStyle = this.#data["grid"]["color"] || this.#y_axis_color;

		for (let i = 0; i < this.#y_axis_marker_count; i++) {
			let y = this.#y_axis_marker_gap * i + this.#padding;

			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings["left"], y);
			this.#ctx.lineTo(this.#paddings["right"], y);
			this.#ctx.stroke();
		}
	}

	#draw_y_axis_line(){
		if(!("y_axis" in this.#data) || this.#data["y_axis"]["line"] == false) return;

		this.#ctx.beginPath();
		this.#ctx.setLineDash([this.#data["y_axis"]["line_dash"] || 0]);
		this.#ctx.moveTo(this.#paddings["left"], this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings["left"], this.#paddings.top);

		this.#ctx.strokeStyle = this.#data["y_axis"]["color"] || this.#y_axis_color;
		this.#ctx.lineWidth = 2;
		this.#ctx.stroke();
		this.#ctx.closePath();
	}

	#draw_y_axis_markers(){
		if(!("y_axis" in this.#data) || this.#data["y_axis"]["markers"] == false) return;

		for (let i = 0; i < this.#y_axis_marker_count; i++) {
			this.#ctx.textBaseline = "middle";
			this.#ctx.textAlign = "right";
			this.#ctx.font = `1em ${this.#font_family}`;
			this.#ctx.fillStyle = this.#text_color;

			let value = (this.#max_value - i * this.#y_axis_step_value).toFixed(0);
			let y = this.#y_axis_marker_gap * i + this.#padding;
			let x = this.#paddings["left"] - this.#padding;

			this.#ctx.fillText(value, x, y);
		}
	}

	#init_on_hover_bar(){
		this.#canvas.addEventListener("mousemove", (event)=>{
			const rect = this.#canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			let hovered_bar= null;
			for(const bar of this.#bars) if(x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) hovered_bar = bar;

			if(hovered_bar != null){
				let tooltip_height = this.#tooltip.getBoundingClientRect().height;
				this.#tooltip.style.display = "block";
				this.#tooltip.style.left = event.pageX + "px";
				this.#tooltip.style.top = event.pageY - tooltip_height - 5 + "px";
				this.#tooltip.textContent = `${hovered_bar.label}${hovered_bar["display_value"] && ": " + hovered_bar["display_value"]}`;
			}else this.#tooltip.style.display = "none";
		});
	}
}

window.customElements.define("x-bar-y-chart", Bar_y);
