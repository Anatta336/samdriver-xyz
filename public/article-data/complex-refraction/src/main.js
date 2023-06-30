import scene from "./scene";
import padInput from "./padInput";
import cursorInput from "./cursorInput";

let simpleScene = scene('simple-cube');

let pad = padInput();
let cursor = cursorInput();
let timeOfLastInput = 0.0;

simpleScene.addCallback(dt => {
    const now = performance.now();
    handleInput(now, dt);
});

function handleInput(now, dt) {
    if (!simpleScene.mesh.bottle) {
        // No use handling input yet.
        return;
    }

    const dx = pad.getLeftStickX() + cursor.getHorizontal() * 0.4;
    const dy = pad.getLeftStickY() + cursor.getVertical() * 0.4;

    if (dx || dy) {
        timeOfLastInput = now;
        simpleScene.mesh.bottle.rotation.y += dt * dx * 4.0;
        simpleScene.mesh.bottle.rotation.z += dt * dy * 4.0;
    }

    simpleScene.mesh.bottle.rotation.x = -0.2;
        
    // if (timeOfLastInput + 3000.0 < now) {
    //     // Auto-rotate.
    //     simpleScene.mesh.bottle.rotation.y += 0.3 * dt;
    // }
}
