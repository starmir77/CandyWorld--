import * as THREE from 'three';

import { flyToWorld, loadSkyboxAssets, currentClickSound, loadEXRBackground, createStars } from './Scripts/worldManager.js';
import { updateFallingCandies, fallingCandies, increaseScore, stopSpawning } from './Scripts/candySpawner.js';
import { worlds, createPlanetMeshes, universeBackground } from './Scripts/world.js';
import gameState from './Scripts/gameState.js';
import { hideStartUI, toggleTransitionMessage, showFinalMessage } from './Scripts/uiManager.js';
import { scene, camera, renderer, ambientLight, directionalLight } from './Scripts/sceneSetup.js';



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

    }, 2500);  //2.5 second delay

})

// Listen for Clicks 
window.addEventListener("click", onMouseClick);

//  Destroy Candy on Click and increase score
function onMouseClick(event) {
    // convert mouse posititon to normalized device coordinates ( -1, 1)
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Cast a ray from the camera to detect objects 
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    //Check for intersections
    const intersects = raycaster.intersectObjects(scene.children, true);

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
            if (currentClickSound) {
                currentClickSound.currentTime = 0;
                currentClickSound.play();
            }

            // remove from falling candies array
            const index = fallingCandies.indexOf(clickedObject.parent);
            if (index !== -1) {
                fallingCandies.splice(index, 1);
            }
        }
    }
}

// Load Skybox Assets
loadSkyboxAssets();

let frameCount = 0;

// Animation Loop to Continuously Render
function animate() {
    requestAnimationFrame(animate);
    frameCount++;
    renderer.render(scene, camera);

    if (frameCount % 2 === 0) {
        updateFallingCandies();
        ambientLight.intensity = 5 + Math.sin(Date.now() * 0.001) * 0.5;
    }

    // planetMeshes.forEach(planet => {
    //     planet.rotation.y += 0.001; 
    // });

}
animate();

///////

let currentWorldPos = new THREE.Vector3(0, 0, 0);

export { scene, camera, currentClickSound, worldOrder, currentWorldPos };





