import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { ASSET_CONFIG } from './constants.js';

// Retry configuration from constants
const RETRY_ATTEMPTS = ASSET_CONFIG.RETRY_ATTEMPTS;
const RETRY_DELAY = ASSET_CONFIG.RETRY_DELAY;
const ASSET_TIMEOUT = ASSET_CONFIG.ASSET_TIMEOUT;

// Track queued audio for autoplay policy
let queuedAudio = null;
let audioUnlocked = false;

// Loading progress tracking
let totalAssets = 0;
let loadedAssets = 0;

export function updateLoadingProgress() {
    if (totalAssets === 0) return;

    const percentage = Math.round((loadedAssets / totalAssets) * 100);
    const progressBar = document.getElementById('loadingProgress');
    const progressText = document.getElementById('loadingPercentage');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
}

export function initLoadingProgress(total) {
    totalAssets = total;
    loadedAssets = 0;
    updateLoadingProgress();
}

export function incrementLoadingProgress() {
    loadedAssets++;
    updateLoadingProgress();
}

// Helper function to retry async operations
async function retryWithBackoff(fn, attempts = RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = i === attempts - 1;
            if (isLastAttempt) throw error;

            const delay = RETRY_DELAY * Math.pow(2, i); // Exponential backoff
            console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Helper function to add timeout to promises
function withTimeout(promise, timeoutMs = ASSET_TIMEOUT) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

export function loadTextureAsync(path) {
    return retryWithBackoff(async () => {
        const textureLoader = new THREE.TextureLoader();
        return withTimeout(new Promise((resolve, reject) => {
            textureLoader.load(path, resolve, undefined, reject);
        }));
    });
}

export function loadGLTFAsync(path) {
    return retryWithBackoff(async () => {
        const gltfLoader = new GLTFLoader();
        return withTimeout(new Promise((resolve, reject) => {
            gltfLoader.load(path, resolve, undefined, reject);
        }));
    });
}

export function loadEXRAsync(path) {
    return retryWithBackoff(async () => {
        const exrLoader = new EXRLoader();
        exrLoader.setDataType(THREE.FloatType);
        return withTimeout(new Promise((resolve, reject) => {
            exrLoader.load(path, resolve, undefined, reject);
        }));
    });
}

export function loadAudioAsync(path) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(path);
        const timeout = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
        }, ASSET_CONFIG.AUDIO_TIMEOUT);

        audio.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve(audio);
        }, { once: true });

        audio.addEventListener("error", (err) => {
            clearTimeout(timeout);
            reject(err);
        }, { once: true });
    });
}

// Unlock audio on first user interaction
export function unlockAudio() {
    if (audioUnlocked) return;

    const unlock = () => {
        audioUnlocked = true;

        // Play queued audio if any
        if (queuedAudio) {
            queuedAudio.play().catch(err => {
                console.warn('Queued audio still blocked:', err);
            });
            queuedAudio = null;
        }

        // Remove listeners
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
}

export async function playTransitionSound(world) {
    if (!world.transitionSound) return;

    try {
        const audio = await loadAudioAsync(world.transitionSound);

        // Attempt to play with autoplay policy handling
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(err => {
                if (err.name === 'NotAllowedError') {
                    console.warn('Audio blocked by browser autoplay policy - will play after user interaction');
                    queuedAudio = audio;
                    unlockAudio();
                } else {
                    console.error('Failed to play transition sound:', err);
                }
            });
        }

    } catch (err) {
        console.error("Failed to load transition sound:", err);
    }
}

