import {
    Scene,
    WebGLRenderer,
    EquirectangularReflectionMapping,
    LinearSRGBColorSpace,
    Vector2,
    ACESFilmicToneMapping,
    Clock,
} from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmNoisePass } from './FilmNoisePass.js';

export default (holderElement, cameraObject) => {
    if (!holderElement) {
        throw new Error('No holder element provided');
    }
    if (!cameraObject) {
        throw new Error('No camera object provided');
    }

    const scene = new Scene();
    let renderer = null;
    let composer = null;

    let hdri = null;
    const clock = new Clock();

    let isReadyForMeshes = false;

    const perFrameCallbacks = [];
    const queuedMeshesToAdd = [];
    const meshes = [];

    prepareRenderer();
    loadEnvironmentMap();

    return {
        scene,
        addMesh,
        removeMesh,
        addPerFrame,
    };

    function addMesh(mesh) {

        if (!isReadyForMeshes) {
            queuedMeshesToAdd.push(mesh);
            return;
        }

        addMeshToScene(mesh);
    }

    function removeMesh(mesh) {
        if (queuedMeshesToAdd.includes(mesh)) {
            queuedMeshesToAdd.splice(queuedMeshesToAdd.indexOf(mesh), 1);

            return;
        }

        if (meshes.includes(mesh)) {
            scene.remove(mesh);
            meshes.splice(meshes.indexOf(mesh), 1);

            return;
        }
    }

    function onReadyForMeshes() {
        isReadyForMeshes = true;

        queuedMeshesToAdd.forEach(mesh => {
            addMeshToScene(mesh);
        });

        // Empty the array now they're all added.
        queuedMeshesToAdd.length = 0;
    }

    function addMeshToScene(mesh) {
        scene.add(mesh);
        meshes.push(mesh);
    }

    function perFrame() {
        const dt = clock.getDelta();

        resizeToFit();

        perFrameCallbacks.forEach(callback => {
            callback(dt);
        });

        composer.render();
    }

    function addPerFrame(callback) {
        perFrameCallbacks.push(callback);
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
    
        cameraObject.setAspectRatio(getHolderAspectRatio());
    }

    function prepareRenderer() {
        renderer = new WebGLRenderer({ 
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
        renderer.toneMappingExposure = 1.1;
    
        const renderPass = new RenderPass(scene, cameraObject.camera);
    
        const bloomPass = new UnrealBloomPass(
            new Vector2(holderElement.clientWidth, holderElement.clientHeight),
            7.00, // strength
            0.80, // radius
            0.99, // threshold
        );
    
        const noisePass = new FilmNoisePass(0.00);
    
        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(noisePass);
    
        // Add canvas to DOM.
        holderElement.appendChild(renderer.domElement);

        // Set up to render each frame.
        renderer.setAnimationLoop(perFrame);
    }

    function getHolderAspectRatio() {
        return holderElement.clientWidth / holderElement.clientHeight;
    }

    function loadEnvironmentMap() {
        new RGBELoader().setPath('/article-data/flight-prototype/').loadAsync('fouriesburg_mountain_midday_1k.hdr')
        .then((texture) => {
            texture.mapping = EquirectangularReflectionMapping;
            hdri = texture;

            scene.environment = hdri;
            scene.background = hdri;
            scene.backgroundIntensity = 0.8;
            scene.backgroundBlurriness = 0;

            // TODO: replace at least the displayed background with procedural sky.

            onReadyForMeshes();
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }
};
