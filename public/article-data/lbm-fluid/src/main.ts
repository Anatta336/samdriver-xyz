import '../../../css/style.css'; // TODO: will not need this when displayed on site.
import Renderer from './renderer';
import CanvasSizer from './util/webgpu/canvasSizer';
import SquareGenerator, { GeneratorResult } from './squareGenerator';
import { createInputHandler } from './input/input';
import WASDCamera from './camera/wasd';
import { vec3 } from 'wgpu-matrix';

console.log("Hello, world!");

const container = document.getElementById('gfx-container') as HTMLElement;
const canvas = document.getElementById('gfx') as HTMLCanvasElement;

const camera = new WASDCamera({
    position: vec3.fromValues(-5, 0, -1),
    target: vec3.fromValues(0, 0, 0),
});

const renderer = new Renderer(canvas, camera);
renderer.start();

const sizer = new CanvasSizer(canvas, container, renderer);
sizer.start();

const inputHandler = createInputHandler(window, canvas);

// Set up game loop, now that all the elements are declared.
let lastFrameTime = Date.now();
renderer.onReady.addCallback(() => {
    lastFrameTime = Date.now();
    requestAnimationFrame(gameLoop);
});

// Warm up the camera.
camera.update(0, inputHandler());

function gameLoop() {
    const now = Date.now();
    const deltatime = (now - lastFrameTime) * 0.001;
    lastFrameTime = now;

    const inputThisFrame = inputHandler();

    camera.update(deltatime, inputThisFrame);

    renderer.render();

    requestAnimationFrame(gameLoop);
}

document.getElementById('generate-button')?.addEventListener('click', () => {
    console.log('Generate button clicked.');

    if (!renderer?.device || !renderer?.queue) {
        console.log('Renderer not ready yet.');
        return;
    }

    const generator = new SquareGenerator(renderer.device, renderer.queue);

    generator.start().then((result: GeneratorResult) => {
        renderer.copyInMeshBuffers(
            result.vertexBuffer,
            result.indexBuffer,
            result.indexCount
        );
    });
});
