import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Trophy, 
  Undo2, 
  Redo2, 
  Save, 
  AlertTriangle,
  RotateCcw,
  PartyPopper
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
import { Match, Tournament, MatchStatus, ScoringMode, GameMode } from '../../../types';
import { PadelCourt } from './PadelCourt';
import { useTennisLogic, TENNIS_POINTS } from '../../../hooks/useTennisLogic';
import { KatapgamaLogo } from '../../common/KatapgamaLogo';
import { ChampionOverlay } from '../../common/ChampionOverlay';

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
  const [points1, setPoints1] = useState<string | number>(match.points1 ?? (match.scoringMode === ScoringMode.TENNIS ? '0' : 0));
  const [points2, setPoints2] = useState<string | number>(match.points2 ?? (match.scoringMode === ScoringMode.TENNIS ? '0' : 0));
  const [isTiebreak, setIsTiebreak] = useState(match.isTiebreak ?? false);
  const [serverIndex, setServerIndex] = useState(match.serverIndex);
  const [presenceUsers, setPresenceUsers] = useState<any[]>([]);
  const [showChampionOverlay, setShowChampionOverlay] = useState(false);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);
  const [forceCelebration, setForceCelebration] = useState(false);

  const { getNextPoint, checkGameWin, checkSetWin } = useTennisLogic();
  const scoringMode = match.scoringMode || tournament.scoringMode || ScoringMode.AMERICANO;
  const pointsToPlayLocal = match.pointsToPlay || tournament.pointsToPlay || 21;
  const setsToPlayLocal = match.setsToPlay || tournament.setsToPlay || 1;
  const gamesPerSetLocal = match.gamesPerSet || tournament.gamesPerSet || 6;
  const useGoldenPointLocal = match.useGoldenPoint ?? tournament.useGoldenPoint ?? true;
  
  // Real-time sync for collaboration
  useEffect(() => {
    setScore1(match.score1);
    setScore2(match.score2);
    setSets1(match.sets1);
    setSets2(match.sets2);
    setPoints1(match.points1 ?? (match.scoringMode === ScoringMode.TENNIS ? '0' : 0));
    setPoints2(match.points2 ?? (match.scoringMode === ScoringMode.TENNIS ? '0' : 0));
    setIsTiebreak(match.isTiebreak ?? false);
    setServerIndex(match.serverIndex);
  }, [
    match.score1, 
    match.score2, 
    match.sets1, 
    match.sets2, 
    match.points1, 
    match.points2, 
    match.isTiebreak, 
    match.serverIndex
  ]);

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
          displayName: user?.displayName || 'Guest',
          photoURL: user?.photoURL || null,
          email: user?.email || 'Guest'
        });
      } catch (error) {
        console.error('Error registering presence:', error);
      }
    };

    registerPresence();

    const q = query(collection(db, `tournaments/${match.tournamentId}/matches/${match.id}/presence`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPresenceUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      deleteDoc(presenceRef).catch(err => console.error('Error removing presence:', err));
    };
  }, [match.id, match.tournamentId, user]);

  const pushToHistory = () => {
    setHistory([...history, { score1, score2, sets1, sets2, points1, points2, isTiebreak, serverIndex }]);
    setRedoStack([]);
  };

  const handleScore = (team: 1 | 2, delta: number) => {
    pushToHistory();
    
    if (scoringMode === ScoringMode.TENNIS) {
      if (delta < 0) {
        // Simple decrement for undo-like behavior without full history
        if (isTiebreak) {
          if (team === 1) setPoints1(Math.max(0, Number(points1) - 1));
          else setPoints2(Math.max(0, Number(points2) - 1));
        } else {
          // decrement points 15->0 etc.
          const pts = team === 1 ? points1 : points2;
          const idx = TENNIS_POINTS.indexOf(String(pts));
          if (idx > 0) {
            if (team === 1) setPoints1(TENNIS_POINTS[idx - 1]);
            else setPoints2(TENNIS_POINTS[idx - 1]);
          }
        }
        return;
      }

      // Increment
      const currentPoints = team === 1 ? points1 : points2;
      const opponentPoints = team === 1 ? points2 : points1;
      
      const { nextPoint, gameWon } = checkGameWin(
        currentPoints, 
        opponentPoints, 
        isTiebreak, 
        useGoldenPointLocal
      );
      
      if (gameWon) {
        // Win Game
        const newScore1 = team === 1 ? score1 + 1 : score1;
        const newScore2 = team === 2 ? score2 + 1 : score2;
        
        const targetGames = gamesPerSetLocal;
        if (checkSetWin(newScore1, newScore2, targetGames)) {
          // Win Set
          const newSets1 = [...sets1, newScore1];
          const newSets2 = [...sets2, newScore2];
          setSets1(newSets1);
          setSets2(newSets2);
          setScore1(0);
          setScore2(0);
          setPoints1('0');
          setPoints2('0');
          setIsTiebreak(false);

          // Check Match Win
          const setsNeeded = setsToPlayLocal === 1 ? 1 : Math.ceil(setsToPlayLocal / 2);
          const wins1 = newSets1.filter((s, i) => s > newSets2[i]).length;
          const wins2 = newSets2.filter((s, i) => s > newSets1[i]).length;

          if (wins1 >= setsNeeded || wins2 >= setsNeeded) {
            // Auto complete if matched reached
            onUpdate({
              score1: 0, score2: 0, 
              sets1: newSets1, sets2: newSets2,
              status: MatchStatus.COMPLETED,
              winner: wins1 >= setsNeeded ? 1 : 2
            });
            onBack();
          }
        } else {
          setScore1(newScore1);
          setScore2(newScore2);
          setPoints1('0');
          setPoints2('0');
          
          // Check for Tiebreak start
          if (newScore1 === targetGames && newScore2 === targetGames) {
            setIsTiebreak(true);
            setPoints1(0); // number for tiebreak
            setPoints2(0);
          }
        }
        
        // Server changes every game in tennis
        setServerIndex((serverIndex + 1) % 4);
      } else {
        // Point update
        if (team === 1) {
          setPoints1(nextPoint);
          // Special case: if I got 40 and opponent was Ad, opponent becomes 40
          if (!useGoldenPointLocal && nextPoint === '40' && points2 === 'Ad') setPoints2('40');
        } else {
          setPoints2(nextPoint);
          if (!useGoldenPointLocal && nextPoint === '40' && points1 === 'Ad') setPoints1('40');
        }

        // Server change in tiebreak every 2 points (except first)
        if (isTiebreak) {
          const totalPoints = Number(points1) + Number(points2) + 1;
          if (totalPoints % 2 === 1) {
             setServerIndex((serverIndex + 1) % 4);
          }
        }
      }
    } else {
      if (team === 1) setScore1(Math.max(0, score1 + delta));
      else setScore2(Math.max(0, score2 + delta));
    }
  };

  const handleScoreSet = (team: 1 | 2, value: any) => {
    pushToHistory();
    if (scoringMode === ScoringMode.TENNIS) {
       if (team === 1) setPoints1(value);
       else setPoints2(value);
    } else {
      if (team === 1) setScore1(Math.min(99, Math.max(0, Number(value))));
      else setScore2(Math.min(99, Math.max(0, Number(value))));
    }
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
    setRedoStack([...redoStack, { score1, score2, sets1, sets2, serverIndex, points1, points2, isTiebreak }]);
    setHistory(history.slice(0, -1));
    setScore1(prev.score1);
    setScore2(prev.score2);
    setSets1(prev.sets1);
    setSets2(prev.sets2);
    setPoints1(prev.points1);
    setPoints2(prev.points2);
    setIsTiebreak(prev.isTiebreak);
    setServerIndex(prev.serverIndex);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory([...history, { score1, score2, sets1, sets2, serverIndex, points1, points2, isTiebreak }]);
    setRedoStack(redoStack.slice(0, -1));
    setScore1(next.score1);
    setScore2(next.score2);
    setSets1(next.sets1);
    setSets2(next.sets2);
    setPoints1(next.points1);
    setPoints2(next.points2);
    setIsTiebreak(next.isTiebreak);
    setServerIndex(next.serverIndex);
  };

  const handleServerChange = (idx: number) => {
    pushToHistory();
    setServerIndex(idx);
  };
  
  const resetMatch = () => {
    if (!window.confirm('Are you sure you want to reset this match? All current scores and points will be lost.')) return;
    
    const settings = match.isPlayoff ? tournament.playoffSettings : tournament.qualifierSettings;
    const effectiveScoringMode = settings?.scoringMode || scoringMode;
    
    setScore1(0);
    setScore2(0);
    setSets1([]);
    setSets2([]);
    setPoints1(effectiveScoringMode === ScoringMode.TENNIS ? '0' : 0);
    setPoints2(effectiveScoringMode === ScoringMode.TENNIS ? '0' : 0);
    setIsTiebreak(false);
    setServerIndex(0);
    setHistory([]);
    setRedoStack([]);

    onUpdate({
      score1: 0, score2: 0, sets1: [], sets2: [],
      points1: effectiveScoringMode === ScoringMode.TENNIS ? '0' : 0,
      points2: effectiveScoringMode === ScoringMode.TENNIS ? '0' : 0,
      isTiebreak: false,
      status: MatchStatus.PENDING,
      scoringMode: effectiveScoringMode,
      pointsToPlay: settings?.pointsToPlay || pointsToPlayLocal,
      setsToPlay: settings?.setsToPlay || setsToPlayLocal,
      gamesPerSet: settings?.gamesPerSet || gamesPerSetLocal,
      useGoldenPoint: settings?.useGoldenPoint ?? useGoldenPointLocal
    });
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
      points1, points2, isTiebreak,
      serverIndex, status: MatchStatus.IN_PROGRESS
    });
  };

  const complete = () => {
    let winner: 1 | 2;
    const wins1 = sets1.filter((s, i) => s > sets2[i]).length;
    const wins2 = sets2.filter((s, i) => s > sets1[i]).length;

    if (scoringMode === ScoringMode.TENNIS) {
      if (wins1 === wins2) {
        // Current set determines it
        winner = score1 > score2 ? 1 : 2;
      } else {
        winner = wins1 > wins2 ? 1 : 2;
      }
    } else {
      const s1 = wins1 + (score1 > score2 ? 1 : 0);
      const s2 = wins2 + (score2 > score1 ? 1 : 0);
      winner = s1 > s2 ? 1 : 2;
    }

    onUpdate({
      score1, score2, sets1, sets2,
      points1, points2, isTiebreak,
      status: MatchStatus.COMPLETED,
      winner
    });

    // Celebration Gimmick
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fa4615', '#8A9A5B', '#ffffff']
    });

    // Detect Grand Final
    const isFinal = match.isPlayoff && !match.nextMatchId;
    if (isFinal || forceCelebration) {
      setMatchWinner(winner);
      setShowChampionOverlay(true);
    } else {
      onBack();
    }
  };

  const isTargetReached = (score1 + score2) >= pointsToPlayLocal;

  const getTeamName = (playerNames: string[]) => {
    if (!tournament.mode.includes('Team')) return null;
    const p = tournament.players.find(p => p.name === playerNames[0]);
    return p?.teamName || null;
  };

  return (
    <>
      <AnimatePresence>
        {showChampionOverlay && matchWinner && (
          <ChampionOverlay 
            teamName={getTeamName(matchWinner === 1 ? match.team1 : match.team2)}
            players={matchWinner === 1 ? match.team1 : match.team2}
            onContinue={onBack}
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10"
      >
        <div className="space-y-8">
          <div className="relative flex items-center justify-between">
            <div className="flex-1 flex items-center gap-4">
              <button onClick={onBack} className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-all">
                <ArrowLeft className="w-6 h-6 text-on-surface" />
              </button>
              {tournament.isKatapgama && (
                <KatapgamaLogo className="w-12 h-12" />
              )}
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
              {scoringMode === ScoringMode.AMERICANO && (
                <motion.div layout className={`px-8 py-3 rounded-full shadow-lg flex items-center gap-3 whitespace-nowrap transition-colors duration-500 ${isTargetReached ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-on-surface'}`}>
                  {isTargetReached ? (
                    <>
                      <Trophy className="w-5 h-5" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Target Reached</span>
                    </>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Target: {pointsToPlayLocal}</span>
                  )}
                </motion.div>
              )}
              {scoringMode === ScoringMode.TENNIS && (
                <motion.div layout className="px-8 py-3 rounded-full shadow-lg flex items-center gap-3 whitespace-nowrap bg-surface-container-low text-on-surface">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                    {isTiebreak ? 'Tie-break' : `${setsToPlayLocal === 1 ? '1 Set' : `Best of ${setsToPlayLocal}`} | ${gamesPerSetLocal} Games`}
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex-1 flex justify-end items-center gap-4">
              <div className="flex bg-surface-container-low p-1 rounded-2xl">
                <button onClick={undo} disabled={history.length === 0} className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface"><Undo2 className="w-5 h-5" /></button>
                <button onClick={redo} disabled={redoStack.length === 0} className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface"><Redo2 className="w-5 h-5" /></button>
              </div>
              <div className="flex bg-surface-container-low p-1 rounded-2xl">
              <button 
                onClick={() => setForceCelebration(!forceCelebration)} 
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${forceCelebration ? 'bg-[#fa4615] text-white shadow-lg shadow-[#fa4615]/20' : 'hover:bg-surface-container-lowest text-on-surface/40'}`}
                title="Force Champion Ceremony"
              >
                <PartyPopper className={`w-5 h-5 ${forceCelebration ? 'animate-bounce' : ''}`} />
                {forceCelebration && <span className="text-[10px] font-black uppercase tracking-widest pr-1">Ceremony On</span>}
              </button>
            </div>
            
            <button onClick={save} className="flex items-center gap-3 bg-surface-container-low text-on-surface px-8 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all">
                <Save className="w-5 h-5" />
                <span>Save</span>
              </button>
              <button 
                onClick={resetMatch} 
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-surface-container-low hover:bg-on-surface/5 transition-all text-on-surface/40 hover:text-on-surface font-black uppercase tracking-[0.2em] text-[10px]"
              >
                <RotateCcw className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
                <span>Reset Match</span>
              </button>
            </div>
          </div>

          {presenceUsers.length > 1 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-black text-on-surface">Collaboration Mode</p>
                  <p className="text-sm font-bold text-on-surface/40 leading-tight">Multiple users are currently scoring this match.</p>
                </div>
              </div>

              <div className="flex -space-x-4">
                {presenceUsers.map((u, i) => (
                  <div 
                    key={u.id} 
                    className="group relative"
                    style={{ zIndex: presenceUsers.length - i }}
                  >
                    {u.photoURL ? (
                      <img 
                        src={u.photoURL} 
                        alt={u.displayName} 
                        className="w-14 h-14 rounded-2xl border-4 border-surface shadow-xl hover:-translate-y-1 transition-transform cursor-help"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl border-4 border-surface bg-primary-container text-on-primary-container flex items-center justify-center font-black text-lg shadow-xl hover:-translate-y-1 transition-transform cursor-help">
                        {u.displayName[0]}
                      </div>
                    )}
                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-on-surface text-surface text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                      {u.displayName} {u.userId === user?.uid ? '(You)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Full-width Court */}
          <div className="w-full">
            <PadelCourt 
              team1={match.team1} team2={match.team2} 
              serverIndex={serverIndex}
              team1Name={getTeamName(match.team1)}
              team2Name={getTeamName(match.team2)}
              score1={score1} score2={score2}
              points1={points1} points2={points2}
              isTiebreak={isTiebreak}
              scoringMode={scoringMode}
              onScoreUpdate={handleScore}
              onScoreSet={handleScoreSet}
              onServerChange={handleServerChange}
              pointsToPlay={pointsToPlayLocal}
            />
          </div>

          {/* Controls & History in Next Row */}
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="w-full max-w-md">
              <button 
                onClick={complete} 
                className="w-full bg-[#fa4615] text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-[#fa4615]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Confirm Match Result
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
