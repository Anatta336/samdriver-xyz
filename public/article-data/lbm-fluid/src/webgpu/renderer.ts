import vertShaderCode from '../shaders/quad.vert.wgsl?raw';
import fragShaderCode from '../shaders/quad.frag.wgsl?raw';
import computeShaderCode from '../shaders/compute.wgsl?raw';
import { SimParamsBuffer, ValuesBuffer } from '../fluid/bufferInterfaces';

export interface Renderer {
    canvas: HTMLCanvasElement;
    device: GPUDevice | null | undefined;
    queue: GPUQueue | null | undefined;
    simParamsBuffer: SimParamsBuffer | null | undefined;
    valuesBuffer: ValuesBuffer | null | undefined;
    extraPipelines: Pipeline[];
    getResolution(): [number, number];
    render(): void;
    resizeBackings(): void;
}

export interface Pipeline {
    run(commandEncoder: GPUCommandEncoder): void;
}

export interface SimParams {
    width: number;
    height: number;
    time: number;
}

interface RendererState {
    resolutionX: number;
    resolutionY: number;
    context: GPUCanvasContext | null | undefined;
    computePipeline: GPUComputePipeline | null | undefined;
    renderPipeline: GPURenderPipeline | null | undefined;
    computeBindGroup: GPUBindGroup | null | undefined;
    renderBindGroup: GPUBindGroup | null | undefined;
    time: number;
}

export async function createRenderer(canvas: HTMLCanvasElement): Promise<Renderer | null> {
    const state: RendererState = {
        resolutionX: 256,
        resolutionY: 256,
        context: undefined,
        computePipeline: undefined,
        renderPipeline: undefined,
        computeBindGroup: undefined,
        renderBindGroup: undefined,
        time: 0
    };

    const renderer: Renderer = {
        canvas,
        device: undefined as GPUDevice | null | undefined,
        queue: undefined as GPUQueue | null | undefined,
        simParamsBuffer: undefined as SimParamsBuffer | null | undefined,
        valuesBuffer: undefined as ValuesBuffer | null | undefined,
        extraPipelines: [] as Pipeline[],
        getResolution: () => [state.resolutionX, state.resolutionY],
        resizeBackings: () => resizeBackings(renderer, state),
        render: () => render(renderer, state)
    };

    if (await initializeAPI(renderer)) {
        renderer.resizeBackings();
        await initializeResources(renderer, state);

        return renderer;
    }

    return null;
}

async function initializeAPI(renderer: Renderer): Promise<boolean> {
    try {
        const entry: GPU = navigator.gpu;
        if (!entry) {
            console.error('WebGPU is not supported');
            return false;
        }

        const adapter = await entry.requestAdapter();
        const device = await adapter?.requestDevice();
        renderer.device = device;
        renderer.queue = device?.queue;
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}

async function initializeResources(renderer: Renderer, state: RendererState) {
    if (!renderer.device) {
        console.error('Trying to initialise resources before device.');
        return;
    }

    const device = renderer.device;

    // Create sim params buffer
    renderer.simParamsBuffer = device.createBuffer({
        size: 3 * 4, // 3 32-bit values
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create values buffer
    renderer.valuesBuffer = device.createBuffer({
        size: state.resolutionX * state.resolutionY * 4, // f32 values
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    // Create bind group layout for both compute and render
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            },
            {
                // Written to be compute, and read by fragment.
                binding: 1,
                visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
                buffer: { type: 'storage' }
            }
        ]
    });

    // Create compute pipeline
    const computeModule = device.createShaderModule({
        code: computeShaderCode
    });

    state.computePipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        compute: {
            module: computeModule,
            entryPoint: 'main'
        }
    });

    // Create render pipeline
    const vertModule = device.createShaderModule({
        code: vertShaderCode
    });

    const fragModule = device.createShaderModule({
        code: fragShaderCode
    });

    state.renderPipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        vertex: {
            module: vertModule,
            entryPoint: 'main'
        },
        fragment: {
            module: fragModule,
            entryPoint: 'main',
            targets: [{
                format: 'bgra8unorm'
            }]
        },
        primitive: {
            topology: 'triangle-list'
        }
    });

    // Create bind group for both pipelines
    state.computeBindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: renderer.simParamsBuffer }
            },
            {
                binding: 1,
                resource: { buffer: renderer.valuesBuffer }
            }
        ]
    });

    // Compute pass and render pass can share a bind group.
    state.renderBindGroup = state.computeBindGroup;
}

function resizeBackings(renderer: Renderer, state: RendererState) {
    if (!renderer.device || !renderer.canvas) return;

    if (!state.context) {
        state.context = renderer.canvas.getContext('webgpu');
        if (!state.context) {
            console.error('Failed to get WebGPU context.');
            return;
        }

        const canvasConfig: GPUCanvasConfiguration = {
            device: renderer.device,
            format: 'bgra8unorm',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: 'premultiplied'
        };
        state.context.configure(canvasConfig);
    }
}

function render(renderer: Renderer, state: RendererState) {
    if (!renderer.device || !state.context || !renderer.queue
        || !state.computePipeline || !state.renderPipeline
        || !state.computeBindGroup || !state.renderBindGroup
        || !renderer.simParamsBuffer
    ) {
        console.error('Renderer not fully initialized.');
        return;
    }

    // Update simulation parameters
    const simParams: SimParams = {
        width: state.resolutionX,
        height: state.resolutionY,
        time: state.time
    };
    // state.time += 0.016; // Assuming ~60fps

    // Width and height are u32.
    renderer.queue.writeBuffer(
        renderer.simParamsBuffer,
        0,
        new Uint32Array([simParams.width, simParams.height]),
    );
    // Time is f32, offset after the previous 2x u32 values.
    renderer.queue.writeBuffer(
        renderer.simParamsBuffer,
        2 * 4,
        new Float32Array([simParams.time])
    );

    // Get current texture view
    const textureView = state.context.getCurrentTexture().createView();

    // Create command encoder
    const commandEncoder = renderer.device.createCommandEncoder();

    // Compute pass
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(state.computePipeline);
    computePass.setBindGroup(0, state.computeBindGroup);
    computePass.dispatchWorkgroups(
        Math.ceil(state.resolutionX / 16),
        Math.ceil(state.resolutionY / 16)
    );
    computePass.end();

    for (const pipeline of renderer.extraPipelines) {
        pipeline.run(commandEncoder);
    }

    // Render pass
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });

    renderPass.setPipeline(state.renderPipeline);
    renderPass.setBindGroup(0, state.renderBindGroup);
    renderPass.draw(3, 1, 0, 0); // Draw one triangle that covers the screen
    renderPass.end();

    // Submit commands
    renderer.queue.submit([commandEncoder.finish()]);
}
