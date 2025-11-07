import { GAME_CONFIG } from './constants.js';

export function hideInterface(uiElement) {
    document.getElementById(uiElement).style.display = "none";
}

export function hideByCSS(uiElement) {
    document.querySelector(uiElement).style.display = "none";
}

export function hideStartUI() {
    document.querySelector(".uiPanel").style.display = "none";
}

export function toggleTransitionMessage(nextWorldName, show = true) {
    const msg = document.getElementById("transMessage");
    if (show) {
        msg.innerText = `You've Leveled Up & Now Travelling to ${nextWorldName}!`;
        msg.classList.remove("hidden");
    } else {
        msg.classList.add("hidden");
    }
}

let finalMessageShown = false;

export function showFinalMessage() {
    // Prevent duplicate calls
    if (finalMessageShown) return;
    finalMessageShown = true;

    const finale = document.getElementById("finaleMessage");
    finale.classList.remove("hidden");

    // Restart Button - use { once: true } to auto-cleanup listener
    const restBttn = document.getElementById("restartButton");
    if (restBttn) {
        restBttn.addEventListener("click", () => {
            location.reload();
        }, { once: true });
    }
}

export function showScorePanel() {
    const scorePanel = document.querySelector('.scorePanel');
    if (scorePanel) {
        scorePanel.classList.remove('hidden');
    }
}

export function showInstructions(){
    const instructions = document.getElementById("instructions");
    if (instructions){
        instructions.classList.remove("hidden");

        setTimeout(() => {
            instructions.classList.add("hidden");
        }, GAME_CONFIG.INSTRUCTION_DURATION);
    }
}

export function showErrorMessage(message) {
    const errorOverlay = document.getElementById("errorOverlay");
    const errorMessage = document.getElementById("errorMessage");
    const loadingOverlay = document.getElementById("loadingOverlay");

    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorOverlay) {
        errorOverlay.classList.remove("hidden");
    }

    // Setup retry button
    const retryButton = document.getElementById("retryButton");
    if (retryButton) {
        retryButton.addEventListener("click", () => {
            location.reload();
        }, { once: true });
    }
}
