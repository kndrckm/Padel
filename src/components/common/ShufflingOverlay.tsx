import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Match, Player } from '../../types';

interface ShufflingOverlayProps {
  matches: Match[];
  players: Player[];
  onComplete: () => void;
}

export const ShufflingOverlay = ({ matches, players, onComplete }: ShufflingOverlayProps) => {
  const [phase, setPhase] = useState<'initial' | 'shuffling' | 'dealing' | 'settled'>('initial');

  useEffect(() => {
    // Phase 1: Show deck (delayed slightly)
    const t1 = setTimeout(() => setPhase('shuffling'), 500);
    // Phase 2: Dealing cards
    const t2 = setTimeout(() => setPhase('dealing'), 2000);
    // Phase 3: Finish
    const t3 = setTimeout(() => setPhase('settled'), 4000);
    // Callback
    const t4 = setTimeout(onComplete, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const getTeamName = (playerNames: string[]) => {
    if (!playerNames.length) return null;
    const player = players.find(p => p.name === playerNames[0]);
    return player?.teamName || null;
  };

  const courts = Array.from(new Set(matches.map(m => m.court || 1))).sort((a, b) => a - b);
  const gridColsClass = courts.length === 1 
    ? 'grid-cols-1' 
    : courts.length === 2 
      ? 'grid-cols-1 md:grid-cols-2' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-on-surface/90 backdrop-blur-md flex items-center justify-center overflow-hidden"
    >
      {/* Background Skeleton Grid */}
      <AnimatePresence>
        {phase === 'dealing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            className={`absolute inset-0 max-w-7xl mx-auto px-6 md:px-12 py-32 grid ${gridColsClass} gap-8 pointer-events-none`}
          >
            {courts.map(court => (
              <div key={court} className="flex flex-col gap-6">
                {matches.filter(m => (m.court || 1) === court).map((m, i) => (
                  <div key={i} className="bg-surface h-48 rounded-2xl border-2 border-dashed border-surface-container-highest" />
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-full h-full flex items-center justify-center">
        {matches.map((match, idx) => (
          <div key={match.id || idx}>
            <ShuffleCard 
              match={match} 
              phase={phase} 
              index={idx} 
              total={matches.length}
              teamName1={getTeamName(match.team1)}
              teamName2={getTeamName(match.team2)}
              gridColsClass={gridColsClass}
              courtIndex={courts.indexOf(match.court || 1)}
              matchInCourtIndex={matches.filter(m => (m.court || 1) === (match.court || 1)).indexOf(match)}
            />
          </div>
        ))}
      </div>

      {/* Progress Message */}
      <motion.div 
        animate={{ y: phase === 'settled' ? 100 : 0, opacity: phase === 'settled' ? 0 : 1 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
      >
        <p className="text-[#fa4615] font-black uppercase tracking-[0.4em] text-sm animate-pulse mb-2">
          {phase === 'initial' && 'Initializing Matchmaking...'}
          {phase === 'shuffling' && 'Optimizing Fair Pairings...'}
          {phase === 'dealing' && 'Assigning Courts...'}
        </p>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">
          KATAPGAMA TOURNAMENT ENGINE
        </p>
      </motion.div>
    </motion.div>
  );
};

const ShuffleCard = ({ 
  match, phase, index, total, teamName1, teamName2, gridColsClass, courtIndex, matchInCourtIndex 
}: { 
  match: Match, phase: string, index: number, total: number, teamName1: string | null, teamName2: string | null,
  gridColsClass: string, courtIndex: number, matchInCourtIndex: number
}) => {
  // Target position logic: 
  // We need to approximate the grid positions
  // This is tricky without knowing the exact screen coordinates.
  // Instead, we will use a "Stage 2" layout grid inside the overlay as the target.
  
  const isDealing = phase === 'dealing' || phase === 'settled';
  
  if (isDealing) {
    return (
      <motion.div 
        layoutId={`match-${match.id}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
        }}
        className="absolute inset-0 max-w-7xl mx-auto px-6 md:px-12 py-32 pointer-events-none"
      >
        <div className={`grid ${gridColsClass} gap-8 w-full h-full`}>
          {/* We only render the one card in its specific slot */}
          {Array.from({ length: 3 }).map((_, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-6">
              {cIdx === courtIndex && Array.from({ length: 6 }).map((_, mIdx) => (
                mIdx === matchInCourtIndex ? (
                  <motion.div 
                    key={mIdx}
                    layoutId={`card-inner-${index}`}
                    animate={{ 
                      backgroundColor: phase === 'settled' ? 'rgba(250, 70, 21, 0)' : '#fa4615',
                      borderColor: phase === 'settled' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0)',
                    }}
                    className="p-6 rounded-2xl shadow-2xl flex flex-col justify-center items-center h-48 text-white border-2 font-bold"
                  >
                     <div className="flex flex-col items-center gap-1 mb-4">
                        {teamName1 && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{teamName1}</span>}
                        <span className="font-black text-xs uppercase text-center">{match.team1.join(' & ')}</span>
                     </div>
                     <div className="w-8 h-px bg-white/20 mb-4" />
                     <div className="flex flex-col items-center gap-1">
                        {teamName2 && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{teamName2}</span>}
                        <span className="font-black text-xs uppercase text-center">{match.team2.join(' & ')}</span>
                     </div>
                  </motion.div>
                ) : (
                  <div key={mIdx} className="h-48 invisible" />
                )
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Shuffling phase
  return (
    <motion.div
      layoutId={`card-inner-${index}`}
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        rotate: phase === 'shuffling' ? (Math.random() * 20 - 10) : 0,
        x: phase === 'shuffling' ? (Math.random() * 100 - 50) : 0,
        y: phase === 'shuffling' ? (Math.random() * 100 - 50) : 0,
        zIndex: total - index
      }}
      className="absolute w-48 h-64 bg-[#fa4615] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 border-4 border-on-surface/5"
    >
      <div className="w-12 h-12 bg-on-surface/5 rounded-full flex items-center justify-center mb-4">
        <span className="text-on-surface/20 font-black">?</span>
      </div>
      <div className="space-y-2 w-full">
        <div className="h-2 bg-on-surface/10 rounded-full w-full" />
        <div className="h-2 bg-on-surface/10 rounded-full w-2/3" />
      </div>
    </motion.div>
  );
};
