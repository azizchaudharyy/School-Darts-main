export type GameType = 301 | 501;

export interface Player {
    id: number;
    name: string;
    legsWon: number;
}

export interface Turn {
    id: number;
    playerId: number;
    points: number;
    runningScore: number;
}

export interface LegState {
    legNumber: number;
    startingScore: GameType;
    turns: Turn[];
    isFinished: boolean;
    currentPlayerIndex: number;
}

export interface SetState {
    players: Player[];
    gameType: GameType;
    maxLegs: number;
    currentLeg: LegState | null;
    isFinished: boolean;
    winnerPlayerId: number | null;
}
