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
	#barRadius = 0;
	
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

		this.#resizeObserver()
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
	}

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
		this.#scaleY = (this.#canvas.height - this.#padding * 2) / this.#maxValue;

		this.#YAxisStepValue = this.#maxValue / (this.#markerCountYAxis - 1);

		this.#barGap = this.#parentElement.clientWidth * 0.01;
		this.#barRadius = this.#parentElement.clientWidth * 0.02;
		this.#barWidth = (this.#paddings.right - this.#barGap - this.#paddings.left) / this.#ValuesArr.length;
	}
	
	#drawTitle() {
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

			const x = i * this.#barWidth + this.#barGap + this.#padding;
			let y = this.#paddings.bottom - (this.#ValuesArr[i]) * this.#scaleY;

			let height = (this.#ValuesArr[i]) * this.#scaleY;

			this.#ctx.beginPath()
			this.#ctx.fillStyle = this.#data["data"][i]["color"] ?? "#DAE6E5";
			this.#ctx.roundRect(x, y + 1, this.#barWidth - this.#barGap, height - 2, this.#barRadius); 
			this.#ctx.fill()
			this.#ctx.closePath()
		}
	}

	
	#drawLegends() {
		const posY = this.#paddings.bottom + this.#padding / 2;

		for (let i = 0; i < this.#data["data"].length; i++) {
			let startX = i * this.#barWidth + this.#barWidth/2 + this.#padding;
			this.#ctx.textBaseline = "center";
			this.#ctx.font = `bold ${this.#fontSize}px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`;;
			this.#ctx.fillText(this.#data["data"][i]["label"], startX + this.#barGap/2, posY);
			
			startX += this.#barWidth;
		}
	}
}
	window.customElements.define('x-bar-chart', Bar);