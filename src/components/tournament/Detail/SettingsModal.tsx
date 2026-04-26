import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Activity, Save, AlertCircle, Settings } from 'lucide-react';
import { Tournament, TournamentSettings, ScoringMode, GameMode } from '../../../types';

interface SettingsModalProps {
  tournament: Tournament;
  onClose: () => void;
  onSave: (updates: Partial<Tournament>) => void;
}

const DEFAULT_SETTINGS: TournamentSettings = {
  scoringMode: ScoringMode.AMERICANO,
  pointsToPlay: 21,
  setsToPlay: 1,
  gamesPerSet: 6,
  useGoldenPoint: true
};

export const SettingsModal = ({ tournament, onClose, onSave }: SettingsModalProps) => {
  const isMixedMode = tournament.mode === GameMode.MIXED;
  
  const [qualifier, setQualifier] = useState<TournamentSettings>(
    tournament.qualifierSettings || {
      scoringMode: tournament.scoringMode || ScoringMode.AMERICANO,
      pointsToPlay: tournament.pointsToPlay || 21,
      setsToPlay: tournament.setsToPlay || 1,
      gamesPerSet: tournament.gamesPerSet || 6,
      useGoldenPoint: tournament.useGoldenPoint ?? true
    }
  );

  const [playoff, setPlayoff] = useState<TournamentSettings>(
    tournament.playoffSettings || {
      scoringMode: ScoringMode.TENNIS,
      pointsToPlay: 21,
      setsToPlay: 3,
      gamesPerSet: 6,
      useGoldenPoint: true
    }
  );

  const handleSave = () => {
    onSave({
      qualifierSettings: qualifier,
      playoffSettings: playoff,
      // Keep legacy fields in sync with qualifier for backward compatibility
      scoringMode: qualifier.scoringMode,
      pointsToPlay: qualifier.pointsToPlay,
      setsToPlay: qualifier.setsToPlay,
      gamesPerSet: qualifier.gamesPerSet,
      useGoldenPoint: qualifier.useGoldenPoint
    });
    onClose();
  };

  const renderSection = (title: string, settings: TournamentSettings, setSettings: (s: TournamentSettings) => void) => (
    <div className="space-y-6 bg-surface-container-low p-8 rounded-[2rem] border border-on-surface/5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface/30">{title}</h4>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-container-lowest rounded-2xl border border-on-surface/5 h-16">
          <button 
            onClick={() => setSettings({ ...settings, scoringMode: ScoringMode.AMERICANO })}
            className={`flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${settings.scoringMode === ScoringMode.AMERICANO ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/30 hover:text-on-surface/50'}`}
          >
            <Zap className="w-4 h-4" />
            Americano
          </button>
          <button 
            onClick={() => setSettings({ ...settings, scoringMode: ScoringMode.TENNIS })}
            className={`flex items-center justify-center gap-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${settings.scoringMode === ScoringMode.TENNIS ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/30 hover:text-on-surface/50'}`}
          >
            <Activity className="w-4 h-4" />
            Tennis
          </button>
        </div>

        {settings.scoringMode === ScoringMode.AMERICANO ? (
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/20 px-2">Points to Play</label>
            <div className="relative group">
              <input 
                type="number" 
                value={settings.pointsToPlay}
                onChange={(e) => setSettings({ ...settings, pointsToPlay: parseInt(e.target.value) || 0 })}
                className="w-full h-16 bg-surface-container-lowest border border-on-surface/5 rounded-2xl px-6 font-bold text-lg text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-on-surface/20 uppercase tracking-widest">Points</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/20 px-2">Sets Format</label>
              <select 
                value={settings.setsToPlay}
                onChange={(e) => setSettings({ ...settings, setsToPlay: parseInt(e.target.value) })}
                className="w-full h-16 bg-surface-container-lowest border border-on-surface/5 rounded-2xl px-6 font-bold text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                <option value={1}>1 Set</option>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
                <option value={30}>3rd Set MTB</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/20 px-2">Games / Set</label>
              <select 
                value={settings.gamesPerSet}
                onChange={(e) => setSettings({ ...settings, gamesPerSet: parseInt(e.target.value) })}
                className="w-full h-16 bg-surface-container-lowest border border-on-surface/5 rounded-2xl px-6 font-bold text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
              >
                <option value={4}>4 Games</option>
                <option value={6}>6 Games</option>
              </select>
            </div>
          </div>
        )}

        {settings.scoringMode === ScoringMode.TENNIS && (
          <button
            onClick={() => setSettings({ ...settings, useGoldenPoint: !settings.useGoldenPoint })}
            className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${settings.useGoldenPoint ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-lowest border-on-surface/5'}`}
          >
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface">Golden Point</span>
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">No-Ad scoring at 40-40</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.useGoldenPoint ? 'bg-primary' : 'bg-on-surface/10'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.useGoldenPoint ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="relative bg-surface-container-lowest w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-10 pb-6 flex items-center justify-between border-b border-on-surface/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-on-surface tracking-tight uppercase">Tournament Settings</h3>
              <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.25em] mt-1">Configure scoring rules & stage parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 rounded-2xl hover:bg-surface-container-low transition-all text-on-surface/40 hover:text-on-surface">
            <X className="w-8 h-8" strokeWidth={3} />
          </button>
        </div>

        <div className="p-10 overflow-y-auto no-scrollbar flex-1 space-y-10">
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-[2rem] flex items-center gap-6">
            <AlertCircle className="w-8 h-8 text-primary flex-shrink-0" />
            <p className="text-xs font-black text-primary leading-relaxed uppercase tracking-wider">
              Note: Changes will propagate to all non-completed matches immediately.
            </p>
          </div>

          <div className={`grid grid-cols-1 ${isMixedMode ? 'md:grid-cols-2' : ''} gap-10`}>
            {isMixedMode ? (
              <>
                {renderSection("Stage 1 Configuration", qualifier, setQualifier)}
                {renderSection("Playoff Stage Configuration", playoff, setPlayoff)}
              </>
            ) : (
              renderSection("Scoring Configuration", qualifier, setQualifier)
            )}
          </div>
        </div>

        <div className="p-10 bg-surface-container-low border-t border-on-surface/5 flex gap-6">
          <button 
            onClick={handleSave}
            className="flex-1 bg-primary text-on-primary py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
          >
            <Save className="w-6 h-6" />
            Apply Settings
          </button>
          <button 
            onClick={onClose}
            className="px-12 py-6 font-black text-on-surface/40 hover:text-on-surface/60 transition-all text-[10px] uppercase tracking-[0.25em]"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};
