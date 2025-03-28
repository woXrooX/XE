//// Recuirements
// Minimum card number should be 3
// All cards should have the same width
// flex-shrink-0 should be used with cards so they don't shrink due to parents flex attribute
// max-width-100vw is recommended for the container, as child elements may make it grow more than that

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
		this.previous_btn.innerHTML = `<x-svg name="carousel_left" color="white"></x-svg>`;
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
		this.next_btn.innerHTML = `<x-svg name="carousel_right" color="white"></x-svg>`;
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
		this.addEventListener('touchmove', this.handle_touch_move.bind(this));
	}

	handle_touch_start(e) {
		this.stop_auto_rotate();
		this.touch_start_x = e.touches[0].clientX;
		
		clearTimeout(this.auto_rotate_timeout);
		this.auto_rotate_timeout = setTimeout(() => { this.start_auto_rotate(); }, 5000);
	}

	handle_touch_move(e) { e.preventDefault(); }

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
		for (const child of this.children) if (!child.classList.contains('btn')) cards.push(child);

		return cards;
	}
}

window.customElements.define('x-carousel', Carousel);
