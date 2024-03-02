export default class Line extends HTMLElement{
	#data;
	#canvas;
	#ctx;

	#textColor = "black";
	#gridColor = "gray";
	#mainAxisColor ="black";

	#padding = 50;
	#paddings;
	#minValue = Infinity;
	#maxValue = -Infinity;
	#longestDataset = 0;
	#gapXAxis = 0;
	#gapYAxis = 0;
	#scaleY;
	#markerSize = 10;
	#markerCountYAxis = 10;
	#YAxisStepValue;
	#circleRad = 4;
	#gridLineWidth = 0.1;
	#parentElement = null;

	#tooltipElement = null;


	constructor(){
		super();

		this.shadow = this.attachShadow({mode: 'closed'});
		this.#data = JSON.parse(this.innerHTML);
		this.#parentElement = this.parentNode;

		// Style element
		const style = document.createElement('style');
		style.textContent = `
			canvas{
				max-width: 100vw;
				max-height: 100vh;
			}

			div{
				pointer-events: none;
				opacity: 0;
				background: rgba(0, 0, 0, 0.7);
				border-radius: 4px;
				box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.5);
				transition: 0.3s ease-in-out;
				transition-property: opacity, background, top, left;
				position: absolute;
				padding: 4px 8px;
			}
		`;
		this.shadow.appendChild(style);

		// Marker count Y axis
		if("yAxis" in this.#data && "markerCount" in this.#data["yAxis"]) this.#markerCountYAxis = this.#data["yAxis"]["markerCount"];

		// Canvas element
		this.shadow.appendChild(document.createElement("canvas"));
		this.#canvas = this.shadow.querySelector("canvas");
		this.#ctx = this.#canvas.getContext('2d');

		// Tooltip element
		this.shadow.appendChild(document.createElement("div"));
		this.#tooltipElement = this.shadow.querySelector("div");

		this.#resizeObserver();
	}

	// APIs
	#draw = ()=>{
		this.#updateColors();
		this.#setUpCanvas();
		this.#setValues();

		this.#drawTitle();

		if("legends" in this.#data && this.#data["legends"] === true) this.#drawLegends();
		if("grid" in this.#data){
			if("horizontal" in this.#data["grid"] && this.#data["grid"]["horizontal"]) this.#drawXLines();
			if("vertical" in this.#data["grid"] && this.#data["grid"]["vertical"]) this.#drawYLines();
		}

		if("fillType" in this.#data){
			if(this.#data["fillType"] === "plain" || this.#data["fillType"] === "opacity") this.#drawOpacityOrPlainBackground();
			if(this.#data["fillType"] === "gradient") this.#drawGradientBackground();
		}

		if("xAxis" in this.#data && "label" in this.#data["xAxis"] && this.#data["xAxis"]["label"]){
			this.#drawMainXAxis();
			this.#drawMarkersXAxis();
		}

		if("yAxis" in this.#data && "label" in this.#data["yAxis"] && this.#data["yAxis"]["label"]){
			this.#drawMainYAxis();
			this.#drawMarkersYAxis();
		}

		this.#drawLines();
		if("dataPoints" in this.#data && this.#data["dataPoints"] === true) this.#drawCircle();

		if("tooltip" in this.#data && this.#data["tooltip"] === true) this.#drawTooltip();
	}

	////// Helpers
	#resizeObserver(){
		const resizeObserver = new ResizeObserver(this.#draw);
		resizeObserver.observe(this.#parentElement);
	}

	#updateColors(){
		this.#textColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");
		this.#gridColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-secondary");
		this.#mainAxisColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");
	}

	#setUpCanvas(){
		this.#canvas.width = this.#parentElement.clientWidth;
		this.#canvas.height = this.#parentElement.clientWidth / 2;
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	#setValues(){
		// Finding min max
		for(let i = 0; i < this.#data["data"].length; i++){
			const min = Math.min(...this.#data["data"][i]["values"]);
			const max = Math.max(...this.#data["data"][i]["values"]);
			if(min < this.#minValue) this.#minValue = min;
			if(max > this.#maxValue) this.#maxValue = max;

			// Longest dataset
			if(this.#data["data"][i]["values"].length > this.#longestDataset) this.#longestDataset = this.#data["data"][i]["values"].length;
		}

		this.#paddings = {
			top: this.#padding,
			right: this.#canvas.width - this.#padding,
			bottom: this.#canvas.height - this.#padding,
			left: this.#padding
		};

		this.#gapXAxis = (this.#paddings.right - this.#padding) / (this.#longestDataset - 1);
		this.#gapYAxis = (this.#paddings.bottom - this.#padding) / (this.#markerCountYAxis - 1);
		this.#scaleY = (this.#canvas.height - this.#padding * 2) / (this.#maxValue - this.#minValue);

		this.#YAxisStepValue = (this.#maxValue - this.#minValue) / (this.#markerCountYAxis - 1);
	}

	#drawTitle(){
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

	#drawMainYAxis(){
		this.#ctx.beginPath();

		this.#ctx.moveTo(this.#paddings.left, this.#paddings.top);
		this.#ctx.lineTo(this.#paddings.left, this.#paddings.bottom);

		this.#ctx.strokeStyle = this.#mainAxisColor;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}

	#drawMarkersXAxis(){
		for(let i = 0; i < this.#longestDataset; i++){
			const x = i * this.#gapXAxis + this.#padding;

			this.#ctx.textAlign = "center";
			this.#ctx.font = " 11px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
			this.#ctx.fillStyle = this.#textColor;
			this.#ctx.fillText(i, x, this.#paddings.bottom + this.#markerSize * 1.5);
		}
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
		this.#ctx.strokeStyle = this.#gridColor;
		this.#ctx.lineWidth = this.#gridLineWidth;

		for (let i = 0; i < this.#markerCountYAxis; i++) {
			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left - this.#markerSize, this.#gapYAxis * i + this.#padding);
			this.#ctx.lineTo(this.#paddings.right, this.#gapYAxis * i + this.#padding);
			this.#ctx.stroke();
		}
	}

	#drawYLines(){
		this.#ctx.strokeStyle = this.#gridColor;
		this.#ctx.lineWidth = this.#gridLineWidth;

		for(let i = 0; i < this.#longestDataset; i++){
			const x = i * this.#gapXAxis + this.#padding;
			this.#ctx.beginPath();
			this.#ctx.moveTo(x, this.#paddings.top);
			this.#ctx.lineTo(x, this.#paddings.bottom + this.#markerSize);
			this.#ctx.stroke();
		}
	}

	#drawLines(){
		this.#ctx.lineWidth = 2;

		for(let i = 0; i < this.#data["data"].length; i++){
			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom - (this.#data["data"][i]["values"][0] - this.#minValue) * this.#scaleY);
			this.#ctx.strokeStyle = this.#data["data"][i]["color"] ?? this.#textColor;

			for(let j = 0; j < this.#data["data"][i]["values"].length; j++){
				this.#ctx.lineTo(
					j * this.#gapXAxis + this.#padding,
					this.#paddings.bottom - (this.#data["data"][i]["values"][j] - this.#minValue) * this.#scaleY
				);
			}

			this.#ctx.stroke();
		}
	}

	#drawCircle(){
		for (let i = 0; i < this.#data["data"].length; i++) {
			const values = this.#data["data"][i]["values"];

			for(let j = 0; j < values.length; j++){
				const x = j * this.#gapXAxis + this.#padding;
				const y = this.#paddings.bottom - (values[j] - this.#minValue) * this.#scaleY;
				this.#ctx.beginPath();
				this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? this.#textColor;
				this.#ctx.arc(x, y, this.#circleRad, 0, Math.PI * 2);
				this.#ctx.fill();
			}
		}
	}

	#drawTooltip(){ this.#canvas.addEventListener("mousemove", this.#handleMouseMove); }

	#handleMouseMove = (event)=>{
		const rect = this.#canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const { data, values, positionX, positionY } = this.#findTooltipData(mouseX, mouseY);

		if(data !== null && values !== null) this.#showTooltip(data, values, positionX, positionY, rect);
		else this.#tooltipElement.style.opacity = 0;;
	}

	#findTooltipData(mouseX, mouseY){
		let data = null, values = null, positionX = null, positionY = null;

		for(let i = 0; i < this.#data["data"].length; i++){
			for(let j = 0; j < this.#data["data"][i]["values"].length; j++){
				const dotX = j * this.#gapXAxis + this.#padding;
				const dotY = this.#paddings.bottom - (this.#data["data"][i]["values"][j] - this.#minValue) * this.#scaleY;

				const dx = mouseX - dotX;
				const dy = mouseY - dotY;
				const distance = Math.sqrt(dx ** 2 + dy ** 2);
				const activationRadius = this.#circleRad * 3;

				if(distance <= activationRadius){
					data = i;
					values = j;
					positionX = dotX;
					positionY = dotY;
					break;
				}
			}
		}

		return { data, values, positionX, positionY };
	}

	#showTooltip(data, values, x, y, canvasRect) {
		const tooltipWidth = this.#tooltipElement.offsetWidth;
		const tooltipHeight = this.#tooltipElement.offsetHeight;
		const canvasLeft = canvasRect.left + window.pageXOffset;
		const canvasTop = canvasRect.top + window.pageYOffset;

		this.#tooltipElement.innerHTML = this.#data["data"][data]["values"][values];

		this.#tooltipElement.style = `
			opacity: 1;
			left: ${canvasLeft + x - tooltipWidth / 2}px;
			top: ${canvasTop + y - tooltipHeight - 15}px;
		`;
	}

	#drawColoredBackground(){
		for(let i = 0; i < this.#data["data"].length; i++){
			const values = this.#data["data"][i]["values"];

			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom - (values[0] - this.#minValue) * this.#scaleY);
			this.#ctx.strokeStyle = this.#data["data"][i]["color"] ?? this.#textColor;

			for(let j = 0; j <= values.length; j++){
				const x = j * this.#gapXAxis + this.#padding;
				const y = this.#paddings.bottom - (values[j] - this.#minValue) * this.#scaleY;
				this.#ctx.lineTo(x, y);

				if (j == values.length) {
					this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);
					this.#ctx.lineTo(this.#paddings.left, this.#paddings.bottom);
					this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? this.#textColor;
					this.#ctx.globalAlpha = 0.1
					this.#ctx.closePath()
				}
			}
			this.#ctx.fill();
		}
		this.#ctx.globalAlpha = 1
	}

	#drawOpacityOrPlainBackground(){
		for(let i = 0; i < this.#data["data"].length; i++){
			this.#ctx.beginPath();

			for(let j = 0; j <= this.#data["data"][i]["values"].length; j++){
				this.#ctx.lineTo(
					j * this.#gapXAxis + this.#padding,
					this.#paddings.bottom - (this.#data["data"][i]["values"][j] - this.#minValue) * this.#scaleY
				);

				if(j == this.#data["data"][i]["values"].length){
					this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);
					this.#ctx.lineTo(this.#paddings.left, this.#paddings.bottom);
					this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? this.#textColor;
					this.#ctx.globalAlpha = this.#data["fillType"] === "plain" ? 1 : 0.1;
					this.#ctx.closePath();
				}
			}
			this.#ctx.fill();
		}
		this.#ctx.globalAlpha = 1;
	}

	#drawGradientBackground(){
		for(let i = 0; i < this.#data["data"].length; i++){
			this.#ctx.beginPath();

			const gradient = this.#ctx.createLinearGradient(
				this.#padding,
				this.#paddings.bottom - (Math.max(...this.#data["data"][i]["values"]) - this.#minValue) * this.#scaleY,
				// this.#paddings.top,
				this.#padding,
				this.#paddings.bottom
			);
			gradient.addColorStop(0, this.#data["data"][i]["color"]);
			gradient.addColorStop(1, "rgba(255, 255, 255, 0");
			this.#ctx.fillStyle = gradient;

			for(let j = 0; j <= this.#data["data"][i]["values"].length; j++){

				this.#ctx.lineTo(
					j * this.#gapXAxis + this.#padding,
					this.#paddings.bottom - (this.#data["data"][i]["values"][j] - this.#minValue) * this.#scaleY
				);

				if(j == this.#data["data"][i]["values"].length){
					this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);
					this.#ctx.lineTo(this.#paddings.left, this.#paddings.bottom);
					this.#ctx.closePath();
				}

			}
			this.#ctx.fill();
		}
	}

	#drawLegends(){
		const rectWidth = 20;
		const rectHeight = 10;
		const gap = 30;

		const posY = this.#paddings.bottom + this.#padding / 1.5;

		// put to the center (x axis)
		let startX = (this.#canvas.width) / 2;

		// - text widths
		for(let i = 0; i < this.#data["data"].length; i++)
			startX -= this.#ctx.measureText(this.#data["data"][i]["label"]).width / 2;

		// - rectangles
		startX -= this.#data["data"].length * rectWidth / 2;

		// - Gaps
		startX -= (this.#data["data"].length - 1) * gap / 2;

		for(let i = 0; i < this.#data["data"].length; i++){
			this.#ctx.fillStyle = this.#data["data"][i]["color"];

			this.#ctx.fillRect(startX, posY, rectWidth, rectHeight);

			this.#ctx.textBaseline = "top";
			this.#ctx.textAlign = "left";
			this.#ctx.font = "bold 11px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
			this.#ctx.fillText(this.#data["data"][i]["label"], startX + gap, posY);

			startX += rectWidth + this.#ctx.measureText(this.#data["data"][i]["label"]).width + gap;
		}
	}

}

window.customElements.define('x-line-chart', Line);
