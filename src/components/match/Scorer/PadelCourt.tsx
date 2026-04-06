import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { PadelBall } from '../../common/Icons';

interface PlayerMarkerProps {
  name: string;
  isServer: boolean;
  onClick: () => void;
}

const PlayerMarker = ({ name, isServer, onClick }: PlayerMarkerProps) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer group"
    >
      <motion.div 
        initial={false}
        animate={isServer ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-xl transition-all duration-500 ${isServer ? 'bg-[#FDE047] border-white' : 'bg-white/10 border-white/30 backdrop-blur-md group-hover:bg-white/20'}`}
      >
        <span className={`text-xs font-bold ${isServer ? 'text-[#1A1A1A]' : 'text-white'}`}>
          {name.split(' ').map(n => n[0]).join('')}
        </span>
        {isServer && (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[#FDE047] rounded-full flex items-center justify-center shadow-md border border-white"
          >
            <PadelBall className="w-4 h-4 text-[#1A1A1A]" />
          </motion.div>
        )}
      </motion.div>
      <span className="text-[10px] font-bold text-white drop-shadow-md whitespace-nowrap group-hover:text-[#FDE047] transition-colors">{name}</span>
    </div>
  );
};

interface PadelCourtProps {
  team1: string[];
  team2: string[];
  serverIndex: number;
  team1Name: string | null;
  team2Name: string | null;
  score1: number;
  score2: number;
  onScoreUpdate: (team: 1 | 2, delta: number) => void;
  onScoreSet: (team: 1 | 2, value: number) => void;
  onServerChange: (idx: number) => void;
  pointsToPlay: number;
}

export const PadelCourt = ({ 
  team1, 
  team2, 
  serverIndex, 
  team1Name, 
  team2Name,
  score1,
  score2,
  onScoreUpdate,
  onScoreSet,
  onServerChange,
  pointsToPlay
}: PadelCourtProps) => {
  const handleInputChange = (team: 1 | 2, val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 2);
    const num = sanitized === '' ? 0 : parseInt(sanitized);
    onScoreSet(team, num);
  };

  return (
    <div className="w-full mt-8">
      <div className="relative aspect-[2/1] bg-[#8A9A5B] rounded-[2.5rem] overflow-hidden">
        {/* Court Lines */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 border-r-[3px] border-white relative">
            <div className="absolute top-0 left-[30%] w-[3px] h-full bg-white" />
            <div className="absolute top-1/2 left-[30%] w-[70%] h-[3px] bg-white -translate-y-1/2" />
          </div>
          <div className="flex-1 relative">
            <div className="absolute top-0 right-[30%] w-[3px] h-full bg-white" />
            <div className="absolute top-1/2 right-[30%] w-[70%] h-[3px] bg-white -translate-y-1/2" />
          </div>
        </div>

        {/* Net */}
        <div className="absolute top-0 left-1/2 w-1.5 h-full bg-white/40 backdrop-blur-sm -translate-x-1/2 flex flex-col justify-between py-4">
          <div className="w-6 h-1.5 bg-white -translate-x-2 rounded-full shadow-sm" />
          <div className="w-6 h-1.5 bg-white -translate-x-2 rounded-full shadow-sm" />
        </div>

        {/* Team Names */}
        <div className="absolute inset-y-0 left-4 flex items-center">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180">
            {team1Name || 'Team 1'}
          </span>
        </div>
        <div className="absolute inset-y-0 right-4 flex items-center">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] [writing-mode:vertical-lr]">
            {team2Name || 'Team 2'}
          </span>
        </div>

        {/* Score Controls */}
        <div className="absolute inset-x-[15%] inset-y-0 flex pointer-events-none">
          <div className="flex-1 relative">
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <input
                type="text"
                inputMode="numeric"
                value={score1}
                onChange={(e) => handleInputChange(1, e.target.value)}
                className="w-64 bg-transparent text-9xl font-black text-white text-center outline-none drop-shadow-lg tabular-nums focus:scale-110 transition-transform"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(1, 1)}
                className="w-32 h-32 rounded-[2.5rem] bg-[#FDE047] text-[#1A1A1A] flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-2xl shadow-[#FDE047]/30"
              >
                <Plus className="w-16 h-16" />
              </button>
            </div>
            <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(1, -1)}
                className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <input
                type="text"
                inputMode="numeric"
                value={score2}
                onChange={(e) => handleInputChange(2, e.target.value)}
                className="w-64 bg-transparent text-9xl font-black text-white text-center outline-none drop-shadow-lg tabular-nums focus:scale-110 transition-transform"
              />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(2, 1)}
                className="w-32 h-32 rounded-[2.5rem] bg-[#FDE047] text-[#1A1A1A] flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-2xl shadow-[#FDE047]/30"
              >
                <Plus className="w-16 h-16" />
              </button>
            </div>
            <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(2, -1)}
                className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-[7.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team1[0]} isServer={serverIndex === 0} onClick={() => onServerChange(0)} />
          </div>
          <div className="absolute top-3/4 left-[7.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team1[1]} isServer={serverIndex === 1} onClick={() => onServerChange(1)} />
          </div>
          <div className="absolute top-1/4 right-[7.5%] translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team2[0]} isServer={serverIndex === 2} onClick={() => onServerChange(2)} />
          </div>
          <div className="absolute top-3/4 right-[7.5%] translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team2[1]} isServer={serverIndex === 3} onClick={() => onServerChange(3)} />
          </div>
        </div>
      </div>
    </div>
  );
};
