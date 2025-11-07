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

//  Destroy Candy on Click and increase score
function onMouseClick(event) {
    // Convert mouse position to normalized device coordinates ( -1, 1)
    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Cast a ray from the camera to detect objects
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections only with falling candies (performance optimization)
    const intersects = raycaster.intersectObjects(fallingCandies, true);

    if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        console.log("Clicked Object:", clickedObject);

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

// Clean up resources on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
    // Dispose all geometries and materials in the scene
    scene.traverse(obj => {
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach(material => {
                // Dispose textures
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

    // Dispose renderer
    renderer.dispose();
});

export { scene, camera, currentClickSound, worldOrder };





