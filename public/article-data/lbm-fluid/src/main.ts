import '../../../css/style.css';
import { createDrawPipeline } from './fluid/drawPipeline';
import { createPaintPipeline, DrawsCircles } from './fluid/paintPipeline';
import { createSimParamsPipeline, ProvidesSimParamsBuffer } from './fluid/simParams';
import { createSimulatePipeline, ProvidesValuesBuffer } from './fluid/simulatePipeline';
import { createRenderer, Pipeline, Renderer } from './webgpu/renderer';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;
const resetButton = document.getElementById('reset') as HTMLButtonElement;
let renderer: Renderer | null = null;
let simParamsPipeline: (Pipeline & ProvidesSimParamsBuffer) | null = null;
let simulatePipeline: (Pipeline & ProvidesValuesBuffer) | null = null;
let paintPipeline: (Pipeline & DrawsCircles) | null = null;
let drawPipeline: Pipeline | null = null;

init();

async function init() {
    renderer = await createRenderer(canvas, 500, 500);
    if (!renderer) {
        console.error('Failed to create renderer');
        return;
    }

    simParamsPipeline = createSimParamsPipeline(
        renderer
    );
    simulatePipeline = createSimulatePipeline(
        renderer,
        simParamsPipeline.getSimParamsBuffer()
    );
    paintPipeline = createPaintPipeline(
        renderer,
        simParamsPipeline.getSimParamsBuffer(),
        simulatePipeline.getValuesBuffer()
    );
    drawPipeline = createDrawPipeline(
        renderer,
        simParamsPipeline.getSimParamsBuffer(),
        simulatePipeline.getValuesBuffer(),
    );

    renderer.addPipelines([
        simParamsPipeline,
        simulatePipeline,
        paintPipeline,
        drawPipeline,
    ]);

    canvas.addEventListener('click', onClick);
    resetButton.addEventListener('click', () => {
        if (simulatePipeline) {
            simulatePipeline.resetSimulation();
            console.log("Simulation reset");
        }
    });
    requestAnimationFrame(renderLoop);
}

function onClick(event: MouseEvent) {
    if (!paintPipeline || !renderer) {
        console.warn("Click before initialization is complete");
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const xOnElement = event.clientX - rect.left;
    const yOnElement = event.clientY - rect.top;

    const [resolutionX, resolutionY] = renderer.getResolution();
    const x = Math.round((xOnElement / canvas.width) * resolutionX);
    const y = Math.round((yOnElement / canvas.height) * resolutionY);

    paintPipeline.drawCircle(x, y, 20.5, 1);
}

function renderLoop() {
    if (!renderer) {
        return;
    }

    // TODO: calculate real delta time, with cap.
    const dt = 0.016;
    renderer.render(dt);

    requestAnimationFrame(renderLoop);
}
