//// Recuirements
// Minimum card number should be 3
// All cards should have the same width
// flex-shrink-0 should be used with cards so they don't shrink due to parents flex attribute
// max-width-100vw is recommended for the container, as child elements may make it grow more than that

//// Sample
// <column class="max-width-1200px width-100">
// 	<x-carousel class="width-100 max-width-100vw padding-5 gap-2">
// 		<column class="flex-center gap-1 text-align-center padding-5 surface-v1 width-600px s-width-90 flex-shrink-0">
// 			<p>1</p>
// 		</column>
// 		<column class="flex-center gap-1 text-align-center padding-5 surface-v1 width-600px s-width-90 flex-shrink-0">
// 			<p>2</p>
// 		</column>
// 		<column class="flex-center gap-1 text-align-center padding-5 surface-v1 width-600px s-width-90 flex-shrink-0">
// 			<p>3</p>
// 		</column>
// 	</x-carousel>
// </column>

export default class Carousel extends HTMLElement {
	constructor() {
		super();
		this.animation_duration = 1000;
		this.auto_rotate_interval = 3000;
		this.rotate_interval = null;
		this.offset = 0;
		this.gap = 0;
		this.resize_observer = null;
		this.card_width = 0;
		this.previous_btn = null;
		this.next_btn = null;
		this.animating = false;

		this.touch_start_x = 0;
		this.auto_rotate_timeout = null;
		this.swipe_threshold = 30;
	}

	connectedCallback() {
		this.setup_carousel();
		this.setup_buttons();
		this.center_cards();
		this.start_auto_rotate();
		this.setup_event_listeners();

		this.resize_observer = new ResizeObserver(() => {
			this.card_width = this.cards[0].offsetWidth;
			this.gap = parseInt(getComputedStyle(this).gap);
			this.center_cards();
		});
		this.resize_observer.observe(this);
	}

	disconnectedCallback() {
		this.stop_auto_rotate();
		this.resize_observer.disconnect();
	}

	setup_carousel() {
		this.style.display = 'flex';
		this.style.overflow = 'hidden';
		this.style.maskImage = "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 2%, rgba(0, 0, 0, 1) 98%, rgba(0, 0, 0, 0))";
		this.style.position = "relative";

		this.cards = this.get_cards_array();
		this.gap = parseInt(getComputedStyle(this).gap);
		this.card_width = this.cards[0].offsetWidth;
	}

	setup_buttons(){
		this.previous_btn = document.createElement("button");
		this.previous_btn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
				<path d="M 7.824219 13 L 12.726562 17.898438 C 12.925781 18.101562 13.019531 18.332031 13.011719 18.601562 C 13.003906 18.867188 12.898438 19.101562 12.699219 19.300781 C 12.5 19.484375 12.265625 19.578125 12 19.585938 C 11.734375 19.597656 11.5 19.5 11.300781 19.300781 L 4.699219 12.699219 C 4.601562 12.601562 4.527344 12.492188 4.488281 12.375 C 4.445312 12.257812 4.425781 12.132812 4.425781 12 C 4.425781 11.867188 4.445312 11.742188 4.488281 11.625 C 4.527344 11.507812 4.601562 11.398438 4.699219 11.300781 L 11.300781 4.699219 C 11.484375 4.515625 11.710938 4.425781 11.988281 4.425781 C 12.261719 4.425781 12.5 4.515625 12.699219 4.699219 C 12.898438 4.898438 13 5.136719 13 5.414062 C 13 5.6875 12.898438 5.925781 12.699219 6.125 L 7.824219 11 L 19 11 C 19.285156 11 19.519531 11.097656 19.710938 11.289062 C 19.902344 11.480469 20 11.714844 20 12 C 20 12.285156 19.902344 12.519531 19.710938 12.710938 C 19.519531 12.902344 19.285156 13 19 13 Z M 7.824219 13 "/>
			</svg>
		`;
		this.previous_btn.className = "btn btn-primary position-absolute radius-circle";
		this.previous_btn.style.padding = "5px 10px";
		this.previous_btn.style.left = "20px";
		this.previous_btn.style.top = "50%";
		this.previous_btn.style.transform = "translateY(-50%)";
		this.previous_btn.style.opacity = "0";
		this.previous_btn.style.transition = "opacity 0.3s ease";
		this.previous_btn.style.zIndex = "5";
		this.appendChild(this.previous_btn);
		this.previous_btn.onclick = () => this.previous_card();

		this.next_btn = document.createElement("button");
		this.next_btn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
				<path d="M 16.175781 13 L 5 13 C 4.714844 13 4.480469 12.902344 4.289062 12.710938 C 4.097656 12.519531 4 12.285156 4 12 C 4 11.714844 4.097656 11.480469 4.289062 11.289062 C 4.480469 11.097656 4.714844 11 5 11 L 16.175781 11 L 11.273438 6.101562 C 11.074219 5.898438 10.980469 5.667969 10.988281 5.398438 C 10.996094 5.132812 11.101562 4.898438 11.300781 4.699219 C 11.5 4.515625 11.734375 4.421875 12 4.414062 C 12.265625 4.402344 12.5 4.5 12.699219 4.699219 L 19.300781 11.300781 C 19.398438 11.398438 19.472656 11.507812 19.511719 11.625 C 19.554688 11.742188 19.574219 11.867188 19.574219 12 C 19.574219 12.132812 19.554688 12.257812 19.511719 12.375 C 19.472656 12.492188 19.398438 12.601562 19.300781 12.699219 L 12.699219 19.300781 C 12.515625 19.484375 12.289062 19.574219 12.011719 19.574219 C 11.738281 19.574219 11.5 19.484375 11.300781 19.300781 C 11.101562 19.101562 11 18.863281 11 18.585938 C 11 18.3125 11.101562 18.074219 11.300781 17.875 Z M 16.175781 13 "/>
			</svg>
		`;
		this.next_btn.className = "btn btn-primary position-absolute radius-circle";
		this.next_btn.style.padding = "5px 10px";
		this.next_btn.style.right = "20px";
		this.next_btn.style.top = "50%";
		this.next_btn.style.transform = "translateY(-50%)";
		this.next_btn.style.transition = "opacity 0.3s ease";
		this.next_btn.style.opacity = "0";
		this.next_btn.style.zIndex = "5";
		this.appendChild(this.next_btn);
		this.next_btn.onclick = () => this.next_card();

		// Hide buttons on mobile
		if ("ontouchstart" in window) {
		  this.previous_btn.style.display = 'none';
		  this.next_btn.style.display = 'none';
		}
	}

