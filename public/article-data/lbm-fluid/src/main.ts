import '../../../css/style.css';
import PaintPipeline from './fluid/paintPipeline';
import Renderer from './renderer';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
let paintPipeline = null as PaintPipeline|null;
renderer.start();

renderer.onReady.addCallback(() => {
    // TODO: the buffers will not be members of the renderer, instead provided by their own pipeline(s).

    paintPipeline = new PaintPipeline(renderer, renderer.simParamsBuffer!, renderer.valuesBuffer!);
    renderer.extraPipelines.push(paintPipeline);

    canvas.addEventListener('click', onClick);
    requestAnimationFrame(renderLoop);
});

function onClick(event: MouseEvent) {
    if (!paintPipeline) {
        console.warn("Click before AddPipeline is initialized");
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const xOnElement = event.clientX - rect.left;
    const yOnElement = event.clientY - rect.top;

    const x = Math.round((xOnElement / canvas.width) * renderer.resolutionX);
    const y = Math.round((yOnElement / canvas.height) * renderer.resolutionY);

    paintPipeline.drawCircle(x, y, 20.5, 1);
}

function renderLoop() {
    renderer.render();
    requestAnimationFrame(renderLoop);
}
