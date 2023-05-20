pixelSmoke = function () {
	var TO_RADIANS = 0.017453292;
	var SIN45 = Math.sin(45 * TO_RADIANS);
	var COS45 = Math.cos(45 * TO_RADIANS);

	function clientPosToCanvas(canvas, xClient, yClient) {
		// corrects for both scale of canvas and 45 degree rotation.

		var rect = canvas.getBoundingClientRect();
		var xMidCanvas = rect.left + rect.width * 0.5;
		var yMidCanvas = rect.top + rect.height * 0.5;

		var xOff = xClient - xMidCanvas;
		var yOff = yClient - yMidCanvas;

		var xOffRotated = xOff * SIN45 - yOff * COS45;
		var yOffRotated = yOff * SIN45 + xOff * COS45;

		var scale = canvas.width / canvas.scrollWidth;
		return {
			x: Math.round(xCanvasSize * 0.5 + xOffRotated * scale),
			y: Math.round(yCanvasSize * 0.5 + yOffRotated * scale)
		}
	};

	function roundToNearest(a, interval) {
		var count = Math.round(a / interval);
		return count * interval;
	}

	function clamp(a) {
		return Math.min(1, Math.max(0, a));
	}

	/* flamey
	var constant = {r: 0.88, g: 0.48, b: 0.19};
	var multi = {r: 0.44, g: 0.35, b: 0.40};
	var repeat = {r: 0.00, g: 1.00, b: 1.00};
	var phase = {r: 0.00, g: 0.66, b: 0.40};
	*/
	/* purples to orange
	constant = {r: 0.56, g: 0.44, b: 0.70};
	multi    = {r: 0.65, g: 0.64, b: 0.39};
	repeat   = {r: 1.00, g: 0.00, b: 1.00};
	phase    = {r: 0.03, g: 0.75, b: 0.78};
	*/
	constant = {r: 0.92, g: 1.00, b: 1.00};
	multi    = {r: 0.48, g: 0.55, b: 0.48};
	repeat   = {r: 1.00, g: 1.00, b: 1.00};
	phase    = {r: 0.06, g: 0.02, b: 0.00};

	var PI2 = 6.28319;
	function generateColour(t) {
		if (t < 0.0 || t >= 1.0) t -= Math.floor(t);
		return {
			r: clamp(
				constant.r + multi.r * Math.cos(
					PI2 * (repeat.r * t + phase.r)
				)),
			g: clamp(
				constant.g + multi.g * Math.cos(
					PI2 * (repeat.g * t + phase.g)
				)),
			b: clamp(
				constant.b + multi.b * Math.cos(
					PI2 * (repeat.b * t + phase.b)
				))
		};
	}

	function colourToHexString(colour) {
		return "#" +
			(
				(1 << 24) +
				(Math.floor(colour.r * 255) << 16) +
				(Math.floor(colour.g * 255) << 8) +
				 Math.floor(colour.b * 255)
			).toString(16).slice(1);
	}

	function paintTColour(x, y) {
    // could round the t value to force colour into fewer variations
    // var colour = generateColour(roundToNearest(tForColour, 0.1));
    var colour = generateColour(tForColour);
		context.fillStyle = colourToHexString(colour);;
		context.fillRect(x, y, 3, 3);
	}

	var pDoNothing = 0.48;
	var reverseScan = true;
	function smear() {
		var image = context.getImageData(0, 0, xCanvasSize, yCanvasSize);
		var data = image.data;

		var pDoSomething = 1.0 - pDoNothing;
		var pCopyLeft = pDoSomething * 0.5;

		if (reverseScan) {
			for (var y = yCanvasSize - 1; y >= 0; y--) {
				for (var x = 0; x < xCanvasSize; x++) {
					var r = Math.random();
					if (r < pCopyLeft) {
						var c = pGet(data, x - 1, y);
						pSet(data,
							x, y,
							c.r, c.g, c.b, c.a
						);
					}
					else if (r < pDoSomething) {
						var c = pGet(data, x, y + 1);
						pSet(data,
							x, y,
							c.r, c.g, c.b, c.a
						);
					}
				}
			}
		}
		else {
			for (var y = 0; y < yCanvasSize; y++) {
				for (var x = xCanvasSize - 1; x >= 0; x--) {
					var r = Math.random();
					if (r < pCopyLeft) {
						var c = pGet(data, x - 1, y);
						pSet(data,
							x, y,
							c.r, c.g, c.b, c.a
						);
					}
					else if (r < pDoSomething) {
						var c = pGet(data, x, y + 1);
						pSet(data,
							x, y,
							c.r, c.g, c.b, c.a
						);
					}
				}
			}
		}

		context.putImageData(image, 0, 0);
	}

	function pGet(data, x, y) {
		if (x < 0 || x > xCanvasSize ||
			y < 0 || y > yCanvasSize) {
			return {r: 0, g: 0, b: 0, a: 0};
		}
		var index = (x + y * xCanvasSize) * 4;
		return {
			r: data[index + 0],
			g: data[index + 1],
			b: data[index + 2],
			a: data[index + 3]
		};
	}
	function pSet(data, x, y, r, g, b, a) {
		if (x < 0 || x > xCanvasSize ||
			y < 0 || y > yCanvasSize) {
			return;
		}
		var index = (x + y * xCanvasSize) * 4;
		data[index + 0] = r;
		data[index + 1] = g;
		data[index + 2] = b;
		data[index + 3] = a;
	}

	var canvas = document.getElementById("smoke-canvas");
	var context = canvas.getContext("2d");

	var yCanvasSize = canvas.height;
	var xCanvasSize = canvas.width;

	var xMouse = 1, yMouse = yCanvasSize - 2;
	var tForColour = 0.1;

	canvas.addEventListener("mousemove", function(e) {
		var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY)
		xMouse = canvasPos.x;
		yMouse = canvasPos.y;
	});
	canvas.addEventListener("touchmove", function(e) {
		e.preventDefault(); // stop mobile scrolling when dragging on canvas
		var touch = e.changedTouches[0]; // asssume it's just one touch happening
		var canvasPos = clientPosToCanvas(canvas, touch.clientX, touch.clientY)
		xMouse = canvasPos.x;
		yMouse = canvasPos.y;
	});

	var slider = document.getElementById("p-do-nothing");
	slider.value = pDoNothing;
	slider.addEventListener("input", function(e) {
		pDoNothing = Number(slider.value);
	});
	slider.addEventListener("change", function(e) {
		// the "input" event would have already fired, but of course IE messes it up.
		pDoNothing = Number(slider.value);
	});

	var checkbox = document.getElementById("reverse-scan");
	checkbox.checked = reverseScan;
	checkbox.addEventListener("change", function(e) {
		reverseScan = checkbox.checked;
	});

	var lastTimestamp = 0;
	function update(timestamp) {
		if (timestamp - lastTimestamp < 33) {
			// skip update if it would create a framerate greater than 30fps
			// (this feels like a dubious way to do this)
			window.requestAnimationFrame(update);
			return;
		}
		lastTimestamp = timestamp;

		smear();
		tForColour += 0.012;
		if (tForColour >= 1.0) tForColour -= 1.0;
		paintTColour(xMouse - 1, yMouse - 1);
		paintTColour(0, Math.floor(yCanvasSize * 0.5));
		paintTColour(Math.floor(xCanvasSize * 0.5), yCanvasSize - 3);

		window.requestAnimationFrame(update);
	}
	update(100);

}();