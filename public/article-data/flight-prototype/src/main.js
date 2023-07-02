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
const player = createPlayer(playerMeshWrapper.mesh, input, new Vector3(0, 40, 0));

scene.addMesh(playerMeshWrapper.mesh);
scene.addMesh(landMeshWrapper.mesh);

camera.pointAt(player.position);
camera.setPosition(player.position.clone().add(new Vector3(0, 0, -3)));

scene.addPerFrame(update);

function update(dt) {
    player.update(dt);
    camera.update(dt);
}