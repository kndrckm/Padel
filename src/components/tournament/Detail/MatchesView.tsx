import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle, Play } from 'lucide-react';
import { Match, MatchStatus, Player } from '../../../types';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stageMatches.map((m) => (
        <motion.div 
          key={m.id}
          whileHover={!m.isSkeleton ? { y: -4 } : {}}
          onClick={() => !m.isSkeleton && onSelectMatch(m)}
          className={`bg-surface-container-lowest p-8 pt-12 rounded-2xl shadow-sm transition-all flex flex-col group relative overflow-hidden ${m.isSkeleton ? 'opacity-40 cursor-default' : 'hover:shadow-2xl hover:shadow-on-surface/5 cursor-pointer'}`}
        >
          {!m.isSkeleton && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />}
          
          {/* Court Tag at the top */}
          {m.court && (
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-surface-container-low rounded-bl-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8A9A5B]">
                Court {m.court}
              </span>
            </div>
          )}

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-6">
            <div className="text-center sm:text-right flex flex-col gap-1">
              {getTeamName(m.team1) && (
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9A5B] mb-1">
                  {getTeamName(m.team1)}
                </p>
              )}
              {m.team1.length > 0 ? m.team1.map((p, i) => (
                <p key={i} className="font-bold text-lg text-on-surface truncate">{p}</p>
              )) : <p className="font-bold text-sm text-on-surface/20 italic">TBD</p>}
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
                    <span className={`text-3xl font-black ${m.status === MatchStatus.COMPLETED && (m.score1 || 0) > (m.score2 || 0) ? 'text-primary' : 'text-on-surface'}`}>{m.score1 || 0}</span>
                  </div>
                  <span className="text-on-surface/10 font-bold text-xl">:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-3xl font-black ${m.status === MatchStatus.COMPLETED && (m.score2 || 0) > (m.score1 || 0) ? 'text-primary' : 'text-on-surface'}`}>{m.score2 || 0}</span>
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
              )) : <p className="font-bold text-sm text-on-surface/20 italic">TBD</p>}
            </div>
          </div>

          <div className={`mt-6 p-2 rounded-xl transition-colors text-on-surface flex items-center justify-center ${m.isSkeleton ? 'bg-surface-container-low/30' : 'bg-surface-container-low group-hover:bg-primary-container group-hover:text-on-primary-container'}`}>
            {m.isSkeleton ? (
              <div className="w-4 h-4 border-2 border-on-surface/5 rounded-full" />
            ) : m.status === MatchStatus.COMPLETED ? (
              <CheckCircle className="w-5 h-5" />
            ) : m.status === MatchStatus.IN_PROGRESS ? (
              <Play className="w-5 h-5 animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 px-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Entry Score</span>
                 <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
