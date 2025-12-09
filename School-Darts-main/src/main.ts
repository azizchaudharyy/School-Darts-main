// Main entry point for the darts scorekeeper application.
// Handles UI initialization, event listeners, and interaction between UI and game state.

import type { GameType, SetState } from "./models";
// Import type definitions for game configuration and state.

import {
    createEmptySet,
    startNewSet,
    addTurn,
    removeLastTurn,
    canStartNextLeg,
    startNextLeg,
    resetSet
} from "./state";
// Import functions responsible for creating and manipulating the game/set state.

import {
    getUiElements,
    renderAll,
    showInfoMessage,
    showWarningMessage,
    showSuccessMessage
} from "./ui";
// Import UI helpers for interacting with DOM elements and displaying messages.

// Collect all required UI elements from the DOM.
const ui = getUiElements();

// Initialize an empty set before any game starts.
let setState: SetState = createEmptySet();

// Set up all event listeners for forms, buttons, and input fields.
// This function wires UI interactions to state logic.
function setupEventHandlers() {
    const setupForm = document.getElementById("setup-form") as HTMLFormElement;
    const resetSetButton = document.getElementById("reset-set-button") as HTMLButtonElement;
    const turnForm = document.getElementById("turn-form") as HTMLFormElement;

    // Handle submission of the setup form, used to start a new set.
    setupForm.addEventListener("submit", evt => {
        evt.preventDefault();
        const formData = new FormData(setupForm);
        const player1 = String(formData.get("player1") || "Player 1");
        const player2 = String(formData.get("player2") || "Player 2");
        const gameTypeValue = Number(formData.get("gameType") || 501) as GameType;
        const maxLegsValue = Number(formData.get("maxLegs") || 5);

        setState = startNewSet(player1, player2, gameTypeValue, maxLegsValue);
        renderAll(setState, ui);
        showInfoMessage(ui, "Set started. Enter points for the current player.");
        ui.pointsInput.focus();
    });

    // Reset all state and UI when the user clicks "Reset Set".
    resetSetButton.addEventListener("click", () => {
        resetSet(setState);
        renderAll(setState, ui);
        showInfoMessage(ui, "All data cleared. Start a new set.");
    });

    // Handle submission of the turn form (user entering points scored).
    turnForm.addEventListener("submit", evt => {
        evt.preventDefault();
        handleAddTurn();
    });

    // Undo the last turn scored for the current leg.
    ui.undoTurnButton.addEventListener("click", () => {
        removeLastTurn(setState);
        renderAll(setState, ui);
        showInfoMessage(ui, "Last turn removed.");
    });

    // Start a new leg if allowed. A leg can only start after one has been won.
    ui.newLegButton.addEventListener("click", () => {
        if (!canStartNextLeg(setState)) {
            return;
        }
        startNextLeg(setState);
        renderAll(setState, ui);
        showInfoMessage(ui, "New leg started. Continue scoring.");
        ui.pointsInput.focus();
    });

    // Allow "Enter" key to submit a turn without clicking a button.
    ui.pointsInput.addEventListener("keydown", evt => {
        if (evt.key === "Enter") {
            evt.preventDefault();
            handleAddTurn();
        }
    });

    // Initial UI render for an empty or newly created set.
    renderAll(setState, ui);
}

// Process and validate user-entered points, update game state accordingly,
// and determine whether the leg or set has been won.
function handleAddTurn(): void {
    // Read and validate the points entered by the user.
    const rawValue = ui.pointsInput.value.trim();
    if (rawValue === "") {
        showWarningMessage(ui, "Please enter the points for this turn.");
        return;
    }

    // Ensure user input is a valid darts score (0–180).
    const points = Number(rawValue);
    if (!Number.isInteger(points) || points < 0 || points > 180) {
        showWarningMessage(ui, "Points must be an integer between 0 and 180.");
        return;
    }

    // Apply the turn to the game state and determine leg progression.
    const result = addTurn(setState, points);

    // Handle cases where the leg has been finished and someone won.
    if (result.legFinished && result.winner) {
        renderAll(setState, ui);
        const winnerName = result.winner.name;
        if (setState.isFinished) {
            showSuccessMessage(
                ui,
                `Leg won by ${winnerName}. The set is finished. Overall winner: ${winnerName}.`
            );
        } else {
            showSuccessMessage(ui, `Leg won by ${winnerName}. Start the next leg when ready.`);
        }
    // Handle normal scoring updates when the leg continues.
    } else if (!result.legFinished) {
        if (points === 0) {
            showInfoMessage(ui, "No score this turn. Next player's turn.");
        } else {
            showInfoMessage(ui, "Turn recorded. Next player's turn.");
        }
        renderAll(setState, ui);
    } else {
        showWarningMessage(ui, "This score would make the remaining points negative.");
    }

    // Select input text so user can quickly enter the next turn.
    ui.pointsInput.select();
}

// Initialize the application when the page finishes loading.
window.addEventListener("load", () => {
    setupEventHandlers();
});
