import { BoxGeometry,
    Mesh,
    MeshStandardMaterial,
    Vector3
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export default () => {
    let mesh = null;

    prepareMesh();

    return {
        mesh,
        setPosition,
        getPosition,
        // Rather than implementing a bunch of setRotation, etc., just use mesh directly.
    };

    function prepareMesh() {
        const material = new MeshStandardMaterial({
            color: 0xcc7ee5,
            metalness: 0.0,
            roughness: 0.5,
        });
    
        const wings = new BoxGeometry(12.0, 0.2, 1.6);
        const body = new BoxGeometry(1.0, 1.0, 6.0);

        const geometry = mergeGeometries([wings, body]);
    
        mesh = new Mesh(geometry, material);
    }

    function setPosition(position = new Vector3()) {
        mesh.position.copy(position);
    }
    
    function getPosition(provideClone = true) {
        if (provideClone) {
            return mesh.position.clone();
        }

        return mesh.position;
    }
};
