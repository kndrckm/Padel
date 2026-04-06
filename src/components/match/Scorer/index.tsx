import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Undo2, 
  Redo2, 
  Save, 
  AlertTriangle 
} from 'lucide-react';
import { 
  doc, 
  setDoc, 
  query, 
  collection, 
  onSnapshot, 
  deleteDoc 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../../../lib/firebase';
import { Match, Tournament, MatchStatus } from '../../../types';
import { PadelCourt } from './PadelCourt';

interface MatchScorerProps {
  match: Match;
  tournament: Tournament;
  onBack: () => void;
  onUpdate: (u: Partial<Match>) => void;
  pointsToPlay: number;
  user: User | null;
}

export default function MatchScorer({ 
  match, 
  tournament, 
  onBack, 
  onUpdate, 
  pointsToPlay, 
  user 
}: MatchScorerProps) {
  const [score1, setScore1] = useState(match.score1);
  const [score2, setScore2] = useState(match.score2);
  const [sets1, setSets1] = useState(match.sets1);
  const [sets2, setSets2] = useState(match.sets2);
  const [serverIndex, setServerIndex] = useState(match.serverIndex);
  const [activeUsers, setActiveUsers] = useState<number>(0);

  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Presence Tracking
  useEffect(() => {
    if (!match.id || !match.tournamentId) return;

    const presenceId = user?.uid || `guest-${Math.random().toString(36).substr(2, 9)}`;
    const presenceRef = doc(db, `tournaments/${match.tournamentId}/matches/${match.id}/presence`, presenceId);

    const registerPresence = async () => {
      try {
        await setDoc(presenceRef, {
          timestamp: new Date().toISOString(),
          userId: user?.uid || 'guest',
          email: user?.email || 'Guest'
        });
      } catch (error) {
        console.error('Error registering presence:', error);
      }
    };

    registerPresence();

    const q = query(collection(db, `tournaments/${match.tournamentId}/matches/${match.id}/presence`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveUsers(snapshot.size);
    });

    return () => {
      unsubscribe();
      deleteDoc(presenceRef).catch(err => console.error('Error removing presence:', err));
    };
  }, [match.id, match.tournamentId, user]);

  const pushToHistory = () => {
    setHistory([...history, { score1, score2, sets1, sets2, serverIndex }]);
    setRedoStack([]);
  };

  const handleScore = (team: 1 | 2, delta: number) => {
    pushToHistory();
    if (team === 1) setScore1(Math.max(0, score1 + delta));
    else setScore2(Math.max(0, score2 + delta));
  };

  const handleScoreSet = (team: 1 | 2, value: number) => {
    pushToHistory();
    if (team === 1) setScore1(Math.min(99, Math.max(0, value)));
    else setScore2(Math.min(99, Math.max(0, value)));
  };

  const handleSet = () => {
    pushToHistory();
    setSets1([...sets1, score1]);
    setSets2([...sets2, score2]);
    setScore1(0);
    setScore2(0);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack([...redoStack, { score1, score2, sets1, sets2, serverIndex }]);
    setHistory(history.slice(0, -1));
    setScore1(prev.score1);
    setScore2(prev.score2);
    setSets1(prev.sets1);
    setSets2(prev.sets2);
    setServerIndex(prev.serverIndex);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory([...history, { score1, score2, sets1, sets2, serverIndex }]);
    setRedoStack(redoStack.slice(0, -1));
    setScore1(next.score1);
    setScore2(next.score2);
    setSets1(next.sets1);
    setSets2(next.sets2);
    setServerIndex(next.serverIndex);
  };

  const handleServerChange = (idx: number) => {
    pushToHistory();
    setServerIndex(idx);
  };

  const handleSetScoreChange = (team: 1 | 2, setIdx: number, val: string) => {
    pushToHistory();
    const newVal = parseInt(val) || 0;
    if (team === 1) {
      const newSets = [...sets1];
      newSets[setIdx] = newVal;
      setSets1(newSets);
    } else {
      const newSets = [...sets2];
      newSets[setIdx] = newVal;
      setSets2(newSets);
    }
  };

  const save = () => {
    onUpdate({
      score1, score2, sets1, sets2,
      serverIndex, status: MatchStatus.IN_PROGRESS
    });
  };

  const complete = () => {
    const s1 = sets1.length + (score1 > score2 ? 1 : 0);
    const s2 = sets2.length + (score2 > score1 ? 1 : 0);
    onUpdate({
      score1, score2, sets1, sets2,
      status: MatchStatus.COMPLETED,
      winner: s1 > s2 ? 1 : 2
    });
    onBack();
  };

  const isTargetReached = (score1 + score2) >= pointsToPlay;

  const getTeamName = (playerNames: string[]) => {
    if (!tournament.mode.includes('Team')) return null;
    const p = tournament.players.find(p => p.name === playerNames[0]);
    return p?.teamName || null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10"
    >
      <div className="space-y-8">
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-all">
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <motion.div layout className={`px-8 py-3 rounded-full shadow-lg flex items-center gap-3 whitespace-nowrap transition-colors duration-500 ${isTargetReached ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-on-surface'}`}>
              {isTargetReached ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Target Reached</span>
                </>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Target: {pointsToPlay}</span>
              )}
            </motion.div>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="flex bg-surface-container-low p-1 rounded-2xl">
              <button onClick={undo} disabled={history.length === 0} className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface"><Undo2 className="w-5 h-5" /></button>
              <button onClick={redo} disabled={redoStack.length === 0} className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface"><Redo2 className="w-5 h-5" /></button>
            </div>
            <button onClick={save} className="flex items-center gap-3 bg-surface-container-low text-on-surface px-8 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all">
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {activeUsers > 1 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-5">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <p className="text-sm font-bold text-on-surface">{activeUsers} people are currently scoring this match.</p>
          </motion.div>
        )}

        {/* Unified Match Controls & Set Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <PadelCourt 
              team1={match.team1} team2={match.team2} 
              serverIndex={serverIndex}
              team1Name={getTeamName(match.team1)}
              team2Name={getTeamName(match.team2)}
              score1={score1} score2={score2}
              onScoreUpdate={handleScore}
              onScoreSet={handleScoreSet}
              onServerChange={handleServerChange}
              pointsToPlay={pointsToPlay}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-on-surface/40">Set History</span>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2].map(teamNum => (
                    <div key={teamNum} className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 px-1">Team {teamNum}</p>
                      <div className="flex gap-2">
                        {(teamNum === 1 ? sets1 : sets2).map((s, i) => (
                          <input 
                            key={i} 
                            type="number" 
                            value={s} 
                            onChange={(e) => handleSetScoreChange(teamNum as 1 | 2, i, e.target.value)} 
                            className="w-14 h-14 bg-surface-container-lowest border border-on-surface/5 rounded-2xl flex items-center justify-center font-black text-xl text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tabular-nums shadow-inner" 
                          />
                        ))}
                        {/* Always show at least 3 set slots for a professional look? No, keep it dynamic but styled well. */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-on-surface/5 flex flex-col gap-3">
                <button 
                  onClick={handleSet} 
                  className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest bg-surface-container-high text-on-surface hover:bg-on-surface hover:text-surface-container-lowest transition-all"
                >
                  Finish Current Set
                </button>
                <button 
                  onClick={complete} 
                  className="w-full bg-primary text-on-primary py-6 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirm Match Result
                </button>
              </div>
            </div>

            {/* Quick Actions / Match Status */}
            <div className="px-8 py-6 bg-primary-container/10 rounded-[2rem] border border-primary/10 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Match Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Live Scoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
