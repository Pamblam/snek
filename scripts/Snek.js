class Snek {
	constructor(player = "live", color = "brown") {
		this.length = 40;
		this.width = 8;
		this.isBot = player == "bot";
		this.botTarget = "food";
		this.color = color;
		var xofst = Math.floor(Math.random() * (250 - 1 + 1)) + 1;
		var yofst = Math.floor(Math.random() * (50 - 1 + 1)) + 1;
		this.segments = [
			new SnekSegment(50 + xofst, 50 + yofst, 50 + xofst, 40 + yofst, "D"),
			new SnekSegment(50 + xofst, 40 + yofst, 30 + xofst, 40 + yofst, "R")
		];
	}

	move() {
		this.addToHead(1);
		this.removeFromTail(1);
	}

	getLength() {
		var len = 0;
		for (var i = 0; i < this.segments.length; i++) {
			let a = this.segments[i].start.x - this.segments[i].end.x;
			let b = this.segments[i].start.y - this.segments[i].end.y;
			len += Math.sqrt(a * a + b * b);
		}
		return len;
	}

	changeDir(D) {
		var headSeg = this.segments[0];
		if (
			(D === "D" || D === "U") &&
			(headSeg.direction === "U" || headSeg.direction === "D")
		) {
			document.getElementById("error").innerHTML = "Invalid move";
			return;
		} else if (
			(D === "L" || D === "R") &&
			(headSeg.direction === "R" || headSeg.direction === "L")
		) {
			document.getElementById("error").innerHTML = "Invalid move";
			return;
		} else {
			this.segments.unshift(
				new SnekSegment(
					headSeg.start.x,
					headSeg.start.y,
					headSeg.start.x,
					headSeg.start.y,
					D
				)
			);
			document.getElementById("error").innerHTML = "";
		}
	}

	alterSegmentLength(idx, end, len) {
		switch (this.segments[idx].direction) {
			case "U":
				this.segments[idx][end].y -= len;
				break;
			case "D":
				this.segments[idx][end].y += len;
				break;
			case "L":
				this.segments[idx][end].x -= len;
				break;
			case "R":
				this.segments[idx][end].x += len;
				break;
		}
	}

	addToHead(len) {
		this.alterSegmentLength(0, "start", len);
	}

	removeFromTail(len) {
		var l = this.segments.length - 1;
		var lastSegmentLength = this.getSegLen(l);
		if (lastSegmentLength <= len) {
			len -= lastSegmentLength;
			this.segments.pop();
			if (!len) return;
			l--;
		}
		this.alterSegmentLength(l, "end", len);
		var seg = this.segments[l];
	}

	getSegLen(idx) {
		var a = this.segments[idx].start.x - this.segments[idx].end.x;
		var b = this.segments[idx].start.y - this.segments[idx].end.y;
		return Math.sqrt(a * a + b * b);
	}

	addToTail(len) {
		var l = this.segments.length - 1;
		this.alterSegmentLength(l, "end", -len);
	}
}

class SnekSegment {
	constructor(sx, sy, ex, ey, dir) {
		this.start = {x: sx, y: sy};
		this.end = {x: ex, y: ey};
		this.direction = dir;
	}
}
