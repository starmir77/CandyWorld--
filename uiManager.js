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

export function showFinalMessage() {
    const finale = document.getElementById("finaleMessage");
    finale.classList.remove("hidden");

    // Restart Button
    const restBttn = document.getElementById("restartButton");
    if (restBttn) {
        document.getElementById("restartButton").addEventListener("click", () => {
            location.reload();
        });
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
        }, 4000);
    }
}
