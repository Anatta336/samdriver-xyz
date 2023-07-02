import { Quaternion, Vector3 } from "three";

export default (
    mesh,
    input,
    startPosition = new Vector3()
) => {
    const position = startPosition.clone();
    const velocity = new Vector3();
    const acceleration = new Vector3();
    const rotation = new Quaternion();
    let speed = 40.0;

    let rollInputFactor = 5.0;
    let pitchInputFactor = -4.0;

    return {
        mesh,
        position,
        rotation,
        update,
        getRelativePosition,
    };

    function update(dt) {
        updateFromInput(dt);
        updatePosition(dt);
        updateMesh();
    }

    function updateFromInput(dt) {
        const dx = input.getLeftStickX();
        const dy = input.getLeftStickY();

        const pitchChange = new Quaternion().setFromAxisAngle(
            new Vector3(1, 0, 0),
            dy * dt * pitchInputFactor
        );
        rotation.multiply(pitchChange);

        const rollChange = new Quaternion().setFromAxisAngle(
            new Vector3(0, 0, 1),
            dx * dt * rollInputFactor
        );
        rotation.multiply(rollChange);
    }

    function updatePosition(dt) {
        // Just move forward at constant speed.
        const forward = new Vector3(0, 0, speed * dt);
        forward.applyQuaternion(rotation);

        position.add(forward);
    }

    function updateMesh() {
        mesh.position.copy(position);
        mesh.quaternion.copy(rotation);
    }

    function getRelativePosition(offset = new Vector3(0, 0, -10)) {
        return position.clone().add(offset.clone().applyQuaternion(rotation));
    }
};