
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var snek = new Snek();
var int;
var gameStarted = false;
var gameover = false;
var food, cherry, cherryTimer;
var gameSpeed = 100; // how often the game is redrawn in ms (smaller = faster)
var player_name = localStorage.getItem('username');
var top_score = localStorage.getItem('top_score');
var lowest_in_top = false;
var foodSize = 15;
var snekHead = new Image();
var cherryImg = new Image();

function edges() {
	return [
		{start: {x: 0, y: 0}, end: {x: canvas.width, y: 0}},
		{start: {x: canvas.width, y: 0}, end: {x: canvas.width, y: canvas.height}},
		{start: {x: canvas.width, y: canvas.height}, end: {x: 0, y: canvas.height}},
		{start: {x: 0, y: canvas.height}, end: {x: 0, y: 0}}
	];
}

function newRandomPoint() {
	var point = {
		x: Math.floor(Math.random() * ((canvas.width - 2) - 2 + 1)) + 2,
		y: Math.floor(Math.random() * ((canvas.height - 2) - 2 + 1)) + 2
	};
	return isPointCollidedWithEdgeOrSelf(point) ? newRandomPoint() : point;
}

function setCherryTimer(){
	cherryTimer = true;
	var min = 1*60*1000, max = 3*60*1000;
	var ms = Math.floor(Math.random()*(max-min+1)+min);
	setTimeout(()=>{
		cherry = newRandomPoint();
		cherryTimer = false;
	}, ms);
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!food) food = newRandomPoint();
	if (!cherryTimer && !cherry) setCherryTimer();
	for (var i = 0; i < snek.segments.length; i++) {
		drawCircle(snek.segments[i].end.x, snek.segments[i].end.y, snek.width / 2);
		ctx.lineWidth = snek.width;
		ctx.beginPath();
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
		ctx.strokeStyle = '#795548';
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
		ctx.strokeStyle = '#ffffff';
		ctx.stroke();
	}
	switch (snek.segments[0].direction) { // img dims: w = 12, h = 18
		case 'L':
			drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHead, 90);
			break;
		case 'U':
			drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHead, 180);
			break;
		case 'R':
			drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHead, 270);
			break;
		case 'D':
			drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHead, 0);
			break;
	}
	ctx.font = 'bold ' + foodSize + 'px Calibri';
	ctx.fillText("🍅", food.x, food.y);
	if(cherry) ctx.drawImage(cherryImg, cherry.x, cherry.y, foodSize+3, foodSize+3);
}

function drawRotatedImage(x, y, im, deg) {
	ctx.save();
	ctx.translate(x, y);
	ctx.translate(im.width / 2, im.height / 2);
	ctx.rotate(deg * Math.PI / 180);
	ctx.drawImage(im, -(im.width / 2), -(im.height / 2));
	ctx.restore();
}

function drawCircle(x, y, rad) {
	ctx.beginPath();
	ctx.arc(x, y, rad, 0, 2 * Math.PI, false);
	ctx.fillStyle = '#795548';
	ctx.fill();
}

function mainLoop() {
	draw();
	snek.move();
	if (isCollidedWithEdgeOrSelf()) {
		gameover = true;
		document.body.classList.remove('started');
		document.body.classList.add('finished');
		gameOver();
		stopGame();
	} else if (isPointCollidedWithEdgeOrSelf(food)) {
		food = newRandomPoint();
		snek.addToTail(10);
		var len = snek.getLength();
		if (len % 5 === 0) {
			speedUp();
			displayMessage("You got a food. Your score is " + len + " and you got a speed boost...");
		} else displayMessage("You got a food. Your score is " + len + ".")
	} else if (cherry && isPointCollidedWithEdgeOrSelf(cherry)) {
		cherry = false;
		gameSpeed -= 25;
		clearInterval(int);
		int = setInterval(mainLoop, gameSpeed);
		displayMessage("You got a temporary speed boost!");
		setTimeout(()=>{
			gameSpeed += 35;
			clearInterval(int);
			int = setInterval(mainLoop, gameSpeed);
			displayMessage("Temporary speed boost expired.")
		},30000);
	}
}

function gameOver() {
	var score = snek.getLength();
	displayMessage('gameover, your score is ' + snek.getLength() + ".");
	document.getElementById("btn-restart").classList.remove("hide");
	ajax({action: 'addScore', username: player_name, score: score, game: 'snek'}).then(res => {
		if (top_score && score > top_score) {
			localStorage.getItem('top_score', score);
			alert("You beat your personal top score!");
		}
		if (score > lowest_in_top) {
			loadTop15();
			alert("You made it into the top 15!");
		}
	});
}

function displayMessage(msg) {
	document.getElementById('out').innerHTML = msg;
}

function speedUp() {
	if (gameSpeed < 31)
		return;
	gameSpeed -= 5;
	clearInterval(int);
	int = setInterval(mainLoop, gameSpeed);
}

function startGame() {
	if (gameStarted || gameover)
		return;
	gameStarted = true;
	document.body.classList.add('started');
	int = setInterval(mainLoop, gameSpeed);
}

function stopGame() {
	if (!gameStarted)
		return;
	gameStarted = false;
	clearInterval(int);
}

function toggleGame() {
	var resolution = document.getElementById("resolution");
	if (!gameStarted) {
		startGame();
		resolution.classList.add("hidden");
	} else {
		stopGame();
		resolution.classList.remove("hidden");
	}
}

