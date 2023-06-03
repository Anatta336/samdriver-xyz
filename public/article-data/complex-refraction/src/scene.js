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
    Vector3,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RefractShader } from './refractShader.js';
import { FilmNoisePass } from './FilmNoisePass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default (holderName) => {
    const holderElement = document.getElementById(holderName);

    if (!holderElement) {
        return;
    }

    const scene = new Scene();
    let camera = null;
    let cameraControl = null;
    let renderer = null;
    let composer = null;

    const geometry = {};
    const material = {};
    const mesh = {};
    let hdri = null;

    createCamera();
    prepareRenderer();
    prepareMaterial();
    loadGeometry();
    loadEnvironmentMap();

    function perFrame() {
        resizeToFit();
        cameraControl.update();

        // mesh.rotation.y += 0.003;

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
    
        const renderPass = new RenderPass(scene, camera);
    
        const bloomPass = new UnrealBloomPass(
            new Vector2(holderElement.clientWidth, holderElement.clientHeight),
            9.00, // strength
            0.80, // radius
            0.99, // threshold
        );
    
        const noisePass = new FilmNoisePass(0.04);
    
        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(noisePass);
    
        // Add canvas to DOM.
        holderElement.appendChild(renderer.domElement);

        // Set up to render each frame.
        renderer.setAnimationLoop(perFrame);
    }

    function prepareMaterial() {
        material.bottle = new ShaderMaterial({
            uniforms: {
                envMap: { value: null },
                refractiveIndexOutside: { value: 1.0 },
                refractiveIndexInside: { value: 1.5 },
                aabbExtent: { value: new Vector3(0.07, 0.09, 0.04) },
            },
            vertexShader: RefractShader.vertexShader,
            fragmentShader: RefractShader.fragmentShader,
        });
    }

    function createCamera() {
        camera = new PerspectiveCamera(75, getHolderAspectRatio(), 0.001, 5.00);

        cameraControl = new OrbitControls(camera, holderElement);
        cameraControl.dampingFactor = 0.05;
        cameraControl.maxDistance = 3;
        cameraControl.minDistance = 0.07;

        cameraControl.target.set(0, 0, 0);
        camera.position.set(0, 0, 0.16);
        cameraControl.update();
    }

    function getHolderAspectRatio() {
        return holderElement.clientWidth / holderElement.clientHeight;
    }

    function loadGeometry() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('/article-data/complex-refraction/bottle-external.glb', (gltf) => {
            geometry.bottle = gltf.scene.children[0].geometry;

            mesh.bottle = new Mesh(geometry.bottle, material.bottle);
            scene.add(mesh.bottle);
        });
    }

    function loadEnvironmentMap() {
        new RGBELoader().setPath('/article-data/complex-refraction/').loadAsync('garden_nook_1k.hdr')
        .then((texture) => {
            texture.mapping = EquirectangularReflectionMapping;
            hdri = texture;

            scene.environment = hdri;
            material.bottle.uniforms.envMap.value = hdri.clone();

            scene.background = hdri;
            scene.backgroundIntensity = 0.8;
            scene.backgroundBlurriness = 0;
        })
        .catch((error) => {
            console.error('Error loading HDR.', error);
        });
    }
}