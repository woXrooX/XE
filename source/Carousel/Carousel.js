export default class Carousel extends HTMLElement {
	static #animation_duration = 1000;
	static #auto_scroll_interval = 3000;

	#auto_scroll_timeout = null;
	#scroll_interval = null;
	#auto_scroll_interval_after_touch = 5000;

	#offset = 0;
	#gap = 0;
	#resize_observer_object = null;
	#card_width = 0;
	#previous_button = null;
	#next_button = null;
	#animating = false;

	#touch_start_x = 0;
	#swipe_threshold = 30;

	constructor() { super(); }

	connectedCallback() {
		this.#calculate_values();
		this.#resize_observer();
		this.#style_host();
		this.#init_buttons();
		this.#center_cards();
		this.#start_auto_scroll();
		this.#init_event_listeners();
	}

	disconnectedCallback() {
		this.#stop_auto_scroll();
		this.#resize_observer_object.disconnect();
	}

	#calculate_values() {
		const computed_style = getComputedStyle(this);

		this.cards = this.#generate_cards();
		this.#gap = parseInt(computed_style.gap);
		this.#card_width = this.cards[0].offsetWidth;

		const container_width = this.offsetWidth - parseInt(computed_style.paddingLeft) - parseInt(computed_style.paddingRight);

		// Core positioning logic
		this.#offset = this.#card_width + this.#gap - (container_width - this.#card_width) / 2;
		this.#offset = Math.abs(this.#offset);
	}

	#resize_observer() {
		this.#resize_observer_object = new ResizeObserver(() => {
			this.#calculate_values();
			this.#center_cards();
		});

		this.#resize_observer_object.observe(this);
	}

	#style_host() {
		this.style = `
			display: flex;
			overflow: hidden;
			mask-image: linear-gradient(
				to right,
				rgba(0, 0, 0, 0),
				rgba(0, 0, 0, 1) 2%,
				rgba(0, 0, 0, 1) 98%,
				rgba(0, 0, 0, 0)
			);
			position: relative;
		`;
	}

	#init_buttons(){
		previous: {
			this.#previous_button = document.createElement("button");
			this.#previous_button.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
					<path d="M 7.824219 13 L 12.726562 17.898438 C 12.925781 18.101562 13.019531 18.332031 13.011719 18.601562 C 13.003906 18.867188 12.898438 19.101562 12.699219 19.300781 C 12.5 19.484375 12.265625 19.578125 12 19.585938 C 11.734375 19.597656 11.5 19.5 11.300781 19.300781 L 4.699219 12.699219 C 4.601562 12.601562 4.527344 12.492188 4.488281 12.375 C 4.445312 12.257812 4.425781 12.132812 4.425781 12 C 4.425781 11.867188 4.445312 11.742188 4.488281 11.625 C 4.527344 11.507812 4.601562 11.398438 4.699219 11.300781 L 11.300781 4.699219 C 11.484375 4.515625 11.710938 4.425781 11.988281 4.425781 C 12.261719 4.425781 12.5 4.515625 12.699219 4.699219 C 12.898438 4.898438 13 5.136719 13 5.414062 C 13 5.6875 12.898438 5.925781 12.699219 6.125 L 7.824219 11 L 19 11 C 19.285156 11 19.519531 11.097656 19.710938 11.289062 C 19.902344 11.480469 20 11.714844 20 12 C 20 12.285156 19.902344 12.519531 19.710938 12.710938 C 19.519531 12.902344 19.285156 13 19 13 Z M 7.824219 13 "/>
				</svg>
			`;
			this.#previous_button.className = "btn btn-primary position-absolute radius-circle";
			this.#previous_button.style = `
				padding: 5px 10px;
				left: 20px;
				top: 50%;
				transform: translateY(-50%);
				opacity: 0;
				transition: opacity 0.3s ease;
				z-index: 4;
			`;
			this.appendChild(this.#previous_button);
		}

		next: {
			this.#next_button = document.createElement("button");
			this.#next_button.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
					<path d="M 16.175781 13 L 5 13 C 4.714844 13 4.480469 12.902344 4.289062 12.710938 C 4.097656 12.519531 4 12.285156 4 12 C 4 11.714844 4.097656 11.480469 4.289062 11.289062 C 4.480469 11.097656 4.714844 11 5 11 L 16.175781 11 L 11.273438 6.101562 C 11.074219 5.898438 10.980469 5.667969 10.988281 5.398438 C 10.996094 5.132812 11.101562 4.898438 11.300781 4.699219 C 11.5 4.515625 11.734375 4.421875 12 4.414062 C 12.265625 4.402344 12.5 4.5 12.699219 4.699219 L 19.300781 11.300781 C 19.398438 11.398438 19.472656 11.507812 19.511719 11.625 C 19.554688 11.742188 19.574219 11.867188 19.574219 12 C 19.574219 12.132812 19.554688 12.257812 19.511719 12.375 C 19.472656 12.492188 19.398438 12.601562 19.300781 12.699219 L 12.699219 19.300781 C 12.515625 19.484375 12.289062 19.574219 12.011719 19.574219 C 11.738281 19.574219 11.5 19.484375 11.300781 19.300781 C 11.101562 19.101562 11 18.863281 11 18.585938 C 11 18.3125 11.101562 18.074219 11.300781 17.875 Z M 16.175781 13 "/>
				</svg>
			`;
			this.#next_button.className = "btn btn-primary position-absolute radius-circle";
			this.#next_button.style = `
				padding: 5px 10px;
				right: 20px;
				top: 50%;
				transform: translateY(-50%);
				opacity: 0;
				transition: opacity 0.3s ease;
				z-index: 5;
			`;
			this.appendChild(this.#next_button);
		}

		// Hide buttons on mobile
		if ("ontouchstart" in window) {
		  this.#previous_button.style.display = 'none';
		  this.#next_button.style.display = 'none';
		}
	}

	#center_cards() {
		for (const card of this.cards) card.style = `
			transition: none;
			transform: translateX(-${this.#offset}px);
		`;
	}

	#start_auto_scroll() {
		this.#scroll_interval = setInterval(() => this.#scroll_to_next_card(), Carousel.#auto_scroll_interval);
	}

	#init_event_listeners() {
		this.addEventListener('mouseenter', () =>{
			this.#stop_auto_scroll();
			this.#previous_button.style.opacity = "1";
			this.#next_button.style.opacity = "1";
		});

		this.addEventListener('mouseleave', () =>{
			this.#start_auto_scroll();
			this.#previous_button.style.opacity = "0";
			this.#next_button.style.opacity = "0";
		});

		this.addEventListener('touchstart', this.#handle_touch_start);
		this.addEventListener('touchend', this.#handle_touch_end);

		this.#previous_button.onclick = () => this.#scroll_to_previous_card();
		this.#next_button.onclick = () => this.#scroll_to_next_card();
	}


	/////////// Helpers
	#stop_auto_scroll() {
		clearInterval(this.#scroll_interval);
		this.#scroll_interval = null;
	}

	#handle_touch_start = (event) => {
		if (!event.touches || event.touches.length === 0) return;

		this.#stop_auto_scroll();
		this.#touch_start_x = event.touches[0].clientX;

		clearTimeout(this.#auto_scroll_timeout);
		this.#auto_scroll_timeout = setTimeout(() => { this.#start_auto_scroll(); }, this.#auto_scroll_interval_after_touch);
	}

	#handle_touch_end = (event) => {
		if (!event.changedTouches || event.changedTouches.length === 0) return;

		const touch_end_x = event.changedTouches[0].clientX;
		const delta_x = touch_end_x - this.#touch_start_x;

		if (Math.abs(delta_x) > this.#swipe_threshold)
			delta_x > 0 ? this.#scroll_to_previous_card() : this.#scroll_to_next_card();
	}

	#scroll_to_previous_card() {
		if (this.#animating) return;
		this.#animating = true;

		const last_card = this.cards[this.cards.length - 1];
		const clone = last_card.cloneNode(true);

		clone.style.transform = `translateX(-${this.#offset + this.#card_width + this.#gap}px)`;
		this.insertBefore(clone, this.cards[0]);

		const initialOffset = this.#offset + this.#card_width + this.#gap;
		this.cards = this.#generate_cards();

		for (const card of this.cards) {
			card.style.transition = 'none';
			card.style.transform = `translateX(-${initialOffset}px)`;
		}

		// Force layout synchronization
		void this.offsetWidth;

		for (const card of this.cards) {
			card.style.transition = `transform ${Carousel.#animation_duration}ms ease`;
			card.style.transform = `translateX(-${this.#offset}px)`;
		}

		last_card.addEventListener("transitionend", () => {
			this.removeChild(last_card);
			this.cards = this.#generate_cards();

			for (const card of this.cards) {
				card.style.transition = 'none';
				card.style.transform = `translateX(-${this.#offset}px)`;
			}

			this.#animating = false;
		});
	}

	#scroll_to_next_card() {
		if (this.#animating) return;
		this.#animating = true;

		const first_card = this.cards[0];
		const clone = first_card.cloneNode(true);

		// Prepare clone position
		clone.style.transform = `translateX(-${this.#offset}px)`;
		this.appendChild(clone);

		// Force layout synchronization
		void this.offsetWidth;

		// Animate all cards
		this.cards = this.#generate_cards();

		for (const card of this.cards){
			card.style.transition = `transform ${Carousel.#animation_duration}ms ease`;
			card.style.transform = `translateX(-${this.#offset + this.#card_width + this.#gap}px)`;
		}

		first_card.addEventListener("transitionend", ()=>{
			this.removeChild(first_card);
			this.cards = this.#generate_cards();

			// Reset positions without animation
			for (const card of this.cards){
				card.style.transition = 'none';
				card.style.transform = `translateX(-${this.#offset}px)`;
			}

			this.#animating = false;
		});
	}

	#generate_cards() {
		const cards = [];
		for (const child of this.children)
			if (!child.classList.contains('btn')) {
				child.style.flexShrink = '0';
				cards.push(child);
			}

		return cards;
	}
}

window.customElements.define('x-carousel', Carousel);
