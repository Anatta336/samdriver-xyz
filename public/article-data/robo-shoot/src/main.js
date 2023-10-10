import createCamera from './camera.js';
import createScene from './scene.js';
import createPlayerMesh from './playerMesh.js';
import createLandMesh from './landMesh.js';
import createPlayer from './player.js';
import createInput from './input.js';
import { Vector3 } from 'three';

/**
 * @typedef {import('./camera.js').Camera} Camera
 * @typedef {import('./playerMesh.js').PlayerMesh} PlayerMesh
 * @typedef {import('./input.js').Input} Input
 * @typedef {import('./scene.js').SceneWrapper} SceneWrapper
 * @typedef {import('./landMesh.js').LandMesh} LandMesh
 * @typedef {import('./player.js').Player} Player
 */

const holderElement = document.getElementById('game');
const camera = createCamera(holderElement);
const scene = createScene(holderElement, camera);
const landMeshWrapper = createLandMesh();
const playerMeshWrapper = createPlayerMesh();

const input = createInput();
const player = createPlayer(playerMeshWrapper.mesh, input, new Vector3(0, 3, 0));
const chaseAbsoluteOffset = new Vector3(0, 8.0, 0.0);

scene.addMesh(playerMeshWrapper.mesh);
scene.addMesh(landMeshWrapper.mesh);

scene.addPerFrame(update);

/**
 * @param {number} dt
 * @returns {void}
 */
function update(dt) {

    player.update(dt);

    camera.setPosition(player.position.clone().add(chaseAbsoluteOffset));
    camera.pointAt(player.position.clone());

    camera.update(dt);
}
