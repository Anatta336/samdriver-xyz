struct SimParams {
    width:  u32,
    height: u32,
    time:   f32,
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;

    if (x >= params.width || y >= params.height) {
        return;
    }

    let index = y * params.width + x;

    let fx = f32(x) / f32(params.width);
    let fy = f32(y) / f32(params.height);
    let t = params.time;

    // Create a simple pattern.
    values[index] = 0.5 + 0.25 * sin(
        10.0 * fx +
        8.0 * fy +
        t
    ) * sin(
        8.0 * fx -
        6.0 * fy +
        0.7 * t
    );
}