import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

export function loadTextureAsync(path) {
    const textureLoader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => {
        textureLoader.load(path, resolve, undefined, reject);
    });
}

export function loadGLTFAsync(path) {
    const gltfLoader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        gltfLoader.load(path, resolve, undefined, reject);
    });
}

export function loadEXRAsync(path) {
    const exrLoader = new EXRLoader();
    exrLoader.setDataType(THREE.FloatType);

    return new Promise((resolve, reject) => {
        exrLoader.load(path, resolve, undefined, reject);
    });
}

export function loadAudioAsync(path) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(path);
        audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
        audio.addEventListener("error", reject, { once: true });
    });
}

export async function playTransitionSound(world) {
    if (!world.transitionSound) return;

    try {
        const audio = await loadAudioAsync(world.transitionSound);
        audio.play();

    } catch (err) {
        console.error("Failed to load transition sound:", err);
    }
}

