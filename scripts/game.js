
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// Example of how to set up a "two player" game against a bot
//var sneks = [new Snek('live', 'blue'), new Snek('bot', 'red')];

var sneks = [new Snek('live', 'brown')];

var int;
var gameStarted = false;
var gameover = false;
var gameTimer = new Timer(document.querySelector('.game-timer'));
var food, cherry, cherryTimer;
var gameSpeed = 100; // how often the game is redrawn in ms (smaller = faster)
var playerName = localStorage.getItem('username');
var topScore = localStorage.getItem('top_score');
var lowestInTop = false;
var foodSize = 15;
var snekHeads = {
	brown: new Image(),
	red: new Image(),
	blue: new Image(),
	yellow: new Image()
};
var cherryImg = new Image();
var foodChar = '🍅';
var modalMessage = '';
var modal = document.getElementById("modal");
var span = document.getElementsByClassName("close")[0];
var gameMode = 'stamina'; // 'longest_wins';

// Key Codes for reading user input
const SPACE = 32;
const LEFT = 37;
const UP = 38;
const RIGHT = 39;
const DOWN = 40;

function showModal(message) {
	addModalMessage(message);
	modal.style.display = "block";
}

function closeModal() {
	modal.style.display = "none";
}

function addModalMessage(message) {
	document.getElementById("message-modal").textContent = message
}

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
	var safe = true;
	for(var i=0; i<sneks.length; i++){ { if(isPointCollidedWithEdgeOrSelf(point, sneks[i])) safe = false; break; } }
	return safe ? point : newRandomPoint() ;
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

function drawSnek(snek){
	switch(snek.color){
		case 'brown': var color = '#795548'; break;
		case 'red': var color = '#ff0d00'; break;
		case 'blue': var color = '#312dc5'; break;
		case 'yellow': var color = '#f5ff00'; break;
	}
	for (var i = 0; i < snek.segments.length; i++) {
		drawCircle(snek.segments[i].end.x, snek.segments[i].end.y, snek.width / 2, color);
		ctx.lineWidth = snek.width;
		ctx.beginPath();
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
		ctx.strokeStyle = '#ffffff';
		ctx.stroke();
	}
	switch (snek.segments[0].direction) { // img dims: w = 12, h = 18
		case 'L': drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHeads[snek.color], 90); break;
		case 'U': drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHeads[snek.color], 180); break;
		case 'R': drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHeads[snek.color], 270);break;
		case 'D': drawRotatedImage(snek.segments[0].start.x - 6, snek.segments[0].start.y - 9, snekHeads[snek.color], 0); break;
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!food) {
		if (generateRandomInt(0,10) >= 7) foodChar = '🎃';
		food = newRandomPoint();
	}
	if (!cherryTimer && !cherry) setCherryTimer();
	sneks.forEach(drawSnek);
	ctx.font = 'bold ' + foodSize + 'px Calibri';
	ctx.fillText(foodChar, food.x, food.y);
	if(cherry) ctx.drawImage(cherryImg, cherry.x, cherry.y, foodSize+3, foodSize+3);
}

function generateRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawRotatedImage(x, y, im, deg) {
	ctx.save();
	ctx.translate(x, y);
	ctx.translate(im.width / 2, im.height / 2);
	ctx.rotate(deg * Math.PI / 180);
	ctx.drawImage(im, -(im.width / 2), -(im.height / 2));
	ctx.restore();
}

function drawCircle(x, y, rad, color) {
	ctx.beginPath();
	ctx.arc(x, y, rad, 0, 2 * Math.PI, false);
	ctx.fillStyle = color;
	ctx.fill();
}

function renderSnek(snek, idx){
	if(gameover) return;
	snek.move();
	if (isCollidedWithEdgeOrSelf(snek)) {
		gameover = true;
		document.body.classList.remove('started');
		document.body.classList.add('finished');
		gameOver(idx == 0);
		stopGame();
	} else if (isPointCollidedWithEdgeOrSelf(food, snek)) {
		food = newRandomPoint();
		snek.addToTail(10);
		var len = snek.getLength();
		if (len % 5 === 0) {
			speedUp();
			displayMessage("You got a food. Your score is " + len + " and you got a speed boost...");
		} else displayMessage("You got a food. Your score is " + len + ".")
	} else if (cherry && isPointCollidedWithEdgeOrSelf(cherry, snek)) {
		cherry = false;
		gameSpeed -= 25;
		clearInterval(int);
		int = setInterval(mainLoop, gameSpeed);
		displayMessage("You got a temporary speed boost!");
		setTimeout(()=>{
			if(gameover) return;
			gameSpeed += 35;
			clearInterval(int);
			int = setInterval(mainLoop, gameSpeed);
			displayMessage("Temporary speed boost expired.")
		},30000);
	}
}

