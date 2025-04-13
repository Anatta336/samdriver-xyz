import vertShaderCode from './shaders/quad.vert.wgsl?raw';
import fragShaderCode from './shaders/quad.frag.wgsl?raw';
import computeShaderCode from './shaders/compute.wgsl?raw';
import { SimParams } from './sharedBufferLayouts';
import Observer, { SimpleCallback } from './util/observer';
import Pipeline from './webgpu/pipeline';
import { SimParamsBuffer, ValuesBuffer } from './fluid/bufferInterfaces';

export default class Renderer {
    canvas: HTMLCanvasElement;

    resolutionX: number = 256;
    resolutionY: number = 256;

    // To let others know when the renderer has finished init.
    onReady: Observer<SimpleCallback> = new Observer();

    // API Data Structures
    adapter: GPUAdapter|null|undefined;
    device: GPUDevice|null|undefined;
    queue: GPUQueue|null|undefined;

    // Frame Backings
    context: GPUCanvasContext|null|undefined;
    targetColorView: GPUTextureView|null|undefined;

    // Pipelines
    computePipeline: GPUComputePipeline|null|undefined;
    renderPipeline: GPURenderPipeline|null|undefined;

    // Buffers
    simParamsBuffer: SimParamsBuffer|null|undefined;
    valuesBuffer: ValuesBuffer|null|undefined;

    // Bind Groups
    computeBindGroup: GPUBindGroup|null|undefined;
    renderBindGroup: GPUBindGroup|null|undefined;

    // Simulation state
    time: number = 0;

    extraPipelines = new Array<Pipeline>();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // Start the rendering engine
    async start() {
        if (await this.initializeAPI()) {
            this.resizeBackings();
            await this.initialiseResources();
            this.onReady.notify();
        }
    }

    // Initialize WebGPU
    async initializeAPI(): Promise<boolean> {
        try {
            const entry: GPU = navigator.gpu;
            if (!entry) {
                console.error('WebGPU is not supported');
                return false;
            }

            this.adapter = await entry.requestAdapter();
            this.device = await this.adapter?.requestDevice();
            this.queue = this.device?.queue;
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    async initialiseResources() {
        if (!this.device) {
            console.error('Trying to initialise resources before device.');
            return;
        }

        // Create sim params buffer
        this.simParamsBuffer = this.device.createBuffer({
            size: 3 * 4, // 3 32-bit values
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Create values buffer
        this.valuesBuffer = this.device.createBuffer({
            size: this.resolutionX * this.resolutionY * 4, // f32 values
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        // Create bind group layout for both compute and render
        const bindGroupLayout = this.device.createBindGroupLayout({
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
        const computeModule = this.device.createShaderModule({
            code: computeShaderCode
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: computeModule,
                entryPoint: 'main'
            }
        });

        // Create render pipeline
        const vertModule = this.device.createShaderModule({
            code: vertShaderCode
        });

        const fragModule = this.device.createShaderModule({
            code: fragShaderCode
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({
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
        this.computeBindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.simParamsBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.valuesBuffer }
                }
            ]
        });

        // Compute pass and render pass can share a bind group.
        this.renderBindGroup = this.computeBindGroup;
    }

    resizeBackings() {
        if (!this.device || !this.canvas) return;

        if (!this.context) {
            this.context = this.canvas.getContext('webgpu');
            if (!this.context) {
                console.error('Failed to get WebGPU context.');
                return;
            }

            const canvasConfig: GPUCanvasConfiguration = {
                device: this.device,
                format: 'bgra8unorm',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
                alphaMode: 'premultiplied'
            };
            this.context.configure(canvasConfig);
        }
    }

    render() {
        if (!this.device || !this.context || !this.queue
            || !this.computePipeline || !this.renderPipeline
            || !this.computeBindGroup || !this.renderBindGroup
            || !this.simParamsBuffer
        ) {
            console.error('Renderer not fully initialized.');
            return;
        }

        // Update simulation parameters
        const simParams: SimParams = {
            width: this.resolutionX,
            height: this.resolutionY,
            time: this.time
        };
        // this.time += 0.016; // Assuming ~60fps

        // Width and height are u32.
        this.queue.writeBuffer(
            this.simParamsBuffer,
            0,
            new Uint32Array([simParams.width, simParams.height]),
        );
        // Time is f32, offset after the previous 2x u32 values.
        this.queue.writeBuffer(
            this.simParamsBuffer,
            2 * 4,
            new Float32Array([simParams.time])
        );

        // Get current texture view
        const textureView = this.context.getCurrentTexture().createView();

        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();

        // Compute pass
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroup);
        computePass.dispatchWorkgroups(
            Math.ceil(this.resolutionX / 16),
            Math.ceil(this.resolutionY / 16)
        );
        computePass.end();

        for (const pipeline of this.extraPipelines) {
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

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.draw(3, 1, 0, 0); // Draw one triangle that covers the screen
        renderPass.end();

        // Submit commands
        this.queue.submit([commandEncoder.finish()]);
    };
}
