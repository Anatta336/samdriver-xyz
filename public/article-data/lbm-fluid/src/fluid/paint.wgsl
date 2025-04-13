struct SimParams {
    width:     u32,
    height:    u32,
    time:      f32,
    omega:     f32,
    viscosity: f32,
    reserved:  f32,
}

// D2Q9 lattice directions (same as in simulate.wgsl)
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

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;
@group(0) @binding(2) var<storage, read_write> userInput: array<f32>;

// Helper to compute buffer index for the cell at (x, y)
fn computeIndex(x: u32, y: u32) -> u32 {
    return (y * params.width + x) * 12u;
}

// Helper function to compute equilibrium distribution (same as in simulate.wgsl)
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

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let index = y * params.width + x;
    let baseIndex = computeIndex(x, y);

    // Get user input (paint) value for this cell
    let inputValue = userInput[index];

    // Only process cells that have been painted
    if (inputValue > 0.0) {
        // Get current density and velocity from the cell
        let rho = values[baseIndex + 9];
        let vx = values[baseIndex + 10];
        let vy = values[baseIndex + 11];

        // Add density based on user input and reset to near equilibrium
        // with a slight downward velocity to create a flow effect
        let newRho = rho + inputValue * 0.2;

        // Create a small velocity impulse in the vertical direction
        // This helps to create visible fluid motion when painting
        let velocityImpulse = vec2<f32>(0.0, 0.0);
        let newVelocity = vec2<f32>(vx, vy) + velocityImpulse;

        // Update the macroscopic values
        values[baseIndex + 9] = newRho;
        values[baseIndex + 10] = newVelocity.x;
        values[baseIndex + 11] = newVelocity.y;

        // Recalculate distribution functions based on new density and velocity
        // This effectively adds fluid to the simulation
        for (var i = 0u; i < 9u; i++) {
            values[baseIndex + i] = computeEquilibrium(newRho, newVelocity, i);
        }
    }

    // Reset the user input after processing
    userInput[index] = 0.0;
}