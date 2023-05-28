import * as THREE from 'three';

export default (holderName) => {
    const holderElement = document.getElementById(holderName);

    if (!holderElement) {
        return;
    }

    function getHolderAspectRatio() {
        return holderElement.clientWidth / holderElement.clientHeight;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, getHolderAspectRatio(), 0.05, 10);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(holderElement.clientWidth, holderElement.clientHeight);
    holderElement.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xa0ff50 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    renderer.setAnimationLoop(perFrame);

    function perFrame() {
        resizeToFit();

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    function resizeToFit(forceResize = false) {
        const width = holderElement.clientWidth;
        const height = holderElement.clientHeight;
    
        const needsResize = forceResize
            || renderer.domElement.width !== width
            || renderer.domElement.height !== height;
    
        if (!needsResize) {
            return;
        }
    
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(window.devicePixelRatio);
    
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
};
