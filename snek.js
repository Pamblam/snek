
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var snek = new Snek();
var int;
var gameStarted = false;
var gameover = false;
var food;
var gameSpeed = 100; // how often the game is redrawn in ms (smaller = faster)
var player_name = localStorage.getItem('username');
var top_score = localStorage.getItem('top_score');
var lowest_in_top = false;
var resolutionOptions = document.getElementById('resolution').options;
var screenWidth = window.innerWidth;
console.log(screenWidth);

for (var i = 0; i < resolutionOptions.length; i++) {
	var valueWidth = parseFloat(resolutionOptions[i].value.split('/')[1]);
	if ( valueWidth > screenWidth) {
		resolutionOptions[i] = null;
	}
}

var edges = [
	{start: {x:0, y:0}, end: {x:canvas.width, y:0}},
	{start: {x:canvas.width, y:0}, end: {x:canvas.width, y:canvas.height}},
	{start: {x:canvas.width, y:canvas.height}, end: {x:0, y:canvas.height}},
	{start: {x:0, y:canvas.height}, end: {x:0, y:0}}
];

function newRandomPoint(){
	var point = {
		x: Math.floor(Math.random() * ((canvas.width-2) - 2 + 1)) + 2,
		y: Math.floor(Math.random() * ((canvas.height-2) - 2 + 1)) + 2
	}
	return isPointCollidedWithEdgeOrSelf(point) ? newRandomPoint() : point;
}

function draw(){
    let tomatoColor = "tomato";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(!food) food = newRandomPoint();
	ctx.beginPath();
	ctx.lineWidth = snek.width;
	for(var i=0; i<snek.segments.length; i++){
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
	}
	ctx.strokeStyle = '#795548';
	ctx.stroke();
    ctx.strokeStyle = snek.color;
	ctx.font = 'bold 3px Calibri';
	ctx.fillText("🍅", food.x, food.y);
    ctx.fillStyle = tomatoColor;
	// ctx.fillRect(food.x, food.y, snek.width, snek.width);
}

function mainLoop(){
	draw();
	snek.move();
	if(isCollidedWithEdgeOrSelf()){
		gameover = true;
		document.body.classList.remove('started');
		document.body.classList.add('finished');
		gameOver();
		stopGame();
	}else if(isPointCollidedWithEdgeOrSelf(food)){
		food = newRandomPoint();
		snek.addToTail(1);
		var len = snek.getLength();
		if(len%5===0){
			speedUp();
			displayMessage("You got a food. Your score is "+ len + " and you got a speed boost...");
		}else displayMessage("You got a food. Your score is "+ len +".")
	}
}

function gameOver(){
	var score = snek.getLength();
	displayMessage('gameover, your score is ' + snek.getLength()+".");

	document.getElementById("btn-restart").classList.remove("hide");

	ajax({action:'addScore',username:player_name,score:score,game:'snek'}).then(res=>{
		if(top_score && score > top_score){
			localStorage.getItem('top_score', score);
			alert("You beat your personal top score!");
		}
		if(score > lowest_in_top){
			loadTop15();
			alert("You made it into the top 15!");
		}
	});
}

function displayMessage(msg){
	document.getElementById('out').innerHTML = msg;
}

function speedUp(){
	if(gameSpeed < 31) return;
	gameSpeed -= 3;
	clearInterval(int);
	int = setInterval(mainLoop, gameSpeed);
}

function startGame(){
	if(gameStarted || gameover) return;
	gameStarted = true;
	document.body.classList.add('started');
	int = setInterval(mainLoop, gameSpeed);
}

function stopGame(){
	if(!gameStarted) return;
	gameStarted = false;
	clearInterval(int);
}

function toggleGame(){
	var resolution = document.getElementById("resolution");
	if(!gameStarted) {
		startGame();
		resolution.classList.add("hidden");
	}
	else {
		stopGame();
		resolution.classList.remove("hidden");
	}
}

function isPointCollidedWithEdgeOrSelf(point){
	var lines = edges.concat(snek.segments);
	for(var i=0; i<lines.length; i++){
		if(isPointTouchingLine(point, lines[i], snek.width)) return true;
	}
	return false;
}

function isCollidedWithEdgeOrSelf(){
	var head = snek.segments[0].start;
	var lines = edges.concat(snek.segments.slice(1));
	for(var i=0; i<lines.length; i++){
		if(isPointTouchingLine(head, lines[i])) return true;
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
	if (len_sq != 0) param = dot / len_sq;
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

function getPlayerName(){
	document.getElementById('getname').style.display = "block";
	document.getElementById('game').style.display = "none";
	document.getElementById("nameform").addEventListener('submit', function(e){
		e = e || window.event;
		player_name = document.getElementById("username").value;
		if(player_name.length > 10 || player_name.length < 2) return alert("Username should be between 2 and 10 chars.");
		localStorage.setItem('username', player_name);
	});
}

function showGame(){
	document.getElementById('getname').style.display = "none";
	document.getElementById('game').style.display = "block";
	loadTop15();
	document.addEventListener('keydown', function(e){
		e = e || window.event;
		var key = parseInt(e.keyCode);
		switch(key){
			case 38: snek.changeDir('U'); break;
			case 39: snek.changeDir('R'); break;
			case 40: snek.changeDir('D'); break;
			case 37: snek.changeDir('L'); break;
			case 32: toggleGame(); break;
		}
	});
}

function loadTop15(){
	var list = document.getElementById('scores');
	var markup_buffer = [];
	ajax({action:'getTop',results:15,game:'snek'}).then(res=>{
		res.data.forEach(score=>{
			if(lowest_in_top === false || lowest_in_top > score.score) lowest_in_top = score.score;
			markup_buffer.push(`<li>${score.username} (${score.score}pts)</li>`);
		});
		list.innerHTML = markup_buffer.join('');
	});
}

function ajax(params){
	/**
	 * Let's not be a dick with my server please :)
	 * This is on the honor system.
	 */
	return new Promise(done=>{
		var qs = [];
		for(var p in params) qs.push(`${p}=${encodeURIComponent(params[p])}`);
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
			   done(JSON.parse(xhttp.responseText));
			}
		};
		xhttp.open("GET", "https://pamblam.com/scoreboard/?"+qs.join('&'), true);
		xhttp.send();
	});
}

if(!player_name)getPlayerName();
else showGame();


for (var i=0; i<document.getElementById('resolution').options.length; i++){
	var size = document.getElementById('resolution').options[i].value.split("/");
	if (parseInt(size[1],10) > window.innerWidth || parseInt(size[0],10) > window.innerHeight){
		document.getElementById('resolution').remove(i);
		i--;
	}
}

document.getElementById('resolution').addEventListener('change', function() {
	var selectedVal = document.getElementById('resolution').value.split('/');
	var canvas = document.querySelector('canvas')
	var canvasHeight = canvas.height;
	canvas.height = selectedVal[0] === 'fullscreen' ? window.innerHeight - document.documentElement.offsetHeight + canvasHeight  : selectedVal[0];
	canvas.width = selectedVal[0] === 'fullscreen' ? document.body.clientWidth : selectedVal[1];
})

document.getElementById('btn-toggle-hide').addEventListener('click', function() {
	if(document.getElementById('scores').style.display == 'none') {
		document.getElementById('scores').style.display = 'block';
	}
	else {
		document.getElementById('scores').style.display = 'none';
	}
});
