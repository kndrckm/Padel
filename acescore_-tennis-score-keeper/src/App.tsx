/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Undo2, 
  User, 
  Settings2, 
  ChevronRight,
  History,
  Info
} from 'lucide-react';
import { MatchState, INITIAL_STATE, Point, SetScore } from './types';

export default function App() {
  const [state, setState] = useState<MatchState>(INITIAL_STATE);
  const [showSettings, setShowSettings] = useState(false);
  const [tempNames, setTempNames] = useState({ p1: state.player1Name, p2: state.player2Name });

  // Save history for undo
  const pushHistory = useCallback((currentState: MatchState) => {
    const serialized = JSON.stringify(currentState);
    setState(prev => ({
      ...prev,
      history: [serialized, ...prev.history].slice(0, 20) // Keep last 20 moves
    }));
  }, []);

  const undo = useCallback(() => {
    if (state.history.length === 0) return;
    const [lastState, ...remainingHistory] = state.history;
    const restored = JSON.parse(lastState) as MatchState;
    setState({ ...restored, history: remainingHistory });
  }, [state.history]);

  const resetMatch = useCallback(() => {
    if (confirm("Are you sure you want to reset the match? All progress will be lost.")) {
      setState(INITIAL_STATE);
    }
  }, []);

  const updateNames = () => {
    setState(prev => ({
      ...prev,
      player1Name: tempNames.p1 || "Player 1",
      player2Name: tempNames.p2 || "Player 2"
    }));
    setShowSettings(false);
  };

  const nextPoint = (player: 1 | 2) => {
    if (state.winner) return;
    pushHistory(state);

    const newState = { ...state };
    const opponent = player === 1 ? 2 : 1;
    const pKey = `player${player}` as 'player1' | 'player2';
    const oKey = `player${opponent}` as 'player1' | 'player2';

    if (state.isTiebreak) {
      newState.tiebreakPoints[pKey]++;
      
      // Tiebreak win condition: 7 points and 2 ahead
      if (newState.tiebreakPoints[pKey] >= 7 && newState.tiebreakPoints[pKey] - newState.tiebreakPoints[oKey] >= 2) {
        winGame(player, newState);
      } else {
        // Change server every 2 points (except first point)
        const totalPoints = newState.tiebreakPoints.player1 + newState.tiebreakPoints.player2;
        if (totalPoints % 2 === 1) {
          newState.serving = newState.serving === 1 ? 2 : 1;
        }
      }
    } else {
      const currentPoint = state.points[pKey];
      const opponentPoint = state.points[oKey];

      if (currentPoint === '0') newState.points[pKey] = '15';
      else if (currentPoint === '15') newState.points[pKey] = '30';
      else if (currentPoint === '30') newState.points[pKey] = '40';
      else if (currentPoint === '40') {
        if (opponentPoint === 'Ad') {
          newState.points[oKey] = '40'; // Back to deuce
        } else if (opponentPoint === '40') {
          newState.points[pKey] = 'Ad';
        } else {
          winGame(player, newState);
        }
      } else if (currentPoint === 'Ad') {
        winGame(player, newState);
      }
    }

    setState(newState);
  };

  const winGame = (player: 1 | 2, newState: MatchState) => {
    const pKey = `player${player}` as 'player1' | 'player2';
    const oKey = `player${player === 1 ? 'player2' : 'player1'}` as 'player1' | 'player2';

    newState.games[pKey]++;
    newState.points = { player1: '0', player2: '0' };
    newState.tiebreakPoints = { player1: 0, player2: 0 };
    newState.isTiebreak = false;
    
    // Change server after every game (unless it was a tiebreak, handled separately)
    newState.serving = newState.serving === 1 ? 2 : 1;

    // Game win logic
    if (newState.games[pKey] >= 6) {
      if (newState.games[pKey] - newState.games[oKey] >= 2) {
        winSet(player, newState);
      } else if (newState.games[pKey] === 6 && newState.games[oKey] === 6) {
        newState.isTiebreak = true;
      }
    }
  };

  const winSet = (player: 1 | 2, newState: MatchState) => {
    const pKey = `player${player}` as 'player1' | 'player2';
    const oKey = `player${player === 1 ? 'player2' : 'player1'}` as 'player1' | 'player2';

    const currentSet: SetScore = {
      player1: newState.games.player1,
      player2: newState.games.player2,
    };

    // If it was a tiebreak, record the tiebreak score
    if (newState.games.player1 === 7 || newState.games.player2 === 7) {
      // Note: This is a simplified check, usually tiebreak is 7-6
    }

    newState.sets = [...newState.sets, currentSet];
    newState.games = { player1: 0, player2: 0 };

    // Match win logic (Best of 3)
    const setsWon = newState.sets.filter(s => 
      (player === 1 ? s.player1 > s.player2 : s.player2 > s.player1)
    ).length;

    if (setsWon === 2) {
      newState.winner = player;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-lime-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/20">
            <Trophy className="text-slate-950 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">AceScore</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Match Tracker</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={undo}
            disabled={state.history.length === 0}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-all active:scale-95"
            title="Undo"
          >
            <Undo2 size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all active:scale-95"
            title="Settings"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={resetMatch}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 border border-red-500/20"
            title="Reset Match"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {[1, 2].map((pNum) => {
            const player = pNum as 1 | 2;
            const pKey = `player${player}` as 'player1' | 'player2';
            const isServing = state.serving === player;
            const isWinner = state.winner === player;
            const name = player === 1 ? state.player1Name : state.player2Name;

            return (
              <motion.div 
                key={player}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative group p-6 rounded-3xl border-2 transition-all duration-500 ${
                  isWinner 
                    ? 'bg-lime-500/10 border-lime-500 shadow-2xl shadow-lime-500/10' 
                    : isServing 
                      ? 'bg-slate-900 border-slate-700 shadow-xl' 
                      : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                {isServing && !state.winner && (
                  <motion.div 
                    layoutId="serving-indicator"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter"
                  >
                    Serving
                  </motion.div>
                )}

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-100">{name}</h2>
                    <div className="flex justify-center gap-1">
                      {state.sets.map((set, idx) => (
                        <span key={idx} className={`text-sm font-mono px-2 py-0.5 rounded ${
                          (player === 1 ? set.player1 > set.player2 : set.player2 > set.player1)
                            ? 'bg-lime-500/20 text-lime-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {player === 1 ? set.player1 : set.player2}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">Games</span>
                      <span className="text-4xl font-black font-mono text-slate-300">{state.games[pKey]}</span>
                    </div>
                    <div className="w-px h-12 bg-slate-800" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs uppercase font-bold text-lime-500 tracking-widest mb-1">Points</span>
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={state.isTiebreak ? state.tiebreakPoints[pKey] : state.points[pKey]}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.2 }}
                          className="text-7xl font-black font-mono text-white drop-shadow-2xl"
                        >
                          {state.isTiebreak ? state.tiebreakPoints[pKey] : state.points[pKey]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    onClick={() => nextPoint(player)}
                    disabled={!!state.winner}
                    className={`w-full py-6 rounded-2xl font-bold text-xl transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2 ${
                      isWinner 
                        ? 'bg-lime-500 text-slate-950' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {isWinner ? (
                      <>
                        <Trophy size={24} />
                        Winner
                      </>
                    ) : (
                      'Add Point'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
              <History size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Sets Played</p>
              <p className="text-xl font-bold">{state.sets.length}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
              <Info size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Format</p>
              <p className="text-xl font-bold">Best of 3</p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Tiebreak</p>
              <p className="text-xl font-bold">{state.isTiebreak ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>

        {/* Set History Table */}
        {state.sets.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/30 rounded-3xl border border-slate-800 overflow-hidden"
          >
            <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2">
              <History size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Set Summary</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-500 uppercase font-bold border-b border-slate-800/50">
                  <th className="px-6 py-4">Player</th>
                  {state.sets.map((_, i) => (
                    <th key={i} className="px-6 py-4 text-center">Set {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/30">
                  <td className="px-6 py-4 font-medium">{state.player1Name}</td>
                  {state.sets.map((set, i) => (
                    <td key={i} className={`px-6 py-4 text-center font-mono ${set.player1 > set.player2 ? 'text-lime-400 font-bold' : 'text-slate-500'}`}>
                      {set.player1}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">{state.player2Name}</td>
                  {state.sets.map((set, i) => (
                    <td key={i} className={`px-6 py-4 text-center font-mono ${set.player2 > set.player1 ? 'text-lime-400 font-bold' : 'text-slate-500'}`}>
                      {set.player2}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold">Match Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                  <RotateCcw size={20} className="rotate-45" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Player 1 Name</label>
                    <input 
                      type="text" 
                      value={tempNames.p1}
                      onChange={(e) => setTempNames({ ...tempNames, p1: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                      placeholder="Enter name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Player 2 Name</label>
                    <input 
                      type="text" 
                      value={tempNames.p2}
                      onChange={(e) => setTempNames({ ...tempNames, p2: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime-500/50 transition-all"
                      placeholder="Enter name..."
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3">
                  <Info className="text-blue-400 shrink-0" size={20} />
                  <p className="text-sm text-slate-400">
                    Standard tennis rules apply: Best of 3 sets, 6 games to win a set (by 2), and 7-point tiebreak at 6-6.
                  </p>
                </div>

                <button 
                  onClick={updateNames}
                  className="w-full py-4 bg-lime-500 text-slate-950 font-bold rounded-xl hover:bg-lime-400 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20"
                >
                  Save Changes
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-8 text-center text-slate-600 text-sm">
        <p>© 2026 AceScore Pro • Built for the Court</p>
      </footer>
    </div>
  );
}
