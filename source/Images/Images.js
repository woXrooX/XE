export default class Images extends HTMLElement{
	#JSON = {};
	#main_element = null;
	#first_img_element = null;
	#div_elements = null;
	#clicked_img_src = null;
	#original_first_img_src = null;


	constructor(){
		super();
		this.#JSON = JSON.parse(this.innerHTML).constructor === Object ? JSON.parse(this.innerHTML) : {};

		this.replaceChildren();
		this.shadow = this.attachShadow({mode: 'closed'});
		
		DOM: {
			// Pre define grid class based on the number of images
			const grid_nxn = `grid-${Math.min(this.#JSON["images"].length, 5)}`;

			let imgs = "";
			for(const img of this.#JSON["images"]) imgs += `<div><img src="${img}"></div>`;
			
			this.shadow.innerHTML = `
				<style>
					:host{
						display: inline-block;
						height: 100%;
						cursor: pointer;
						user-select: none;
						overflow: hidden;
					}

					${this.#JSON["version"] === "2" ? 
						`main{
							width: 100%;
							height: 100%;
							
							display: grid;
							grid-template-columns: 1fr 1fr;
							grid-gap: 3px;
	
							&.grid-1 {
								grid-template-columns: 1fr;
								grid-template-rows: 1fr;
							}
	
							&.grid-2 {
								grid-template-columns: 1fr 1fr;
								grid-template-rows: 1fr;
							}
	
							&.grid-3 {
								grid-template-columns: 1fr 1fr;
								grid-template-rows: 1fr;
	
								> :nth-child(1) {
									grid-column: span 2;
									grid-row: span 1;
								}
							}
	
							&.grid-4 {
								grid-template-columns: repeat(3, 1fr);
								grid-template-rows: 1fr;
	
								> :nth-child(1) {
									grid-column: span 3;
									grid-row: span 1;
								}
							}
	
							&.grid-5 {
								grid-template-columns: 1fr 1fr;
								grid-template-rows: 1fr 1fr;
	
								> :nth-child(1) {
									grid-column: span 2;
									grid-row: span 2;
								}
							}

							& > div{
								width: 100%;
								height: 100%;
								transform: scale(1);
								overflow: hidden;

								&::after{
									pointer-events: none;
									content: 'view';
									opacity: 0;

									background-color: rgba(0, 0, 0, 0.7);
									color: white;

									font-size: 250%;

									width: 100%;
									height: 100%;

									display: grid;
									place-items: center;

									position: absolute;
									top: 0px;
									left: 0px;
									z-index: 21;

									transition: opacity ease-in-out 250ms;
								}

								&:hover{
									&::after{
										opacity: 1;
									}
								}

								& > img{
									width: 100%;
									height: 100%;
									object-fit: cover;
								}
							}

							&.active{
								background: hsla(0deg, 0%, 0%, 0.5);
								backdrop-filter: blur(20px);
								-webkit-backdrop-filter: blur(20px);

								height: 100dvh;
								width: 100dvw;
								
								display: flex;
								flex-direction: row;

								position: fixed;
								top: 0;
								left: 0;
								z-index: 20;

								& > div{
									overflow: hidden;
	
									transform: unset;
									width: unset;
									height: unset;
	
									min-width: 100dvw;
									min-height: 100dvh;
	
									display: grid;
									place-content: center;
	
									& > img{
										cursor: initial;
										width: auto;
										height: auto;
										max-width: 90dvw;
										max-height: 90dvh;
										object-fit: contain;
										filter: drop-shadow(0px 5px 20px rgba(0, 0, 0, 0.8));
									}

									&:hover{
										&::after{
											transition: opacity ease-in-out 0ms;
											opacity: 0;
										}
									}
								}
							}
						}`

						: 

						`main{
							display: inline-block;
							width: 100%;
							height: 100%;

							/* Disable scrollbar START */
							-ms-overflow-style: none; /* IE and Edge */
							scrollbar-width: none; /* Firefox */

							&::-webkit-scrollbar{
								display: none;
							}
							/* Disable scrollbar END */

							& > :first-child{
								display: block;
								width: 100%;
								height: 100%;
								transform: scale(1);
								overflow: hidden;

								&::after{
									pointer-events: none;
									content: '${this.#JSON["images"].length}';
									opacity: 0;

									background-color: rgba(0, 0, 0, 0.7);
									color: white;

									font-size: 250%;

									width: 100%;
									height: 100%;

									display: grid;
									place-items: center;

									position: absolute;
									top: 0px;
									left: 0px;
									z-index: 21;

									transition: opacity ease-in-out 250ms;
								}

								&:hover{
									&::after{
										opacity: 1;
									}
								}


								& > img{
									width: 100%;
									height: 100%;
									object-fit: cover;
								}
							}

							& > div{
								display: none;
								width: 0px;
								height: 0px;
								transform: scale(0);
							}

							&.active{
								background: hsla(0deg, 0%, 0%, 0.5);
								backdrop-filter: blur(20px);
								-webkit-backdrop-filter: blur(20px);

								height: 100dvh;
								width: 100dvw;

								overflow-y: hidden;
								overflow-x: scroll;
								scroll-snap-type: x mandatory;

								display: flex;
								flex-direction: row;

								position: fixed;
								top: 0;
								left: 0;
								z-index: 20;

								& > :first-child{
									&:hover{
										&::after{
											transition: opacity ease-in-out 0ms;
											opacity: 0;
										}
									}
								}

								& > div{
									overflow: hidden;

									transform: unset;
									width: unset;
									height: unset;

									min-width: 100dvw;
									min-height: 100dvh;

									scroll-snap-align: start;

									display: grid;
									place-content: center;

									& > img{
										cursor: initial;
										width: auto;
										height: auto;
										max-width: 90dvw;
										max-height: 90dvh;
										object-fit: contain;
										filter: drop-shadow(0px 5px 20px rgba(0, 0, 0, 0.8));
									}
								}
							}
						}`
					}
				</style>
				<main class="${grid_nxn}">${imgs}</main>
			`;
		}

		Listeners: {
			this.#main_element = this.shadow.querySelector("main");
			
			// version 1
			this.#first_img_element = this.shadow.querySelector("main > :first-child");
			this.#first_img_element.onclick = (event)=>{if(!this.#main_element.classList.contains("active")) this.#show();};
			
			// version 2
			if(this.#JSON["version"]){
				
				this.#div_elements = this.#main_element.querySelectorAll("div");
				
				for (const selected_div of this.#div_elements) {
					selected_div.onclick = () => { 

						// Store the clicked img src
						this.#clicked_img_src = selected_div.querySelector("img").src;
						
						if(!this.#main_element.classList.contains("active")) this.#show();
					};
				}

				// Store the original src of the first image
				const first_image = this.#main_element.querySelector("div > img");
				if (first_image) this.#original_first_img_src = first_image.src;
			}
			
			this.#main_element.onclick = (event)=>{ if(event.target.nodeName !== "IMG" && this.#main_element.classList.contains("active")) this.#hide(); };
		}
	}

	#show(){
		this.#main_element.classList.add("active");

		// Set the current img src clicked image
		if(this.#JSON["version"]) this.#main_element.querySelector("main.active div img").src = this.#clicked_img_src;

		// disable scrolling
		document.body.style = "overflow: hidden";
	}

	#hide(){
		this.#main_element.classList.remove("active");

		// Reset the first image's src to its original value
		if(this.#JSON["version"]) this.#main_element.querySelector("div > img").src = this.#original_first_img_src;

		// enable scrolling
		document.body.removeAttribute("style");
	}
};

window.customElements.define('x-images', Images);

// Make WC Usable W/O Importing It
window.Images = Images;
