export type Point = '0' | '15' | '30' | '40' | 'Ad';

export interface SetScore {
  player1: number;
  player2: number;
  tiebreak?: {
    player1: number;
    player2: number;
  };
}

export interface MatchState {
  player1Name: string;
  player2Name: string;
  points: {
    player1: Point;
    player2: Point;
  };
  games: {
    player1: number;
    player2: number;
  };
  sets: SetScore[];
  serving: 1 | 2;
  isTiebreak: boolean;
  tiebreakPoints: {
    player1: number;
    player2: number;
  };
  winner: 1 | 2 | null;
  history: string[]; // For undo functionality (serialized states)
}

export const INITIAL_STATE: MatchState = {
  player1Name: "Player 1",
  player2Name: "Player 2",
  points: { player1: '0', player2: '0' },
  games: { player1: 0, player2: 0 },
  sets: [],
  serving: 1,
  isTiebreak: false,
  tiebreakPoints: { player1: 0, player2: 0 },
  winner: null,
  history: [],
};
