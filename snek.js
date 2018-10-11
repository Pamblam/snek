
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var snek = new Snek();
var int;
var gameStarted = false;
var gameover = false;
var food;

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
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(!food) food = newRandomPoint();
	ctx.beginPath();
	for(var i=0; i<snek.segments.length; i++){
		ctx.moveTo(snek.segments[i].start.x, snek.segments[i].start.y);
		ctx.lineTo(snek.segments[i].end.x, snek.segments[i].end.y);
	}
	ctx.strokeStyle="#00C800"
	ctx.stroke();
	ctx.fillStyle="#C80000"
	ctx.fillRect(food.x, food.y, 2, 2);
}

function startGame(){
	if(gameStarted || gameover) return;
	gameStarted = true;
	int = setInterval(()=>{
		draw();
		snek.move();
		if(isCollidedWithEdgeOrSelf()){
			gameover = true;
			document.getElementById('out').innerHTML = '<font face="courier" style="color: rgb(0, 200, 0); font-size: 22px">Your game is over. You scored <b>' + snek.getLength() + "</b> points.</font>";
			stopGame();
		}else if(isPointCollidedWithEdgeOrSelf(food)){
			food = newRandomPoint();
			snek.addToTail(2);
			var len = snek.getLength();
			var speedups = [38, 46, 54, 62, 70, 78];
			if(~speedups.indexOf(len)){
				snek.speed++;
				document.getElementById('out').innerHTML = "You got a food. Your score is "+ len + " and you got a speed boost...";
			}else document.getElementById('out').innerHTML = "You got a food. Your score is "+ len;
		}
	}, 100);
}

function stopGame(){
	if(!gameStarted) return;
	gameStarted = false;
	clearInterval(int);
}

function toggleGame(){
	if(!gameStarted) startGame();
	else stopGame();
}

function isPointCollidedWithEdgeOrSelf(point){
	var lines = edges.concat(snek.segments);
	for(var i=0; i<lines.length; i++){
		if(isPointTouchingLine(point, lines[i])) return true;
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

function isPointTouchingLine(point, line) {
	return pointToLineDistance(point, line) === 0;
}

function pointToLineDistance(point, line) {

  var A = point.x - line.start.x;
  var B = point.y - line.start.y;
  var C = line.end.x - line.start.x;
  var D = line.end.y - line.start.y;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq != 0) //in case of 0 length line
      param = dot / len_sq;

  var xx, yy;

  if (param < 0) {
    xx = line.start.x;
    yy = line.start.y;
  }
  else if (param > 1) {
    xx = line.end.x;
    yy = line.end.y;
  }
  else {
    xx = line.start.x + param * C;
    yy = line.start.y + param * D;
  }

  var dx = point.x - xx;
  var dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

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
