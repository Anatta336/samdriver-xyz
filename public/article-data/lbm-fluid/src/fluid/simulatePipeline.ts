import { Pipeline, Renderer } from "../webgpu/renderer";
import shaderCode from "./simulate.wgsl?raw";
import { SimParamsBuffer } from "./simParams";

interface SimulatePipelineState {
    renderer: Renderer;
    simParamsBuffer: SimParamsBuffer;
    valuesBuffer: ValuesBuffer;
    bindGroup: GPUBindGroup;
    pipeline: GPUComputePipeline;
    timeElapsed: number;
}

export interface ProvidesValuesBuffer {
    getValuesBuffer(): ValuesBuffer;
}

/**
 * Stores f32 value for each point.
 */
export interface ValuesBuffer extends GPUBuffer {}

export function createSimulatePipeline(
    renderer: Renderer,
    simParamsBuffer: SimParamsBuffer,
): Pipeline & ProvidesValuesBuffer {
    const device = renderer.getDevice();
    const [resolutionX, resolutionY] = renderer.getResolution();

    if (!device) {
        throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");
    }

    const bytesPerPoint = 4; // 1x f32
    const valuesBuffer = device.createBuffer({
        size: resolutionX * resolutionY * bytesPerPoint,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                // SimParams
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
            {
                // Values
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'storage' }
            },
        ]
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: simParamsBuffer }
            },
            {
                binding: 1,
                resource: { buffer: valuesBuffer }
            },
        ]
    });

    const shaderModule = device.createShaderModule({
        code: shaderCode
    });

    const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
            module: shaderModule,
            entryPoint: 'main'
        }
    });

    const state: SimulatePipelineState = {
        renderer,
        simParamsBuffer,
        valuesBuffer,
        bindGroup,
        pipeline,
        timeElapsed: 0,
    };

    return {
        run: (commandEncoder: GPUCommandEncoder, _: number) => run(commandEncoder, state),
        getValuesBuffer: () => valuesBuffer,
    };
}

function run(
    commandEncoder: GPUCommandEncoder,
    state: SimulatePipelineState,
): void {
    const [resolutionX, resolutionY] = state.renderer.getResolution();

    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(state.pipeline);
    pass.setBindGroup(0, state.bindGroup);
    pass.dispatchWorkgroups(
        Math.ceil(resolutionX / 16),
        Math.ceil(resolutionY / 16)
    );
    pass.end();
}
