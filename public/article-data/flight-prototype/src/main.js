import createCamera from './camera.js';
import createScene from './scene.js';
import createPlayerMesh from './playerMesh.js';
import createLandMesh from './landMesh.js';
import { Vector3 } from 'three';

const holderElement = document.getElementById('flight');
const camera = createCamera(holderElement);
const scene = createScene(holderElement, camera);

const landMesh = createLandMesh();
const playerMesh = createPlayerMesh();

scene.addMesh(playerMesh.mesh);
scene.addMesh(landMesh.mesh);

playerMesh.setPosition(new Vector3(0, 20, 0));
camera.pointAt(playerMesh.getPosition());
camera.setPosition(new Vector3(0, 23, -3));
