// State management logic for the darts scorekeeper.
// Handles creation of sets, legs, turns, and game progression rules.

import type { GameType, Player, Turn, LegState, SetState } from "./models";

// Import type definitions for players, turns, leg state, and set state.

// Sequential ID counter for turns within a leg.
let nextTurnId = 1;

// Create a brand‑new, empty set with default values before players are added.
export function createEmptySet(): SetState {
    return {
        players: [],
        gameType: 501,
        maxLegs: 5,
        currentLeg: null,
        isFinished: false,
        winnerPlayerId: null
    };
}

// Start a new set by initializing players, configuring game rules,
// and creating the first leg of the match.
export function startNewSet(
    player1Name: string,
    player2Name: string,
    gameType: GameType,
    maxLegs: number
): SetState {
    const players: Player[] = [
        { id: 1, name: player1Name.trim() || "Player 1", legsWon: 0 },
        { id: 2, name: player2Name.trim() || "Player 2", legsWon: 0 }
    ];

    const setState: SetState = {
        players,
        gameType,
        maxLegs,
        currentLeg: null,
        isFinished: false,
        winnerPlayerId: null
    };

    setState.currentLeg = createNewLeg(setState, 1);
    return setState;
}

// Create a new leg for the given set, resetting score and turn history.
// Also resets the turn ID counter.
export function createNewLeg(setState: SetState, legNumber: number): LegState {
    const leg: LegState = {
        legNumber,
        startingScore: setState.gameType,
        turns: [],
        isFinished: false,
        currentPlayerIndex: 0
    };
    nextTurnId = 1;
    return leg;
}

// Add a turn to the current leg. Validates the score, updates player running totals,
// determines whether the leg is finished, and checks for a set winner.
export function addTurn(setState: SetState, points: number): { legFinished: boolean; winner: Player | null } {
    const leg = setState.currentLeg;
    if (!leg || setState.isFinished || leg.isFinished) {
        return { legFinished: false, winner: null };
    }

    const players = setState.players;
    const currentPlayer = players[leg.currentPlayerIndex];

    // Compute the player's remaining score before and after the turn.
    const remainingBefore = getRemainingScoreForPlayer(leg, currentPlayer.id);
    const remainingAfter = remainingBefore - points;

    // If the result would go below zero, the turn is invalid and ignored.
    if (remainingAfter < 0) {
        return { legFinished: false, winner: null };
    }

    // Record the turn with a unique ID and updated running score.
    const turn: Turn = {
        id: nextTurnId++,
        playerId: currentPlayer.id,
        points,
        runningScore: remainingAfter
    };
    leg.turns.push(turn);

    let legFinished = false;
    let winner: Player | null = null;

    // If remaining score hits zero, the player wins the leg.
    if (remainingAfter === 0) {
        leg.isFinished = true;
        legFinished = true;
        winner = currentPlayer;
        winner.legsWon += 1;
        updateSetWinner(setState);
    } else {
        // Otherwise rotate to the next player.
        leg.currentPlayerIndex = (leg.currentPlayerIndex + 1) % players.length;
    }

    return { legFinished, winner };
}

// Remove the most recent turn and recalculate all running scores for accuracy.
// Re‑evaluates whose turn it is.
export function removeLastTurn(setState: SetState): void {
    const leg = setState.currentLeg;
    if (!leg || leg.turns.length === 0 || leg.isFinished) {
        return;
    }

    leg.turns.pop();

    nextTurnId = 1;
    const players = setState.players;
    const startingScore = leg.startingScore;

    // Recalculate each player's running score because turn removal may change totals.
    const remainingScores: Record<number, number> = {};
    for (const p of players) {
        remainingScores[p.id] = startingScore;
    }

    for (const t of leg.turns) {
        const currentRemaining = remainingScores[t.playerId];
        const updated = currentRemaining - t.points;
        t.runningScore = updated;
        remainingScores[t.playerId] = updated;
    }

    if (leg.turns.length === 0) {
        leg.currentPlayerIndex = 0;
    } else {
        const lastTurn = leg.turns[leg.turns.length - 1];
        const lastPlayerIndex = players.findIndex(p => p.id === lastTurn.playerId);
        leg.currentPlayerIndex = (lastPlayerIndex + 1) % players.length;
    }
}

// Calculate remaining score for a given player by subtracting their turn totals.
export function getRemainingScoreForPlayer(leg: LegState, playerId: number): number {
    let remaining = leg.startingScore;
    for (const t of leg.turns) {
        if (t.playerId === playerId) {
            remaining -= t.points;
        }
    }
    return remaining;
}

// Determine whether a new leg can begin.
export function canStartNextLeg(setState: SetState): boolean {
    const leg = setState.currentLeg;
    if (!leg || !leg.isFinished || setState.isFinished) {
        return false;
    }
    return true;
}

// Progress the match to the next leg, if available.
export function startNextLeg(setState: SetState): void {
    const leg = setState.currentLeg;
    if (!leg || !leg.isFinished || setState.isFinished) {
        return;
    }
    const nextLegNumber = leg.legNumber + 1;
    if (nextLegNumber > setState.maxLegs) {
        return;
    }
    setState.currentLeg = createNewLeg(setState, nextLegNumber);
}

// Reset the entire set, clearing win counts and current leg data.
export function resetSet(setState: SetState): void {
    setState.players.forEach(p => {
        p.legsWon = 0;
    });
    setState.isFinished = false;
    setState.winnerPlayerId = null;
    setState.currentLeg = null;
}

// Check whether a player has won enough legs to win the set.
export function updateSetWinner(setState: SetState): void {
    const neededLegs = Math.floor(setState.maxLegs / 2) + 1;
    for (const player of setState.players) {
        if (player.legsWon >= neededLegs) {
            setState.isFinished = true;
            setState.winnerPlayerId = player.id;
            break;
        }
    }
}

// Return the name of the player whose turn it currently is.
export function getCurrentPlayerName(setState: SetState): string {
    const leg = setState.currentLeg;
    if (!leg) return "–";
    const player = setState.players[leg.currentPlayerIndex];
    return player ? player.name : "–";
}
