struct SimParams {
    width:  u32,
    height: u32,
    time:   f32,
}

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> values: array<f32>;

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
    let x = u32(texCoord.x * f32(params.width));
    let y = u32((1.0 - texCoord.y) * f32(params.height));

    if (x >= params.width || y >= params.height) {
        return vec4f(0.0);
    }

    let index = y * params.width + x;
    let value = values[index];

    return vec4f(value, value, value, 1.0);
}