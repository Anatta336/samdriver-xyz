import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three";

/**
 * @typedef {Object} LandMesh
 * @property {Mesh} mesh
 */

/**
 * @returns {LandMesh}
 */
export default () => {

    /**
     * @type {Mesh}
     */
    let mesh = null;

    prepareMesh();

    return {
        mesh,
    };

    function prepareMesh() {
        const material = new MeshStandardMaterial({
            color: 0xcc8f3d,
            metalness: 0.0,
            roughness: 0.9,
        });

        // Create a non-flat surface to give some texture.
        const geometry = new PlaneGeometry(50, 50, 100, 100)
        geometry.rotateX(-Math.PI / 2);

        const vertices = geometry.attributes.position.array;
        for (let i = 1; i < vertices.length; i += 3) {
            vertices[i] = (Math.random() - 0.5) * 0.8;
        }

        geometry.computeVertexNormals();

        mesh = new Mesh(geometry, material);
    }
};
