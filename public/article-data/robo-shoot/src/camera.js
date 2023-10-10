import { PerspectiveCamera, Vector3 } from "three";

/**
 * @typedef {import('three').PerspectiveCamera} PerspectiveCamera
 * @typedef {import('three').Vector3} Vector3
 */

/**
 * @typedef {Object} Camera
 * @property {PerspectiveCamera} camera
 * @property {function(): void} update
 * @property {function(number): void} setAspectRatio
 * @property {function(Vector3): void} pointAt
 * @property {function(boolean): Vector3} getPosition
 * @property {function(Vector3): void} setPosition
 */

/**
 * @param {HTMLElement} holderElement
 * @param {number} fieldOfViewDegrees
 * @param {number} zNear
 * @param {number} zFar
 * @param {Vector3} initialPosition
 *
 * @returns {Camera}
 */
export default (holderElement,
    fieldOfViewDegrees = 75,
    zNear = 0.1, zFar = 500.0,
    initialPosition = new Vector3(0, 5.0, 0)
) => {

    /** @type {PerspectiveCamera} */
    let camera = null;
    prepareCamera();

    return {
        camera,
        update,
        setAspectRatio,
        pointAt,
        getPosition,
        setPosition,
    };

    function prepareCamera() {
        camera = new PerspectiveCamera(fieldOfViewDegrees, 1.0, zNear, zFar);
        camera.position.copy(initialPosition);
    }

    function update(dt) {
        // TODO?
    }

    function setAspectRatio(ratio) {
        camera.aspect = ratio;
        camera.updateProjectionMatrix();
    }

    function pointAt(position = new Vector3()) {
        camera.lookAt(position);
    }

    function getPosition(provideClone = true) {
        if (provideClone) {
            return camera.position.clone();
        }

        return camera.position;
    }

    function setPosition(position = new Vector3()) {
        camera.position.copy(position);
    }
};
