pixelFlame = function () {
	function clamp(a) {
		return Math.min(1, Math.max(0, a));
	}
	var PI2 = 6.28319;
	function generateColour(t) {
		if (t < 0.0 || t >= 1.0) t -= Math.floor(t);
		return {
			r: clamp(
				palette.constant.r + palette.multi.r * Math.cos(
					PI2 * (palette.repeat.r * t + palette.phase.r)
				)),
			g: clamp(
				palette.constant.g + palette.multi.g * Math.cos(
					PI2 * (palette.repeat.g * t + palette.phase.g)
				)),
			b: clamp(
				palette.constant.b + palette.multi.b * Math.cos(
					PI2 * (palette.repeat.b * t + palette.phase.b)
				))
		};
	}

	function colourToHexString(colour) {
		return "#" + (
			(1 << 24) +
			(Math.floor(colour.r * 255) << 16) +
			(Math.floor(colour.g * 255) << 8) +
			 Math.floor(colour.b * 255)
		).toString(16).slice(1);
	}

	var palette = {}
	// these values get overwritten by whatever state the sliders are in,
	// but we want to have object structure set up ready for iterating through.
	palette.constant = {r: 0.50, g: 0.50, b: 0.50};
	palette.multi = {r: 0.50, g: 0.50, b: 0.50};
	palette.repeat = {r: 1.00, g: 1.00, b: 1.00};
	palette.phase = {r: 0.00, g: 0.33, b: 0.67};

	var stored = function() {
		function rndComp() {
			return Math.round(Math.random() * 100) / 100;
		}
		function rndInt() {
			return Math.round(Math.random() * 2);
		}
		return {
			simplyRed: function() {
				palette.constant = {r: 0.50, g: 0.00, b: 0.00};
				palette.multi    = {r: 0.50, g: 0.00, b: 0.00};
				palette.repeat   = {r: 2.00, g: 0.00, b: 0.00};
				palette.phase    = {r: 0.00, g: 0.00, b: 0.00};
			},
			rainbow: function() {
				palette.constant = {r: 0.50, g: 0.50, b: 0.50};
				palette.multi    = {r: 0.50, g: 0.50, b: 0.50};
				palette.repeat   = {r: 1.00, g: 1.00, b: 1.00};
				palette.phase    = {r: 0.00, g: 0.33, b: 0.67};
			},
			random: function() {
				palette.constant = {r: rndComp(), g: rndComp(), b: rndComp()};
				palette.multi    = {r: rndComp(), g: rndComp(), b: rndComp()};
				palette.repeat   = {r: rndInt(),  g: rndInt(),  b: rndInt()};
				palette.phase    = {r: rndComp(), g: rndComp(), b: rndComp()};
			}
		}
	}();

	var canvas = document.getElementById("palette-canvas");
	var context = canvas.getContext("2d");
	var readoutText = document.getElementById("value-readout");

	var sliders = {};
	for (key in palette) {
		var attri = palette[key];
		for (component in attri) {
			var sliderId = key + component;
			var slider = document.getElementById(sliderId);
			sliders[sliderId] = slider;
		}
	}

	// generate buttons for each preset
	var presetBox = document.getElementById("preset-box");
	var presetHtml = "";
	for (key in stored) {
		presetHtml += "<input class=\"preset\" id=\"" + key + "\" type=\"button\" value=\"" + key + "\">";
	}
	presetBox.innerHTML = presetHtml;
	// now that the buttons exist, add handlers to them
	// (probably better to generate the element in-code rather than changing HTML then fetching from DOM)
	for (key in stored) {
		var handler = function(localKey) {
			return function(e) {
				stored[localKey]();
				updateCanvas();
				updateText();
				updateSlidersFromAttri();
			}
		}(key);

		var button = document.getElementById(key);
		button.addEventListener("click", handler);
	}

	function updateSlidersFromAttri() {
		for (key in palette) {
			for (component in palette[key]) {
				var sliderId = key + component;
				var slider = sliders[sliderId];
				slider.valueAsNumber = palette[key][component];
			}
		}
	}

	function updateText() {
		var text = "// JavaScript\n";
		for (key in palette) {
			var attri = palette[key];
			var keyPadded = `${key}         `.substring(0, 9);
			text += keyPadded + "= {";
			text += "r: " + attri.r.toFixed(2) + ", ";
			text += "g: " + attri.g.toFixed(2) + ", ";
			text += "b: " + attri.b.toFixed(2) + "};\n";
		}

        text += "\n// WebGPU\n";
        for (key in palette) {
            var attri = palette[key];
            var keyPadded = `let ${key}        `.substring(0, 12);
            text += keyPadded + " = vec3<f32>(";
            text += attri.r.toFixed(2) + ", ";
            text += attri.g.toFixed(2) + ", ";
            text += attri.b.toFixed(2) + ");\n";
        }

		readoutText.innerHTML = text;
	}

	function updateCanvas() {
		for (x = 0; x < canvas.width; x++) {
			var colour = generateColour(x / canvas.width);
			context.fillStyle = colourToHexString(colour);
			context.fillRect(x, 0, 1, canvas.height);
		}
	}

	for (key in palette) {
		var attri = palette[key];
		for (component in attri) {
			var sliderId = key + component;
			var slider = sliders[sliderId];
			palette[key][component] = slider.valueAsNumber;

			var handler = function(palette, key, component, slider) {
				return function (e) {
					palette[key][component] = slider.valueAsNumber;
					updateText();
					updateCanvas();
				}
			}(palette, key, component, slider)

			// browsers disagree on which event to trigger, so listen for both
			slider.addEventListener("input", handler);
			slider.addEventListener("change", handler);
		}
	}
	updateText();
	updateCanvas();
}();