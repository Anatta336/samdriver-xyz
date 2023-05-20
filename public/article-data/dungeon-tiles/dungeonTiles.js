var awareTiles = function() {
	var TILESIZE = 24;
	var FLOOR_VARIATION_COUNT = 9;
	var WALLSIDE_FLAT_VARIATION_COUNT = 4;
	var WALLTOP = 0, WALLSIDE = 1, FLOOR = 2;

	function clientPosToCanvas(canvas, xClient, yClient) {
		var rect = canvas.getBoundingClientRect();
		var xCanvas = xClient - rect.left;
		var yCanvas = yClient - rect.top;
		// .width gives the internal width of canvas
		// .scrollWidth gives the width at which it is actually displayed
		// the "client" position values are in same scale as scrollWidth
		// and require scaling to true internal-to-canvas space.
		var scale = canvas.width / canvas.scrollWidth;
		return {
			x: Math.floor(xCanvas * scale),
			y: Math.floor(yCanvas * scale)
		}
	}

	var tileSheet = function() {
		var sheetImage;
		window.addEventListener("load", function() {
			sheetImage = document.getElementById("tile-sheet");
		});

		function draw(context, typeIndex, tileIndex, x, y) {
			if (sheetImage === undefined) return;

			xStart = tileIndex * TILESIZE;
			yStart = typeIndex * TILESIZE;
			context.drawImage(sheetImage,
				xStart, yStart,
				TILESIZE, TILESIZE,
				x, y,
				TILESIZE, TILESIZE
			);
		}

		return {
			draw: draw
		};
	}();

	function calcTileIndexFull(isAboveSame, isLeftSame, isBelowSame, isRightSame) {
		var sum = 0;
		if (isAboveSame) sum += 1;
		if (isLeftSame)  sum += 2;
		if (isBelowSame) sum += 4;
		if (isRightSame) sum += 8;
		return sum;
	}

	function calcTileIndexSide(isLeftSame, isRightSame) {
		var sum = 0;
		if (isLeftSame) sum += 1;
		if (isRightSame) sum += 2;
		return sum;
	}

	var demo = function() {
		var canvas = document.getElementById("dungeon-canvas");
		var context = canvas.getContext("2d");
		var resetButton = document.getElementById("reset-button");

		var XMAPSIZE = 16, YMAPSIZE = 16;
		var TILECOUNT = XMAPSIZE * YMAPSIZE;

		var xCamera = 1, yCamera = 1;
		var tiles, wallTopMap, tileMap;

		function isInMapBounds(x, y) {
			return (x >= 0 && x < XMAPSIZE &&
					y >= 0 && y < YMAPSIZE);
		}

		function makeWallTopMap() {
			var content = [];
			for (x = 0; x < XMAPSIZE; x++) {
				content[x] = [];
				for (y = 0; y < YMAPSIZE; y++) {
					content[x][y] = false;
				}
			}

			function fillWithDefault() {
				var tops = [
					1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
					1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1,
					1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1,
					1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1,
					1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
					1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1,
					1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1,
					1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1,
					1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1,
					1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1,
					1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1,
					1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1,
					1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1,
					1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1,
					1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
					1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
				];
				for (x = 0; x < XMAPSIZE; x++) {
					for (y = 0; y < YMAPSIZE; y++) {
						i = x + y * XMAPSIZE;
						setWallTop(x, y, tops[i]);
					}
				}
			}

			function setWallTop(x, y, value) {
				if (isInMapBounds(x, y)) {
					content[x][y] = !!value;
				}
			}

			function getWallTop(x, y) {
				if (isInMapBounds(x, y)) {
					return content[x][y];
				}
				else {
					return false;
				}
			}

			function flipWallTop(x, y) {
				if (isInMapBounds(x, y)) {
					content[x][y] = !content[x][y];
				}
			}

			return {
				fillWithDefault: fillWithDefault,

				getWallTop: getWallTop,
				setWallTop: setWallTop,
				flipWallTop: flipWallTop
			}
		}

		function makeTileMap(wallTopMap) {
			var content = [];
			for (x = 0; x < XMAPSIZE; x++) {
				content[x] = [];
				for (y = 0; y < YMAPSIZE; y++) {
					content[x][y] = FLOOR;
				}
			}

			function isWalkable(x, y) {
				if (isInMapBounds(x, y)) {
					return content[x][y] === FLOOR;
				}
				else {
					return false;
				}
			}

			function isWallSide(x, y) {
				if (isInMapBounds(x, y)) {
					return content[x][y] === WALLSIDE;
				}
				else {
					return true;
				}
			}
			function isWallTop(x, y) {
				if (isInMapBounds(x, y)) {
					return content[x][y] === WALLTOP;
				}
				else {
					return false;
				}
			}
			function isAnyWall(x, y) {
				if (isInMapBounds(x, y)) {
					var type = content[x][y];
					return type === WALLSIDE || type === WALLTOP;
				}
				else {
					return true;
				}
			}

			function getTypeIndex(x, y) {
				if (isInMapBounds(x, y)) {
					return content[x][y];
				}
				else {
					return undefined;
				}
			}

			function updateFromWallTops(wallTopMap) {
				for (x = 0; x < XMAPSIZE; x++) {
					for (y = 0; y < YMAPSIZE; y++) {
						var result = FLOOR;
						if (wallTopMap.getWallTop(x, y)) {
							result = WALLTOP;
						}
						else if (wallTopMap.getWallTop(x, y - 1)) {
							result = WALLSIDE;
						}
						content[x][y] = result;
					}
				}
			}

			return {
				isWalkable: isWalkable,

				isWallSide: isWallSide,
				isWallTop: isWallTop,
				isAnyWall: isAnyWall,

				updateFromWallTops: updateFromWallTops,

				getTypeIndex: getTypeIndex
			};
		}

		function createTile(x, y) {
			var randomVariation = Math.random();

			function draw() {
				var xDisplay = (x - xCamera) * TILESIZE;
				var yDisplay = (y - yCamera) * TILESIZE;

				context.clearRect(xDisplay, yDisplay, TILESIZE, TILESIZE);

				var typeIndex = tileMap.getTypeIndex(x, y);
				var tileIndex = 0;
				if (typeIndex === WALLTOP) {
					tileIndex = calcTileIndexFull(
						tileMap.isWallTop(x, y - 1),
						tileMap.isWallTop(x - 1, y),
						tileMap.isWallTop(x, y + 1),
						tileMap.isWallTop(x + 1, y)
					);
				}
				else if (typeIndex == WALLSIDE) {
					tileIndex = calcTileIndexSide(
						tileMap.isAnyWall(x - 1, y),
						tileMap.isAnyWall(x + 1, y)
					);
					if (tileIndex === 3) {
						// we have multiple versions of WALLSIDE_3, so pick one
						tileIndex += Math.floor(randomVariation * WALLSIDE_FLAT_VARIATION_COUNT);
					}
				}
				else { // floor
					// there are multiple versions of FLOOR tiles, so pick one
					tileIndex = Math.floor(randomVariation * FLOOR_VARIATION_COUNT);
				}
				tileSheet.draw(context, typeIndex, tileIndex, xDisplay, yDisplay);
			}

			// draw on creation
			draw();

			return {
				draw: draw
			}
		}

		function redrawTile(x, y) {
			if (isInMapBounds(x, y)) {
				tiles[x][y].draw();
			}
		}

		function handleClick(xCanvas, yCanvas) {
			var xTile = Math.floor(xCanvas / TILESIZE) + xCamera;
			var yTile = Math.floor(yCanvas / TILESIZE) + yCamera;
			wallTopMap.flipWallTop(xTile, yTile);
			tileMap.updateFromWallTops(wallTopMap);

			redrawTile(xTile, yTile);
			redrawTile(xTile - 1, yTile);
			redrawTile(xTile + 1, yTile);
			redrawTile(xTile, yTile - 1);
			redrawTile(xTile, yTile + 1);
			redrawTile(xTile - 1, yTile + 1);
			redrawTile(xTile + 1, yTile + 1);
		}

		function reset() {
			wallTopMap.fillWithDefault();
			tileMap.updateFromWallTops(wallTopMap);
			for (var x = 0; x < XMAPSIZE; x++) {
				for (var y = 0; y < YMAPSIZE; y++) {
					tiles[x][y].draw();
				}
			}
		}

		function init() {
			wallTopMap = makeWallTopMap();
			wallTopMap.fillWithDefault();

			tileMap = makeTileMap();
			tileMap.updateFromWallTops(wallTopMap);

			tiles = [];
			for (var x = 0; x < XMAPSIZE; x++) {
				tiles[x] = [];
				for (var y = 0; y < YMAPSIZE; y++) {
					tiles[x][y] = createTile(x, y);
				}
			}

			canvas.addEventListener("click", function(e) {
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				handleClick(canvasPos.x, canvasPos.y);
			});
			resetButton.addEventListener("click", function(e) {
				reset();
			});
		}

		// don't create any tiles until images are loaded
		window.addEventListener("load", function() {
			init();
		});

	}();
}();