function isPointCollidedWithEdgeOrSelf(point) {
	var lines = edges().concat(snek.segments);
	for (var i = 0; i < lines.length; i++) {
		if (isPointTouchingLine(point, lines[i], foodSize))
			return true;
	}
	return false;
}

function isCollidedWithEdgeOrSelf() {
	var head = snek.segments[0].start;
	var lines = edges().concat(snek.segments.slice(1));
	for (var i = 0; i < lines.length; i++) {
		if (isPointTouchingLine(head, lines[i]))
			return true;
	}
	return false;
}

function isPointTouchingLine(point, line, tolerance = 0) {
	var distance = pointToLineDistance(point, line);
	return distance >= (0 - tolerance) && distance <= tolerance;
}

function pointToLineDistance(point, line) {
	var xx, yy;
	var A = point.x - line.start.x;
	var B = point.y - line.start.y;
	var C = line.end.x - line.start.x;
	var D = line.end.y - line.start.y;
	var dot = A * C + B * D;
	var len_sq = C * C + D * D;
	var param = -1;
	if (len_sq != 0)
		param = dot / len_sq;
	if (param < 0) {
		xx = line.start.x;
		yy = line.start.y;
	} else if (param > 1) {
		xx = line.end.x;
		yy = line.end.y;
	} else {
		xx = line.start.x + param * C;
		yy = line.start.y + param * D;
	}
	var dx = point.x - xx;
	var dy = point.y - yy;
	return Math.sqrt(dx * dx + dy * dy);
}

function getPlayerName() {
	document.getElementById('getname').style.display = "block";
	document.getElementById('game').style.display = "none";
	document.getElementById("nameform").addEventListener('submit', function (e) {
		e = e || window.event;
		player_name = document.getElementById("username").value;
		if (player_name.length > 10 || player_name.length < 2)
			return alert("Username should be between 2 and 10 chars.");
		localStorage.setItem('username', player_name);
	});
}

function showGame() {
	document.getElementById('getname').style.display = "none";
	document.getElementById('game').style.display = "block";
	loadTop15();
	document.addEventListener('keydown', function (e) {
		e = e || window.event;
		var key = parseInt(e.keyCode);
		switch (key) {
			case 38:
				snek.changeDir('U');
				e.preventDefault();
				break;
			case 39:
				snek.changeDir('R');
				e.preventDefault();
				break;
			case 40:
				snek.changeDir('D');
				e.preventDefault();
				break;
			case 37:
				snek.changeDir('L');
				e.preventDefault();
				break;
			case 32:
				var x = document.activeElement;
				if (x.id != 'username'){
					e.preventDefault();
				}
				toggleGame();
				break;
		}
	});
}

function loadTop15() {
	var list = document.getElementById('scores');
	var markup_buffer = [];
	ajax({action: 'getTop', results: 15, game: 'snek'}).then(res => {
		res.data.forEach(score => {
			if (lowest_in_top === false || lowest_in_top > score.score)
				lowest_in_top = score.score;
			markup_buffer.push(`<li>${score.username} (${score.score}pts)</li>`);
		});
		list.innerHTML = markup_buffer.join('');
	});
}

function ajax(params) {
	/**
	 * Let's not be a dick with my server please :)
	 * This is on the honor system.
	 */
	return new Promise(done => {
		var qs = [];
		for (var p in params)
			qs.push(`${p}=${encodeURIComponent(params[p])}`);
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				done(JSON.parse(xhttp.responseText));
			}
		};
		xhttp.open("GET", "https://pamblam.com/scoreboard/?" + qs.join('&'), true);
		xhttp.send();
	});
}

function setCanvasSizeOpts() {
	var res = document.getElementById('resolution');
	var availableHeight = innerHeight - canvas.getBoundingClientRect().top;
	var opts = {
		"400/400": "400x400",
		"480/720": "480x720",
		"600/600": "600x600",
		"800/600": "800x600",
		"800/800": "800x800",
		"800/1000": "800x1000",
		"720/1028": "720x1028",
		"1080/1920": "1080x1920"
	};
	var opts_buffer = [];
	for (let i in opts) {
		var w, h;
		[w, h] = i.split('/');
		if (parseInt(w) < (innerWidth - 40) && parseInt(h) < (availableHeight - 30)) {
			opts_buffer.push(`<option value='${i}'>${opts[i]}</option>`);
		}
	}
	opts_buffer.push(`<option value='fullscreen'>Window size</option>`);
	res.innerHTML = opts_buffer.join('');
	res.removeEventListener('change', resizeCanvas);
	res.addEventListener('change', resizeCanvas);
}

function resizeCanvas() {
	scrollTo(0, 0);
	var w, h;
	var availableHeight = innerHeight - canvas.getBoundingClientRect().top;
	[w, h] = document.getElementById('resolution').value.split('/');
	canvas.height = w === 'fullscreen' ? availableHeight - 30 : h;
	canvas.width = w === 'fullscreen' ? innerWidth - 40 : w;
}

cherryImg.src = 'cherries.png';
snekHead.src = 'snek_head.png';
addEventListener('resize', setCanvasSizeOpts);
if (!player_name)
	getPlayerName();
else
	showGame();
setCanvasSizeOpts();