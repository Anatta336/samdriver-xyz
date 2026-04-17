import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    PMREMGenerator,
    TextureLoader,
    MeshStandardMaterial,
    SRGBColorSpace,
    ACESFilmicToneMapping,
    Box3,
    Vector3,
} from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BASE = '/article-data/scroll-anim-model/3d/';

const canvas = document.getElementById('top-canvas');

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.75;

const scene = new Scene();

const camera = new PerspectiveCamera(20, 1, 0.001, 10);
camera.position.set(0, 0.05, 1.4);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;
controls.enablePan = false;

// Resize renderer to match canvas CSS size each frame
function syncSize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
}

// HDRi environment
const pmrem = new PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new HDRLoader().load(BASE + 'pav_studio_03_1k.hdr', (hdrTex) => {
    const envMap = pmrem.fromEquirectangular(hdrTex).texture;
    scene.environment = envMap;
    hdrTex.dispose();
    pmrem.dispose();
});

// Textures
const texLoader = new TextureLoader();

const baseColorTex = texLoader.load(BASE + 'watering_baseColor.png');
baseColorTex.colorSpace = SRGBColorSpace;

const normalTex = texLoader.load(BASE + 'watering_normal.png');

// ORM: occlusion, roughness, metallic
const ormTex = texLoader.load(BASE + 'watering_occlusionRoughnessMetallic.png');

const material = new MeshStandardMaterial({
    map: baseColorTex,
    normalMap: normalTex,
    aoMap: ormTex,
    roughnessMap: ormTex,
    metalnessMap: ormTex,
});
material.roughness = 1.0;
material.metalness = 1.0;
material.aoMapIntensity = 1.0;

// Centre camera on the full scene after both meshes have loaded
let loadedCount = 0;

function centreCameraOnScene() {
    const box = new Box3().setFromObject(scene);
    const centre = new Vector3();
    const size = new Vector3();
    box.getCenter(centre);
    box.getSize(size);

    const distance = size.length() * 3.0;
    camera.position.copy(centre).addScaledVector(new Vector3(0.3, 0.4, 1).normalize(), distance);
    camera.lookAt(centre);
    controls.target.copy(centre);
    controls.update();
}

function applyMaterialToObj(obj) {
    obj.traverse((child) => {
        if (!child.isMesh) return;
        child.material = material;
        // aoMap requires a second UV set; copy uv -> uv1
        const uv = child.geometry.getAttribute('uv');
        if (uv) {
            child.geometry.setAttribute('uv1', uv);
        }
    });
}

const objLoader = new OBJLoader();

objLoader.load(BASE + 'watering-can.obj', (obj) => {
    applyMaterialToObj(obj);
    scene.add(obj);
    loadedCount++;
    if (loadedCount === 2) centreCameraOnScene();
});

objLoader.load(BASE + 'watering-trigger.obj', (obj) => {
    applyMaterialToObj(obj);
    scene.add(obj);
    loadedCount++;
    if (loadedCount === 2) centreCameraOnScene();
});

// Render loop
renderer.setAnimationLoop(() => {
    syncSize();
    controls.update();
    renderer.render(scene, camera);
});
