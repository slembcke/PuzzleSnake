SVGNS = "http://www.w3.org/2000/svg";
puzzle = {
	size: 5,
	
	tiles: [
		[1,1,1,0,0],
		[0,1,0,0,0],
		[0,0,0,1,0],
		[0,0,0,0,0],
		[0,0,0,0,0],
	],
};

Board = document.getElementById("board");
function MakeProtoTypeNode(id){
	var node = document.getElementById(id);
	node.parentNode.removeChild(node);
	
	return node;
}

TilesProto = MakeProtoTypeNode("tiles");
PolylineProto = MakeProtoTypeNode("snake");
HeadProto = MakeProtoTypeNode("head");

// TODO move this
Tiles = Board.appendChild(TilesProto.cloneNode(true));

{
	// Setup scale matrix.
	var svg = document.getElementById("svg");
	var size = puzzle.size;
	var w = svg.width.baseVal.value;
	var h = svg.height.baseVal.value;
	var sx = w/size;
	var sy = h/size;
	
	Board.setAttribute("transform", "matrix("+(sx)+", 0, 0, "+(-sy)+", "+(sx/2)+", "+(h - sy/2)+")");
}
			
function AddTile(x, y){
	var bevel = 0.1;
	var inset = 0.1;
	
	var s = 1.0 - 2.0*inset;
	var hs = 0.5*s;
	
	var rect = document.createElementNS(SVGNS, "rect");
	rect.x.baseVal.value = -hs;
	rect.y.baseVal.value = -hs;
	rect.width.baseVal.value = s;
	rect.height.baseVal.value = s;
	rect.rx.baseVal.value = bevel;
	rect.ry.baseVal.value = bevel;
	rect.setAttribute("fill", "darkcyan");
	rect.setAttribute("transform", "matrix(1, 0, 0, 1, " + x + ", "+ y + ")");
	Tiles.appendChild(rect);
}

for(var y=0; y<puzzle.size; y++){
	for(var x=0; x<puzzle.size; x++){
		if(puzzle.tiles[y][x]) AddTile(x, y);
	}
}

function Snake(x, y){
	this.facing = [1, 0];
	this.verts = [[x, y], [x, y]];
	this.polyline = PolylineProto.cloneNode(true);
	this.head = HeadProto.cloneNode(true);
}

Snake.prototype.draw = function(){
	this.polyline.setAttribute("points", this.verts.join(" "));
	
	var c = this.facing[0], s = this.facing[1];
	var x = this.verts[0][0], y = this.verts[0][1];
	this.head.setAttribute("transform", "matrix("+c+", "+s+", "+s+", "+c+", "+x+", "+y+")")
}

Snake.prototype.pushVert = function(v, animationCompleted){
	console.log(v);
	var x0 = this.verts[0][0], y0 = this.verts[0][1];
	var x1 = v[0], y1 = v[1];
	
	var dx = x1 - x0, dy = y1 - y0;
	var dist = Math.max(Math.abs(dx), Math.abs(dy));
	this.facing = [dx/dist, dy/dist];
	
	var delay = 1.0/60.0;
	var speed = 4.0;
	var t = 0.0;
	function animate(snake){
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
	}
	
	animate(this);
}

Snake.prototype.addToBoard = function(){
	Board.appendChild(this.polyline);
	Board.appendChild(this.head);
	this.draw();
}

var snake = new Snake(3, 3);
snake.addToBoard();

(function Rec(verts){
	var l = verts.length;
	if(!l) return;
	
	snake.pushVert(verts[l - 1], function(){
		Rec(verts.slice(0, l - 1));
	});
})([
	[0, 1],
	[0, 2],
	[2, 2],
	[2, 1],
	[3, 1],
	[3, 0],
	[4, 0],
	[4, 4],
	[0, 4],
	[0, 3],
]);

