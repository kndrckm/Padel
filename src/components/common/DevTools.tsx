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
        let winner: 1 | 2 | undefined = undefined;
        if (score1 > score2) winner = 1;
        else if (score1 < score2) winner = 2;
        
        batch.update(matchRef, {
          score1,
          score2,
          status: MatchStatus.COMPLETED,
          winner
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
        const tMatches = mSnap.docs.map(d => ({ ...d.data(), id: d.id } as Match));
        
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
            const aTotal = a.gamesWon + (a.missedPoints || 0);
            const bTotal = b.gamesWon + (b.missedPoints || 0);
            const aDiff = a.gamesWon - a.gamesLost;
            const bDiff = b.gamesWon - b.gamesLost;
            
            if (bTotal !== aTotal) return bTotal - aTotal;
            if (bDiff !== aDiff) return bDiff - aDiff;
            if (b.wins !== a.wins) return b.wins - a.wins;

            // Tie Breaker: Head-to-Head
            const h2hMatches = matches.filter(m => {
              const team1 = m.team1.join(' & ');
              const team2 = m.team2.join(' & ');
              return (team1 === a.name && team2 === b.name) || (team1 === b.name && team2 === a.name);
            });

            if (h2hMatches.length > 0) {
              let aH2h = 0, bH2h = 0;
              h2hMatches.forEach(m => {
                const isT1 = m.team1.join(' & ') === a.name;
                aH2h += isT1 ? m.score1 : m.score2;
                bH2h += isT1 ? m.score2 : m.score1;
              });
              if (bH2h !== aH2h) return bH2h - aH2h;
            }

            // Tie Breaker 2: Buchholz
            const getBuchholz = (name: string) => {
              let score = 0;
              matches.forEach(m => {
                const t1 = m.team1.join(' & ');
                const t2 = m.team2.join(' & ');
                if (t1 === name) score += (stats[t2]?.gamesWon || 0);
                else if (t2 === name) score += (stats[t1]?.gamesWon || 0);
              });
              return score;
            };

            return getBuchholz(b.name) - getBuchholz(a.name);
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

  const runLifecycleAudit = async () => {
    setIsProcessing(true);
    setStatus('🚀 Initializing Lifecycle Audit...');

    const katapgamaPlayers = [];
    KATAPGAMA_TEAMS.forEach(t => {
      katapgamaPlayers.push({ name: t.name, gender: 'man', teamName: t.teamName });
      katapgamaPlayers.push({ name: t.partner, gender: 'man', teamName: t.teamName });
    });

    try {
      // 1. CREATE TOURNAMENT
      setStatus('Creating Test Tournament...');
      const tournamentId = await createTournament(
        user.uid,
        `LIFECYCLE-AUDIT-${new Date().getTime()}`,
        GameMode.KATAPGAMA_FUN_PADEL,
        katapgamaPlayers,
        2, 16, ScoringMode.AMERICANO, 
        2, 1, 8, 'single', 
        GameMode.TEAM_MEXICANO, GameMode.SINGLE_ELIMINATION
      );

      const getSnapshot = async (id: string) => {
        const mSnap = await getDocs(collection(db, `tournaments/${id}/matches`));
        return mSnap.docs.map(d => ({ ...d.data(), id: d.id } as Match));
      };

      const calculateAuditLeaderboard = (matchesList: Match[], tData: any) => {
        const stats: Record<string, any> = {};
        tData.players.forEach((p: any) => {
          const name = p.teamName || p.name;
          if (!stats[name]) stats[name] = { 
            name, wins: 0, gamesWon: 0, gamesLost: 0, diff: 0, totalPoints: 0, matchedWith: [] 
          };
        });

        matchesList.filter(m => m.status === MatchStatus.COMPLETED).forEach(m => {
          const resolveTeam = (pNames: string[]) => {
            const p = tData.players.find((p: any) => p.name === pNames[0]);
            return p?.teamName || pNames[0];
          };
          const t1 = resolveTeam(m.team1);
          const t2 = resolveTeam(m.team2);

          stats[t1].matchedWith.push(t2);
          stats[t2].matchedWith.push(t1);
          stats[t1].gamesWon += m.score1;
          stats[t1].gamesLost += m.score2;
          stats[t2].gamesWon += m.score2;
          stats[t2].gamesLost += m.score1;
          stats[t1].diff = stats[t1].gamesWon - stats[t1].gamesLost;
          stats[t2].diff = stats[t2].gamesWon - stats[t2].gamesLost;

          if (m.winner === 1) stats[t1].wins++;
          else if (m.winner === 2) stats[t2].wins++;
        });

        return Object.values(stats).sort((a: any, b: any) => 
          (b.gamesWon - a.gamesWon) || (b.diff - a.diff) || (b.wins - a.wins)
        );
      };

      // 2. RANDOMIZE STAGE 1
      setStatus('Simulating Stage 1...');
      const s1Matches = await getSnapshot(tournamentId);
      const batch1 = writeBatch(db);
      s1Matches.forEach(m => {
        const s1 = Math.floor(Math.random() * 17);
        const s2 = 16 - s1;
        batch1.update(doc(db, `tournaments/${tournamentId}/matches/${m.id}`), {
          score1: s1, score2: s2, status: MatchStatus.COMPLETED, winner: s1 > s2 ? 1 : (s1 < s2 ? 2 : undefined)
        });
      });
      await batch1.commit();

      // 3. SNAPSHOT S1
      const updatedS1 = await getSnapshot(tournamentId);
      const snapshotS1 = calculateAuditLeaderboard(updatedS1, { players: katapgamaPlayers });

      // 4. GENERATE STAGE 2
      setStatus('Generating Stage 2 Pairings...');
      const nextStageMatches = generateNextStageMatches(
        { id: tournamentId, isKatapgama: true, mode: GameMode.KATAPGAMA_FUN_PADEL, players: katapgamaPlayers, currentStage: 1, courtsCount: 2 },
        updatedS1,
        snapshotS1
      );

      const batchGen = writeBatch(db);
      for (const mData of nextStageMatches) {
        const mRef = doc(collection(db, `tournaments/${tournamentId}/matches`));
        batchGen.set(mRef, { ...mData, tournamentId, status: MatchStatus.PENDING, score1: 0, score2: 0, sets1: [], sets2: [] });
      }
      await batchGen.commit();
      await updateDoc(doc(db, `tournaments`, tournamentId), { currentStage: 2 });

      // 5. RANDOMIZE STAGE 2
      setStatus('Simulating Stage 2...');
      const s2Matches = (await getSnapshot(tournamentId)).filter(m => m.stage === 2);
      const batch2 = writeBatch(db);
      s2Matches.forEach(m => {
        const s1 = Math.floor(Math.random() * 17);
        const s2 = 16 - s1;
        batch2.update(doc(db, `tournaments/${tournamentId}/matches/${m.id}`), {
          score1: s1, score2: s2, status: MatchStatus.COMPLETED, winner: s1 > s2 ? 1 : (s1 < s2 ? 2 : undefined)
        });
      });
      await batch2.commit();

      // 6. FINAL SNAPSHOT
      const finalMatches = await getSnapshot(tournamentId);
      const snapshotFinal = calculateAuditLeaderboard(finalMatches, { players: katapgamaPlayers });

      // 7. EXPORT
      const result = {
        tournamentId,
        timestamp: new Date().toISOString(),
        stage1Leaderboard: snapshotS1,
        finalLeaderboard: snapshotFinal,
        allMatches: finalMatches
      };

      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `full_lifecycle_audit_${tournamentId}.json`;
      a.click();

      setStatus('✅ Lifecycle Audit Complete!');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('❌ Audit Failed');
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

                <button 
                  disabled={isProcessing}
                  onClick={runLifecycleAudit}
                  className="w-full group bg-amber-500/10 hover:bg-amber-500 hover:text-white p-6 rounded-3xl flex items-center justify-between transition-all disabled:opacity-50 shadow-lg shadow-amber-500/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:bg-white/20">
                      <Zap className="w-6 h-6 text-amber-500 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Full Lifecycle Audit</p>
                      <p className="text-xs font-medium opacity-40">Complete test: Create → S1 → S2 → Results</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
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
