import * as THREE from 'three';

import { scene, worldOrder } from "../index.js";
import { camera } from "../index.js";
import gameState from "./gameState.js";
import { showFinalMessage } from "./uiManager.js";

let fallingCandies = []; // Track falling candies
let spawnLoop; // store interval reference so we can modify, stop later on
const MAX_ACTIVE_CANDIES = 100;


// Spawn Candy at Random Position relative to world and camera positions
function getCandySpawnPosition(worldPosition, worldRadius, cameraPosition) {
    const spawnHeight = cameraPosition.y + 10;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * worldRadius * 0.7;

    const x = worldPosition.x + Math.cos(angle) * radius;
    const z = worldPosition.z + Math.sin(angle) * radius;

    // Ensure candy spawns slightly inside the planet.
    const inwardOffset = 0.9; // 90% of the radius.  Adjust as needed.
    const candyX = worldPosition.x + (x - worldPosition.x) * inwardOffset;
    const candyZ = worldPosition.z + (z - worldPosition.z) * inwardOffset * 2;


    return new THREE.Vector3(candyX, spawnHeight, candyZ);
}

//Make Candies Fall
function updateFallingCandies() {
    fallingCandies.forEach((candy, index) => {
        candy.position.y -= gameState.fallSpeed; //Adjust fall speed

        if (candy.position.y < -30) {
            scene.remove(candy);
            fallingCandies.splice(index, 1);
        }
    });
}


function startSpawning(worldModel, scene, worldPosition, worldRadius) {

    if (!worldModel) return console.error("World Candy not loaded yet, waiting...");

    clearInterval(spawnLoop);

    // Remove candies
    fallingCandies.forEach(candy => {
        scene.remove(candy);
        if (candy.geometry) candy.geometry.dispose();
        if (candy.material) candy.material.dispose();
        if (candy.material) {
            if (Array.isArray(candy.material)) {
                candy.material.forEach(m => m.dispose());
            } else {
                candy.material.dispose();
            }
        }
    });
    fallingCandies = [];

    // Start spawning loop
    spawnLoop = setInterval(() => {
        const candyClone = worldModel.clone();
        candyClone.position.copy(getCandySpawnPosition(worldPosition, worldRadius, camera.position)); // Pass worldPosition, worldRadius, and camera.position
        candyClone.userData.clickable = true;

        scene.add(candyClone);
        fallingCandies.push(candyClone);

        //Remove oldest candy once we reach max
        if (fallingCandies.lenght > MAX_ACTIVE_CANDIES) {
            const oldCandy = fallingCandies.shift();
            scene.remove(oldCandy);
            if (oldCandy.geometry) oldCandy.geometry.dispose();
            if (oldCandy.material) {
                if (Array.isArray(oldCandy.material)) {
                    oldCandy.material.forEach(m => m.dispose());
                } else {
                    oldCandy.material.dispose();
                }
            }
        }

    }, gameState.spawnInterval);
}

function increaseScore() {
    gameState.score++;
    document.getElementById("scoreDisplay").textContent = "Score: " + gameState.score;

    if (gameState.score % gameState.nextLevelScore === 0) {
        gameState.spawnInterval *= gameState.levelSpeed; // decrease interval falling candy interval
        console.log("New spawn interval:", gameState.spawnInterval);

        // Fire envent when level increases
        const event = new CustomEvent("levelUp");
        window.dispatchEvent(event);

        if (gameState.currentWorldIndex === worldOrder.length - 1) {
            showFinalMessage();
        }
    }
}



function stopSpawning() {
    if (spawnLoop) {
        clearInterval(spawnLoop);
        spawnLoop = null;
    }

    // Animate candies "poofing" out of the scene
    fallingCandies.forEach((candy, index) => {
        const duration = 300; // ms
        const startTime = performance.now();

        function animatePoof(time) {
            const t = Math.min((time - startTime) / duration, 1);
            const scale = 1 - t;

            candy.scale.set(scale, scale, scale);

            if (t < 1) {
                requestAnimationFrame(animatePoof);
            } else {
                scene.remove(candy);
            }
        }

        requestAnimationFrame(animatePoof);
    });

    // Clear array after short delay to allow animation to finish
    setTimeout(() => {
        fallingCandies = [];
    }, 350);
}


export { startSpawning, updateFallingCandies, increaseScore, fallingCandies, stopSpawning };