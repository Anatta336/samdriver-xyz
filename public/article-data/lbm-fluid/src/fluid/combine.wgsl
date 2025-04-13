struct SimParams {
    width:  u32,
    height: u32,
    time:   f32,
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;
@group(0) @binding(2) var<storage, read_write> userInput: array<f32>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let index = y * params.width + x;

    // Add values from both buffers and clamp between 0 and 1
    values[index] = clamp(values[index] + userInput[index], 0.0, 1.0);
}