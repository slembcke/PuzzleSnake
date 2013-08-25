SVGNS = "http://www.w3.org/2000/svg";
Puzzle = {
	size: 5,
	
	tiles: [
		[1,1,1,0,0],
		[0,1,0,0,0],
		[0,0,0,1,0],
		[0,0,0,0,0],
		[0,0,0,0,0]
	]
};

Board = document.getElementById("board");
function MakeProtoTypeNode(id){
	var node = document.getElementById(id);
	node.parentNode.removeChild(node);
	
	return node;
}

TileProto = MakeProtoTypeNode("tile");
SpaceProto = MakeProtoTypeNode("space");
TilesProto = MakeProtoTypeNode("tiles");
PolylineProto = MakeProtoTypeNode("snake");
HeadProto = MakeProtoTypeNode("head");

// TODO move this
Tiles = Board.appendChild(TilesProto.cloneNode(true));

function SetBoardSize(){
	var size = Math.min(document.body.clientWidth, document.body.clientHeight);
	
	var tiles = Puzzle.size;
	var scale = size/tiles;
	
	var svg = document.getElementById("svg");
	svg.setAttribute("width", size);
	svg.setAttribute("height", size);
	
	Board.setAttribute("transform", "matrix("+(scale)+", 0, 0, "+(-scale)+", "+(scale/2)+", "+(size - scale/2)+")");
	
	ConvertCoords = function(x, y){
		return [Math.floor(x/scale), tiles - 1 - Math.floor(y/scale)];
	}
}

window.onresize = SetBoardSize;
SetBoardSize();
			
function CheckTile(x, y){
	return (
		0 <= x && x < Puzzle.size &&
		0 <= y && y < Puzzle.size &&
		!Puzzle.tiles[y][x]
	);
}

for(var y=0; y<Puzzle.size; y++){
	for(var x=0; x<Puzzle.size; x++){
		var solid = Puzzle.tiles[y][x];
		var tile = (solid ? TileProto : SpaceProto).cloneNode(true);
		tile.setAttribute("transform", "matrix(1, 0, 0, 1, "+(x)+", "+(y)+")");
		Tiles.appendChild(tile);
	}
}

Snake = (function(){
	function This(startPos){
		this.facing = [1, 0];
		this.verts = [startPos, startPos.slice(0)];
		this.polyline = PolylineProto.cloneNode(true);
		this.head = HeadProto.cloneNode(true);
	}
	
	This.prototype.headPos = function(){
		return this.verts[0];
	}
	
	This.prototype.draw = function(){
		this.polyline.setAttribute("points", this.verts.join(" "));
		
		var c = this.facing[0], s = this.facing[1];
		var x = this.verts[0][0], y = this.verts[0][1];
		this.head.setAttribute("transform", "matrix("+c+", "+s+", "+s+", "+c+", "+x+", "+y+")")
	}
	
	This.prototype.checkDirections = function(){
		var head = this.headPos();
		var x = head[0], y = head[1];
		
		var arr = new Array();
		function Check(x, y, dx, dy){ if(CheckTile(x + dx, y + dy)) arr.push([dx, dy]); }
		
		Check(x, y,  1,  0);
		Check(x, y,  0,  1);
		Check(x, y, -1,  0);
		Check(x, y,  0, -1);
		return arr;
	}
	
	This.prototype.animateMove = function(v, animationCompleted){
		var x0 = this.verts[0][0], y0 = this.verts[0][1];
		var x1 = v[0], y1 = v[1];
		
		var dx = x1 - x0, dy = y1 - y0;
		var dist = Math.max(Math.abs(dx), Math.abs(dy));
		this.facing = [dx/dist, dy/dist];
		
		var delay = 1.0/60.0;
		var speed = 4.0;
		var t = 0.0;
		(function animate(snake){
			// TODO better time based animation here?
			t = Math.min(1.0, t + speed*delay/dist);
			
			snake.verts[0] = [x0 + t*dx, y0 + t*dy];
			snake.draw();
			if(t < 1.0){
				window.setTimeout(animate, delay, snake);
			} else {
				snake.verts.unshift(v);
				
				var choices = snake.checkDirections();
				if(choices.length == 0){
					console.log("Game Over!");
				} else if(choices.length == 1){
					// Only one choice. Take it automatically.
					snake.move(choices[0], animationCompleted);
				} else {
					// Show arrows
					if(animationCompleted) animationCompleted();
				}
			}
		})(this);
	}
	
	This.prototype.move = function(dir, animationCompleted){
		if(dir[0] == 0 && dir[1] == 0) return;
		
		var head = this.headPos();
		var dx = dir[0], dy = dir[1];
		
		// function returns false if the next tile is blocked.
		// Otherwise it returns the furthest open tile in that direction.
		var stop = (function advance(x, y){
			if(CheckTile(x, y)){
				// Mark the current tile as closed.
				Puzzle.tiles[y][x] = true;
				// Recursively look for the endpoint.
				var stop = advance(x + dx, y + dy);
				return (stop ? stop : [x, y]);
			} else {
				// The current tile blocked.
				return false;
			}
		})(head[0] + dx, head[1] + dy);
		
		// If non-false, stop will contain the coord of the stoping point.
		if(stop){
			this.animateMove(stop, animationCompleted);
		} else {
			animationCompleted();
		}
	}
	
	This.prototype.addToBoard = function(){
		var head = this.headPos();
		// TODO Make a method for this.
		Puzzle.tiles[head[1]][head[0]] = true;
		
		Board.appendChild(this.polyline);
		Board.appendChild(this.head);
		this.draw();
	}
	
	return This;
})();

Board.onclick = function(event){
	var pos = ConvertCoords(event.clientX, event.clientY);
	if(ClickHandler) ClickHandler(pos);
};

function FirstClick(pos){
	var x = pos[0], y = pos[1];
	
	if(!Puzzle.tiles[y][x]){
		Snake = new Snake(pos);
		Snake.addToBoard();
		
		ClickHandler = MoveClick;
	}
}

function MoveClick(pos){
	var head = Snake.headPos();
	var dx = (pos[0] - head[0]), dy = (pos[1] - head[1]);
	
	if(dx == 0 || dy == 0){
		ClickHandler = null;
		var max = Math.max(Math.abs(dx), Math.abs(dy));
		Snake.move([dx/max, dy/max], function(){ ClickHandler = MoveClick; });
	}
}

ClickHandler = FirstClick;

//(function Rec(verts){
//	var l = verts.length;
//	if(!l) return;
//	
//	snake.animateMove(verts[l - 1], function(){
//		Rec(verts.slice(0, l - 1));
//	});
//})([
//	[0, 1],
//	[0, 2],
//	[2, 2],
//	[2, 1],
//	[3, 1],
//	[3, 0],
//	[4, 0],
//	[4, 4],
//	[0, 4],
//	[0, 3]
//]);

