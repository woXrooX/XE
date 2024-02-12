"use strict";

// Use Case
{/* <x-chart-pie>
	{
		"width": "800",
		"height": "500",
		"chartSize": "150",
		"color": 60,
		"title":"Pie Chart",
		"data": [
			{"name": "USA", "value": "90%"},
			{"name": "UK", "value": "60%"},
			{"name": "JAPAN", "value": "50%"},
			{"name": "UZB", "value": "40%"},
			{"name": "KOREA", "value": "40%"},
			{"name": "KAZAK", "value": "40%"}
		]
	}

</x-chart-pie> */}

class PieChart extends HTMLElement{ 
	static template = document.createElement("template");

	static { PieChart.template.innerHTML = `<canvas></canvas>`;}
	
	constructor(){
		super();
	
		// Save the JSON data
		this.data = JSON.parse(this.innerHTML).constructor === Object ? JSON.parse(this.innerHTML) : {};
		
		this.shadow = this.attachShadow({mode: 'closed'});
		
		// Clone And Append Template
		this.shadow.appendChild(PieChart.template.content.cloneNode(true));

		// Canvas properties 
		this.cumulativeAngle = 0;
		this.paddingSlice = 0.01;
		this.titlePadding = 20;
		this.boxSize = 14;
		this.labelMargin = 4;
		this.labelPadding = 25;
		this.chartSize = this.data["chartSize"]

		// Fonts
		this.fontSize = "10px";
		this.fontStyle = "Quicksand";
		
		// Select canvas
		this.canvas = this.shadow.querySelector("canvas");
		this.ctx = this.canvas.getContext('2d');

		// Set canvas width and height
		this.canvas.width = this.data['width'];
		this.canvas.height = this.data['height'];

		// Generating random colors and storing them in array
		// this.colors = this.data["data"].map(() => this.#generateRandomColor());
		this.colors = [];
		for (const key in this.data["data"]) { this.colors.push(this.#generateRandomColor());};

	}
	
	connectedCallback() { this.#drawAll(); }

	#drawBackground(){
		this.ctx.fillStyle = "blue";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	#drawPieSlices =()=> {
		// Calculate Total Values
		let totalValues = this.data['data'].reduce((total, value) => { return total + parseFloat(value["value"]); }, 0);
		for (const entry in this.data["data"]) {
			const data = this.data["data"];

			// Parsing percentage to Float
			const value = parseFloat(data[entry]["value"]);
	
			// Convert values to Angle
			const angle = (value / totalValues) * 2 * Math.PI;
	
			// Calculate midpoint of the slice
			const midAngle = this.cumulativeAngle + angle / 2;
			
			// Drawing Slice
			this.ctx.beginPath();
			this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2);
			this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.chartSize, this.cumulativeAngle + this.paddingSlice, this.cumulativeAngle + angle - this.paddingSlice);
			
			// Fill with different colors
			this.ctx.fillStyle = this.colors[entry];
			this.ctx.fill();
		
			// Update cumulative angle for the next slice
			this.cumulativeAngle += angle;
		
			// Display labels with values
			const labelXValue = this.canvas.width / 2 + Math.cos(midAngle) * 100;
			const labelYValue = this.canvas.height / 2 + Math.sin(midAngle) * 100;
			
			this.ctx.fillStyle = "black";
			// this.ctx.font = "15px Arial";
			this.ctx.fillText(data[entry]["value"], labelXValue, labelYValue);
		}

	}

	#drawTitle(){
		this.ctx.font = `calc(${this.fontSize} * 3) ${this.fontStyle}`;
		this.ctx.fillStyle = "black";
		this.ctx.fillText(this.data["title"], this.canvas.width / 2 - 60, this.titlePadding + 30, this.canvas.width);
	}

	#drawLegends =()=> {
		// Position legends 
		let labelsX = this.shadow.querySelector("canvas").width / 20;
		let labelsY = this.shadow.querySelector("canvas").height / 2 - 100;

		for (const label in this.data["data"]) {
			const data = this.data["data"];
			
			// Display color box
			const boxX = labelsX - this.boxSize - this.labelMargin;
			const boxY = labelsY - this.boxSize;
			this.ctx.font = `${this.fontSize} ${this.fontStyle}`;
			this.ctx.fillStyle = this.colors[label];
			this.ctx.fillRect(boxX, boxY, this.boxSize, this.boxSize);
		
			// Display country name
			this.ctx.fillStyle = "black";
			this.ctx.fillText(data[label]["name"], labelsX, labelsY);
	
			// Adjust the spacing between labels
			labelsY += this.labelPadding;
		}
			
	}

	#generateRandomColor =()=> {
		return `hsl(${this.data["color"]}, ${Math.random() * 100}%, ${Math.random() * 100}%)`;
	}

	#drawAll(){
		this.#drawBackground();
		this.#drawPieSlices();
		this.#drawTitle();
		this.#drawLegends();
	}
}

window.customElements.define('x-pie-chart', PieChart);
