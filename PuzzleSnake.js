SVG = document.getElementById("svg");

function SetViewport(){
	ViewportSize = Math.min(document.body.clientWidth, document.body.clientHeight);
	SVG.setAttribute("width", ViewportSize);
	SVG.setAttribute("height", ViewportSize);
}

SetViewport();
window.onresize = SetViewport;

function MakeProto(id, deep){
	var node = document.getElementById(id).cloneNode(deep);
	node.removeAttribute("id");
	return node;
}

Protos = {
	board: MakeProto("board", false),
	openTile: MakeProto("openTile", false),
	closedTile: MakeProto("closedTile", false),
	snake: MakeProto("snake", false),
	head: MakeProto("head", true),
	arrow: MakeProto("arrow", false)
};

Puzzle = (function(){
	function This(str){
		this.tiles = str.split(",").map(function(row){
			return row.split("").map(function(e){return (e == "1");});
		});
		
		this.size = this.tiles.length;
	}
	
	This.prototype = {
		getTile: function(x, y){
			// Check that it's out of bounds or a filled tile.
			return (
				!(0 <= x && x < this.size) ||
				!(0 <= y && y < this.size) ||
				this.tiles[y][x]
			);
		},
		
		setTile: function(x, y, value){
			this.tiles[y][x] = value;
		}
	}
	
	return This;
})();

Game = (function(){
	function This(puzzle){
		this.puzzle = puzzle;
		
		// Setup the tiles.
		this.setupBoard();
		this.setupTiles();
		
		this.animating = false;
	}
	
	This.prototype = {
		setupBoard: function(){
			var this_ = this;
			this.board = Protos.board.cloneNode(false);
			this.board.onclick = function(event){
				this_.click(event.clientX, event.clientY);
			}
			
			var s = this.puzzle.size;
			var offset = (s-1)/s;
			this.board.setAttribute("transform", "matrix("+[2/s, 0, 0, -2/s, -offset, offset]+")");
		},
		
		setupTiles: function(){
			var size = this.puzzle.size;
			
			for(var y=0; y<size; y++){
				for(var x=0; x<size; x++){
					var solid = this.puzzle.tiles[y][x];
					var tile = (solid ? Protos.closedTile : Protos.openTile).cloneNode(true);
					tile.setAttribute("transform", "matrix("+[1,0,0,1,x,y]+")");
					this.board.appendChild(tile);
				}
			}
		},
		
		addSnake: function(x, y){
			this.facing = [1, 0];
			this.snake = Protos.snake.cloneNode(true);
			this.head = Protos.head.cloneNode(true);
			this.verts = [[x, y], [x, y]];
			
			this.puzzle.tiles[y][x] = true;
			
			this.drawSnake();
			this.board.appendChild(this.snake);
			this.board.appendChild(this.head);
		},
		
		headPos: function(){
			return this.verts[0];
		},
		
		drawSnake: function(){
			this.snake.setAttribute("points", this.verts.join(" "));
			
			var c = this.facing[0], s = this.facing[1];
			var x = this.verts[0][0], y = this.verts[0][1];
			this.head.setAttribute("transform", "matrix("+[c,s,-s,c,x,y]+")")
		},
		
		checkDirections: function(){
			var head = this.headPos();
			var x = head[0], y = head[1];
			
			var arr = new Array();
			var this_ = this;
			function Check(x, y, dx, dy){ if(!this_.puzzle.getTile(x + dx, y + dy)) arr.push([dx, dy]); }
			
			Check(x, y,  1,  0);
			Check(x, y,  0,  1);
			Check(x, y, -1,  0);
			Check(x, y,  0, -1);
			return arr;
		},
		
		checkMove: function(animationCompleted){
			var choices = this.checkDirections();
			if(choices.length == 0){
				console.log("Game Over!");
				
				// Check if the board is full.
				this.dispose();
				RandomGame();
			} else if(choices.length == 1){
				// Only one choice. Take it automatically.
				this.move(choices[0], animationCompleted);
			} else {
				// TODO Show arrows
				if(animationCompleted) animationCompleted.call(this);
			}
		},
		
		animateMove: function(v, animationCompleted){
			var x0 = this.verts[0][0], y0 = this.verts[0][1];
			var x1 = v[0], y1 = v[1];
			
			var dx = x1 - x0, dy = y1 - y0;
			var dist = Math.max(Math.abs(dx), Math.abs(dy));
			this.facing = [dx/dist, dy/dist];
			
			var delay = 1.0/60.0;
			var speed = 4.0;
			var t = 0.0;
			var _this = this;
			(function animate(){
				// TODO better time based animation here?
				t = Math.min(1.0, t + speed*delay/dist);
				
				_this.verts[0] = [x0 + t*dx, y0 + t*dy];
				_this.drawSnake();
				if(t < 1.0){
					window.setTimeout(animate, delay);
				} else {
					_this.verts.unshift(v);
					_this.checkMove(animationCompleted);
				}
			})();
		},
		
		move: function(dir, animationCompleted){
			if(dir[0] == 0 && dir[1] == 0) return;
			
			var head = this.headPos();
			var dx = dir[0], dy = dir[1];
			
			var puzzle = this.puzzle;
			// function returns false if the next tile is blocked.
			// Otherwise it returns the furthest open tile in that direction.
			var stop = (function advance(x, y){
				if(!puzzle.getTile(x, y)){
					// Mark the current tile as closed.
					puzzle.setTile(x, y, true);
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
				animationCompleted.call(this);
			}
		},
		
		click: function(mx, my){
			if(this.animating) return;
			
			var scale = ViewportSize/this.puzzle.size;
			var x = Math.floor(mx/scale)
			var y = this.puzzle.size - 1 - Math.floor(my/scale);
			
			if(!this.snake){
				if(!this.puzzle.tiles[y][x]){
					this.addSnake(x, y);
					this.checkMove();
				}
			} else {
				var head = this.headPos();
				var dx = (x - head[0]), dy = (y - head[1]);
				
				if(dx == 0 || dy == 0){
					this.animating = true;
					var max = Math.max(Math.abs(dx), Math.abs(dy));
					this.move([dx/max, dy/max], function(){
						this.animating = false
					});
				}
			}
		},
		
		present: function(){
			SVG.appendChild(this.board);
		},
		
		dispose: function(){
			SVG.removeChild(this.board);
		}
	}
	
	return This;
})();

function RandomGame(){
	var arr = Puzzles.easy;
	var i = Math.floor(Math.random()*arr.length);
	var puzzle = new Puzzle(arr[i].puzz);
	
	var game = new Game(puzzle);
	game.present();
}

RandomGame();
