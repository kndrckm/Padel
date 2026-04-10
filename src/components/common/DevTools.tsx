import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Play, Zap, Trash2, Plus, ArrowRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { createTournament } from '../../lib/tournamentService';
import { GameMode, MatchStatus, ScoringMode, Tournament, Match } from '../../types';
import { KATAPGAMA_TEAMS } from '../../constants';
import { generateNextStageMatches } from '../../utils/tournamentLogic';

interface DevToolsProps {
  user: any;
  currentTournament?: Tournament;
  matches?: Match[];
}

export default function DevTools({ user, currentTournament, matches = [] }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const createBatch = async () => {
    setIsProcessing(true);
    setStatus('Creating 10 Tournaments...');
    
    const katapgamaPlayers = [];
    KATAPGAMA_TEAMS.forEach(t => {
      katapgamaPlayers.push({ name: t.name, gender: 'man', teamName: t.teamName });
      katapgamaPlayers.push({ name: t.partner, gender: 'man', teamName: t.teamName });
    });

    try {
      for (let i = 1; i <= 10; i++) {
        await createTournament(
          user.uid,
          `TEST Katapgama #${i} - ${new Date().toLocaleTimeString()}`,
          GameMode.KATAPGAMA_FUN_PADEL,
          katapgamaPlayers,
          2, // courts
          16, // points
          ScoringMode.AMERICANO,
          2, // stages
          1, // swiss
          8, // playoff teams
          'single',
          GameMode.TEAM_MEXICANO,
          GameMode.SINGLE_ELIMINATION
        );
        setStatus(`Created ${i}/10...`);
      }
      setStatus('Successfully created 10 tournaments!');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Error creating tournaments');
    } finally {
      setIsProcessing(false);
    }
  };

  const randomizeScores = async (stage: number) => {
    if (!currentTournament || !matches.length) return;
    setIsProcessing(true);
    setStatus(`Randomizing Stage ${stage} scores...`);

    const stageMatches = matches.filter(m => m.stage === stage && !m.isPlayoff);
    const batch = writeBatch(db);

    try {
      for (const m of stageMatches) {
        const score1 = Math.floor(Math.random() * 17); // 0-16
        const score2 = 16 - score1;
        
        const matchRef = doc(db, `tournaments/${currentTournament.id}/matches`, m.id!);
        batch.update(matchRef, {
          score1,
          score2,
          status: MatchStatus.COMPLETED,
          winner: score1 >= score2 ? 1 : 2
        });
      }
      await batch.commit();
      setStatus(`Stage ${stage} randomized!`);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Error randomizing scores');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAuditReport = async () => {
    setIsProcessing(true);
    setStatus('Generating Audit Report...');

    try {
      const tQuery = query(collection(db, 'tournaments'), where('creatorId', '==', user.uid));
      const tSnap = await getDocs(tQuery);
      const testTournaments = tSnap.docs.filter(d => d.data().name.includes('TEST'));
      
      const report: any[] = [];

      for (const tDoc of testTournaments) {
        const tData = tDoc.data();
        const mSnap = await getDocs(collection(db, `tournaments/${tDoc.id}/matches`));
        const tMatches = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Match));
        
        // 1. Calculate Leaderboard after Stage 1 to verify Mexicano Logic
        const stage1Matches = tMatches.filter(m => m.stage === 1 && !m.isPlayoff && m.status === MatchStatus.COMPLETED);
        
        const getStats = (matches: Match[]) => {
          const stats: Record<string, any> = {};
          tData.players.forEach((p: any) => {
            const name = p.teamName || p.name;
            if (!stats[name]) stats[name] = { name, wins: 0, gamesWon: 0, gamesLost: 0, totalPoints: 0, matchedWith: [] };
          });

          matches.forEach(m => {
            const team1 = m.team1.join(' & ') || m.team1[0]; // handle team names vs player names
            const team2 = m.team2.join(' & ') || m.team2[0];
            
            // For simple audit, use names directly if they exist
            const t1Name = m.team1.length > 1 ? (tData.players.find((p: any) => p.name === m.team1[0])?.teamName || team1) : team1;
            const t2Name = m.team2.length > 1 ? (tData.players.find((p: any) => p.name === m.team2[0])?.teamName || team2) : team2;

            if (!stats[t1Name]) stats[t1Name] = { name: t1Name, wins: 0, gamesWon: 0, gamesLost: 0, totalPoints: 0, matchedWith: [] };
            if (!stats[t2Name]) stats[t2Name] = { name: t2Name, wins: 0, gamesWon: 0, gamesLost: 0, totalPoints: 0, matchedWith: [] };

            stats[t1Name].matchedWith.push(t2Name);
            stats[t2Name].matchedWith.push(t1Name);
            stats[t1Name].totalPoints += m.score1 || 0;
            stats[t2Name].totalPoints += m.score2 || 0;
            stats[t1Name].gamesWon += m.score1 || 0;
            stats[t1Name].gamesLost += m.score2 || 0;
            stats[t2Name].gamesWon += m.score2 || 0;
            stats[t2Name].gamesLost += m.score1 || 0;

            if (m.winner === 1) stats[t1Name].wins++;
            if (m.winner === 2) stats[t2Name].wins++;
          });

          return Object.values(stats).sort((a: any, b: any) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            const aDiff = a.gamesWon - a.gamesLost;
            const bDiff = b.gamesWon - b.gamesLost;
            if (bDiff !== aDiff) return bDiff - aDiff;
            return b.totalPoints - a.totalPoints;
          });
        };

        const leaderboardS1 = getStats(stage1Matches);
        const stage2Matches = tMatches.filter(m => m.stage === 2 && !m.isPlayoff);
        
        const rankDeltas: string[] = [];
        const repeats: string[] = [];

        stage2Matches.forEach(m => {
          const t1Name = m.team1.length > 1 ? (tData.players.find((p: any) => p.name === m.team1[0])?.teamName || m.team1[0]) : m.team1[0];
          const t2Name = m.team2.length > 1 ? (tData.players.find((p: any) => p.name === m.team2[0])?.teamName || m.team2[0]) : m.team2[0];
          
          const r1 = leaderboardS1.findIndex(s => s.name === t1Name) + 1;
          const r2 = leaderboardS1.findIndex(s => s.name === t2Name) + 1;
          
          if (r1 && r2) {
            rankDeltas.push(`${t1Name} (#${r1}) vs ${t2Name} (#${r2}) - Delta: ${Math.abs(r1 - r2)}`);
          }

          // Check for repeat
          const s1Opponent = leaderboardS1.find(s => s.name === t1Name)?.matchedWith[0];
          if (s1Opponent === t2Name) {
            repeats.push(`REPEAT: ${t1Name} vs ${t2Name} played in both stages!`);
          }
        });

        report.push({
          tournamentName: tData.name,
          tournamentId: tDoc.id,
          summary: {
            totalMatches: tMatches.length,
            repeatsFound: repeats.length,
            avgMexicanoDelta: rankDeltas.length ? (rankDeltas.reduce((acc, d) => acc + parseInt(d.split('Delta: ')[1]), 0) / rankDeltas.length).toFixed(2) : 0
          },
          mexicanoAudit: rankDeltas,
          repeatAudit: repeats,
          leaderboardSnapshot: leaderboardS1
        });
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `padel_audit_report_${new Date().toISOString()}.json`;
      a.click();
      
      setStatus('Audit report downloaded!');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Error generating report');
    } finally {
      setIsProcessing(false);
    }
  };

  const autoAdvance = async () => {
    // Hidden logic as per previous instruction
    setIsProcessing(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-on-surface text-surface rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[9999]"
      >
        <Bug className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-lowest rounded-[2.5rem] shadow-2xl p-10 border border-on-surface/5"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/30">Debug Tools</span>
                  </div>
                  <h2 className="text-3xl font-black text-on-surface italic uppercase tracking-tighter">Automated Testing</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center hover:bg-surface-container-high transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  disabled={isProcessing}
                  onClick={createBatch}
                  className="w-full group bg-surface-container-low hover:bg-on-surface hover:text-surface p-6 rounded-3xl flex items-center justify-between transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-surface/20">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Create 10 Tournaments</p>
                      <p className="text-xs font-medium opacity-40">Katapgama format (16 teams)</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                </button>

                <button 
                  disabled={isProcessing}
                  onClick={generateAuditReport}
                  className="w-full group bg-primary-container/20 hover:bg-primary-container text-on-primary-container p-6 rounded-3xl flex items-center justify-between transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bug className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Audit & Export JSON</p>
                      <p className="text-xs font-medium opacity-40">Verify fairness & pairings</p>
                    </div>
                  </div>
                </button>

                {currentTournament && (
                  <>
                    <div className="pt-4 border-t border-on-surface/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 mb-4 px-2">Current tournament: {currentTournament.name}</p>
                      
                      <button 
                        disabled={isProcessing}
                        onClick={() => randomizeScores(1)}
                        className="w-full group bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container p-6 rounded-3xl flex items-center justify-between transition-all disabled:opacity-50 mb-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Play className="w-6 h-6 text-amber-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg">Randomize Stage 1</p>
                            <p className="text-xs font-medium opacity-40">Scores sum to 16</p>
                          </div>
                        </div>
                      </button>

                      <button 
                        disabled={isProcessing}
                        onClick={() => randomizeScores(2)}
                        className="w-full group bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container p-6 rounded-3xl flex items-center justify-between transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Play className="w-6 h-6 text-amber-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg">Randomize Stage 2</p>
                            <p className="text-xs font-medium opacity-40">Scores sum to 16</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-primary-container/20 rounded-2xl border border-primary/20 text-center"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-primary">{status}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
