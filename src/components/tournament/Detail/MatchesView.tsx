import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, Play, Users } from 'lucide-react';
import { Match, MatchStatus, Player } from '../../../types';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';

interface MatchesViewProps {
  matches: Match[];
  onSelectMatch: (m: Match) => void;
  stage: number;
  players: Player[];
}

export const MatchesView = ({ matches, onSelectMatch, stage, players }: MatchesViewProps) => {
  const getTeamName = (playerNames: string[]) => {
    if (!playerNames.length) return null;
    const player = players.find(p => p.name === playerNames[0]);
    if (player?.teamName) return player.teamName;
    return null;
  };

  const stageMatches = matches
    .filter(m => m.stage === stage)
    .sort((a, b) => (a.matchIndex || 0) - (b.matchIndex || 0) || a.id!.localeCompare(b.id!));

  const courts = Array.from(new Set(stageMatches.map(m => m.court || 1))).sort((a, b) => a - b);
  const gridColsClass = courts.length === 1 
    ? 'grid-cols-1' 
    : courts.length === 2 
      ? 'grid-cols-1 md:grid-cols-2' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={`grid ${gridColsClass} gap-8`}>
      {courts.map(court => (
        <div key={court} className="flex flex-col gap-6">
          {stageMatches.filter(m => (m.court || 1) === court).map((m) => (
            <MatchCard 
              key={m.id} 
              m={m} 
              onSelectMatch={onSelectMatch} 
              getTeamName={getTeamName} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const MatchCard = ({ m, onSelectMatch, getTeamName }: { m: Match, onSelectMatch: (m: Match) => void, getTeamName: (names: string[]) => string | null }) => {
  const [presenceUsers, setPresenceUsers] = useState<any[]>([]);

  useEffect(() => {
    if (m.isSkeleton || m.status === MatchStatus.COMPLETED) return;
    
    const q = query(collection(db, `tournaments/${m.tournamentId}/matches/${m.id}/presence`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPresenceUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [m.id, m.tournamentId, m.isSkeleton, m.status]);

  return (
    <motion.div 
      whileHover={!m.isSkeleton ? { y: -4 } : {}}
      onClick={() => !m.isSkeleton && onSelectMatch(m)}
      className={`bg-surface-container-lowest p-8 pt-12 rounded-2xl shadow-sm transition-all flex flex-col group relative overflow-hidden ${m.isSkeleton ? 'opacity-40 cursor-default' : 'hover:shadow-2xl hover:shadow-on-surface/5 cursor-pointer border border-on-surface/5'}`}
    >
      {!m.isSkeleton && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />}
      
      {/* Court Tag */}
      {m.court && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-surface-container-low rounded-bl-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9A5B]">
            Court {m.court}
          </span>
        </div>
      )}

      {/* Presence Icons */}
      <AnimatePresence>
        {presenceUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-12 right-6 flex -space-x-3"
          >
            {presenceUsers.map((u, i) => (
              <div key={i} className="relative group/user">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-lg border-2 border-surface-container-lowest shadow-md" />
                ) : (
                  <div className="w-8 h-8 rounded-lg border-2 border-surface-container-lowest bg-primary/20 text-primary flex items-center justify-center font-black text-[10px]">
                    {u.displayName[0]}
                  </div>
                )}
              </div>
            ))}
            <div className="ml-4 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
        <div className="text-center sm:text-right flex flex-col gap-1">
          {getTeamName(m.team1) && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9A5B] mb-1">
              {getTeamName(m.team1)}
            </p>
          )}
          {m.team1.length > 0 ? m.team1.map((p, i) => (
            <p key={i} className="font-bold text-lg text-on-surface truncate">{p}</p>
          )) : <p className="font-bold text-sm text-on-surface/20 italic tracking-wider">TBD</p>}
        </div>
        
        <div className="flex flex-col items-center justify-center">
          {m.isSkeleton ? (
            <div className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface/20 text-[10px] font-bold uppercase tracking-widest">
              Upcoming
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                {(m.sets1 || []).map((s, i) => <span key={i} className="text-on-surface/20 font-bold text-xs">{s}</span>)}
                <span className={`text-3xl font-black tabular-nums tracking-tighter ${m.status === MatchStatus.COMPLETED && (m.score1 || 0) > (m.score2 || 0) ? 'text-primary' : 'text-on-surface'}`}>{m.score1 || 0}</span>
              </div>
              <span className="text-on-surface/10 font-bold text-xl">:</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-3xl font-black tabular-nums tracking-tighter ${m.status === MatchStatus.COMPLETED && (m.score2 || 0) > (m.score1 || 0) ? 'text-primary' : 'text-on-surface'}`}>{m.score2 || 0}</span>
                {(m.sets2 || []).map((s, i) => <span key={i} className="text-on-surface/20 font-bold text-xs">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="text-center sm:text-left flex flex-col gap-1">
           {getTeamName(m.team2) && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9A5B] mb-1">
              {getTeamName(m.team2)}
            </p>
          )}
          {m.team2.length > 0 ? m.team2.map((p, i) => (
            <p key={i} className="font-bold text-lg text-on-surface truncate">{p}</p>
          )) : <p className="font-bold text-sm text-on-surface/20 italic tracking-wider">TBD</p>}
        </div>
      </div>

      <div className={`mt-6 p-2 rounded-xl transition-all text-on-surface flex items-center justify-center ${m.isSkeleton ? 'bg-surface-container-low/30' : 'bg-surface-container-low group-hover:bg-primary-container group-hover:text-on-primary-container group-hover:shadow-lg shadow-primary/10'}`}>
        {m.isSkeleton ? (
          <div className="w-4 h-4 border-2 border-on-surface/5 rounded-full" />
        ) : m.status === MatchStatus.COMPLETED ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Match Completed</span>
          </div>
        ) : m.status === MatchStatus.IN_PROGRESS ? (
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Now</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Entry Round Score</span>
             <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
