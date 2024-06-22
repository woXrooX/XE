// Useful Links

// Native Form Behaviour
// https://web.dev/more-capable-form-controls/

"use strict";

export default class Images extends HTMLElement{
	#ARRAY = [];

	constructor(){
		super();

		// Save the JSON data
		this.#ARRAY = JSON.parse(this.innerHTML);

		// Clean up
		this.replaceChildren();

		// Closed
		this.shadow = this.attachShadow({mode: 'closed'});

		DOM: {
			let imgs = "";
			for(const img of this.#ARRAY) imgs += `<div><img src="${img}"></div>`;
			this.shadow.innerHTML = `<main>${imgs}</main>`;
		}

		CSS: {
			const style = document.createElement('style');
			style.textContent = `
				main{
					& > :first-child{
						cursor: pointer;
						transform: scale(1);
					}

					& > div{
						transform: scale(0);
						width: 0px;
						height: 0px;
					}

					&.active{
						background: hsla(0deg, 0%, 0%, 0.5);
						backdrop-filter: blur(20px);

						height: 100dvh;
						width: 100dvw;

						overflow-y: hidden;
						overflow-x: scroll;
						scroll-snap-type: x mandatory;

						display: flex;
						flex-direction: row;

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
								max-width: 90dvw;
								max-height: 90dvh;
								width: auto;
								height: auto;
								object-fit: contain;
								filter: drop-shadow(0px 5px 20px rgba(0, 0, 0, 0.8));
							}
						}
					}
				}
			`;
			this.shadow.appendChild(style);
		}

		Listeners: {
			const main_element = this.shadow.querySelector("main");
			const first_img_element = this.shadow.querySelector("main > :first-child");

			first_img_element.onclick = (event)=>{
				if(!main_element.classList.contains("active")) main_element.classList.add("active");
			};

			main_element.onclick = (event)=>{
				if(event.target.nodeName !== "IMG" && main_element.classList.contains("active"))
					main_element.classList.remove("active");
			};
		}
	}
};

window.customElements.define('x-images', Images);

// Make WC Usable W/O Importing It
window.Images = Images;
