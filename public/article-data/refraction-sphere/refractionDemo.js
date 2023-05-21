var refraction = function() {

    var refractiveIndexAir = 1.0;
    var refractiveIndexGlass = 1.52;

    function clear(context) {
        // Store the current transformation matrix
        context.save();

        // Use the identity matrix while clearing the canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        // Restore the transform
        context.restore();
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

    function solveQuadratic(a, b, c) {
        var s = Math.sqrt(b * b - 4 * a * c);
        return {
            hasSolution : (s > 0) && a != 0,
            x1: (-b + s) / (2 * a),
            x2: (-b - s) / (2 * a)
        };
    }

    function refract(angleOfIncidence, refractiveIndexA, refractiveIndexB) {
        // by Snell's law
        var a = (refractiveIndexA / refractiveIndexB) * Math.sin(angleOfIncidence);
        var totalInternalReflection = Math.abs(a) > 1;
        angleOfTransmission = Math.asin(a);

        return {
            totalInternalReflection: totalInternalReflection,
            angleOfTransmission: angleOfTransmission
        }
    }

    // a and b must both have .x and .y
    function dotProduct(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    function angleAtoAngleB(a, b) {
        var diff = b - a;
        if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }
        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        }
        return diff;
    }

    var intoGlass = function(canvasName) {
        var canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");
        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;
        var xMid = canvasWidth / 2;
        var yMid = canvasHeight / 2;

        var angleOfIncidence = -2.2;
        var angleOfReflection;
        var angleOfTransmission;

        var fresnel;

        function updateAngles() {
            angleOfReflection = -angleOfIncidence;

            const refractResult = refract(angleOfIncidence, refractiveIndexAir, refractiveIndexGlass);
            angleOfTransmission = refractResult.angleOfTransmission;

            // very rough fresnel approximation
            fresnel = refractResult.totalInternalReflection ? 1 : Math.pow(1 - Math.abs(Math.cos(angleOfIncidence)), 5);
        }

        function onMouseDown(x, y) {
            if (x > xMid) {
                // if within glass region, ignore
                return;
            }

            angleOfIncidence = Math.atan2(y - yMid, x - xMid);
            updateAngles();
            draw();
        }

        function drawGlassBlock() {
            context.fillStyle = '#8fbdc9';
            context.lineWidth = 0;
            context.setLineDash([]);

            context.fillRect(xMid, 0, xMid, canvasHeight);

            context.strokeStyle = '#5a9eca';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(xMid, 0);
            context.lineTo(xMid, canvasHeight);
            context.stroke();
            context.closePath();
        }

        function drawNormals() {
            context.strokeStyle = '#515151';
            context.lineWidth = 2;
            context.setLineDash([4, 2]);

            context.beginPath();
            context.moveTo(xMid - 120, yMid);
            context.lineTo(xMid + 120, yMid);
            context.stroke();
            context.closePath();
        }

        function drawAngles() {
            context.strokeStyle = '#515151';
            context.lineWidth = 2;
            context.setLineDash([]);
            context.font = "1rem Roboto";
            context.fillStyle = '#000000';

            // only draw angle arc when angle isn't extremely small
            if (Math.abs(angleOfIncidence - Math.PI) > 0.0001 && Math.abs(angleOfIncidence) > 0.0001)
            {
                context.beginPath();
                context.arc(xMid, yMid, 50, -Math.PI, angleOfIncidence, angleOfIncidence >= 0);
                context.stroke();
                context.closePath();
            }

            context.fillText("θ₁", xMid - 75, angleOfIncidence >= 0 ? yMid + 20 : yMid - 7);

            // check small angle
            context.beginPath();
            context.arc(xMid, yMid, 50, 0, -angleOfTransmission, angleOfTransmission >= 0);
            context.stroke();
            context.closePath();

            context.fillText("θ₂", xMid + 75, angleOfTransmission < 0 ? yMid + 20 : yMid - 7);
        }

        function drawRays() {
            context.font = "1rem Roboto";
            context.fillStyle = '#000000';
            context.setLineDash([]);

            // incident
            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(xMid, yMid);
            context.lineTo(
                xMid + 10 * canvasWidth * Math.cos(angleOfIncidence),
                yMid + 10 * canvasWidth * Math.sin(angleOfIncidence)
            );
            context.stroke();
            context.closePath();

            context.fillText("incident",
                xMid + 0.3 * canvasWidth * Math.cos(angleOfIncidence) + 8,
                yMid + 0.3 * canvasWidth * Math.sin(angleOfIncidence)
            );

            // transmission
            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 4.75 * (1 - fresnel);
            context.beginPath();
            context.moveTo(xMid, yMid);
            context.lineTo(
                xMid + 10 * canvasWidth * Math.cos(angleOfTransmission),
                yMid - 10 * canvasWidth * Math.sin(angleOfTransmission)
            );
            context.stroke();
            context.closePath();

            context.fillText("transmission",
                xMid + 0.3 * canvasWidth * Math.cos(angleOfTransmission) + 8,
                yMid - 0.3 * canvasWidth * Math.sin(angleOfTransmission)
            );

            // reflection
            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 0.25 + fresnel * 4.75;
            context.beginPath();
            context.moveTo(xMid, yMid);
            context.lineTo(
                xMid + 10 * canvasWidth * Math.cos(angleOfReflection),
                yMid + 10 * canvasWidth * Math.sin(angleOfReflection)
            );
            context.stroke();
            context.closePath();

            context.fillText("reflection",
                xMid + 0.3 * canvasWidth * Math.cos(angleOfReflection) + 8,
                yMid + 0.3 * canvasWidth * Math.sin(angleOfReflection)
            );
        }

        function draw() {
            clear(context);

            drawGlassBlock();
            drawNormals();
            drawRays();
            drawAngles();
        }

        function init() {
            context.setTransform(1, 0, 0, 1, 0, 0);

            var isMouseDown = false;
			canvas.addEventListener("mousedown", function(e) {
                isMouseDown = true;
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
			});
			canvas.addEventListener("mouseup", function(e) {
                isMouseDown = false;
			});
			canvas.addEventListener("mousemove", function(e) {
                if (!isMouseDown) {
                    return;
                }
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
            });
		}

		window.addEventListener("load", function() {
            init();
            updateAngles();
            draw();
		});
    }("into-glass-canvas");

    var intoAir = function(canvasName) {
        var canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");
        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;
        var xMid = canvasWidth / 2;
        var yMid = canvasHeight / 2;

        var angleOfIncidence = -2.6;
        var angleOfReflection;
        var angleOfTransmission;

        var fresnel;

        function updateAngles() {
            angleOfReflection = -angleOfIncidence;

            const refractResult = refract(angleOfIncidence, refractiveIndexGlass, refractiveIndexAir);
            angleOfTransmission = refractResult.angleOfTransmission;

            // very rough fresnel approximation
            fresnel = refractResult.totalInternalReflection ? 1 : Math.pow(1 - Math.abs(Math.cos(angleOfIncidence)), 5);
        }

        function onMouseDown(x, y) {
            if (x > xMid) {
                // if within glass region, ignore
                return;
            }

            angleOfIncidence = Math.atan2(y - yMid, x - xMid);
            updateAngles();
            draw();
        }

        function drawGlassBlock() {
            context.fillStyle = '#8fbdc9';
            context.lineWidth = 0;
            context.setLineDash([]);

            context.fillRect(0, 0, xMid, canvasHeight);

            context.strokeStyle = '#5a9eca';
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(xMid, 0);
            context.lineTo(xMid, canvasHeight);
            context.stroke();
            context.closePath();
        }

        function drawNormals() {
            context.strokeStyle = '#515151';
            context.lineWidth = 2;
            context.setLineDash([4, 2]);

            context.beginPath();
            context.moveTo(xMid - 120, yMid);
            context.lineTo(xMid + 120, yMid);
            context.stroke();
            context.closePath();
        }

        function drawAngles() {
            context.strokeStyle = '#515151';
            context.lineWidth = 2;
            context.setLineDash([]);
            context.font = "1rem Roboto";
            context.fillStyle = '#000000';

            // only draw angle arc when angle isn't extremely small
            if (Math.abs(angleOfIncidence - Math.PI) > 0.0001 && Math.abs(angleOfIncidence) > 0.0001)
            {
                context.beginPath();
                context.arc(xMid, yMid, 50, -Math.PI, angleOfIncidence, angleOfIncidence >= 0);
                context.stroke();
                context.closePath();
            }

            context.fillText("θ₁", xMid - 75, angleOfIncidence >= 0 ? yMid + 20 : yMid - 7);

            if (fresnel < 1)
            {
                context.beginPath();
                context.arc(xMid, yMid, 50, 0, -angleOfTransmission, angleOfTransmission >= 0);
                context.stroke();
                context.closePath();

                context.fillText("θ₂", xMid + 75, angleOfTransmission < 0 ? yMid + 20 : yMid - 7);
            }
        }

        function drawRays() {
            context.font = "1rem Roboto";
            context.fillStyle = '#000000';
            context.setLineDash([]);

            // incident
            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(xMid, yMid);
            context.lineTo(
                xMid + 10 * canvasWidth * Math.cos(angleOfIncidence),
                yMid + 10 * canvasWidth * Math.sin(angleOfIncidence)
            );
            context.stroke();
            context.closePath();

            context.fillText("incident",
                xMid + 0.3 * canvasWidth * Math.cos(angleOfIncidence) + 8,
                yMid + 0.3 * canvasWidth * Math.sin(angleOfIncidence)
            );

            if (fresnel < 1)
            {
                // transmission
                context.strokeStyle = '#ca5aa0';
                context.lineWidth = 4.75 * (1 - fresnel);
                context.beginPath();
                context.moveTo(xMid, yMid);
                context.lineTo(
                    xMid + 10 * canvasWidth * Math.cos(angleOfTransmission),
                    yMid - 10 * canvasWidth * Math.sin(angleOfTransmission)
                );
                context.stroke();
                context.closePath();

                context.fillText("transmission",
                    xMid + 0.3 * canvasWidth * Math.cos(angleOfTransmission) + 8,
                    yMid - 0.3 * canvasWidth * Math.sin(angleOfTransmission)
                );
            }

            // reflection
            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 0.25 + fresnel * 4.75;
            context.beginPath();
            context.moveTo(xMid, yMid);
            context.lineTo(
                xMid + 10 * canvasWidth * Math.cos(angleOfReflection),
                yMid + 10 * canvasWidth * Math.sin(angleOfReflection)
            );
            context.stroke();
            context.closePath();

            context.fillText("reflection",
                xMid + 0.3 * canvasWidth * Math.cos(angleOfReflection) + 8,
                yMid + 0.3 * canvasWidth * Math.sin(angleOfReflection)
            );
        }

        function draw() {
            clear(context);

            drawGlassBlock();
            drawNormals();
            drawRays();
            drawAngles();
        }

        function init() {
            context.setTransform(1, 0, 0, 1, 0, 0);

            var isMouseDown = false;
			canvas.addEventListener("mousedown", function(e) {
                isMouseDown = true;
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
			});
			canvas.addEventListener("mouseup", function(e) {
                isMouseDown = false;
			});
			canvas.addEventListener("mousemove", function(e) {
                if (!isMouseDown) {
                    return;
                }
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
            });
		}

		window.addEventListener("load", function() {
            init();
            updateAngles();
            draw();
		});
    }("into-air-canvas");

    var circleInBox = function(canvasName) {
        var canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");
        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;
        var midX = canvasWidth / 2;
        var midY = canvasHeight / 2;
        var originX = canvasWidth * 0.65;
        var eyeX = canvasWidth * 0.05;

        var eyeSize = canvasWidth * 0.1;
        var boxSize = canvasWidth * 0.52;
        var circleRadius = canvasWidth * 0.24;

        var rayAngle = -0.04 * Math.PI;
        var rayStart = {x: eyeX, y: midY};
        var rayDirection;
        var hasIntersects = false;
        var intersectA, intersectB;

        function onMouseDown(x, y) {
            rayAngle = Math.atan2(y - midY, x - eyeX);
            updateRay();
            updateIntersects();
            draw();
        }

        function updateRay() {
            rayDirection = {
                x: Math.cos(rayAngle),
                y: Math.sin(rayAngle)
            };
        }

        function updateIntersects() {
            var startRelativeToOrigin = {
                x: rayStart.x - originX,
                y: rayStart.y - midY
            };

            var result = solveQuadratic(dotProduct(rayDirection, rayDirection),
                2 * dotProduct(startRelativeToOrigin, rayDirection),
                dotProduct(startRelativeToOrigin, startRelativeToOrigin) - (circleRadius * circleRadius)
            );

            // ignore any negative results, that would mean the intersect happens behind the ray's start point
            hasIntersects = result.hasSolution && result.x1 > 0 && result.x2 > 0;
            if (!hasIntersects) {
                return;
            }

            intersectA = positionOfRayAtTime(result.x1);
            intersectB = positionOfRayAtTime(result.x2);
        }

        function positionOfRayAtTime(t)
        {
            return {
                x: rayStart.x + rayDirection.x * t,
                y: rayStart.y + rayDirection.y * t
            }
        }

        function drawEye() {
            context.strokeStyle = '#373737';
            context.lineWidth = 3;

            context.beginPath();
            context.arc(eyeX, midY, eyeSize * 0.3, -0.2 * Math.PI, 0.2 * Math.PI);
            context.stroke();
            context.closePath();

            context.beginPath();
            context.arc(eyeX - eyeSize * 0.2, midY - eyeSize * 0.573, eyeSize * 0.6, 0.16 * Math.PI, 0.4 * Math.PI);
            context.stroke();
            context.closePath();

            context.beginPath();
            context.arc(eyeX - eyeSize * 0.2, midY + eyeSize * 0.573, eyeSize * 0.6, -0.16 * Math.PI, -0.4 * Math.PI, true);
            context.stroke();
            context.closePath();

            context.font = "1rem Roboto";
            context.fillStyle = '#000000';
            context.fillText("eye",
                eyeX,
                midY + eyeSize * 0.7
            );
        }

        function drawBox() {
            context.strokeStyle = '#575757';
            context.lineWidth = 3;
            context.strokeRect(originX - boxSize * 0.5, midY - boxSize * 0.5, boxSize, boxSize);
        }

        function drawRay() {
            var startLength = eyeSize * 0.8;
            var start = {
                x: eyeX + Math.cos(rayAngle) * startLength,
                y: midY + Math.sin(rayAngle) * startLength
            };
            var end = {
                x: eyeX + Math.cos(rayAngle) * canvasWidth * 5,
                y: midY + Math.sin(rayAngle) * canvasWidth * 5
            };

            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
            context.closePath();

            if (!hasIntersects) {
                return;
            }
            drawIntersect(intersectA);
            drawIntersect(intersectB);
        }

        function drawIntersect(point){
            var radius = 8;
            context.lineWidth = 0;
            context.fillStyle = '#5a9eca'

            context.beginPath();
            context.arc(point.x, point.y, radius, 0, Math.PI * 2, true);
            context.fill();
        }

        function drawCircle() {
            context.strokeStyle = '#5a9eca'
            context.lineWidth = 2;
            context.setLineDash([4, 3]);

            context.beginPath();
            context.arc(originX, midY, circleRadius, 0, Math.PI * 2, true);
            context.stroke();
            context.closePath();

            context.setLineDash([]);
        }

        function draw() {
            clear(context);

            drawEye();
            drawBox();
            drawCircle();
            drawRay();
        }

        function init() {
            context.setTransform(1, 0, 0, 1, 0, 0);

            var isMouseDown = false;
			canvas.addEventListener("mousedown", function(e) {
                isMouseDown = true;
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
			});
			canvas.addEventListener("mouseup", function(e) {
                isMouseDown = false;
			});
			canvas.addEventListener("mousemove", function(e) {
                if (!isMouseDown) {
                    return;
                }
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
            });
		}

        window.addEventListener("load", function() {
            init();
            updateRay();
            updateIntersects();
            draw();
		});
    }("circle-in-box-canvas");

    var circleRefract = function(canvasName) {
        var canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");

        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;
        var midY = canvasHeight / 2;

        var eyeSize = canvasWidth * 0.1;
        var circleRadius = canvasWidth * 0.24;

        var eye = {x: canvasWidth * 0.05, y: midY};
        var origin = {x: canvasWidth * 0.65, y: midY};

        var eyeToSurfaceRay = {start: {x: eye.x, y: eye.y}, end: {}, angle: 0};
        var entryToExitRay = {start: false, end: {}, angle: 0};
        var exitToSceneRay = {start: false, end: {}, angle: 0};

        function onMouseDown(x, y) {
            updateRays(Math.atan2(y - eye.y, x - eye.x));
            draw();
        }

        function calcVelocity(angle) {
            return {
                x: Math.cos(angle),
                y: Math.sin(angle),
            }
        }

        // ray should have .angle and .start properly set
        function castRay(ray){
            // default to no end
            ray.end = false;

            if (ray.start == {}) {
                return;
            }

            var startRelativeToOrigin = {
                x: ray.start.x - origin.x,
                y: ray.start.y - origin.y
            };

            var velocity = calcVelocity(ray.angle);
            var intersects = solveQuadratic(dotProduct(velocity, velocity),
                2 * dotProduct(startRelativeToOrigin, velocity),
                dotProduct(startRelativeToOrigin, startRelativeToOrigin) - (circleRadius * circleRadius)
            );

            if (!intersects.hasSolution) {
                return;
            }

            var time;
            const minTime = 0.0001;
            if (intersects.x1 >= minTime && (intersects.x1 < intersects.x2 || intersects.x2 < minTime)) {
                time = intersects.x1;
            } else if (intersects.x2 >= minTime) {
                time = intersects.x2;
            } else {
                return;
            }

            ray.end = {
                x: ray.start.x + time * velocity.x,
                y: ray.start.y + time * velocity.y
            }
        }

        function updateRays(angleOfFirst) {
            // other rays default to not being drawn
            entryToExitRay.start = false;
            exitToSceneRay.start = false;

            // first ray starts slightly offset from eye, for aesthetics
            var offsetFromEye = eyeSize * 0.8;
            eyeToSurfaceRay.angle = angleOfFirst;
            eyeToSurfaceRay.start = {
                x: eye.x + Math.cos(eyeToSurfaceRay.angle) * offsetFromEye,
                y: eye.y + Math.sin(eyeToSurfaceRay.angle) * offsetFromEye
            };
            castRay(eyeToSurfaceRay);

            if (!eyeToSurfaceRay.end) {
                // give it an end somewhere off-screen
                eyeToSurfaceRay.end = {
                    x: eye.x + Math.cos(eyeToSurfaceRay.angle) * canvasWidth * 10,
                    y: eye.y + Math.sin(eyeToSurfaceRay.angle) * canvasWidth * 10
                }
                return;
            }

            const entrySurfaceNormalAngle = Math.atan2(eyeToSurfaceRay.end.y - origin.y, eyeToSurfaceRay.end.x - origin.x);
            const entryIncidentAngle = angleAtoAngleB(entrySurfaceNormalAngle, eyeToSurfaceRay.angle - Math.PI);

            const entryRefract = refract(entryIncidentAngle, refractiveIndexAir, refractiveIndexGlass);
            if (entryRefract.totalInternalReflection) {
                return;
            }

            // with all the +/- Math.PI going on, would be nice to have a loopAngle function

            entryToExitRay.start = eyeToSurfaceRay.end;
            entryToExitRay.angle = entryRefract.angleOfTransmission + (entrySurfaceNormalAngle - Math.PI);

            castRay(entryToExitRay);
            if (!entryToExitRay.end) {
                return;
            }

            const exitInternalNormalAngle = Math.atan2(entryToExitRay.end.y - origin.y, entryToExitRay.end.x - origin.x) - Math.PI;
            const exitIncidentAngle = angleAtoAngleB(exitInternalNormalAngle, entryToExitRay.angle - Math.PI);

            exitToSceneRay.start = entryToExitRay.end;
            const exitRefract = refract(exitIncidentAngle, refractiveIndexGlass, refractiveIndexAir);
            if (exitRefract.totalInternalReflection) {
                return;
            }

            exitToSceneRay.angle = exitRefract.angleOfTransmission + exitInternalNormalAngle + Math.PI;
            exitToSceneRay.end = {
                x: exitToSceneRay.start.x + Math.cos(exitToSceneRay.angle) * canvasWidth * 10,
                y: exitToSceneRay.start.y + Math.sin(exitToSceneRay.angle) * canvasWidth * 10
            }
        }

        function drawEye() {
            context.strokeStyle = '#373737';
            context.lineWidth = 3;

            context.beginPath();
            context.arc(eye.x, eye.y, eyeSize * 0.3, -0.2 * Math.PI, 0.2 * Math.PI);
            context.stroke();
            context.closePath();

            context.beginPath();
            context.arc(eye.x - eyeSize * 0.2, midY - eyeSize * 0.573, eyeSize * 0.6, 0.16 * Math.PI, 0.4 * Math.PI);
            context.stroke();
            context.closePath();

            context.beginPath();
            context.arc(eye.x - eyeSize * 0.2, midY + eyeSize * 0.573, eyeSize * 0.6, -0.16 * Math.PI, -0.4 * Math.PI, true);
            context.stroke();
            context.closePath();

            context.font = "1rem Roboto";
            context.fillStyle = '#000000';
            context.fillText("eye",
                eye.x,
                midY + eyeSize * 0.7
            );
        }

        function drawCircle() {
            context.strokeStyle = '#5a9eca';
            context.fillStyle = '#8fbdc9';
            context.lineWidth = 2;

            context.beginPath();
            context.arc(origin.x, origin.y, circleRadius, 0, Math.PI * 2, true);
            context.stroke();
            context.fill();
        }

        function draw() {
            clear(context);

            drawEye();
            drawCircle();

            context.strokeStyle = '#ca5aa0';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(eyeToSurfaceRay.start.x, eyeToSurfaceRay.start.y);
            context.lineTo(eyeToSurfaceRay.end.x, eyeToSurfaceRay.end.y);
            if (entryToExitRay.start) {
                context.lineTo(entryToExitRay.end.x, entryToExitRay.end.y);
            }
            if (exitToSceneRay.start) {
                context.lineTo(exitToSceneRay.end.x, exitToSceneRay.end.y);
            }
            context.stroke();
            context.closePath();
        }

        function init() {
            context.setTransform(1, 0, 0, 1, 0, 0);

            var isMouseDown = false;
			canvas.addEventListener("mousedown", function(e) {
                isMouseDown = true;
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
			});
			canvas.addEventListener("mouseup", function(e) {
                isMouseDown = false;
			});
			canvas.addEventListener("mousemove", function(e) {
                if (!isMouseDown) {
                    return;
                }
				var canvasPos = clientPosToCanvas(canvas, e.clientX, e.clientY);
				onMouseDown(canvasPos.x, canvasPos.y);
            });
		}

        window.addEventListener("load", function() {
            init();
            updateRays(-0.12 * Math.PI);
            draw();
		});
    }("circle-refract-canvas");
}();