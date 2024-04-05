export default class Bar extends HTMLElement {
	#data;
	#canvas;
	#ctx;

	#textColor = "black";
	#xAxisColor = "black";
	#yAxisColor = "black";
	#gridColor = "gray";
	#fontSize = 12;

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

	#valuesArr = []
	#barWidth = 0;
	#barGap = 0;
	#borderRadius = 0;

	constructor(){
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

		// Canvas element
		this.shadow.appendChild(document.createElement("canvas"));
		this.#canvas = this.shadow.querySelector("canvas");
		this.#ctx = this.#canvas.getContext('2d');

		this.#resizeObserver()
	}

	////// APIs
	#resizeObserver(){
		const resizeObserver = new ResizeObserver(this.#init);
		resizeObserver.observe(this.#parentElement);
	}

	#init = ()=>{
		this.#textColor = this.#xAxisColor = this.#yAxisColor = getComputedStyle(document.querySelector(':root')).getPropertyValue("--color-text-primary");

		this.#setUpCanvas();
		this.#setValues();
		this.#drawTitle();

		if("yAxis" in this.#data){
			if("title" in this.#data["yAxis"]) this.#drawYAxisTitle();
			if("line" in this.#data["yAxis"]) this.#drawMainYAxis();
			if("markers" in this.#data["yAxis"]) this.#drawMarkersYAxis();
			if("color" in this.#data["yAxis"]) this.#yAxisColor = this.#data["yAxis"]["color"];
		}

		if("xAxis" in this.#data){
			if("line" in this.#data["xAxis"]) this.#drawMainXAxis();
			if("markers" in this.#data["xAxis"]) this.#drawLegends();
			if("color" in this.#data["xAxis"]) this.#xAxisColor = this.#data["xAxis"]["color"];
		}

		if("bar" in this.#data){
			if("radius" in this.#data["bar"] && parseInt(this.#data["bar"]["radius"]) >= 0) this.#drawBarRadius();
			if("values" in this.#data["bar"]) this.#drawBarValues();
		}

		if("grid" in this.#data){
			if("horizontal" in this.#data["grid"]) this.#drawXLines();
			if("color" in this.#data["grid"]) this.#gridColor = this.#data["grid"]["color"];
		}

		if("fillType" in this.#data){
			if(this.#data["fillType"] === "opacity") this.#opacityBackground();
			this.#drawBars();
		}
	}

	////// Helpers
	#setUpCanvas(){
		this.#canvas.width = this.#parentElement.clientWidth;
		this.#canvas.height = this.#parentElement.clientWidth / 2;
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	#setValues(){
		// Marker count Y axis
		if ("yAxis" in this.#data && "markerCount" in this.#data["yAxis"]) this.#markerCountYAxis = this.#data["yAxis"]["markerCount"];

		if(this.#valuesArr.length === 0) for(let i = 0; i < this.#data["data"].length; i++) this.#valuesArr.push(this.#data["data"][i]["value"])

		this.#minValue = Math.min(...this.#valuesArr);
		this.#maxValue = Math.max(...this.#valuesArr);
		this.#maxValue = this.#maxValue + 10

		this.#paddings = {
			top: this.#padding,
			right: this.#canvas.width - this.#padding,
			bottom: this.#canvas.height - this.#padding,
			left: this.#padding
		};

		this.#gapYAxis = (this.#paddings.bottom - this.#padding) / (this.#markerCountYAxis - 1);
		this.#scaleY = (this.#canvas.height - this.#padding * 2) / this.#maxValue;

		this.#YAxisStepValue = this.#maxValue / (this.#markerCountYAxis - 1);

		this.#barGap = this.#parentElement.clientWidth * 0.01;
		this.#barWidth = (this.#paddings.right - this.#barGap - this.#paddings.left) / this.#valuesArr.length;
	}

	#drawTitle(){
		this.#ctx.beginPath()
		this.#ctx.fillStyle = this.#textColor;
		this.#ctx.textAlign = "center";
		this.#ctx.font = "bold 16px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
		this.#ctx.fillText(this.#data.title, this.#canvas.width / 2, this.#paddings.top / 2);

	}

	#drawMainXAxis(){
		this.#ctx.beginPath();

		this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);

		this.#ctx.strokeStyle = this.#xAxisColor;
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}

	#drawMainYAxis(){
		this.#ctx.beginPath();

		let startY = this.#paddings.top;
		let endY = this.#paddings.bottom;

		this.#ctx.moveTo(this.#paddings.left, startY);
		this.#ctx.lineTo(this.#paddings.left, endY);

		this.#ctx.strokeStyle = this.#yAxisColor;
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

	#drawYAxisTitle(){
		this.#paddings.left = this.#paddings.left * 2
		this.#barWidth = (this.#paddings.right - this.#barGap - this.#paddings.left) / this.#valuesArr.length;

		this.#ctx.save();
		this.#ctx.translate(this.#padding/2, this.#canvas.height / 2);
		this.#ctx.rotate(-Math.PI / 2);
		this.#ctx.fillStyle = this.#textColor;
		this.#ctx.textAlign = "center";
		this.#ctx.textBaseline = "top";
		this.#ctx.font = "16px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
		this.#ctx.fillText(this.#data["yAxis"]["title"], 0, 0);
		this.#ctx.restore();
	}

	#drawXLines(){
		this.#ctx.strokeStyle = this.#gridColor;
		this.#ctx.lineWidth = 0.5;

		for (let i = 0; i < this.#markerCountYAxis; i++) {
			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left - this.#markerSize, this.#gapYAxis * i + this.#padding);
			this.#ctx.lineTo(this.#paddings.right, this.#gapYAxis * i + this.#padding);
			this.#ctx.stroke();
		}
	}

	#drawBarRadius(){
		this.#borderRadius = this.#data["bar"]["radius"]
	}

	#opacityBackground(){
		this.#ctx.globalAlpha = 0.5
		this.#ctx.lineWidth = 2
	}

	#drawBars(){
		for (let i = 0; i < this.#valuesArr.length; i++) {

			const x = i * this.#barWidth + this.#barGap + this.#paddings.left;
			let y = this.#paddings.bottom - (this.#valuesArr[i]) * this.#scaleY;

			let height = this.#valuesArr[i] * this.#scaleY;

			this.#ctx.beginPath()
			this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? "#DAE6E5";
			this.#ctx.strokeStyle = this.#data["data"][i]["color"] ?? "#DAE6E5";
			this.#ctx.roundRect(x, y + 1, this.#barWidth - this.#barGap, height - 2, this.#borderRadius);
			this.#ctx.stroke()
			this.#ctx.fill()
			this.#ctx.closePath()
		}
	}

	#drawBarValues(){
		for (let i = 0; i < this.#data["data"].length; i++) {
			let y = this.#paddings.bottom - (this.#valuesArr[i]) * this.#scaleY - this.#barGap/1.5
			let x = i * this.#barWidth + this.#barWidth/2 + this.#paddings.left;

			this.#ctx.textBaseline = "center";
			this.#ctx.textAlign = "center";
			this.#ctx.font = `${this.#fontSize * 1.5}px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`;
			this.#ctx.fillText(this.#valuesArr[i], x + this.#barGap/2, y);

			x += this.#barWidth;
		}
	}

	#drawLegends(){
		const posY = this.#paddings.bottom + this.#padding / 2;

		for (let i = 0; i < this.#data["data"].length; i++) {
			let startX = i * this.#barWidth + this.#barWidth/2 + this.#paddings.left;
			this.#ctx.textBaseline = "center";
			this.#ctx.textAlign = "center";
			this.#ctx.font = `${this.#fontSize}px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`;;
			this.#ctx.fillText(this.#data["data"][i]["label"], startX + this.#barGap/2, posY);

			startX += this.#barWidth;
		}
	}
}

window.customElements.define('x-bar-chart', Bar);
