los = function() {
	function almostEqual(a, b) {
		return (Math.abs(a - b) < 0.000001);
	}

	// based on http://www.cs.yorku.ca/~amana/research/grid.pdf
	// with added diagonal step
	function makeRay(xStart, yStart, xEnd, yEnd) {
		// change from step to step
		var tValue, xGrid, yGrid, tForNextBorderX, tForNextBorderY;

		// constant throughout raycast
		var xDirection, yDirection, tForOneX, tForOneY, xStep, yStep;

		xDirection = xEnd - xStart;
		yDirection = yEnd - yStart;
		tForOneX = Math.abs(1.0 / xDirection);
		tForOneY = Math.abs(1.0 / yDirection);
		yStep = (yDirection >= 0) ? 1 : -1;
		xStep = (xDirection >= 0) ? 1 : -1;

		tValue = 0;
		xGrid = Math.floor(xStart);
		yGrid = Math.floor(yStart);

		var fracStartPosX = xStart - Math.floor(xStart);
		if (xDirection > 0) {
			tForNextBorderX = (1 - fracStartPosX) * tForOneX;
		}
		else {
			tForNextBorderX = fracStartPosX * tForOneX;
		}

		var fracStartPosY = yStart - Math.floor(yStart);
		if (yDirection > 0) {
			tForNextBorderY = (1 - fracStartPosY) * tForOneY;
		}
		else {
			tForNextBorderY = fracStartPosY * tForOneY;
		}

		function hasNext() {
			return tValue <= 1.0;
		}

		function next() {
			// store this position to return, then advance to next step
			var toReturn = {x: xGrid, y: yGrid};

			if (almostEqual(tForNextBorderX, tForNextBorderY)) {
				// diagonal step (normally not included in a raycast)
				tValue = tForNextBorderX;
				tForNextBorderX += tForOneX;
				tForNextBorderY += tForOneY;
				xGrid += xStep;
				yGrid += yStep;
			}
			else if (tForNextBorderX <= tForNextBorderY) {
				// step in x
				tValue = tForNextBorderX;
				tForNextBorderX += tForOneX;
				xGrid += xStep;
			}
			else {
				// step in y
				tValue = tForNextBorderY;
				tForNextBorderY += tForOneY;
				yGrid += yStep;
			}

			return toReturn;
		}

		return {
			next: next,
			hasNext: hasNext
		};
	}

	// based on https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm#Simplification
	function makeBresenham(xStart, yStart, xEnd, yEnd) {
		var deltaX = Math.floor(Math.abs(xEnd - xStart));
		var deltaY = Math.floor(Math.abs(yEnd - yStart));
		var xStep = (xEnd >= xStart) ? 1 : -1;
		var yStep = (yEnd >= yStart) ? 1 : -1;
		var error = deltaX - deltaY;
		var xGrid = xStart, yGrid = yStart;

		function hasNext() {
			return !(xGrid == xEnd && yGrid == yEnd);
		}

		function next() {
			var toReturn = {x: xGrid, y: yGrid};

			var twoError = 2 * error;
			if (twoError > (-1 * deltaY)) {
				error -= deltaY;
				xGrid += xStep;
			}
			if (twoError < deltaX) {
				error += deltaX;
				yGrid += yStep;
			}

			return toReturn;
		}

		return {
			next: next,
			hasNext: hasNext
		};
	}

	var COLOUR_BACK = "#ffffff";
	var COLOUR_GRID = "#b7b7b8";
	var COLOUR_HANDLE = "#1e6a9a";
	var COLOUR_WALL = "#35594b";
	var gridSize = 25;

	function makeGrid(context, xSize, ySize) {
		var cellCount = xSize * ySize;
		var content = []; // one of below constants
		var NOTHING = 0, SHADED = 1, HANDLE = 2, WALL = 3;

		for (var i = 0; i < cellCount; i++) {
			content[i] = NOTHING;
		}

		function drawCell(x, y) {
			var c = content[x + y * xSize];
			var fillColour = COLOUR_BACK;
			if (c === SHADED) {
				fillColour = COLOUR_GRID;
			}
			else if (c === HANDLE) {
				fillColour = COLOUR_HANDLE;
			}
			else if (c === WALL) {
				fillColour = COLOUR_WALL;
			}
			context.fillStyle = fillColour;
			context.strokeStyle = COLOUR_GRID

			// +0.5 prevents it being absurd and trying to draw between pixels
			// (at least in Chrome and Firefox - assume other browsers have same behaviour?)
			var left = x * gridSize + 0.5;
			var top = y * gridSize + 0.5;
			context.fillRect(left, top, gridSize, gridSize);
			context.strokeRect(left, top, gridSize, gridSize);
		}

		function drawAll() {
			for (var y = 0; y < ySize; y++) {
				for (var x = 0; x < xSize; x++) {
					drawCell(x, y);
				}
			}
		}

		function clearAll() {
			for (var y = 0; y < ySize; y++) {
				for (var x = 0; x < xSize; x++) {
					var i = x + y * xSize;
					if (content[i] !== NOTHING) {
						content[i] = NOTHING;
						drawCell(x, y);
					}
				}
			}
		}

		function clearAndDrawAll() {
			for (var y = 0; y < ySize; y++) {
				for (var x = 0; x < xSize; x++) {
					var i = x + y * xSize;
					content[i] = NOTHING;
					drawCell(x, y);
				}
			}
		}

		function setShaded(x, y) {
			content[x + y * xSize] = SHADED;
			drawCell(x, y);
		}

		function setHandle(x, y) {
			content[x + y * xSize] = HANDLE;
			drawCell(x, y);
		}

		function setWall(x, y) {
			content[x + y * xSize] = WALL;
			drawCell(x, y);
		}

		drawAll();
		return {
			clearAll: clearAll,
			clearAndDrawAll: clearAndDrawAll,
			setShaded: setShaded,
			setHandle: setHandle,
			setWall: setWall
		};
	}

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
	};

	function makeHandle(x, y, xMax, yMax, callbackOnMove) {
		var isDragging = false;

		function drawOnGrid(grid) {
			grid.setHandle(x, y);
		}

		function addListenOnCanvas(canvas) {
			canvas.addEventListener("mousedown", function(e) {
				e.preventDefault(); // stops switch to text cursor
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				if (Math.floor(canvasPos.x / gridSize) === x &&
					Math.floor(canvasPos.y / gridSize) === y) {
					isDragging = true;
					e.stopImmediatePropagation(); // don't want it to register on multiple overlapping handles
				}
			});
			canvas.addEventListener("touchstart", function(e) {
				e.preventDefault(); // stop mobile scrolling when dragging on canvas

				// for sake of simplicity, assume it's the first touch we're interested in
				// which means we'll get odd behaviour from multitouch input. But for a little
				// demo that's not a big deal.
				var touch = e.changedTouches[0];

				var canvasPos = clientPosToCanvas(canvas, touch.clientX, touch.clientY);
				if (Math.floor(canvasPos.x / gridSize) === x &&
					Math.floor(canvasPos.y / gridSize) === y) {
					isDragging = true;
					e.stopImmediatePropagation(); // don't want it to register on multiple overlapping handles
				}
			});

			window.addEventListener("mouseup", function() {
				isDragging = false;
			});
			window.addEventListener("touchend", function() {
				isDragging = false;
			});
			window.addEventListener("touchcancel", function() {
				isDragging = false;
			});

			canvas.addEventListener("mousemove", function(e) {
				if (isDragging) {
					var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY)
					drag(
						Math.floor(canvasPos.x / gridSize),
						Math.floor(canvasPos.y / gridSize)
					);
				}
			});
			canvas.addEventListener("touchmove", function(e) {
				e.preventDefault(); // stop scrolling on touch devices
				if (isDragging) {
					var touch = e.changedTouches[0];
					var canvasPos = clientPosToCanvas(canvas, touch.clientX, touch.clientY)
					drag(
						Math.floor(canvasPos.x / gridSize),
						Math.floor(canvasPos.y / gridSize)
					);
				}
			});
		}

		function drag(xGrid, yGrid) {
			if (xGrid !== x || yGrid !== y) {
				x = Number(xGrid);
				y = Number(yGrid);
				if (x < 0) x = 0;
				if (x > xMax) x = xMax;
				if (y < 0) y = 0;
				if (y > yMax) y = yMax;
				callbackOnMove();
			}
		}

		return {
			getX: function() {
				return x;
			},
			getY: function() {
				return y;
			},
			drawOnGrid: drawOnGrid,
			addListenOnCanvas: addListenOnCanvas
		}
	}

	lineDemo = function() {
		var xGridCount = 10;
		var yGridCount = 10;

		var canvasBresenham = document.getElementById("line-demo-bresenham");
		var contextBresenham = canvasBresenham.getContext("2d");
		var gridBresenham = makeGrid(contextBresenham, xGridCount, yGridCount);

		var canvasRay = document.getElementById("line-demo-ray");
		var contextRay = canvasRay.getContext("2d");
		var gridRay = makeGrid(contextRay, xGridCount, yGridCount);

		var startHandle = makeHandle(2, 6, xGridCount - 1, yGridCount - 1, update);
		startHandle.addListenOnCanvas(canvasBresenham);
		startHandle.addListenOnCanvas(canvasRay);

		var endHandle = makeHandle(7, 2, xGridCount - 1, yGridCount - 1, update);
		endHandle.addListenOnCanvas(canvasBresenham);
		endHandle.addListenOnCanvas(canvasRay);

		function drawTrueLine(context) {
			context.strokeStyle = COLOUR_HANDLE;
			context.beginPath();
			context.moveTo(
				gridSize * (startHandle.getX() + 0.5),
				gridSize * (startHandle.getY() + 0.5)
			);
			context.lineTo(
				gridSize * (endHandle.getX() + 0.5),
				gridSize * (endHandle.getY() + 0.5)
			);
			context.stroke();
		}

		function update() {
			var point;
			// need to redraw every cell as "trueline" may be outside cleared cells.
			gridBresenham.clearAndDrawAll();
			var bresenham = makeBresenham(
				startHandle.getX(), startHandle.getY(),
				endHandle.getX(), endHandle.getY()
			);
			while (bresenham.hasNext()) {
				point = bresenham.next();
				gridBresenham.setShaded(point.x, point.y);
			}
			startHandle.drawOnGrid(gridBresenham);
			endHandle.drawOnGrid(gridBresenham);
			drawTrueLine(contextBresenham);

			gridRay.clearAll();
			// add 0.5 to positions so we're working from middle of grid squares
			// (not needed for Bresenham as that deals with whole grid squares)
			var ray = makeRay(
				startHandle.getX() + 0.5, startHandle.getY() + 0.5,
				endHandle.getX() + 0.5, endHandle.getY() + 0.5
			);
			while (ray.hasNext()) {
				point = ray.next();
				gridRay.setShaded(point.x, point.y);
			}
			startHandle.drawOnGrid(gridRay);
			endHandle.drawOnGrid(gridRay);
			drawTrueLine(contextRay);
		}

		update();
	}();

	visionDemo = function() {
		var xGridCount = 10;
		var yGridCount = 10;

		var canvasBresenham = document.getElementById("visionDemoBresenham");
		var contextBresenham = canvasBresenham.getContext("2d");
		var gridBresenham = makeGrid(contextBresenham, xGridCount, yGridCount);

		var canvasRay = document.getElementById("visionDemoRay");
		var contextRay = canvasRay.getContext("2d");
		var gridRay = makeGrid(contextRay, xGridCount, yGridCount);

		var handle = makeHandle(5, 4, xGridCount - 1, yGridCount - 1, update);
		handle.addListenOnCanvas(canvasBresenham);
		handle.addListenOnCanvas(canvasRay);

		var walls = [
			0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
			0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
			0, 1, 1, 1, 0, 0, 1, 1, 1, 1,
			0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
			0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
			0, 0, 0, 0, 0, 0, 1, 1, 0, 1,
			0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
			0, 0, 1, 0, 0, 0, 0, 0, 0, 0
		];

		function drawWalls(grid) {
			for (var y = 0; y < yGridCount; y++) {
				for (var x = 0; x < xGridCount; x++) {
					if (walls[x + y * xGridCount]) {
						grid.setWall(x, y);
					}
				}
			}
		}

		function canBeSeenBresenham(x, y) {
			if (walls[x + y * xGridCount]){
				return false;
			}

			var bresenham = makeBresenham(
				handle.getX(), handle.getY(),
				x, y
			);
			while (bresenham.hasNext()) {
				var p = bresenham.next();
				if (walls[p.x + p.y * xGridCount]) {
					return false;
				}
			}
			return true;
		}

		function canBeSeenRay(x, y) {
			if (walls[x + y * xGridCount]){
				return false;
			}

			var ray = makeRay(
				handle.getX() + 0.5, handle.getY() + 0.5,
				x + 0.5, y + 0.5
			);
			while (ray.hasNext()) {
				var p = ray.next();
				if (walls[p.x + p.y * xGridCount]) {
					return false;
				}
			}
			return true;
		}

		function update() {
			var point;

			gridBresenham.clearAll();
			for (var y = 0; y < yGridCount; y++) {
				for (var x = 0; x < xGridCount; x++) {
					if (!canBeSeenBresenham(x, y)) {
						gridBresenham.setShaded(x, y);
					}
				}
			}
			drawWalls(gridBresenham);
			handle.drawOnGrid(gridBresenham);

			gridRay.clearAll();
			for (var y = 0; y < yGridCount; y++) {
				for (var x = 0; x < xGridCount; x++) {
					if (!canBeSeenRay(x, y)) {
						gridRay.setShaded(x, y);
					}
				}
			}
			drawWalls(gridRay);
			handle.drawOnGrid(gridRay);
		}

		drawWalls(gridBresenham);
		drawWalls(gridRay);
		update();
	}();
}();