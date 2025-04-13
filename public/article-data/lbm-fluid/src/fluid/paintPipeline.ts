import Renderer from "../renderer";
import Pipeline from "../webgpu/pipeline";
import shaderCode from "./combine.wgsl?raw";

export default class PaintPipeline implements Pipeline {
    #renderer: Renderer;

    #simParamsBuffer: GPUBuffer;
    #valuesBuffer: GPUBuffer;
    #userInputBuffer: GPUBuffer;

    #bindGroupLayout: GPUBindGroupLayout;
    #bindGroup: GPUBindGroup;
    #shaderModule: GPUShaderModule;
    #pipeline: GPUComputePipeline;

    constructor(
        renderer: Renderer,
        simParamsBuffer: GPUBuffer,
        valuesBuffer: GPUBuffer,
    ) {
        this.#renderer = renderer;
        this.#simParamsBuffer = simParamsBuffer;
        this.#valuesBuffer = valuesBuffer;

        if (!renderer.device) {
            throw new Error("Trying to construct AddPipeline when Renderer doesn't have device yet.");
        }

        const device = renderer.device;

        this.#userInputBuffer = device.createBuffer({
            size: this.#renderer.resolutionX * this.#renderer.resolutionY * 4, // 4 bytes each for f32.
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        this.#bindGroupLayout = device.createBindGroupLayout({
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
                {
                    // UserInput
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' }
                }
            ]
        });

        this.#bindGroup = device.createBindGroup({
            layout: this.#bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.#simParamsBuffer }
                },
                {
                    binding: 1,
                    resource: { buffer: this.#valuesBuffer }
                },
                {
                    binding: 2,
                    resource: { buffer: this.#userInputBuffer }
                }
            ]
        });

        this.#shaderModule = device.createShaderModule({
            code: shaderCode
        });

        this.#pipeline = device.createComputePipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: [this.#bindGroupLayout]
            }),
            compute: {
                module: this.#shaderModule,
                entryPoint: 'main'
            }
        });
    }

    run(commandEncoder: GPUCommandEncoder): void{
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.#pipeline);
        pass.setBindGroup(0, this.#bindGroup);
        pass.dispatchWorkgroups(
            Math.ceil(this.#renderer.resolutionX / 16),
            Math.ceil(this.#renderer.resolutionY / 16)
        );
        pass.end();
    }

    drawCircle(x: number, y: number, radius: number, value: number) {
        if (!this.#renderer.queue) {
            throw new Error("Trying to draw circle when Renderer doesn't have queue yet.");
        }

        // TODO: rather than immediately queueing to write to buffer, that should
        // be done as part of the `run` method. That way we can handle multiple
        // inputs in a single pass.

        // Create a temporary array to hold our data
        const data = new Float32Array(this.#renderer.resolutionX * this.#renderer.resolutionY);

        // Calculate squared radius for efficiency
        const radiusSquared = radius * radius;

        // For each pixel in a square around the circle
        for (let dy = -radius; dy <= radius; dy++) {
            const py = Math.round(y + dy);
            if (py < 0 || py >= this.#renderer.resolutionY) {
                continue;
            }

            for (let dx = -radius; dx <= radius; dx++) {
                const px = Math.round(x + dx);
                if (px < 0 || px >= this.#renderer.resolutionX) {
                    continue;
                }

                // Check if this point is within the circle
                const distSquared = dx * dx + dy * dy;
                if (distSquared <= radiusSquared) {
                    // Write the value to our array
                    const index = py * this.#renderer.resolutionX + px;
                    data[index] = value;
                }
            }
        }

        // Write the data to the GPU buffer
        this.#renderer.queue!.writeBuffer(this.#userInputBuffer, 0, data);
    }
};