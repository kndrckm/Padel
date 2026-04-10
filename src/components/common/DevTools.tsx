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

  const autoAdvance = async () => {
    if (!currentTournament || !matches.length) return;
    setIsProcessing(true);
    setStatus('Generating Stage 2...');

    // We need to calculate the leaderboard first
    // In a real script, we'd calculate it, but here we can just wait for the component to provide it
    // Actually, we can just trigger the same logic as the button in TournamentDetail
    // For this dev tool, we'll assume the user is on the page and can see the button, 
    // OR we can trigger it here if we have the leaderboard.
    setStatus('Please use the "Next Stage" button in the UI for now, or I can implement the full leaderboard calc if needed.');
    setTimeout(() => setStatus(null), 3000);
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
