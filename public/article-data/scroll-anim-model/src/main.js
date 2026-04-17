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

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

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
    scene.environment = pmrem.fromEquirectangular(hdrTex).texture;
    hdrTex.dispose();
    pmrem.dispose();
});

// Textures
const texLoader = new TextureLoader();

const baseColorTex = texLoader.load(BASE + 'watering_baseColor.png');
baseColorTex.colorSpace = SRGBColorSpace;
const normalTex = texLoader.load(BASE + 'watering_normal.png');
const ormTex = texLoader.load(BASE + 'watering_occlusionRoughnessMetallic.png');

const material = new MeshStandardMaterial({
    map: baseColorTex,
    normalMap: normalTex,
    aoMap: ormTex,
    roughnessMap: ormTex,
    metalnessMap: ormTex,
    roughness: 1.0,
    metalness: 1.0,
    aoMapIntensity: 1.8,
});

// ─── Scroll-driven camera ────────────────────────────────────────────────────

// Scroll positions (in units of window.innerHeight) that activate each section.
// Sections are positioned in the HTML so they enter the viewport at these thresholds.
const SECTION_THRESHOLDS = [0.8, 1.8, 2.8, 3.8];
const LERP_SPEED = 0.05;

let camKeyframes = []; // filled after model loads
const animCamPos = new Vector3();
const animLookAt = new Vector3();
let activeSection = -1;  // -1 = free controls
let controlsLocked = false;

function lockControls(idx) {
    controlsLocked = true;
    controls.enabled = false;
    animCamPos.copy(camKeyframes[idx].pos);
    animLookAt.copy(camKeyframes[idx].target);
}

function unlockControls() {
    controlsLocked = false;
    controls.enabled = true;
    // OrbitControls re-reads camera.position and controls.target on the next
    // update() call, so no snap occurs — the transition back is seamless.
}

window.addEventListener('scroll', () => {
    if (camKeyframes.length === 0) return;

    const scrollVH = window.scrollY / window.innerHeight;
    let newSection = -1;
    for (let i = 0; i < SECTION_THRESHOLDS.length; i++) {
        if (scrollVH >= SECTION_THRESHOLDS[i]) newSection = i;
    }

    if (newSection === -1) {
        if (controlsLocked) unlockControls();
        activeSection = -1;
    } else if (newSection !== activeSection) {
        activeSection = newSection;
        lockControls(newSection);
    }
}, { passive: true });

// ─── Model loading ────────────────────────────────────────────────────────────

let loadedCount = 0;

function setupAfterLoad() {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);
    const r = size.length();

    // Place initial free-zone camera
    const initDir = new Vector3(0.3, 0.4, 1).normalize();
    camera.position.copy(center).addScaledVector(initDir, r * 2.8);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.enableZoom = false;
    controls.update();

    animCamPos.copy(camera.position);
    animLookAt.copy(center);

    // Four scripted camera positions, one per scroll section
    camKeyframes = [
        // 01 — right-front overview
        {
            pos: center.clone().addScaledVector(new Vector3(0.5, 0.3, 0.8).normalize(), r * 2.6),
            target: center.clone(),
        },
        // 02 — above-front, looking at upper body / nozzle
        {
            pos: center.clone().addScaledVector(new Vector3(0.1, 0.75, 0.65).normalize(), r * 1.9),
            target: center.clone().addScaledVector(new Vector3(0, 1, 0), size.y * 0.25),
        },
        // 03 — near top-down
        {
            pos: center.clone().addScaledVector(new Vector3(0.08, 1.0, 0.18).normalize(), r * 2.4),
            target: center.clone(),
        },
        // 04 — left side, showing trigger geometry
        {
            pos: center.clone().addScaledVector(new Vector3(-0.85, 0.2, 0.48).normalize(), r * 2.3),
            target: center.clone(),
        },
    ];
}

function applyMaterialToObj(obj) {
    obj.traverse((child) => {
        if (!child.isMesh) return;
        child.material = material;
        const uv = child.geometry.getAttribute('uv');
        if (uv) child.geometry.setAttribute('uv1', uv);
    });
}

const objLoader = new OBJLoader();

objLoader.load(BASE + 'watering-can.obj', (obj) => {
    applyMaterialToObj(obj);
    scene.add(obj);
    if (++loadedCount === 2) setupAfterLoad();
});

objLoader.load(BASE + 'watering-trigger.obj', (obj) => {
    applyMaterialToObj(obj);
    scene.add(obj);
    if (++loadedCount === 2) setupAfterLoad();
});

// ─── Render loop ──────────────────────────────────────────────────────────────

renderer.setAnimationLoop(() => {
    syncSize();
    if (controlsLocked) {
        camera.position.lerp(animCamPos, LERP_SPEED);
        controls.target.lerp(animLookAt, LERP_SPEED);
        camera.lookAt(controls.target);
    } else {
        controls.update();
    }
    renderer.render(scene, camera);
});
