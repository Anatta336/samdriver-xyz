import '../../../css/style.css';
import { createPaintPipeline, DrawsCircles } from './fluid/paintPipeline';
import { createRenderer, Pipeline, Renderer } from './webgpu/renderer';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;
let renderer: Renderer | null = null;
let paintPipeline: (Pipeline & DrawsCircles) | null = null;

init();

async function init() {
    renderer = await createRenderer(canvas);
    if (!renderer) {
        console.error('Failed to create renderer');
        return;
    }

    paintPipeline = createPaintPipeline(renderer, renderer.simParamsBuffer!, renderer.valuesBuffer!);
    renderer.extraPipelines.push(paintPipeline);

    canvas.addEventListener('click', onClick);
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
    if (!renderer) return;
    renderer.render();
    requestAnimationFrame(renderLoop);
}
