export default class Line extends HTMLElement{
	#data;
	#canvas;
	#ctx;
	#padding = 50;
	#paddings;
	#minValue = Infinity;
	#maxValue = -Infinity;
	#longestDataset = 0;
	#gapXAxis = 0;
	#gapYAxis = 0;
	#markerSize = 10;
	#markerCountYAxis = 10;
	#YAxisStepValue;
	#circleRad = 4;
	#gridLineWidth = 0.1;
	#parentElement = null;


	constructor(){
		super();

		this.shadow = this.attachShadow({mode: 'closed'});
		this.#data = JSON.parse(this.innerHTML);
		this.#parentElement = this.parentNode;

		const style = document.createElement('style');
		style.textContent = `
			canvas{
				max-width: 100vw;
				max-height: 100vh;

				border-radius: var(--radius);
				box-shadow: var(--shadow);
			}
		`;
		this.shadow.appendChild(style);

		this.shadow.appendChild(document.createElement("canvas"));
		this.#canvas = this.shadow.querySelector("canvas");
		this.#ctx = this.#canvas.getContext('2d');

		this.#resizeObserver();
	}

	// APIs
	#draw = ()=>{
		this.#setUpCanvas();
		this.#setValues();
		this.#drawLines();

		if(this.#parentElement.clientWidth > 600){
			this.#drawTitle();
			this.#drawMainAxis();
			this.#drawXLines();
			this.#drawYLines();
			this.#drawCircle();
			this.#drawMarkersXAxis();
			this.#drawMarkersYAxis();
			this.#drawLegends();
		}
	}


	////// Helpers
	#resizeObserver(){
		const resizeObserver = new ResizeObserver(this.#draw);
		resizeObserver.observe(this.#parentElement);
	}

	#setUpCanvas(){
		this.#canvas.width = this.#parentElement.clientWidth;
		this.#canvas.height = this.#parentElement.clientHeight;
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

		this.#gapXAxis = this.#paddings.right / this.#longestDataset;
		this.#gapYAxis = (this.#paddings.bottom - this.#padding) / (this.#markerCountYAxis - 1);

		this.#YAxisStepValue = (this.#maxValue - this.#minValue) / (this.#markerCountYAxis - 1);
	}

	#drawTitle(){
		this.#ctx.fillStyle = "black";
		this.#ctx.textAlign = "center";
		this.#ctx.font = "bold 16px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
		this.#ctx.fillText(this.#data.title, this.#canvas.width / 2, this.#paddings.top / 2);
	}

	#drawMainAxis(){
		this.#ctx.beginPath();
		this.#ctx.moveTo(this.#paddings.left, this.#paddings.top);
		this.#ctx.lineTo(this.#paddings.left, this.#paddings.bottom);
		this.#ctx.lineTo(this.#paddings.right, this.#paddings.bottom);

		this.#ctx.strokeStyle = '#35374B';
		this.#ctx.lineWidth = 1;
		this.#ctx.stroke();
	}

	#drawXLines(){
		this.#ctx.strokeStyle = '#35374B';
		this.#ctx.lineWidth = this.#gridLineWidth;

		for (let i = 0; i < this.#markerCountYAxis; i++) {
			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left - this.#markerSize, this.#gapYAxis * i + this.#padding);
			this.#ctx.lineTo(this.#paddings.right, this.#gapYAxis * i + this.#padding);
			this.#ctx.stroke();
		}
	}

	#drawYLines(){
		this.#ctx.strokeStyle = '#35374B';
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
		const scaleY = (this.#canvas.height - this.#padding * 2) / (this.#maxValue - this.#minValue);

		this.#ctx.lineWidth = 2;

		for(let i = 0; i < this.#data["data"].length; i++){
			const values = this.#data["data"][i]["values"];

			this.#ctx.beginPath();
			this.#ctx.moveTo(this.#paddings.left, this.#paddings.bottom - (values[0] - this.#minValue) * scaleY);
			this.#ctx.strokeStyle = this.#data["data"][i]["color"];

			for(let j = 0; j < values.length; j++){
				const x = j * this.#gapXAxis + this.#padding;
				const y = this.#paddings.bottom - (values[j] - this.#minValue) * scaleY;
				this.#ctx.lineTo(x, y);
			}

			this.#ctx.stroke();
		}
	}

	#drawCircle(){
		const scaleY = (this.#canvas.height - this.#padding * 2) / (this.#maxValue - this.#minValue);

		for (let i = 0; i < this.#data["data"].length; i++) {
			const values = this.#data["data"][i]["values"];

			for(let j = 0; j < values.length; j++){
				const x = j * this.#gapXAxis + this.#padding;
				const y = this.#paddings.bottom - (values[j] - this.#minValue) * scaleY;
				this.#ctx.beginPath();
				this.#ctx.fillStyle = this.#data["data"][i]["color"];
				this.#ctx.arc(x, y, this.#circleRad, 0, Math.PI * 2);
				this.#ctx.fill();
			}
		}
	}

	#drawMarkersXAxis(){
		for(let i = 0; i < this.#longestDataset; i++){
			const x = i * this.#gapXAxis + this.#padding;

			this.#ctx.textAlign = "center";
			this.#ctx.font = " 11px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
			this.#ctx.fillStyle = "black";
			this.#ctx.fillText(i, x, this.#paddings.bottom + this.#markerSize * 2.5);
		}
	}

	#drawMarkersYAxis(){
		for(let i = 0; i < this.#markerCountYAxis; i++){
			this.#ctx.textAlign = "right";
			this.#ctx.font = " 11px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
			this.#ctx.textBaseline = "middle";
			this.#ctx.fillText(this.#maxValue - i * this.#YAxisStepValue, this.#paddings.left - this.#markerSize * 2.5, i * this.#gapYAxis + this.#padding);
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
