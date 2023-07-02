import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three";

export default () => {
    
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
    
        const geometry = new PlaneGeometry(1000, 1000)
        geometry.rotateX(-Math.PI / 2);
    
        mesh = new Mesh(geometry, material);
    }
};
