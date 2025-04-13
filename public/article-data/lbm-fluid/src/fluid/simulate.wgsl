struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,  // Relaxation parameter (1/tau)
    viscosity: f32,
    reserved:  f32,
}

// D2Q9 lattice directions:
// 6 2 5
// 3 0 1
// 7 4 8

// Lattice velocity vectors for D2Q9
const e = array<vec2<f32>, 9>(
    vec2<f32>(0.0, 0.0),   // Center (0)
    vec2<f32>(1.0, 0.0),   // East (1)
    vec2<f32>(0.0, 1.0),   // North (2)
    vec2<f32>(-1.0, 0.0),  // West (3)
    vec2<f32>(0.0, -1.0),  // South (4)
    vec2<f32>(1.0, 1.0),   // North-East (5)
    vec2<f32>(-1.0, 1.0),  // North-West (6)
    vec2<f32>(-1.0, -1.0), // South-West (7)
    vec2<f32>(1.0, -1.0)   // South-East (8)
);

// Weights for D2Q9 model
const w = array<f32, 9>(
    4.0 / 9.0,  // Center (0)
    1.0 / 9.0,  // East (1)
    1.0 / 9.0,  // North (2)
    1.0 / 9.0,  // West (3)
    1.0 / 9.0,  // South (4)
    1.0 / 36.0, // North-East (5)
    1.0 / 36.0, // North-West (6)
    1.0 / 36.0, // South-West (7)
    1.0 / 36.0  // South-East (8)
);

// Opposite directions for bounce-back boundary conditions
const opposite = array<u32, 9>(
    0u, // Center (0) -> Center (0)
    3u, // East (1) -> West (3)
    4u, // North (2) -> South (4)
    1u, // West (3) -> East (1)
    2u, // South (4) -> North (2)
    7u, // North-East (5) -> South-West (7)
    8u, // North-West (6) -> South-East (8)
    5u, // South-West (7) -> North-East (5)
    6u  // South-East (8) -> North-West (6)
);

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read> src: array<f32>;
@group(0) @binding(2) var<storage, read_write> dst: array<f32>;

// Helper to compute buffer index for the cell at (x, y)
fn computeIndex(x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

// Helper function to compute equilibrium distribution
fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    // Standard equilibrium formula for D2Q9:
    // f_eq = rho * w_i * (1 + 3(e_i·u) + 9/2(e_i·u)² - 3/2|u|²)
    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}

// Check if a cell is solid (boundary)
fn isSolid(x: u32, y: u32) -> bool {
    // Walls on the borders.
    return x == 0u || y == 0u || x == params.width - 1u || y == params.height - 1u;

    // Could add more complex boundary conditions here.
}

// Collision step (compute new distributions after collision)
@compute @workgroup_size(16, 16)
fn collision(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let baseIndex = computeIndex(x, y);

    // Check if this is a solid cell
    if (isSolid(x, y)) {
        // For solid cells, we'll handle bounce-back in the streaming step
        // Just copy the original values to the destination buffer
        for (var i = 0u; i < 12u; i++) {
            dst[baseIndex + i] = src[baseIndex + i];
        }
        return;
    }

    // Load current distributions f[i]
    var f: array<f32, 9>;
    for (var i = 0u; i < 9u; i++) {
        f[i] = src[baseIndex + i];
    }

    // Compute macroscopic quantities: density and velocity
    var rho = 0.0;
    var momentum = vec2<f32>(0.0, 0.0);

    for (var i = 0u; i < 9u; i++) {
        rho += f[i];
        momentum += f[i] * e[i];
    }

    let velocity = select(momentum / rho, vec2<f32>(0.0, 0.0), rho < 0.0001);

    // Save macroscopic quantities for visualization and next steps
    dst[baseIndex + 9] = rho;
    dst[baseIndex + 10] = velocity.x;
    dst[baseIndex + 11] = velocity.y;

    // Compute equilibrium distributions
    var f_eq: array<f32, 9>;
    for (var i = 0u; i < 9u; i++) {
        f_eq[i] = computeEquilibrium(rho, velocity, i);
    }

    // Perform collision step using BGK approximation
    // f_i = f_i + omega * (f_eq_i - f_i)
    for (var i = 0u; i < 9u; i++) {
        // Calculate the post-collision distribution
        let f_coll = f[i] + params.omega * (f_eq[i] - f[i]);
        dst[baseIndex + i] = f_coll;
    }
}

// Streaming step (move distributions to neighboring cells)
@compute @workgroup_size(16, 16)
fn streaming(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let dstIndex = computeIndex(x, y);

    // Handle bounce-back boundary conditions for solid cells
    if (isSolid(x, y)) {
        // For solid cells, perform bounce-back
        // Distributions bounce back in the opposite direction
        for (var i = 1u; i < 9u; i++) { // Skip center direction (0)
            let oppositeDir = opposite[i];

            // Get the distribution from the opposite direction
            let srcValue = src[dstIndex + i];

            // Reflect it back
            dst[dstIndex + oppositeDir] = srcValue;
        }
        return;
    }

    // For fluid cells, handle streaming from neighboring cells
    for (var i = 0u; i < 9u; i++) {
        // Find the source cell for this direction (move in the opposite direction to trace back)
        let srcDir = opposite[i];
        let srcVec = e[srcDir];

        // Calculate coordinates of the source cell
        let srcX = u32(i32(x) - i32(srcVec.x));
        let srcY = u32(i32(y) - i32(srcVec.y));

        // Check if the source cell is within bounds
        if (srcX < params.width && srcY < params.height) {
            let srcCellIndex = computeIndex(srcX, srcY);

            // If source is a solid cell, handle bounce-back
            if (isSolid(srcX, srcY)) {
                // The distribution bounces back from the solid boundary
                dst[dstIndex + i] = src[dstIndex + srcDir];
            } else {
                // Regular streaming: pull the distribution from the source cell
                dst[dstIndex + i] = src[srcCellIndex + i];
            }
        }
    }

    // Copy the macroscopic quantities (rho, vx, vy) from collision step
    dst[dstIndex + 9] = src[dstIndex + 9];   // rho
    dst[dstIndex + 10] = src[dstIndex + 10]; // vx
    dst[dstIndex + 11] = src[dstIndex + 11]; // vy
}