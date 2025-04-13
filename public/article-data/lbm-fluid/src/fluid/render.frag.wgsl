struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;

// Helper to compute buffer index for the cell at (x, y)
fn computeIndex(x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

// Maps velocity to a color using a simple color scheme
fn velocityToColor(velocity: vec2<f32>) -> vec3<f32> {
    let speed = length(velocity);
    let maxSpeed = 0.1; // Adjust based on your simulation scale
    let normalizedSpeed = min(speed / maxSpeed, 1.0);

    // Direction-based coloring
    let angle = atan2(velocity.y, velocity.x);
    let hue = (angle / (2.0 * 3.14159) + 1.0) * 0.5; // Map angle to [0,1]

    // Generate an HSV color and convert to RGB
    return hsv2rgb(vec3<f32>(hue, normalizedSpeed, normalizedSpeed * 0.8 + 0.2));
}

// HSV to RGB conversion
fn hsv2rgb(hsv: vec3<f32>) -> vec3<f32> {
    let h = hsv.x * 6.0;
    let s = hsv.y;
    let v = hsv.z;

    let c = v * s;
    let x = c * (1.0 - abs(fract(h) * 2.0 - 1.0));
    let m = v - c;

    var rgb: vec3<f32>;

    if (h < 1.0) {
        rgb = vec3<f32>(c, x, 0.0);
    } else if (h < 2.0) {
        rgb = vec3<f32>(x, c, 0.0);
    } else if (h < 3.0) {
        rgb = vec3<f32>(0.0, c, x);
    } else if (h < 4.0) {
        rgb = vec3<f32>(0.0, x, c);
    } else if (h < 5.0) {
        rgb = vec3<f32>(x, 0.0, c);
    } else {
        rgb = vec3<f32>(c, 0.0, x);
    }

    return rgb + vec3<f32>(m);
}

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    let x = u32(texCoord.x * f32(params.width));
    let y = u32((1.0 - texCoord.y) * f32(params.height));

    if (x >= params.width || y >= params.height) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let baseIndex = computeIndex(x, y);

    // Check if this is a boundary/wall
    let isBoundary = x == 0u || y == 0u || x == params.width - 1u || y == params.height - 1u;
    if (isBoundary) {
        return vec4f(0.2, 0.2, 0.2, 1.0); // Gray color for boundaries
    }

    // Extract macroscopic quantities
    let rho = values[baseIndex + 9];
    let vx = values[baseIndex + 10];
    let vy = values[baseIndex + 11];
    let velocity = vec2<f32>(vx, vy);

    // Visualization mode: combined density and velocity
    // Use velocity for color hue and density for brightness
    let velocityColor = velocityToColor(velocity);

    // Scale the density for visualization
    // (density should usually be around 1.0 in an LBM simulation)
    let normalizedDensity = (rho - 0.9) * 5.0; // Adjust these constants based on your simulation
    let densityFactor = clamp(normalizedDensity, 0.0, 1.0);

    // Mix density and velocity visualization
    let finalColor = mix(
        vec3<f32>(densityFactor), // Density as grayscale
        velocityColor,            // Velocity as color
        0.0                       // TODO: Just showing density for now.
    );

    return vec4f(finalColor, 1.0);
}