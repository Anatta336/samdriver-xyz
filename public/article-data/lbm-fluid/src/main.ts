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
