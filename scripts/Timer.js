class Timer {
	constructor(timerElem) {
		this.timerElem = timerElem;
		this.timerId = null;
		this.minutes = 0;
		this.seconds = 0;
	}

	start() {
		this.timerId = setInterval(() => {
			this.seconds++;
			if (this.seconds === 60) {
				this.minutes++;
				this.seconds = 0;
			}
			this.displayTime();
		}, 1000);
	}

	displayTime() {
		var timing = `${("0" + this.minutes).slice(-2)} : ${(
			"0" + this.seconds
		).slice(-2)}`;
		if (!this.timerElem.classList.contains("show"))
			this.timerElem.classList.add("show");
		this.timerElem.classList.remove("hightLight");
		this.timerElem.innerHTML = timing;
	}

	stop() {
		if (!this.timerId) return;
		clearInterval(this.timerId);
		this.displayTime();
	}
}
