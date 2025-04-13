import '../../../css/style.css';
import Renderer from './renderer';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;

const renderer = new Renderer(canvas);
renderer.start();

// Set up render loop
function renderLoop() {
    renderer.render();
    requestAnimationFrame(renderLoop);
}

renderer.onReady.addCallback(() => {
    requestAnimationFrame(renderLoop);
});

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const xOnElement = event.clientX - rect.left;
    const yOnElement = event.clientY - rect.top;

    const x = Math.floor((xOnElement / canvas.width) * renderer.width);
    const y = Math.floor((yOnElement / canvas.height) * renderer.height);

    renderer.drawCircle(x, y, 20.5, 1);
});
