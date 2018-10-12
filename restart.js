function restartGame(){
	
	var btn = document.createElement("RestartButton");        
	var t = document.createTextNode("Restart"); 
	document.getElementsByName("RestartButton").onClick = "refresh()";
	appendChild(t);                                
	document.body.appendChild(btn);                     
}

function refresh(){
	location.reload(); 
}
