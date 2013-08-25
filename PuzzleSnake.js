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
			
function AddTile(x, y){
	var tile = TileProto.cloneNode(true);
	tile.setAttribute("transform", "matrix(1, 0, 0, 1, "+(x)+", "+(y)+")");
	Tiles.appendChild(tile);
}

for(var y=0; y<Puzzle.size; y++){
	for(var x=0; x<Puzzle.size; x++){
		if(Puzzle.tiles[y][x]) AddTile(x, y);
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
	
	This.prototype.pushVert = function(v, animationCompleted){
		var x0 = this.verts[0][0], y0 = this.verts[0][1];
		var x1 = v[0], y1 = v[1];
		
		var dx = x1 - x0, dy = y1 - y0;
		var dist = Math.max(Math.abs(dx), Math.abs(dy));
		this.facing = [dx/dist, dy/dist];
		
		var delay = 1.0/60.0;
		var speed = 4.0;
		var t = 0.0;
		(function animate(snake){
			// TODO better time based animation here.
			t = Math.min(1.0, t + speed*delay/dist);
			
			snake.verts[0] = [x0 + t*dx, y0 + t*dy];
			snake.draw();
			if(t < 1.0){
				window.setTimeout(animate, delay, snake);
			} else {
				snake.verts.unshift(v);
				if(animationCompleted) animationCompleted();
			}
		})(this);
	}
	
	This.prototype.move = function(dir){
		var size = Puzzle.size;
		var head = this.headPos();
		var dx = dir[0], dy = dir[1];
		
		var stop = (function advance(snake, x, y){
			if(
				0 <= x && x < size &&
				0 <= y && y < size &&
				!Puzzle.tiles[y][x]
			){
				console.log("Non-blocked tile: " + [x, y]);
				// Recursively look for the endpoint.
				var stop = advance(snake, x + dx, y + dy);
				return (stop ? stop : [x, y]);
			} else {
				// The current tile blocked.
				console.log("Blocked tile: " + [x, y]);
				return false;
			}
		})(snake, head[0] + dx, head[1] + dy);
		
		// If non-false, stop will contain the coord of the stoping point.
		if(stop) this.pushVert(stop);
	}
	
	This.prototype.addToBoard = function(){
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

ClickHandler = function(pos){
	var x = pos[0], y = pos[1];
	
	if(!Puzzle.tiles[y][x]){
		Snake = new Snake(pos);
		Snake.addToBoard();
		Snake.move([-1, 0]);
		
		ClickHandler = function(pos){
			console.log(pos);
		}
	}
}

//(function Rec(verts){
//	var l = verts.length;
//	if(!l) return;
//	
//	snake.pushVert(verts[l - 1], function(){
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

