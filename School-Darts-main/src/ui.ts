// UI rendering and DOM interaction module for the darts scorekeeper.
// Responsible for updating status displays, tables, buttons, and messages.
import type { SetState, LegState, Player, Turn } from "./models";
import { getRemainingScoreForPlayer, getCurrentPlayerName } from "./state";

// Import data models and helper functions used to compute UI values.

// Collection of all DOM elements used by the app.
// Centralized here so other modules can interact with the UI cleanly.
export interface UiElements {
    message: HTMLElement;
    statusGame: HTMLElement;
    statusMaxLegs: HTMLElement;
    statusLegNumber: HTMLElement;
    statusCurrentPlayer: HTMLElement;
    playersTableBody: HTMLElement;
    turnsTableBody: HTMLElement;
    addTurnButton: HTMLButtonElement;
    undoTurnButton: HTMLButtonElement;
    newLegButton: HTMLButtonElement;
    pointsInput: HTMLInputElement;
}

// Fetch all needed UI elements from the DOM and return them in a structured object.
// Ensures safe access to all interactive and display components.
export function getUiElements(): UiElements {
    // Map each required ID from the HTML document into a typed property.
    return {
        message: document.getElementById("message") as HTMLElement,
        statusGame: document.getElementById("status-game") as HTMLElement,
        statusMaxLegs: document.getElementById("status-max-legs") as HTMLElement,
        statusLegNumber: document.getElementById("status-leg-number") as HTMLElement,
        statusCurrentPlayer: document.getElementById("status-current-player") as HTMLElement,
        playersTableBody: document.getElementById("players-table-body") as HTMLElement,
        turnsTableBody: document.getElementById("turns-table-body") as HTMLElement,
        addTurnButton: document.getElementById("add-turn-button") as HTMLButtonElement,
        undoTurnButton: document.getElementById("undo-turn-button") as HTMLButtonElement,
        newLegButton: document.getElementById("new-leg-button") as HTMLButtonElement,
        pointsInput: document.getElementById("points-input") as HTMLInputElement
    };
}

// Render every major part of the UI: status bar, players table, turns table, and buttons.
// Called after any significant update to the game state.
export function renderAll(setState: SetState, ui: UiElements): void {
    renderStatus(setState, ui);
    renderPlayersTable(setState, ui);
    renderTurnsTable(setState, ui);
    renderButtons(setState, ui);
}

// Render the game's overall status: game type, leg number, current player, and max legs.
// If no leg is active, placeholders are shown instead.
export function renderStatus(setState: SetState, ui: UiElements): void {
    // If no leg has been started yet, show placeholders for all status fields.
    if (!setState.currentLeg) {
        ui.statusGame.textContent = "–";
        ui.statusMaxLegs.textContent = "–";
        ui.statusLegNumber.textContent = "–";
        ui.statusCurrentPlayer.textContent = "–";
        return;
    }

    ui.statusGame.textContent = `${setState.gameType} down`;
    ui.statusMaxLegs.textContent = `Best of ${setState.maxLegs}`;
    ui.statusLegNumber.textContent = String(setState.currentLeg.legNumber);
    ui.statusCurrentPlayer.textContent = setState.isFinished
        ? "Set finished"
        : getCurrentPlayerName(setState);
}

// Render the players table with names, legs won, and current remaining score for each player.
export function renderPlayersTable(setState: SetState, ui: UiElements): void {
    const leg = setState.currentLeg;
    // Clear previous table contents before re-rendering.
    ui.playersTableBody.innerHTML = "";
    if (!leg) return;

    for (const player of setState.players) {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.textContent = player.name;
        tr.appendChild(nameTd);

        const legsWonTd = document.createElement("td");
        legsWonTd.textContent = String(player.legsWon);
        tr.appendChild(legsWonTd);

        const remainingTd = document.createElement("td");
        const remaining = getRemainingScoreForPlayer(leg, player.id);
        remainingTd.textContent = String(remaining);
        tr.appendChild(remainingTd);

        ui.playersTableBody.appendChild(tr);
    }
}

// Render the table of all turns taken in the current leg.
// Displays turn index, player name, points scored, and running score.
export function renderTurnsTable(setState: SetState, ui: UiElements): void {
    const leg = setState.currentLeg;
    // Clear previous turn rows before listing updated turn history.
    ui.turnsTableBody.innerHTML = "";
    if (!leg) return;

    leg.turns.forEach((turn: Turn, index: number) => {
        const tr = document.createElement("tr");

        const indexTd = document.createElement("td");
        indexTd.textContent = String(index + 1);
        tr.appendChild(indexTd);

        const playerTd = document.createElement("td");
        const player = setState.players.find(p => p.id === turn.playerId);
        playerTd.textContent = player ? player.name : "?";
        tr.appendChild(playerTd);

        const pointsTd = document.createElement("td");
        pointsTd.textContent = String(turn.points);
        tr.appendChild(pointsTd);

        const runningTd = document.createElement("td");
        runningTd.textContent = String(turn.runningScore);
        tr.appendChild(runningTd);

        ui.turnsTableBody.appendChild(tr);
    });
}

// Enable or disable UI buttons based on the current game and leg state.
// Prevents invalid actions when the set is finished or a leg is not active.
export function renderButtons(setState: SetState, ui: UiElements): void {
    const leg = setState.currentLeg;

    const hasSet = !!leg;
    const setFinished = setState.isFinished;
    const legFinished = leg ? leg.isFinished : false;

    ui.addTurnButton.disabled = !hasSet || setFinished || legFinished;
    ui.undoTurnButton.disabled = !hasSet || setFinished || legFinished || (leg && leg.turns.length === 0);
    ui.newLegButton.disabled = !hasSet || setFinished || !legFinished;

    ui.pointsInput.disabled = ui.addTurnButton.disabled;
}

// Display an informational message to the user.
// Applies appropriate styling and clears other message styles.
export function showInfoMessage(ui: UiElements, text: string): void {
    ui.message.textContent = text;
    ui.message.classList.remove("message--warning", "message--success");
    ui.message.classList.add("message--info");
}

// Display a warning message to the user (used for invalid inputs or blocked actions).
export function showWarningMessage(ui: UiElements, text: string): void {
    ui.message.textContent = text;
    ui.message.classList.remove("message--info", "message--success");
    ui.message.classList.add("message--warning");
}

// Display a success message (e.g., leg won, valid scoring action).
export function showSuccessMessage(ui: UiElements, text: string): void {
    ui.message.textContent = text;
    ui.message.classList.remove("message--info", "message--warning");
    ui.message.classList.add("message--success");
}
