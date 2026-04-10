import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChampionOverlayProps {
  teamName: string | null;
  players: string[];
  onContinue: () => void;
}

export const ChampionOverlay = ({ teamName, players, onContinue }: ChampionOverlayProps) => {
  // Trigger a second, more intense confetti burst
  React.useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-on-surface/95 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fa4615]/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-12 w-full max-w-4xl px-6">
        
        {/* Champion Card - Top Center */}
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", damping: 12 }}
          className="bg-[#fa4615] px-12 py-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,70,21,0.4)] text-center border-4 border-white/20"
        >
          {teamName && (
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 mb-2">Tournament Champion</p>
          )}
          <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase mb-4 tracking-tight">
            {teamName || "Champions"}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {players.map((p, i) => (
              <React.Fragment key={i}>
                <span className="text-xl font-bold text-white uppercase tracking-widest">{p}</span>
                {i < players.length - 1 && <span className="w-1.5 h-1.5 rounded-full bg-white/30" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* Trophy Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2
          }}
          className="relative"
        >
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              filter: ["drop-shadow(0 0 0px rgba(250,70,21,0))", "drop-shadow(0 0 30px rgba(250,70,21,0.6))", "drop-shadow(0 0 0px rgba(250,70,21,0))"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              ease: "easeInOut" 
            }}
          >
            <Trophy className="w-48 h-48 md:w-64 md:h-64 text-[#fa4615]" strokeWidth={1.5} />
          </motion.div>
          
          {/* Sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: [0, (i % 2 === 0 ? 100 : -100) * Math.random()],
                y: [0, (i < 3 ? 100 : -100) * Math.random()],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                delay: i * 0.4,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={onContinue}
          className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-10 py-5 rounded-2xl transition-all border border-white/5 hover:border-white/20 mt-8"
        >
          <span className="text-xs font-black uppercase tracking-[0.4em]">Click to Continue</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

      </div>
    </motion.div>
  );
};
