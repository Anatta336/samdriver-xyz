// Create a scene
const scene = new THREE.Scene();
const holderElement = document.getElementById('simple-sphere-holder');

let camera = null;
let cameraControl = null;
prepareCamera();

// Create a renderer.
const renderer = new THREE.WebGLRenderer();

// Add renderer to DOM.
holderElement.appendChild(renderer.domElement);

resizeToFit(true);

// Create a cube
const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const material = new THREE.MeshNormalMaterial();
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const hdri = {};
prepareEnvironment();

function prepareEnvironment() {
    console.log('prepareEnvironment');

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    // TODO: none of this works.

    console.log('prepareEnvironment', pmremGenerator)

    const loader = new THREE.TextureLoader();

    console.log('loader:', loader);

    try {
        loader.load('http://netdev.samdriver.xyz/article-data/complex-refraction/garden_nook_1k.hdr',
            // public/article-data/complex-refraction/garden_nook_1k.hdr
        function (texture) {
            console.log('loaded', texture);

            const cubeGenerator = new THREE.EquirectangularToCubeGenerator( texture, { resolution: 512 } );
            const cubeMapTexture = cubeGenerator.renderTarget.texture;

            const envMap = pmremGenerator.fromCubemap(cubeMapTexture).texture;

            // Set the scene's environment map and background to the loaded HDR texture.
            scene.environment = envMap;
            scene.background = envMap;

            console.log(envMap);

            // Clean up the PMREMGenerator and CubeGenerator.
            cubeGenerator.dispose();
            pmremGenerator.dispose();
        },
        function (xhr) {
            console.log('progress', xhr, xhr.status, xhr.statusText, xhr.response, xhr.responseText, xhr.responseURL, xhr.responseType, xhr.responseXML, xhr.timeout, xhr.withCredentials);
        },
        function (xhr) {
            console.error('error', xhr, xhr.status, xhr.statusText, xhr.response, xhr.responseText, xhr.responseURL, xhr.responseType, xhr.responseXML, xhr.timeout, xhr.withCredentials);
        }
        );
    } catch (error) {
        console.error('caught:', error);
    }
    

    console.log('after', loader);
}

function prepareCamera() {
    // Camera with orbit control.

    camera = new THREE.PerspectiveCamera(75,
        holderElement.clientWidth / holderElement.clientHeight,
        0.01, 10);
    camera.position.z = 2.5;

    // cameraControl = new THREE.OrbitControls(camera, holderElement);
    // cameraControl.dampingFactor = 0.05;
    // cameraControl.enableDamping = true;
    // cameraControl.maxDistance = 8;
    // cameraControl.minDistance = 0.2;

    // cameraControl.target.set(0, 0, 0);
    // camera.position.set(0, 0, 0.3);
    // cameraControl.update();
}

renderer.setAnimationLoop(perFrame);

document.addEventListener('resize', () => resizeToFit(true));

function perFrame() {
    resizeToFit();
    // cube.rotation.x += 0.01;
    cube.rotation.y += 0.002;

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

    // Re-render the scene for new size.
    renderer.render(scene, camera);
}