function mainLoop() {
	draw();
	sneks.forEach(renderSnek);
}

function gameOver(won) {
	gameTimer.stop();
	var snek = sneks.reduce((acc,cur)=>{ return acc === false ? cur : cur.getLength() > acc.getLength() ? cur : acc}, false);
	if(sneks.length === 1){
		displayMessage('gameover, your score is ' + snek.getLength() + ".");
	}else{
		if(gameMode === 'longest_wins'){
			if(snek.getLength()>sneks[0].getLength()){
				displayMessage('gameover, you lose.');
			}else if(snek.getLength()<sneks[0].getLength()){
				displayMessage('gameover, you win.');
			}else{
				displayMessage('gameover, it\'s a tie.');
			}
		}else{
			if(won){
				displayMessage('gameover, you win.');
			}else if(snek.getLength()<sneks[0].getLength()){
				displayMessage('gameover, you lose.');
			}
		}
	}
	var score = sneks[0].getLength();
	document.getElementById("btn-restart").classList.remove("hide");
	ajax({action: 'addScore', username: playerName, score: score, game: 'snek'}).then(res => {
		if (topScore && score > topScore) {
			localStorage.getItem('top_score', score);
			showModal("You beat your personal top score!");
		}
		if (score > lowestInTop) {
			loadTop15();
			showModal("You made it into the top 15!");
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

function startBots(){
	var botInt = setInterval(()=>{
		if(gameover) clearInterval(botInt);
		if(!gameStarted) return;
		sneks.forEach(snek=>{
			if(snek.isBot) thinkForBot(snek);
		});
	},500);
}

function startGame() {
	if (gameStarted || gameover) return;
	gameStarted = true;
	startBots();
	document.body.classList.add('started');
	int = setInterval(mainLoop, gameSpeed);
	gameTimer.start();
}

function stopGame() {
	if (!gameStarted) return;
	gameStarted = false;
	gameTimer.stop();
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

function linesIntersect(line1, line2) {
	var det, gamma, lambda;
	det = (line1.end.x - line1.start.x) * (line2.end.y - line2.start.y) - (line2.end.x - line2.start.x) * (line1.end.y - line1.start.y);
	if (det === 0) return false;
	else {
		lambda = ((line2.end.y - line2.start.y) * (line2.end.x - line1.start.x) + (line2.start.x - line2.end.x) * (line2.end.y - line1.start.y)) / det;
		gamma = ((line1.start.y - line1.end.y) * (line2.end.x - line1.start.x) + (line1.end.x - line1.start.x) * (line2.end.y - line1.start.y)) / det;
		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
	}
}

function isObstructionWithinNPixels(head, direction, pixels){
	var lines = allLines();
	switch(direction){
		case "U": var path = {start:{x:head.x, y:head.y}, end:{x:head.x, y:head.y-pixels}}; break;
		case "D": var path = {start:{x:head.x, y:head.y}, end:{x:head.x, y:head.y+pixels}}; break;
		case "L": var path = {start:{x:head.x, y:head.y}, end:{x:head.x-pixels, y:head.y}}; break;
		case "R": var path = {start:{x:head.x, y:head.y}, end:{x:head.x+pixels, y:head.y}}; break;
	}
	var safe = true;
	for(var i=0; i<lines.length; i++){
		if(lines[i].start.x === head.x && lines[i].start.y === head.y) continue;
		if(linesIntersect(lines[i], path)){
			safe = false;
			break;
		}
	}
	return !safe;
}

function allLines(){
	var lines = edges();
	for(var i=0; i<sneks.length; i++){ lines = lines.concat(sneks[i].segments); }
	return lines;
}

function getDirectionToward(head, dest, direction, available_directions){
	var newDir = false;
	if(direction === 'U' || direction === 'D'){
		var d = dest.x > head.x ? 'R' : 'L';
		if(~available_directions.indexOf(d)) newDir = d;
	}else{
		var d = dest.x > head.x ? 'D' : 'U';
		if(~available_directions.indexOf(d)) newDir = d;
	}
	return newDir;
}

function distanceBetweenPoints(p1, p2){
	var a = p1.x - p2.x;
	var b = p1.y - p2.y;
	return Math.sqrt( a*a + b*b );
}

function thinkForBot(snek){
	var head = snek.segments[0].start;
	var direction = snek.segments[0].direction;
	var available_directions = [];
	if(direction === 'U' || direction === 'D'){
		if(!isObstructionWithinNPixels(head, 'L', 30)) available_directions.push('L');
		if(!isObstructionWithinNPixels(head, 'R', 30)) available_directions.push('R');
	}else{
		if(!isObstructionWithinNPixels(head, 'U', 30)) available_directions.push('U');
		if(!isObstructionWithinNPixels(head, 'D', 30)) available_directions.push('D');
	}
	if(isObstructionWithinNPixels(head, direction, 30)){
		var newDir = false;
		if(snek.botTarget === 'food'){
			newDir = getDirectionToward(head, food, direction, available_directions);
			if(newDir === false && cherry){
				snek.botTarget === 'cherry';
				newDir = getDirectionToward(head, cherry, direction, available_directions);
			}
		}else{
			if(cherry) newDir = getDirectionToward(head, food, direction, available_directions);
			if(newDir === false){
				snek.botTarget === 'food';
				newDir = getDirectionToward(head, cherry, direction, available_directions);
			}
		}
		if(newDir) snek.changeDir(newDir);
	}else{
		var target, newDir = false;
		if(!cherry){
			snek.botTarget === 'food'
			target = food;
		}else if(distanceBetweenPoints(head, cherry) < distanceBetweenPoints(head, food)){
			snek.botTarget === 'cherry'
			target = cherry;
		}else{
			snek.botTarget === 'food'
			target = food;
		}
		if(direction === 'U' && head.y < target.y) newDir = getDirectionToward(head, target, direction, available_directions);
		else if(direction === 'D' && head.y > target.y) newDir = getDirectionToward(head, target, direction, available_directions);
		else if(direction === 'L' && head.x < target.x) newDir = getDirectionToward(head, target, direction, available_directions);
		else if(direction === 'R' && head.x > target.x) newDir = getDirectionToward(head, target, direction, available_directions);
		if(newDir) snek.changeDir(newDir);
	}
}

function isPointCollidedWithEdgeOrSelf(point, snek) {
	var lines = allLines();
	for (var i = 0; i < lines.length; i++) {
		if (isPointTouchingLine(point, lines[i], foodSize))
			return true;
	}
	return false;
}

function isCollidedWithEdgeOrSelf(snek) {
	var head = snek.segments[0].start;
	var lines = allLines();
	for (var i = 0; i < lines.length; i++) {
		if(lines[i].start.x === head.x && lines[i].start.y === head.y) continue;
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
		e.preventDefault();
		e = e || window.event;
		playerName = document.getElementById("username").value;
		if (playerName.length > 10 || playerName.length < 2) {
			showModal("Username should be between 2 and 10 chars.");
		} else {
			localStorage.setItem('username', playerName);
			showGame();
		}
	});
}

function showGame() {
	document.getElementById('getname').style.display = "none";
	document.getElementById('game').style.display = "block";
	loadTop15();
	var snek = sneks[0];
	document.addEventListener('keydown', function (e) {
		e = e || window.event;
		var key = parseInt(e.keyCode);
		switch (key) {
			case UP:
				snek.changeDir('U');
				e.preventDefault();
				break;
			case RIGHT:
				snek.changeDir('R');
				e.preventDefault();
				break;
			case DOWN:
				snek.changeDir('D');
				e.preventDefault();
				break;
			case LEFT:
				snek.changeDir('L');
				e.preventDefault();
				break;
			case SPACE:
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
	var nrCount = 0;
	var list = document.getElementById('scores');
	var markupBuffer = [];
	ajax({action: 'getTop', results: 15, game: 'snek'}).then(res => {
		res.data.forEach(score => {
			nrCount +=1;
			if (lowestInTop === false || lowestInTop > score.score)
				lowestInTop = score.score;
			markupBuffer.push(`
				<tr>
				<td><i> ${nrCount}</i> </td>
				<td> ${score.username}  </td>
				<td> (${score.score}pts) </td>
				</tr>`);
		});
		list.innerHTML = markupBuffer.join('');
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
		"300/150": "300x150",
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

function loadImages(){
	return new Promise(done=>{
		var promises = [];
		promises.push(new Promise(done=>{cherryImg.onload = done}));
		promises.push(new Promise(done=>{snekHeads.brown.onload = done}));
		promises.push(new Promise(done=>{snekHeads.red.onload = done}));
		promises.push(new Promise(done=>{snekHeads.blue.onload = done}));
		promises.push(new Promise(done=>{snekHeads.yellow.onload = done}));
		cherryImg.src = 'images/cherries.png';
		snekHeads.brown.src = 'images/snek_head_brown.png';
		snekHeads.red.src = 'images/snek_head_red.png';
		snekHeads.blue.src = 'images/snek_head_blue.png';
		snekHeads.yellow.src = 'images/snek_head_yellow.png';
		Promise.all(promises).then(done);
	});
}

loadImages().then(done=>{
	addEventListener('resize', setCanvasSizeOpts);
	getPlayerName();
	if (playerName) document.getElementById('username').value = playerName;
	setCanvasSizeOpts();
	onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}
});