	center_cards() {
		const computed_style = getComputedStyle(this);
		const container_width = this.offsetWidth - parseInt(computed_style.paddingLeft) - parseInt(computed_style.paddingRight);

		// Core positioning logic
		this.offset = this.card_width + this.gap - (container_width - this.card_width) / 2;
		this.offset = Math.abs(this.offset);

		for (const card of this.cards){
			card.style.transition = 'none';
			card.style.transform = `translateX(-${this.offset}px)`;
		}
	}

	setup_event_listeners() {
		this.addEventListener('mouseenter', () =>{
			this.stop_auto_rotate();
			this.previous_btn.style.opacity = "1";
			this.next_btn.style.opacity = "1";
		});

		this.addEventListener('mouseleave', () =>{
			this.start_auto_rotate();
			this.previous_btn.style.opacity = "0";
			this.next_btn.style.opacity = "0";
		});

		this.addEventListener('touchstart', this.handle_touch_start.bind(this));
		this.addEventListener('touchend', this.handle_touch_end.bind(this));
	}

	handle_touch_start(e) {
		this.stop_auto_rotate();
		this.touch_start_x = e.touches[0].clientX;

		clearTimeout(this.auto_rotate_timeout);
		this.auto_rotate_timeout = setTimeout(() => { this.start_auto_rotate(); }, 5000);
	}

	handle_touch_end(e) {
		const touch_end_x = e.changedTouches[0].clientX;
		const delta_x = touch_end_x - this.touch_start_x;

		if (Math.abs(delta_x) > this.swipe_threshold) {
			if (delta_x > 0) this.previous_card();
			else this.next_card();
		}
	}

	start_auto_rotate() {
		this.rotate_interval = setInterval(() => this.next_card(), this.auto_rotate_interval);
	}

	stop_auto_rotate() {
		clearInterval(this.rotate_interval);
		this.rotate_interval = null;
	}

	next_card() {
		if (this.animating) return;
		this.animating = true;

		const first_card = this.cards[0];
		const clone = first_card.cloneNode(true);

		// Prepare clone position
		clone.style.transform = `translateX(-${this.offset}px)`;
		this.appendChild(clone);

		// Force layout synchronization
		void this.offsetWidth;

		// Animate all cards
		this.cards = this.get_cards_array();

		for (const card of this.cards){
			card.style.transition = `transform ${this.animation_duration}ms ease`;
			card.style.transform = `translateX(-${this.offset + this.card_width + this.gap}px)`;
		}

		// Cleanup after animation
		setTimeout(() => {
			this.removeChild(first_card);
			this.cards = this.get_cards_array();

			// Reset positions without animation
			for (const card of this.cards){
				card.style.transition = 'none';
				card.style.transform = `translateX(-${this.offset}px)`;
			}
			this.animating = false;

		}, this.animation_duration);
	}

	previous_card() {
		if (this.animating) return;
		this.animating = true;

		const last_card = this.cards[this.cards.length - 1];
		const clone = last_card.cloneNode(true);

		clone.style.transform = `translateX(-${this.offset + this.card_width + this.gap}px)`;
		this.insertBefore(clone, this.cards[0]);

		const initialOffset = this.offset + this.card_width + this.gap;
		this.cards = this.get_cards_array();
		for (const card of this.cards) {
			card.style.transition = 'none';
			card.style.transform = `translateX(-${initialOffset}px)`;
		}

		// this shenanigan is important, if you wanna transform right after one transformation
		void this.offsetWidth;

		for (const card of this.cards) {
			card.style.transition = `transform ${this.animation_duration}ms ease`;
			card.style.transform = `translateX(-${this.offset}px)`;
		}

		setTimeout(() => {
			this.removeChild(last_card);
			this.cards = this.get_cards_array();

			for (const card of this.cards) {
				card.style.transition = 'none';
				card.style.transform = `translateX(-${this.offset}px)`;
			}
			this.animating = false;

		}, this.animation_duration);
	}

	/// Helper
	get_cards_array(){
		const cards = [];
		for (const child of this.children) if (!child.classList.contains('btn')){
			child.style.flexShrink = '0';
			cards.push(child);
		}

		return cards;
	}
}

window.customElements.define('x-carousel', Carousel);
