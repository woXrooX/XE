export default class Bar extends HTMLElement {
	#data;
	#canvas;
	#ctx;
	#tooltip;

	#text_color = getComputedStyle(document.querySelector(":root")).getPropertyValue("--color-text-primary");
	#font_family = "Quicksand";
	#hue = "230deg";
	#x_axis_color = "black";
	#y_axis_color = "black";
	#rotation_needed = false;

	#max_value = 0;
	#padding = 20;
	#paddings = {};
	#y_axis_marker_count = 5;
	#gap_y_axis_markers = 0;
	#y_axis_step_value = 0;

	#bars = [];
	#total_value = 0;
	#bar_width = 60;
	#bar_gap = 10;
	#border_radius = 5;
	#bar_scale = 0;
	#canvas_DPI_width;
	#canvas_DPI_height;

	#parent_node_height;

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
			div#XE_charts_bar_tooltip{
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
		this.#tooltip.setAttribute("id", "XE_charts_bar_tooltip");
		this.shadow.appendChild(this.#tooltip);

		// Canvas element
		this.#canvas = document.createElement("canvas");
		this.shadow.appendChild(this.#canvas);
		this.#ctx = this.#canvas.getContext("2d");

		this.#resize_observer();

		this.#init_draw_canvas();

		this.#init_on_hover_pie();
	}

	////// APIs
	#resize_observer(){
		const resize_observer_object = new ResizeObserver(this.#init_draw_canvas);
		resize_observer_object.observe(this.parentNode);
	}

	#init_draw_canvas = ()=>{
		this.#set_up_canvas();
		this.#init_values();

		this.#draw_x_axis_markers();
		this.#draw_y_axis_markers();
		this.#draw_y_axis_marker_lines();

		this.#draw_opacity();
		this.#init_bars();
		this.#draw_bars();
		this.#draw_bar_values();

		this.#draw_x_axis_line();
		this.#draw_y_axis_line();
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

		this.#canvas_DPI_width = css_width;
		this.#canvas_DPI_height = css_height;

		this.#parent_node_height = getComputedStyle(this.parentNode).height;

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
		if("background" in this.#data) this.#canvas.style.background = this.#data["background"];

		if(this.#max_value == 0) for(const bar of this.#data["bars"]) if(bar["value"] > this.#max_value) this.#max_value = bar["value"];
		let max_value_width = this.#ctx.measureText(this.#max_value).width;

		this.#paddings = {
			top: this.#padding,
			right: this.#canvas_DPI_width - this.#padding,
			bottom: this.#canvas_DPI_height - this.#padding,
			left: this.#padding
		};

		let longest_label = [...this.#data["bars"]].sort((a, b) => b["label"].length - a["label"].length)[0]["label"];
		let longest_label_width = this.#ctx.measureText(longest_label).width;

		this.#bar_gap = this.#parent_node_height * 0.01 > 5 ? this.#parent_node_height * 0.01 : 5;

		if(this.#data["direction"] == "y"){
			this.#bar_scale = (this.#canvas_DPI_width - this.#padding * 2) / this.#max_value;

			let bar_text_width = 0;
			if(this.#data["bar"]["percentage"] == true && this.#data["bar"]["values"]){
				bar_text_width = (max_value_width * 2) + 80;
			}else if(this.#data["bar"]["percentage"] == true){
				bar_text_width = 50;
			}else{
				bar_text_width = max_value_width * 2;
			}

			if(this.#data["bar"]["values"] == true || this.#data["bar"]["percentage"] == true){
				this.#paddings["right"] -= bar_text_width;
				this.#bar_scale = (this.#canvas_DPI_width - this.#padding * 2 - bar_text_width) / this.#max_value;
			}

			if("x_axis" in this.#data && this.#data["x_axis"]["markers"] == true){
				this.#paddings["left"] += longest_label_width*2 + this.#padding;
				this.#bar_scale = (this.#canvas_DPI_width - this.#paddings["left"] - this.#padding) / this.#max_value;

				if(this.#data["bar"]["values"] == true || this.#data["bar"]["percentage"] == true)
					this.#bar_scale = (this.#canvas_DPI_width - this.#paddings["left"] - this.#padding - bar_text_width) / this.#max_value;
			}

			if("y_axis" in this.#data && this.#data["y_axis"]["markers"] == true) this.#paddings["bottom"] -= max_value_width;

			this.#bar_width = (this.#paddings.bottom - this.#bar_gap - this.#paddings["top"]) / this.#data["bars"].length;
			this.#gap_y_axis_markers = (this.#paddings["right"] - this.#paddings["left"]) / (this.#y_axis_marker_count - 1);
			this.#y_axis_step_value = this.#max_value / (this.#y_axis_marker_count - 1);
		}
		else{
			this.#bar_scale = (this.#canvas_DPI_height - this.#padding * 2) / this.#max_value;

			if("x_axis" in this.#data && this.#data["x_axis"]["markers"] == true){
				this.#paddings["bottom"] -= max_value_width;
				this.#bar_scale = (this.#canvas_DPI_height - this.#padding * 2 - max_value_width) / this.#max_value;

				this.#rotation_needed = false;
				for(const bar of this.#data["bars"]) if(this.#ctx.measureText(bar["label"]).width*2 >= this.#bar_width) this.#rotation_needed = true;
				if(this.#rotation_needed == true){
					this.#paddings["bottom"] -= longest_label_width*2 + this.#padding;
					this.#bar_scale = (this.#canvas_DPI_height - this.#padding * 3 - max_value_width - longest_label_width * 2) / this.#max_value;
				}
			}

			if("y_axis" in this.#data && this.#data["y_axis"]["markers"] == true) this.#paddings["left"] += max_value_width * 2;

			this.#bar_width = (this.#paddings["right"] - this.#bar_gap - this.#paddings["left"]) / this.#data["bars"].length;
			this.#gap_y_axis_markers = (this.#paddings["bottom"] - this.#padding) / (this.#y_axis_marker_count - 1);
			this.#y_axis_step_value = this.#max_value / (this.#y_axis_marker_count - 1);
		}

		if(this.#data["sorted"] == true) this.#data["bars"].sort((a, b) => b["value"] - a["value"]);

		if("bar" in this.#data && "radius" in this.#data["bar"]) this.#border_radius = this.#data["bar"]["radius"];
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
		let x = 0;
		let y = 0;
		let height = 0;
		let width = 0;
		for(let i = 0; i < this.#data["bars"].length; i++){
			let bar_value = this.#data["bars"][i]["value"] > 0 ? this.#data["bars"][i]["value"] : 0;

			if(this.#data["direction"] == "y"){
				y = i * this.#bar_width + this.#bar_gap + this.#paddings["top"];
				x = this.#paddings["left"];
				height = this.#bar_width - this.#bar_gap;
				width = bar_value * this.#bar_scale;
			}else{
				x = i * this.#bar_width + this.#bar_gap + this.#paddings["left"];
				y = this.#paddings["bottom"] - (bar_value * this.#bar_scale);
				height = bar_value * this.#bar_scale;
				width = this.#bar_width - this.#bar_gap;
			}

			const index_of_this_value = sorted_bar_values.indexOf(this.#data["bars"][i]["value"]);
			const saturation = 20 + (60 / (this.#data["bars"].length)) * index_of_this_value;
			const lightness = 20 + (60 / (this.#data["bars"].length)) * index_of_this_value;

			this.#bars.push({
				x: x,
				y: y,
				width: width,
				height: height,
				label: this.#data["bars"][i]["label"],
				value: this.#data["bars"][i]["value"],
				percent: ((this.#data["bars"][i]["value"] / this.#total_value) * 100).toFixed(1),
				color: `hsl(${this.#hue}, ${saturation}%, ${lightness}%)`,
				hovered: false,
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

	#draw_bar_values(){
		if(this.#data["direction"] != "y" || this.#data["bar"]["values"] != true && this.#data["bar"]["percentage"] != true) return;

		for(let i = 0; i < this.#bars.length; i++){
			let text = '';
			if(this.#data["bar"]["percentage"] == true && this.#data["bar"]["values"]){
				text = `${this.#bars[i]["value"]} (${this.#bars[i]["percent"]})%`;
			}else if(this.#data["bar"]["percentage"] == true){
				text = `${this.#bars[i]["percent"]}%`;
			}else{
				text = this.#bars[i]["value"];
			}

			let x = this.#bars[i]["width"] + this.#paddings["left"] + this.#bar_gap*2;
			let y = this.#bars[i]["y"];

			this.#ctx.globalAlpha = 1;
			this.#ctx.textBaseline = "middle";
			this.#ctx.textAlign = "left";
			this.#ctx.font = `1em ${this.#font_family}`;
			this.#ctx.fillStyle = this.#text_color;

			y += this.#bar_width/2 - this.#bar_gap/2;
			this.#ctx.fillText(text, x, y);

			y += this.#bar_width;
		}
	}

	#draw_opacity(){
		if(!("opacity" in this.#data) || this.#data["opacity"] != true) return;
		this.#ctx.globalAlpha = 0.8;
		this.#ctx.lineWidth = 3;
	}

	#draw_x_axis_line(){
		if(!("x_axis" in this.#data) || this.#data["x_axis"]["line"] == false) return;
		if("color" in this.#data["x_axis"]) this.#x_axis_color = this.#data["x_axis"]["color"];

		this.#ctx.beginPath();
		this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings["right"], this.#paddings.bottom);

		this.#ctx.strokeStyle = this.#x_axis_color;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}

	#draw_x_axis_markers(){
		if(this.#data["x_axis"]["markers"] != true) return;

		for (let i = 0; i < this.#bars.length; i++) {
			this.#ctx.textBaseline = "middle";
			this.#ctx.font = `1em ${this.#font_family}`;
			this.#ctx.fillStyle = this.#text_color;

			if(this.#data["direction"] == "y"){
				let x = this.#bars[i]["x"] - this.#padding;
				let y = this.#bars[i]["y"] + this.#bar_width/2;

				this.#ctx.textAlign = "right";
				this.#ctx.fillText(this.#bars[i]["label"], x, y);
				y += this.#bar_width;
			}else{
				let x = this.#bars[i]["x"] + this.#bar_width/2;
				let y = this.#bars[i]["y"] + this.#bars[i]["height"] + this.#padding;

				if(this.#rotation_needed == true){
					this.#ctx.save();
					this.#ctx.translate(x, y);
					this.#ctx.rotate(Math.PI / 2);
					this.#ctx.textAlign = "left";
					this.#ctx.fillText(this.#bars[i]["label"], 0, 0);
					this.#ctx.restore();
				}else{
					this.#ctx.textAlign = "center";
					this.#ctx.fillText(this.#bars[i]["label"], x, y);
				}
				x += this.#bar_width;
			}
		}
	}

	#draw_y_axis_line(){
		if(!("y_axis" in this.#data) || this.#data["y_axis"]["line"] == false) return;
		if("color" in this.#data["y_axis"]) this.#y_axis_color = this.#data["y_axis"]["color"];

		this.#ctx.beginPath();
		this.#ctx.moveTo(this.#paddings["left"], this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings["left"], this.#paddings.top);

		this.#ctx.strokeStyle = this.#y_axis_color;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
		this.#ctx.closePath();
	}

	#draw_y_axis_markers(){
		if(this.#data["y_axis"]["markers"] != true) return;

		for (let i = 0; i < this.#y_axis_marker_count; i++) {
			if(this.#data["direction"] == "y"){
				this.#ctx.textBaseline = "top";
				this.#ctx.textAlign = "center";
				this.#ctx.font = `1em ${this.#font_family}`;
				this.#ctx.fillStyle = this.#text_color;

				let value = (this.#max_value - i * this.#y_axis_step_value).toFixed(0);
				this.#ctx.fillText(value, i * this.#gap_y_axis_markers + this.#paddings["right"] - (this.#gap_y_axis_markers * 2 * i), this.#paddings["bottom"] + this.#ctx.measureText(this.#max_value).width/2);
			}else{
				this.#ctx.textBaseline = "middle";
				this.#ctx.textAlign = "center";
				this.#ctx.font = `1em ${this.#font_family}`;
				this.#ctx.fillStyle = this.#text_color;

				let value = (this.#max_value - i * this.#y_axis_step_value).toFixed(0);
				this.#ctx.fillText(value, this.#paddings["left"] - this.#ctx.measureText(this.#max_value).width, i * this.#gap_y_axis_markers + this.#padding);
			}

		}
	}

	#draw_y_axis_marker_lines(){
		if(this.#data["y_axis"]["marker_lines"] != true) return;

		this.#ctx.lineWidth = 0.5;
		this.#ctx.strokeStyle = this.#y_axis_color;

		for (let i = 0; i < this.#y_axis_marker_count; i++) {
			if(this.#data["direction"] == "y"){
				this.#ctx.beginPath();
				this.#ctx.moveTo(this.#gap_y_axis_markers * i + this.#paddings["right"] - (this.#gap_y_axis_markers * 2 * i), this.#paddings["top"]);
				this.#ctx.lineTo(this.#gap_y_axis_markers * i + this.#paddings["right"] - (this.#gap_y_axis_markers * 2 * i), this.#paddings["bottom"]);
				this.#ctx.stroke();
			}else{
				this.#ctx.beginPath();
				this.#ctx.moveTo(this.#paddings["left"], this.#gap_y_axis_markers * i + this.#padding);
				this.#ctx.lineTo(this.#paddings["right"], this.#gap_y_axis_markers * i + this.#padding);
				this.#ctx.stroke();
			}

		}
	}

	#init_on_hover_pie(){
		this.#canvas.addEventListener("mousemove", (event)=>{
			const rect = this.#canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			let needs_redraw = false;
			let hovered_bar= null;
			for(const bar of this.#bars){
				const is_hovered = x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height;

				if(bar.hovered !== is_hovered){
					bar.hovered = is_hovered;
					needs_redraw = true;
				}

				if(is_hovered == true) hovered_bar = bar;
			}

			if(hovered_bar != null){
				let tooltip_height = this.#tooltip.getBoundingClientRect().height;

				let text = hovered_bar["value"];
				if(this.#data["bar"]["percentage"] == true && this.#data["bar"]["values"]){
					text = `${hovered_bar["value"]} (${hovered_bar["percent"]})%`;
				}else if(this.#data["bar"]["percentage"] == true){
					text = `${hovered_bar["percent"]}%`;
				}

				this.#tooltip.style.display = "block";
				this.#tooltip.style.left = event.pageX + "px";
				this.#tooltip.style.top = event.pageY - tooltip_height - 5 + "px";
				this.#tooltip.textContent = `${hovered_bar.label}: ${text}`;
			}else this.#tooltip.style.display = "none";

			if(needs_redraw) this.#init_draw_canvas();
		});
	}
}

window.customElements.define("x-bar-chart", Bar);
