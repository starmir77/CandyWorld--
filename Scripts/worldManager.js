import * as THREE from 'three';

import { scene, camera, pmremGenerator } from './sceneSetup.js';
import gameState from './gameState.js';
import { startSpawning, stopSpawning } from './candySpawner.js';
import { worlds } from './world.js';
import { hideInterface, showInstructions, showScorePanel, showErrorMessage } from './uiManager.js';
import { loadTextureAsync, loadGLTFAsync, playTransitionSound, loadEXRAsync, initLoadingProgress, incrementLoadingProgress } from './assetLoader.js';
import { GAME_CONFIG, VISUAL_CONFIG } from './constants.js';


export let currentClickSound = null;

// Cache for preloaded candy models
const candyModelCache = {};

// Preload all candy models during initial load
export async function preloadCandyModels() {
    const loadPromises = [];

    for (const worldName in worlds) {
        const world = worlds[worldName];
        const promise = loadGLTFAsync(world.model)
            .then(gltf => {
                const candyModel = gltf.scene;

                // Fix chocolate world shading
                if (world.name === "Chocoworld") {
                    candyModel.traverse(child => {
                        if (child.isMesh) {
                            child.geometry.computeVertexNormals();
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x8b4513,
                                metalness: 0.3,
                                roughness: 0.6,
                            });
                        }
                    });
                }

                candyModel.scale.copy(world.scale);
                candyModel.rotation.copy(world.rotation);

                // Cache the model
                candyModelCache[worldName] = candyModel;
                incrementLoadingProgress();
            })
            .catch(error => {
                console.error(`Failed to preload candy model for ${worldName}:`, error);
                // Create fallback
                const fallbackGeometry = new THREE.SphereGeometry(0.5, 16, 16);
                const fallbackMaterial = new THREE.MeshStandardMaterial({
                    color: world.color,
                    emissive: world.emissive,
                    emissiveIntensity: 0.5
                });
                const fallbackModel = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
                fallbackModel.scale.copy(world.scale);
                fallbackModel.rotation.copy(world.rotation);
                candyModelCache[worldName] = fallbackModel;
                incrementLoadingProgress();
            });
        loadPromises.push(promise);
    }

    try {
        await Promise.all(loadPromises);
        console.log("All candy models preloaded");
    } catch (error) {
        console.error("Error preloading candy models:", error);
    }
}

function removeOldSkyDome() {
    const oldDome = scene.getObjectByName('interiorSky');
    if (oldDome) scene.remove(oldDome);
}

function addNewSkyDome(world, worldPosition) {
    const skyMaterial = skyboxMaterials[world.name];
    if (skyMaterial) {
        const skyGeo = new THREE.SphereGeometry(world.interiorSky.radius, 60, 40);
        const skyDome = new THREE.Mesh(skyGeo, skyMaterial);
        skyDome.name = "interiorSky";
        skyDome.position.copy(worldPosition);
        scene.add(skyDome);
    }
}

async function loadCandyModel(world, worldPosition) {
    // Use preloaded model from cache
    const candyModel = candyModelCache[world.name];

    if (!candyModel) {
        console.error(`Candy model for ${world.name} not found in cache!`);
        return;
    }

    // Load click sound
    if (world.clickSound) {
        currentClickSound = new Audio(world.clickSound);
    }

    startSpawning(candyModel, scene, worldPosition, world.geometry.radius);
}

export function animateCameraToPosition(start, end, lookTarget, duration, onComplete) {
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        let t = Math.min(elapsed / duration, 1);

        t = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        camera.position.lerpVectors(start, end, t);
        camera.lookAt(lookTarget);

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }

    requestAnimationFrame(animate);
}

function calculateCameraPath(worldPosition, radius) {
    const start = camera.position.clone();
    const direction = worldPosition.clone().sub(start).normalize();
    const entryOffset = radius - 0.1;
    const end = worldPosition.clone().add(direction.multiplyScalar(-entryOffset));
    const lookTarget = worldPosition.clone();

    return { start, end, lookTarget };
}


export async function flyToWorld(worldName) {
    const world = worlds[worldName];
    if (!world) {
        console.error(`World ${worldName} not found`);
        return;
    }
    stopSpawning();

    const worldPosition = world.position.clone();
    const radius = world.geometry.radius;

    const { start, end, lookTarget } = calculateCameraPath(worldPosition, radius);

    //Update sky background 
    removeOldSkyDome();
    addNewSkyDome(world, worldPosition);


    await playTransitionSound(world);

    // Instantly face the target planet
    camera.lookAt(lookTarget);

    animateCameraToPosition(start, end, lookTarget, GAME_CONFIG.CAMERA_ANIMATION_DURATION, () => {
        gameState.currentWorldPos = worldPosition.clone();

        // Show instructions once at the beginning of the game
        if (world.name === "Gumdrop") {
            showInstructions();
        }

        showScorePanel();
        loadCandyModel(world, worldPosition);
    });
}

const skyboxMaterials = {}; // Reuse your original global object

export async function loadSkyboxAssets() {
    const loadPromises = [];

    // Count total assets to load (3 skyboxes + 1 EXR background + 3 candy models)
    const worldCount = Object.keys(worlds).filter(name => worlds[name].interiorSky?.texture).length;
    const candyModelCount = Object.keys(worlds).length;
    initLoadingProgress(worldCount + 1 + candyModelCount); // skyboxes + EXR + candy models

    for (const worldName in worlds) {
        const world = worlds[worldName];
        if (world.interiorSky?.texture) {
            const promise = loadTextureAsync(world.interiorSky.texture)
                .then(texture => {
                    texture.encoding = THREE.sRGBEncoding;
                    texture.mapping = THREE.EquirectangularReflectionMapping;

                    skyboxMaterials[worldName] = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.BackSide,
                        depthWrite: false,
                    });
                    incrementLoadingProgress();
                })
                .catch(error => {
                    console.error(`Failed to load skybox for ${worldName}:`, error);
                    // Create fallback solid color material
                    skyboxMaterials[worldName] = new THREE.MeshBasicMaterial({
                        color: world.color,
                        side: THREE.BackSide,
                        depthWrite: false,
                    });
                    incrementLoadingProgress();
                });
            loadPromises.push(promise);
        }
    }

    try {
        await Promise.all(loadPromises);
        console.log("All skyboxes loaded");
    } catch (error) {
        console.error("Error loading skybox assets:", error);
        // Continue anyway with fallback materials
    }
}

export async function loadEXRBackground(path) {
    try {
        const texture = await loadEXRAsync(path);
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.background = envMap;
        scene.environment = envMap;

        incrementLoadingProgress();
        hideInterface("loadingOverlay");

        texture.dispose();
        pmremGenerator.dispose();

    } catch (error) {
        console.error("Error loading EXR background:", error);

        incrementLoadingProgress();

        // Show error to user
        showErrorMessage("Failed to load the CandyWorld environment. Please check your connection and try again.");

        // Set fallback background color
        scene.background = new THREE.Color(VISUAL_CONFIG.FALLBACK_SPACE_COLOR);
    }
}

export function createStars(count = VISUAL_CONFIG.STAR_COUNT) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * VISUAL_CONFIG.STAR_SPREAD;
        const y = (Math.random() - 0.5) * VISUAL_CONFIG.STAR_SPREAD;
        const z = (Math.random() - 0.5) * VISUAL_CONFIG.STAR_SPREAD;
        positions.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: VISUAL_CONFIG.STAR_SIZE,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}