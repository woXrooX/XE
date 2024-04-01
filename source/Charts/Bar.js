export default class Bar extends HTMLElement {
	#data;
	#canvas;
	#ctx;
	
	#textColor = "black";
	#mainAxisColor = "black";
	#fontSize = 11;
	
	#padding = 50;
	#paddings;
	#minValue = Infinity;
	#maxValue = -Infinity;
	#gapYAxis = 0;
	#scaleY;
	#markerSize = 10;
	#markerCountYAxis = 10;
	#YAxisStepValue;
	#parentElement = null;

	#ValuesArr = []
	#barWidth = 0;
	#barGap = 0;
	#total_width_of_bars = 0;
	
	constructor() {
		super();
		
		this.shadow = this.attachShadow({ mode: 'closed' });
		this.#data = JSON.parse(this.innerHTML);
		this.#parentElement = this.parentNode;
		
		// Style element
		const style = document.createElement('style');
		style.textContent = `
			canvas{
				max-width: 100vw;
				max-height: 100vh;
			}
		`;
		this.shadow.appendChild(style);
		
		// Marker count Y axis
		if ("yAxis" in this.#data && "markerCount" in this.#data["yAxis"]) this.#markerCountYAxis = this.#data["yAxis"]["markerCount"];
		
		// Canvas element
		this.shadow.appendChild(document.createElement("canvas"));
		this.#canvas = this.shadow.querySelector("canvas");
		this.#ctx = this.#canvas.getContext('2d');
		
		this.#resizeObserver();
	}
	
	// APIs
	#draw = () => {
		this.#updateColors();
		this.#setUpCanvas();
		this.#setValues();
		
		this.#drawTitle();
		
		if ("legends" in this.#data && this.#data["legends"] === true) this.#drawLegends();
		
		if ("yAxis" in this.#data && "label" in this.#data["yAxis"] && this.#data["yAxis"]["label"]) {
			this.#drawMainYAxis();
			this.#drawMainXAxis();

			this.#drawMarkersYAxis();
		}

		if ("yAxisLines" in this.#data && this.#data["yAxisLines"] === true) this.#drawXLines()
		
		this.#drawBars();
		this.#drawTooltip();
	}
	
	////// Helpers
	#resizeObserver() {
		const resizeObserver = new ResizeObserver(this.#draw);
		resizeObserver.observe(this.#parentElement);
	}
	
	#updateColors() {
		this.#textColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");
		this.#mainAxisColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");
	}
	
	#setUpCanvas() {
		this.#canvas.width = this.#parentElement.clientWidth;
		this.#canvas.height = this.#parentElement.clientWidth / 2;
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}
	
	#setValues() {
		if (this.#ValuesArr.length === 0) {
			for (let i = 0; i < this.#data["data"].length; i++) {
				this.#ValuesArr.push(this.#data["data"][i]["value"])
			}
		}
		
		this.#minValue = Math.min(...this.#ValuesArr);
		this.#maxValue = Math.max(...this.#ValuesArr);
		
		this.#paddings = {
			top: this.#padding,
			right: this.#canvas.width - this.#padding,
			bottom: this.#canvas.height - this.#padding,
			left: this.#padding
		};

		this.#gapYAxis = (this.#paddings.bottom - this.#padding) / (this.#markerCountYAxis - 1);
		this.#scaleY = (this.#canvas.height - this.#padding * 2) / (this.#maxValue - this.#minValue);

		this.#YAxisStepValue = (this.#maxValue - this.#minValue) / (this.#markerCountYAxis - 1);

		this.#barWidth = this.#canvas.width / 15;
		this.#barGap = this.#barWidth / 15;
		this.#total_width_of_bars = (this.#barWidth + this.#barGap) * (this.#ValuesArr.length + 1) + this.#padding;
	}
	
	#drawTitle() {
		this.#ctx.fillStyle = this.#textColor;
		this.#ctx.textAlign = "center";
		this.#ctx.font = "bold 16px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
		this.#ctx.fillText(this.#data.title, this.#canvas.width / 2, this.#paddings.top / 2);
	}
	
	#drawMainXAxis(){
		this.#ctx.beginPath();

		this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);

		this.#ctx.strokeStyle = this.#mainAxisColor;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}
	
	#drawMainYAxis() {
		this.#ctx.beginPath();
		
		let startY = this.#paddings.top;
		let endY = this.#paddings.bottom;
		
		this.#ctx.moveTo(this.#paddings.left, startY);
		this.#ctx.lineTo(this.#paddings.left, endY);
		
		this.#ctx.strokeStyle = this.#mainAxisColor;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}
	
	#drawMarkersYAxis(){
		for(let i = 0; i < this.#markerCountYAxis; i++){
			this.#ctx.textAlign = "right";
			this.#ctx.fillStyle = this.#textColor;
			this.#ctx.font = " 11px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
			this.#ctx.textBaseline = "middle";
			this.#ctx.fillText((this.#maxValue - i * this.#YAxisStepValue).toFixed(1), this.#paddings.left - this.#markerSize * 1.5, i * this.#gapYAxis + this.#padding);
		}
	}

	#drawXLines(){
		this.#ctx.strokeStyle = "gray";
		this.#ctx.lineWidth = 0.5;

		for (let i = 0; i < this.#markerCountYAxis; i++) {
			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left - this.#markerSize, this.#gapYAxis * i + this.#padding);
			this.#ctx.lineTo(this.#paddings.right, this.#gapYAxis * i + this.#padding);
			this.#ctx.stroke();
		}
	}
	
	#drawBars() {
		for (let i = 0; i < this.#ValuesArr.length; i++) {

			let y = this.#paddings.bottom - (this.#ValuesArr[i] - this.#minValue) * this.#scaleY;

			let height;
			this.#minValue > 0 ? height = (this.#ValuesArr[i] - this.#minValue) * this.#scaleY : height = (this.#ValuesArr[i]) * this.#scaleY;

			const x = (i * this.#barWidth + this.#padding) + (this.#canvas.width / 2) - (this.#total_width_of_bars / 2);

			this.#ctx.beginPath()
			this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? "#DAE6E5";
			this.#ValuesArr[i] == this.#minValue ? y = y - this.#barGap : y
			
			this.#ctx.roundRect(x + this.#barGap, y, this.#barWidth - this.#barGap, height - this.#barGap, this.#barGap * 2); 
			this.#ctx.fill()
		}
	}

	
	#drawLegends() {
		const posY = this.#paddings.bottom + this.#padding / 2;

		let startX = this.#paddings.left;

		for (let i = 0; i < this.#data["data"].length; i++) startX = this.#ctx.measureText(this.#data["data"][i]["label"]).width + (this.#barWidth / 2) + (this.#canvas.width / 2) - (this.#total_width_of_bars / 2);

		this.#ctx.save()
		for (let i = 0; i < this.#data["data"].length; i++) {
			this.#ctx.textBaseline = "center";
			this.#ctx.textAlign = "center";
			this.#ctx.font = `bold ${this.#fontSize}px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`;;
			this.#ctx.fillText(this.#data["data"][i]["label"], startX, posY);
			

			startX += this.#barWidth;
		}
	}

	#drawTooltip() {
		this.#canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
	}

	handleMouseMove(e) {
		const rect = this.#canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		const { mouse_in_position, data, pos_x, pos_y, bar_height} = this.getTooltipData(mouseX, mouseY);

		if (mouse_in_position !== undefined && data !== null) {
			this.#showTooltip(data, pos_x, pos_y, rect, bar_height);
		} else {
			this.#hideTooltip();
		}
	}

	getTooltipData(mouseX, mouseY) {
		let mouse_in_position, data, pos_x, pos_y, bar_height;

		for (let i = 0; i < this.#ValuesArr.length; i++) {
			
			const y = this.#paddings.bottom - (this.#ValuesArr[i] - this.#minValue) * this.#scaleY;

			const x = (i * this.#barWidth + this.#padding) + (this.#canvas.width / 2) - (this.#total_width_of_bars / 2);
			
			let height;
			this.#minValue > 0 ? height = (this.#ValuesArr[i] - this.#minValue) * this.#scaleY : height = (this.#ValuesArr[i]) * this.#scaleY;
			
			let condition;
			this.#ValuesArr[i] > 0 ? condition = mouseY >= y && mouseY <= y + height: condition = mouseY <= y && mouseY >= y + height

			if (mouseX >= x && mouseX <= x + this.#barWidth && condition) {
				mouse_in_position = true,
				data = this.#ValuesArr[i],
				pos_x = x,
				pos_y = y,
				bar_height = height
			}
		}
		return { mouse_in_position, data, pos_x, pos_y, bar_height}
	}

	#showTooltip(data, x, y, canvasRect, height) {

		let tooltipEl = this.getOrCreateTooltipElement();

		tooltipEl.style.opacity = 1;
		tooltipEl.style.border = `2px solid #222`;
		tooltipEl.style.background = "rgba(0, 0, 0, 0.7)";
		tooltipEl.style.borderRadius = "4px";
		tooltipEl.style.transition = "all 0.3s ease";
		tooltipEl.style.position = "absolute";

		const tooltipWidth = tooltipEl.offsetWidth;
		const tooltipHeight = tooltipEl.offsetHeight;
		const canvasLeft = canvasRect.left;
		let canvasTop = canvasRect.top;
		canvasTop == 44 ? canvasTop = 0 : canvasTop


		tooltipEl.style.left = `${canvasLeft + x + this.#barWidth / 2 - tooltipWidth / 2}px`;
		
		let top;
		data > 0 ? top = `${canvasTop + y - tooltipHeight - 10}px`: top = `${canvasTop + y - tooltipHeight - 20 + height}px`
		
		tooltipEl.style.top = top;

		tooltipEl.style.listStyle = "none"
		tooltipEl.style.padding = "1px 3px"
		tooltipEl.style.margin = 0

		tooltipEl.innerHTML = `<li>${data}</li>`;

		this.#drawBars()

		this.#ctx.beginPath()
		this.#ctx.globalAlpha = 1;

		this.#ctx.fillStyle = "#BCC7C6";
		data == this.#minValue ? y = y - this.#barGap : y
		this.#ctx.roundRect(x + this.#barGap, y, this.#barWidth - this.#barGap, height - this.#barGap, this.#barGap * 2);
		this.#ctx.fill()
	}

	getOrCreateTooltipElement() {
		let tooltipEl = this.#ctx.canvas.parentNode.querySelector('div');

		if (!tooltipEl) {
			tooltipEl = document.createElement("div");
			this.#canvas.parentNode.appendChild(tooltipEl);
		}

		return tooltipEl;
	}

	#hideTooltip() {
		let tooltipEl = this.#ctx.canvas.parentNode.querySelector('div');
		if (tooltipEl) {
			tooltipEl.style.opacity = 0;
		}

		this.#drawBars()
	}
	
}
	window.customElements.define('x-bar-chart', Bar);