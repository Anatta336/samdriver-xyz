import createCamera from './camera.js';
import createScene from './scene.js';
import createPlayerMesh from './playerMesh.js';
import createLandMesh from './landMesh.js';
import createPlayer from './player.js';
import createInput from './input.js';
import { Vector3 } from 'three';

const holderElement = document.getElementById('flight');
const camera = createCamera(holderElement);
const scene = createScene(holderElement, camera);
const landMeshWrapper = createLandMesh();
const playerMeshWrapper = createPlayerMesh();

const input = createInput();
const player = createPlayer(playerMeshWrapper.mesh, input, new Vector3(0, 50, 0));
const chaseRelativeOffset = new Vector3(0, 0, -5.0);
const chaseAbsoluteOffset = new Vector3(0, 2.0, 0);

scene.addMesh(playerMeshWrapper.mesh);
scene.addMesh(landMeshWrapper.mesh);

scene.addPerFrame(update);

function update(dt) {
    player.update(dt);

    camera.setPosition(player.getRelativePosition(chaseRelativeOffset).add(chaseAbsoluteOffset));
    camera.pointAt(player.position);
    camera.update(dt);
}