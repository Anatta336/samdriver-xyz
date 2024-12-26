import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three";

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
        const geometry = new PlaneGeometry(1000, 1000, 100, 100)
        geometry.rotateX(-Math.PI / 2);

        const vertices = geometry.attributes.position.array;
        for (let i = 1; i < vertices.length; i += 3) {
            vertices[i] = (Math.random() - 0.5) * 2.0;
        }

        geometry.computeVertexNormals();

        mesh = new Mesh(geometry, material);
    }
};
