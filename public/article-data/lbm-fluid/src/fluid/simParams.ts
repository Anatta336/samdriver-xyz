import { Pipeline, Renderer } from "../webgpu/renderer";

interface SimParamsState {
    simParamsBuffer: SimParamsBuffer;
    timeElapsed: number;
    renderer: Renderer;
}

export interface ProvidesSimParamsBuffer {
    getSimParamsBuffer(): SimParamsBuffer;
}

/**
 * Uniforms for the simulation.
 */
export interface SimParamsBuffer extends GPUBuffer {}

export function createSimParamsPipeline(
    renderer: Renderer,
): Pipeline & ProvidesSimParamsBuffer {
    const device = renderer.getDevice();

    if (!device) {
        throw new Error("Trying to create pipeline when Renderer doesn't have device yet.");
    }

    const simParamsBuffer = device.createBuffer({
        size: 3 * 4, // 3 32-bit values
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const state: SimParamsState = {
        simParamsBuffer,
        timeElapsed: 0,
        renderer,
    };

    return {
        run: (_: GPUCommandEncoder, dt: number) => run(state, dt),
        getSimParamsBuffer: () => simParamsBuffer,
    };
}

function run(
    state: SimParamsState,
    dt: number
): void {
    const queue = state.renderer.getQueue();
    if (!queue) {
        throw new Error("Trying to run pipeline when Renderer doesn't have queue yet.");
    }

    const [resolutionX, resolutionY] = state.renderer.getResolution();
    state.timeElapsed = state.timeElapsed + dt;

    // Width and height are u32.
    queue.writeBuffer(
        state.simParamsBuffer,
        0,
        new Uint32Array([resolutionX, resolutionY]),
    );
    // Time is f32, offset after the previous 2x u32 values.
    queue.writeBuffer(
        state.simParamsBuffer,
        2 * 4,
        new Float32Array([state.timeElapsed])
    );
}
