import * as THREE from 'three';

import { flyToWorld, loadSkyboxAssets, currentClickSound, loadEXRBackground, createStars, preloadCandyModels } from './Scripts/worldManager.js';
import { updateFallingCandies, fallingCandies, increaseScore, stopSpawning } from './Scripts/candySpawner.js';
import { worlds, createPlanetMeshes, universeBackground } from './Scripts/world.js';
import gameState from './Scripts/gameState.js';
import { hideStartUI, toggleTransitionMessage, showFinalMessage, enableStartButton, disableStartButton } from './Scripts/uiManager.js';
import { scene, camera, renderer, ambientLight, directionalLight } from './Scripts/sceneSetup.js';
import { GAME_CONFIG, VISUAL_CONFIG } from './Scripts/constants.js';



const worldOrder = Object.keys(worlds);

scene.add(camera);
scene.add(ambientLight);
scene.add(directionalLight);

// Load initial candy universe EXR (space skybox look)
loadEXRBackground(universeBackground);

// Add planets to scene
const planetMeshes = createPlanetMeshes(worlds);
planetMeshes.forEach(mesh => scene.add(mesh));

// Add stars to scene
createStars();

// Disable start button until assets are loaded
disableStartButton();

// Sound management
let soundEnabled = true;

// Sound Toggle Button
const soundToggle = document.getElementById('soundToggle');
if (soundToggle) {
    soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        soundToggle.classList.toggle('muted');

        // Mute current click sound if playing
        if (currentClickSound) {
            currentClickSound.muted = !soundEnabled;
        }
    });
}

// Start Button
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("startButton").addEventListener("click", (e) => {
        const world = e.target.dataset.targetWorld;
        flyToWorld(world, worldOrder);
        hideStartUI();
    });
});

// Listen for LevelUp events
window.addEventListener("levelUp", () => {
    stopSpawning();

    const nextWorldIndex = gameState.currentWorldIndex + 1;

    if (nextWorldIndex >= worldOrder.length) {
        //end game
        showFinalMessage();
        return;
    }

    const nextWorldName = worldOrder[nextWorldIndex];
    toggleTransitionMessage(nextWorldName, true);

    setTimeout(() => {
        toggleTransitionMessage(nextWorldName, false);
        gameState.currentWorldIndex = nextWorldIndex;
        flyToWorld(nextWorldName);

    }, GAME_CONFIG.TRANSITION_DELAY);

})

// Reusable objects for click detection (prevents garbage collection)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Listen for pointer events (better mobile support than click)
window.addEventListener("pointerdown", onMouseClick);

// Prevent default touch behaviors on canvas for better mobile experience
const canvas = document.querySelector('.webgl');
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

/**
 * Handles click/touch events for candy destruction
 * Uses raycasting to detect which candy was clicked in 3D space
 */
function onMouseClick(event) {
    // Convert screen coordinates to normalized device coordinates (-1 to 1)
    // This is required for Three.js raycasting to work correctly
    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,   // X: left (-1) to right (1)
        -(event.clientY / window.innerHeight) * 2 + 1  // Y: top (1) to bottom (-1), note the negation
    );

    // Cast a ray from camera through mouse position into the scene
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections only with falling candies (10x faster than checking entire scene)
    const intersects = raycaster.intersectObjects(fallingCandies, true);

    if (intersects.length > 0) {
        let clickedObject = intersects[0].object; // Get closest intersected object
        console.log("Clicked Object:", clickedObject);

        // Walk up the parent hierarchy until we find the clickable candy
        // GLTF models have nested objects, we need the root clickable object
        while (clickedObject && !clickedObject.userData?.clickable) {
            clickedObject = clickedObject.parent;
        }

        // Check if it's candy

        if (clickedObject && clickedObject.userData?.clickable) {
            console.log("candy clicked", clickedObject.parent);

            scene.remove(clickedObject);
            increaseScore();

            // Play sound on clicked candy
            if (currentClickSound && soundEnabled) {
                currentClickSound.currentTime = 0;
                const playPromise = currentClickSound.play();

                // Handle autoplay policy
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.warn('Click sound blocked by browser policy:', err);
                    });
                }
            }

            // remove from falling candies array
            const index = fallingCandies.indexOf(clickedObject.parent);
            if (index !== -1) {
                fallingCandies.splice(index, 1);
            }
        }
    }
}

// Load Skybox Assets and Candy Models
loadSkyboxAssets().then(() => {
    return preloadCandyModels();
}).then(() => {
    // Enable start button once all assets are loaded
    enableStartButton();
    console.log("All assets loaded, game ready to start");
});

// Animation Loop to Continuously Render
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    updateFallingCandies();
    ambientLight.intensity = VISUAL_CONFIG.AMBIENT_LIGHT_BASE_INTENSITY +
        Math.sin(Date.now() * VISUAL_CONFIG.AMBIENT_LIGHT_PULSE_SPEED) * VISUAL_CONFIG.AMBIENT_LIGHT_PULSE_AMOUNT;
}
animate();

/**
 * Clean up Three.js resources on page unload to prevent memory leaks
 * Critical for SPAs and when game is embedded in other applications
 * Three.js doesn't auto-cleanup, so we must manually dispose all GPU resources
 */
window.addEventListener('beforeunload', () => {
    // Traverse entire scene graph and dispose all geometries and materials
    scene.traverse(obj => {
        // Dispose geometry (vertex buffers on GPU)
        if (obj.geometry) {
            obj.geometry.dispose();
        }

        // Dispose materials and their associated textures
        if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach(material => {
                // Dispose all texture types (frees GPU memory)
                if (material.map) material.map.dispose();
                if (material.lightMap) material.lightMap.dispose();
                if (material.bumpMap) material.bumpMap.dispose();
                if (material.normalMap) material.normalMap.dispose();
                if (material.specularMap) material.specularMap.dispose();
                if (material.envMap) material.envMap.dispose();

                material.dispose();
            });
        }
    });

    // Dispose WebGL rendering context
    renderer.dispose();
});

export { scene, camera, currentClickSound, worldOrder };





