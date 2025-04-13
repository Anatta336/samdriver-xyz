export const positionAttribDesc: GPUVertexAttribute = {
    shaderLocation: 0, // [[location(0)]]
    offset: 0,
    format: 'float32x4'
};
export const colorAttribDesc: GPUVertexAttribute = {
    shaderLocation: 1, // [[location(1)]]
    offset: 0,
    format: 'float32x3'
};

export interface SimParams {
    width: number;
    height: number;
    time: number;
}

export const simParamsBufferLayout = {
    size: 3 * 4, // 3 32-bit values
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
} as const;