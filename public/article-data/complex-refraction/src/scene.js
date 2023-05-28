import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    TorusKnotGeometry,
    Mesh,
    EquirectangularReflectionMapping,
    MeshStandardMaterial,
    LinearSRGBColorSpace,
    ReinhardToneMapping,
    Vector2,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default (holderName) => {
    const holderElement = document.getElementById(holderName);

    if (!holderElement) {
        return;
    }

    const scene = new Scene();

    let camera = null;
    let cameraControl = null;
    createCamera();

    const renderer = new WebGLRenderer({ 
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        stencil: false,
    });
    renderer.alpha = true;
    renderer.setClearColor(0x000000, 0);

    renderer.setSize(holderElement.clientWidth, holderElement.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    scene.background = null;

    // Leave in linear space, to use as input for the bloom pass.
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.toneMapping = ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;

    const renderPass = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
        new Vector2(holderElement.clientWidth, holderElement.clientHeight),
        8.00, // strength
        0.40, // radius
        0.95  // threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // add to DOM.
    holderElement.appendChild(renderer.domElement);

    const geometry = new TorusKnotGeometry();
    const material = new MeshStandardMaterial({
        color: 0xa0ff50,
        metalness: 0.95,
        roughness: 0.2,
    });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let hdri = null;
    loadEnvironmentMap();

    renderer.setAnimationLoop(perFrame);

    function perFrame() {
        resizeToFit();
        cameraControl.update();
        composer.render();
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
    
        camera.aspect = getHolderAspectRatio();
        camera.updateProjectionMatrix();
    }

    function createCamera() {
        camera = new PerspectiveCamera(75, getHolderAspectRatio(), 0.05, 10);

        cameraControl = new OrbitControls(camera, holderElement);
        cameraControl.dampingFactor = 0.05;
        cameraControl.maxDistance = 8;
        cameraControl.minDistance = 0.2;

        cameraControl.target.set(0, 0, 0);
        camera.position.set(0, 0, 4);
        cameraControl.update();
    }

    function getHolderAspectRatio() {
        return holderElement.clientWidth / holderElement.clientHeight;
    }

    function loadEnvironmentMap() {
        new RGBELoader().setPath('/article-data/complex-refraction/').loadAsync('garden_nook_1k.hdr')
        .then((texture) => {
            texture.mapping = EquirectangularReflectionMapping;
            hdri = texture;

            scene.environment = hdri;
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }
}