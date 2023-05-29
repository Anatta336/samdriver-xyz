import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    EquirectangularReflectionMapping,
    LinearSRGBColorSpace,
    Vector2,
    ACESFilmicToneMapping,
    ShaderMaterial,
    BoxGeometry,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RefractShader } from './refractShader.js';

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

    // Linear space for good bloom and tonemapping results.
    renderer.outputColorSpace = LinearSRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const renderPass = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
        new Vector2(holderElement.clientWidth, holderElement.clientHeight),
        9.00, // strength
        0.80, // radius
        0.90, // threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // add to DOM.
    holderElement.appendChild(renderer.domElement);

    const geometry = new BoxGeometry(0.07, 0.09, 0.03);
    const material = new ShaderMaterial({
        uniforms: {
            envMap: { value: null },
            refractiveRatio: { value: 0.8 },
        },
        vertexShader: RefractShader.vertexShader,
        fragmentShader: RefractShader.fragmentShader,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let hdri = null;
    loadEnvironmentMap();

    renderer.setAnimationLoop(perFrame);

    function perFrame() {
        resizeToFit();
        cameraControl.update();

        mesh.rotation.y += 0.003;

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
        camera = new PerspectiveCamera(75, getHolderAspectRatio(), 0.001, 5.00);

        cameraControl = new OrbitControls(camera, holderElement);
        cameraControl.dampingFactor = 0.05;
        cameraControl.maxDistance = 3;
        cameraControl.minDistance = 0.07;

        cameraControl.target.set(0, 0, 0);
        camera.position.set(0, 0, 0.5);
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
            mesh.material.uniforms.envMap.value = hdri.clone();

            scene.background = hdri;
            scene.backgroundIntensity = 0.5;
            scene.backgroundBlurriness = 0;
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }
}