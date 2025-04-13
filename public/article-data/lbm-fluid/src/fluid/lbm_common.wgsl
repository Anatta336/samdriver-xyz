// Common LBM structures and functions.

// Simulation parameters structure
struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

// D2Q9 lattice directions
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

// Helper to compute buffer index for the cell at (x, y)
fn computeIndex(params: SimParams, x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

// Helper function to compute equilibrium distribution
fn computeEquilibrium(rho: f32, velocity: vec2<f32>, i: u32) -> f32 {
    let vel_dot_e = dot(velocity, e[i]);
    let vel_squared = dot(velocity, velocity);

    return rho * w[i] * (
        1.0 +
        3.0 * vel_dot_e +
        4.5 * vel_dot_e * vel_dot_e -
        1.5 * vel_squared
    );
}