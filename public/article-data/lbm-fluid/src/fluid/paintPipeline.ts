import Renderer from "../renderer";
import Pipeline from "../webgpu/pipeline";
import shaderCode from "./combine.wgsl?raw";

export interface DrawsCircles {
    drawCircle(x: number, y: number, radius: number, value: number): void;
}

export function createPaintPipeline(
    renderer: Renderer,
    simParamsBuffer: GPUBuffer,
    valuesBuffer: GPUBuffer,
): Pipeline & DrawsCircles {
    if (!renderer.device) {
        throw new Error("Trying to construct PaintPipeline when Renderer doesn't have device yet.");
    }

    const device = renderer.device;

    const userInputBuffer = device.createBuffer({
        size: renderer.resolutionX * renderer.resolutionY * 4, // 4 bytes each for f32.
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
            {
                // UserInput
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'storage' }
            }
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
            {
                binding: 2,
                resource: { buffer: userInputBuffer }
            }
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

    return {
        // run: (commandEncoder: GPUCommandEncoder) => run(commandEncoder, pipeline, bindGroup, renderer),
        run,
        drawCircle: (x: number, y: number, radius: number, value: number) => drawCircle(renderer, userInputBuffer, x, y, radius, value),
    };

    function run(commandEncoder: GPUCommandEncoder): void {
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(
            Math.ceil(renderer.resolutionX / 16),
            Math.ceil(renderer.resolutionY / 16)
        );
        pass.end();
    }
}

function drawCircle(
    renderer: Renderer,
    inputBuffer: GPUBuffer,
    x: number,
    y: number,
    radius: number,
    value: number
) {
    // Create a temporary array to hold our data
    const data = new Float32Array(renderer.resolutionX * renderer.resolutionY);

    // Calculate squared radius for efficiency
    const radiusSquared = radius * radius;

    // For each pixel in a square around the circle
    for (let dy = -radius; dy <= radius; dy++) {
        const py = Math.round(y + dy);
        if (py < 0 || py >= renderer.resolutionY) {
            continue;
        }

        for (let dx = -radius; dx <= radius; dx++) {
            const px = Math.round(x + dx);
            if (px < 0 || px >= renderer.resolutionX) {
                continue;
            }

            // Check if this point is within the circle
            const distSquared = dx * dx + dy * dy;
            if (distSquared <= radiusSquared) {
                // Write the value to our array
                const index = py * renderer.resolutionX + px;
                data[index] = value;
            }
        }
    }

    // Write the data to the GPU buffer
    renderer.queue!.writeBuffer(inputBuffer, 0, data);
}
