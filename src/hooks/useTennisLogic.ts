import { ScoringMode } from '../types';

export const TENNIS_POINTS = ['0', '15', '30', '40', 'Ad'];

export function useTennisLogic() {
  const getNextPoint = (current: string | number, opponent: string | number, useGoldenPoint: boolean = false) => {
    const curStr = String(current);
    const oppStr = String(opponent);

    if (curStr === '0') return '15';
    if (curStr === '15') return '30';
    if (curStr === '30') return '40';
    
    if (curStr === '40') {
      if (useGoldenPoint) return 'GAME';
      if (oppStr === 'Ad') return '40'; // Opponent loses Advantage
      if (oppStr === '40') return 'Ad'; // Get Advantage
      return 'GAME';
    }
    
    if (curStr === 'Ad') return 'GAME';
    
    return '0';
  };

  const checkGameWin = (
    currentPoints: string | number, 
    opponentPoints: string | number, 
    isTiebreak: boolean,
    useGoldenPoint: boolean = false
  ): { nextPoint: string | number, gameWon: boolean } => {
    if (isTiebreak) {
      const p1 = Number(currentPoints);
      const p2 = Number(opponentPoints);
      const next = p1 + 1;
      if (next >= 7 && next - p2 >= 2) {
        return { nextPoint: 0, gameWon: true };
      }
      return { nextPoint: next, gameWon: false };
    }

    const next = getNextPoint(currentPoints, opponentPoints, useGoldenPoint);
    if (next === 'GAME') {
      return { nextPoint: '0', gameWon: true };
    }
    
    return { nextPoint: next, gameWon: false };
  };

  const checkSetWin = (games1: number, games2: number, targetGames: number = 6) => {
    // Normal Set
    if (games1 >= targetGames && games1 - games2 >= 2) return true;
    
    // Tiebreak winner
    if (games1 === targetGames + 1 && games2 === targetGames) return true;
    
    return false;
  };

  return {
    getNextPoint,
    checkGameWin,
    checkSetWin
  };
}
