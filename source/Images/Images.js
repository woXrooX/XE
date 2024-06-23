// Useful Links

// Native Form Behaviour
// https://web.dev/more-capable-form-controls/

"use strict";

export default class Images extends HTMLElement{
	#JSON = {};

	constructor(){
		super();
		this.#JSON = JSON.parse(this.innerHTML).constructor === Object ? JSON.parse(this.innerHTML) : {};
		this.replaceChildren();
		this.shadow = this.attachShadow({mode: 'closed'});

		DOM: {
			let imgs = "";
			for(const img of this.#JSON["images"]) imgs += `<div><img src="${img}"></div>`;
			this.shadow.innerHTML = `<main>${imgs}</main>`;
		}

		CSS: {
			const style = document.createElement('style');
			style.textContent = `
				main{
					/* Disable scrollbar START */
					-ms-overflow-style: none; /* IE and Edge */
					scrollbar-width: none; /* Firefox */

					&::-webkit-scrollbar{
						display: none;
					}
					/* Disable scrollbar END */

					& > :first-child{
						transform: scale(1);

						& > img{
							width: ${this.#JSON["width"] ?? "auto"};
							height: ${this.#JSON["height"] ?? "auto"};
							object-fit: ${this.#JSON["height"] ?? "initial"};
						}
					}

					& > div{
						cursor: pointer;
						width: 0px;
						height: 0px;
						transform: scale(0);
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
