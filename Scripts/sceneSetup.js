import * as THREE from 'three';

const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();

// Window size setup
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Camera Aspect Ratio
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 5000);
camera.position.set(0, 0, -15);
camera.lookAt(0, 0, 0);
scene.add(camera);

//Make it responsive by listening to screen changes
window.addEventListener('resize', ()=>{
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    //Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    //Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xFFE6EE, 6); // General brightness
const directionalLight = new THREE.DirectionalLight(0xffffff, .3);
scene.add(ambientLight);
scene.add(directionalLight);

//PMREM Generator for EXRs
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

export { scene, camera, renderer, ambientLight, directionalLight, pmremGenerator };



