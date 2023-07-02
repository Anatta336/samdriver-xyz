import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default (holderElement,
    fieldOfViewDegrees = 75,
    zNear = 0.1, zFar = 500.0,
    minDistance = 3.0, maxDistance = 10.0
) => {

    let cameraControl = null;
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

        cameraControl = new OrbitControls(camera, holderElement);
        cameraControl.dampingFactor = 0.05;
        cameraControl.maxDistance = minDistance;
        cameraControl.minDistance = maxDistance;
    
        cameraControl.target.set(0, 0, 0);
        camera.position.set(0, 5.0, -3.0);
        cameraControl.update();
    }

    function update(dt) {
        cameraControl.update();
    }

    function setAspectRatio(ratio) {
        camera.aspect = ratio;
        camera.updateProjectionMatrix();
    }

    function pointAt(position = new Vector3()) {        
        cameraControl.target.copy(position);
        cameraControl.update();
    }

    function getPosition(provideClone = true) {
        if (provideClone) {
            return camera.position.clone();
        }

        return camera.position;
    }

    function setPosition(position = new Vector3()) {
        camera.position.copy(position);
        cameraControl.update();
    }
};
