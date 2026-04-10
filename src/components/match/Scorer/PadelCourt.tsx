import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { PadelBall, ManIcon, WomanIcon } from '../../common/Icons';
import { ScoringMode } from '../../../types';

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
        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-xl transition-all duration-500 ${isServer ? 'bg-[#fa4615] border-white' : 'bg-white/10 border-white/30 backdrop-blur-md group-hover:bg-white/20'}`}
      >
        <span className={`text-xs font-bold ${isServer ? 'text-white' : 'text-white'}`}>
          {name.split(' ').map(n => n[0]).join('')}
        </span>
        {isServer && (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[#fa4615] rounded-full flex items-center justify-center shadow-md border border-white"
          >
            <PadelBall className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.div>
      <span className="text-[10px] font-bold text-white drop-shadow-md whitespace-nowrap group-hover:text-[#fa4615] transition-colors">{name}</span>
    </div>
  );
};

interface ScoreSelectorProps {
  value: string | number;
  options: (string | number)[];
  onSelect: (val: string | number) => void;
  onClose: () => void;
  title: string;
}

const ScoreSelector = ({ value, options, onSelect, onClose, title }: ScoreSelectorProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-surface-container-lowest w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 border border-on-surface/5"
      >
        <div className="mb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface/30 mb-2">{title}</p>
          <h3 className="text-2xl font-black text-on-surface italic uppercase">Select Score</h3>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-9 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); onClose(); }}
              className={`h-16 rounded-2xl font-black text-xl transition-all ${value === opt ? 'bg-[#fa4615] text-white shadow-lg scale-110' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 px-6 bg-on-surface/5 text-on-surface/40 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-on-surface/10 transition-all"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

interface PadelCourtProps {
  team1: string[];
  team2: string[];
  serverIndex: number;
  team1Name: string | null;
  team2Name: string | null;
  score1: number; // Current games in Tennis, Total points in Americano
  score2: number;
  points1?: string | number; // Current points in Tennis (0, 15, 30, 40, Ad)
  points2?: string | number;
  isTiebreak?: boolean;
  scoringMode?: ScoringMode;
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
  points1,
  points2,
  isTiebreak = false,
  scoringMode = ScoringMode.AMERICANO,
  onScoreUpdate,
  onScoreSet,
  onServerChange,
  pointsToPlay
}: PadelCourtProps) => {
  const [showSelector, setShowSelector] = React.useState<1 | 2 | null>(null);

  const tennisOptions = isTiebreak ? Array.from({ length: 31 }, (_, i) => i) : ['0', '15', '30', '40', 'Ad'];
  const americanoOptions = Array.from({ length: pointsToPlay + 1 }, (_, i) => i);
  const currentOptions = scoringMode === ScoringMode.TENNIS ? tennisOptions : americanoOptions;

  const handleScorePick = (team: 1 | 2, val: string | number) => {
    onScoreSet(team, val as any);
  };

  const isAmericano = scoringMode === ScoringMode.AMERICANO;
  const isMaxed = isAmericano && (score1 + score2 >= pointsToPlay);

  return (
    <div className="w-full mt-8">
      <div className="relative aspect-[2/1] bg-[#8A9A5B] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/5 w-full">
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
        
        {/* Tiebreak Indicator */}
        {isTiebreak && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-1.5 bg-[#fa4615] text-white rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-lg border border-white"
            >
              Tiebreak
            </motion.div>
          </div>
        )}

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
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center">
              {scoringMode === ScoringMode.TENNIS && (
                <div className="mb-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Games: {score1}</span>
                </div>
              )}
              <button
                onClick={() => setShowSelector(1)}
                className={`${scoringMode === ScoringMode.TENNIS ? 'text-8xl' : 'text-9xl'} w-64 bg-transparent font-black text-white text-center outline-none drop-shadow-lg tabular-nums hover:scale-110 transition-transform active:scale-95`}
              >
                {scoringMode === ScoringMode.TENNIS ? points1 : score1}
              </button>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => !isMaxed && onScoreUpdate(1, 1)}
                disabled={isMaxed}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${isMaxed ? 'bg-white/5 text-white/10 cursor-not-allowed shadow-none' : 'bg-[#fa4615] text-white hover:scale-110 active:scale-95 shadow-[#fa4615]/30'}`}
              >
                <Plus className="w-10 h-10" strokeWidth={5} />
              </button>
            </div>
            <div className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(1, -1)}
                className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Minus className="w-3 h-3 text-white" strokeWidth={4} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center">
              {scoringMode === ScoringMode.TENNIS && (
                <div className="mb-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Games: {score2}</span>
                </div>
              )}
              <button
                onClick={() => setShowSelector(2)}
                className={`${scoringMode === ScoringMode.TENNIS ? 'text-8xl' : 'text-9xl'} w-64 bg-transparent font-black text-white text-center outline-none drop-shadow-lg tabular-nums hover:scale-110 transition-transform active:scale-95`}
              >
                {scoringMode === ScoringMode.TENNIS ? points2 : score2}
              </button>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => !isMaxed && onScoreUpdate(2, 1)}
                disabled={isMaxed}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${isMaxed ? 'bg-white/5 text-white/10 cursor-not-allowed shadow-none' : 'bg-[#fa4615] text-white hover:scale-110 active:scale-95 shadow-[#fa4615]/30'}`}
              >
                <Plus className="w-10 h-10" strokeWidth={5} />
              </button>
            </div>
            <div className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(2, -1)}
                className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Minus className="w-3 h-3 text-white" strokeWidth={4} />
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

      <AnimatePresence>
        {showSelector !== null && (
          <ScoreSelector 
            value={showSelector === 1 ? (scoringMode === ScoringMode.TENNIS ? points1! : score1) : (scoringMode === ScoringMode.TENNIS ? points2! : score2)}
            options={currentOptions}
            onSelect={(val) => handleScorePick(showSelector, val)}
            onClose={() => setShowSelector(null)}
            title={showSelector === 1 ? (team1Name || 'Team 1') : (team2Name || 'Team 2')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
