import { Quaternion, Vector3 } from "three";

/**
 * @typedef {import('./playerMesh.js').PlayerMesh} PlayerMesh
 * @typedef {import('./input.js').Input} Input
 *
 * @typedef {Object} Player
 * @property {PlayerMesh} mesh
 * @property {Vector3} position
 * @property {Quaternion} rotation
 * @property {function(dt: number): void} update
 * @property {function(offset: Vector3): Vector3} getRelativePosition
 */

/**
 * @param {PlayerMesh} mesh
 * @param {Input} input
 * @param {Vector3} startPosition
 * @returns {Player}
 */
export default (
    mesh,
    input,
    startPosition = new Vector3()
) => {
    const position = startPosition.clone();
    const rotation = new Quaternion();
    let speed = 40.0;

    return {
        mesh,
        position,
        rotation,
        update,
        getRelativePosition,
    };

    function update(dt) {
        updateFromInput(dt);
        updateMesh();
    }

    function updateFromInput(dt) {
        const dx = input.getLeftStickX();
        const dy = input.getLeftStickY();

        position.z += dy * dt * speed;
        position.x += dx * dt * speed;
    }

    function updateMesh() {
        mesh.position.copy(position);
        mesh.quaternion.copy(rotation);
    }

    function getRelativePosition(offset = new Vector3(0, 0, 0)) {
        return position.clone().add(offset.clone().applyQuaternion(rotation));
    }
};
