import React, { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Trophy, 
  ArrowLeft, 
  AlertCircle, 
  X, 
  ChevronDown, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { GameMode, Player, ScoringMode } from '../../../types';
import { PadelBall, ManIcon, WomanIcon } from '../../common/Icons';
import { MODE_DESCRIPTIONS } from '../../../constants';
import { User } from 'firebase/auth';
import { getPredefinedPlayers, getPredefinedTeams } from '../../../lib/userService';
import { PredefinedPlayer, PredefinedTeam } from '../../../types';

interface TournamentCreatorProps {
  onCancel: () => void;
  user: User;
  onCreate: (
    name: string, 
    mode: GameMode, 
    players: Player[], 
    courtsCount: number, 
    pointsToPlay: number, 
    scoringMode: ScoringMode,
    numberOfMatches?: number, 
    swissPools?: number, 
    playoffTeams?: number, 
    playoffType?: 'single' | 'double',
    qualifierMode?: GameMode,
    playoffMode?: GameMode,
    advancingTeamsCount?: number,
    setsToPlay?: number,
    gamesPerSet?: number,
    useGoldenPoint?: boolean
  ) => Promise<void>;
}

export default function TournamentCreator({ onCancel, user, onCreate }: TournamentCreatorProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<GameMode>(GameMode.NORMAL_AMERICANO);
  const [courtsCount, setCourtsCount] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for up, -1 for down
  const [pointsToPlay, setPointsToPlay] = useState(24);
  const [scoringMode, setScoringMode] = useState<ScoringMode>(ScoringMode.AMERICANO);
  const [isCreating, setIsCreating] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { name: '', gender: 'man' },
    { name: '', gender: 'woman' },
    { name: '', gender: 'man' },
    { name: '', gender: 'woman' }
  ]);
  const [customMatchCount, setCustomMatchCount] = useState<number | null>(null);
  const [swissPools, setSwissPools] = useState(1);
  const [playoffTeams, setPlayoffTeams] = useState(4);
  const [playoffType, setPlayoffType] = useState<'single' | 'double'>('single');
  const [qualifierMode, setQualifierMode] = useState<GameMode>(GameMode.NORMAL_AMERICANO);
  const [playoffMode, setPlayoffMode] = useState<GameMode>(GameMode.SINGLE_ELIMINATION);
  const [setsToPlay, setSetsToPlay] = useState<number>(3); // 3 for Best of 3
  const [gamesPerSet, setGamesPerSet] = useState<number>(6);
  const [useGoldenPoint, setUseGoldenPoint] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'warning' } | null>(null);
  const [predefinedPlayers, setPredefinedPlayers] = useState<PredefinedPlayer[]>([]);
  const [predefinedTeams, setPredefinedTeams] = useState<PredefinedTeam[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState<'player' | 'team' | null>(null);

  // Fetch predefined personnel
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [pp, pt] = await Promise.all([
          getPredefinedPlayers(user.uid),
          getPredefinedTeams(user.uid)
        ]);
        setPredefinedPlayers(pp);
        setPredefinedTeams(pt);
      } catch (error) {
        console.error('Error fetching predefined data:', error);
      }
    };
    fetchData();
  }, [user.uid]);

  const activeMode = mode === GameMode.MIXED ? qualifierMode : mode;
  const isTeamMode = activeMode === GameMode.TEAM_AMERICANO || activeMode === GameMode.TEAM_MEXICANO || activeMode === GameMode.ROUND_ROBIN || activeMode === GameMode.DOUBLE_ELIMINATION || activeMode === GameMode.SWISS_SYSTEM || activeMode === GameMode.SINGLE_ELIMINATION;
  const isMixMode = activeMode === GameMode.MIX_AMERICANO || activeMode === GameMode.MIXED_MEXICANO;
  const isAmericanoVariant = [
    GameMode.NORMAL_AMERICANO,
    GameMode.MIX_AMERICANO,
    GameMode.MEXICANO,
    GameMode.SUPER_MEXICANO,
    GameMode.MIXED_MEXICANO,
    GameMode.TEAM_AMERICANO,
    GameMode.TEAM_MEXICANO
  ].includes(activeMode);

  // Calculate default matches
  const defaultMatches = useMemo(() => {
    if (isTeamMode) {
      const teamsCount = Math.floor(players.length / 2);
      if (mode === GameMode.SINGLE_ELIMINATION) {
        return teamsCount > 1 ? teamsCount - 1 : 0;
      }
      if (mode === GameMode.DOUBLE_ELIMINATION) {
        return teamsCount > 1 ? (teamsCount - 1) * 2 + 1 : 0;
      }
      if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.SWISS_SYSTEM) {
        if (teamsCount <= 1) return 0;
        const n = teamsCount % 2 === 0 ? teamsCount : teamsCount + 1;
        const stages = n - 1;
        const matchesPerStage = Math.floor(teamsCount / 2);
        return stages * matchesPerStage;
      }
      return 1; // Default for elimination
    } else {
      if (mode === GameMode.NORMAL_AMERICANO || mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO) {
        if (players.length < 4) return 0;
        return Math.floor((players.length * (players.length - 1)) / 4);
      }
      if (isMixMode) {
        const men = players.filter(p => p.gender === 'man').length;
        const women = players.filter(p => p.gender === 'woman').length;
        const P = Math.min(men, women);
        if (P < 2) return 0;
        if (mode === GameMode.MIXED_MEXICANO) {
           const courts = Math.min(Math.floor(men / 2), Math.floor(women / 2));
           return courts * 1; // Default to 1 stage
        }
        return Math.floor((P * P) / 2);
      }
    }
    return 1;
  }, [players.length, mode, isTeamMode, isMixMode]);

  const currentMatchCount = customMatchCount !== null ? customMatchCount : defaultMatches;

  const addPlayer = () => {
    if (isTeamMode) {
      if (players.length / 2 >= 16) return;
      setPlayers([...players, { name: '', gender: 'man' }, { name: '', gender: 'man' }]);
    } else if (isMixMode) {
      if (players.length >= 32) return;
      setPlayers([...players, { name: '', gender: 'man' }, { name: '', gender: 'woman' }]);
    } else {
      if (players.length >= 32) return;
      setPlayers([...players, { name: '', gender: players.length % 2 === 0 ? 'man' : 'woman' }]);
    }
  };

  const removeTeam = (teamIdx: number) => {
    const next = [...players];
    next.splice(teamIdx * 2, 2);
    setPlayers(next);
  };

  const removePlayer = (idx: number) => {
    if (isMixMode) {
      const next = [...players];
      const pairIdx = idx % 2 === 0 ? idx : idx - 1;
      if (pairIdx >= 0 && pairIdx + 1 < next.length) {
        next.splice(pairIdx, 2);
        setPlayers(next);
      }
    } else {
      const next = [...players];
      next.splice(idx, 1);
      setPlayers(next);
    }
  };

  const updatePlayer = (idx: number, val: string) => {
    const next = [...players];
    next[idx] = { ...next[idx], name: val };
    setPlayers(next);
  };

  const updateGender = (idx: number, gender: 'man' | 'woman') => {
    const next = [...players];
    next[idx] = { ...next[idx], gender };
    setPlayers(next);
  };

  const updateTeamName = (teamIdx: number, val: string) => {
    const next = [...players];
    next[teamIdx * 2] = { ...next[teamIdx * 2], teamName: val };
    if (next[teamIdx * 2 + 1]) {
      next[teamIdx * 2 + 1] = { ...next[teamIdx * 2 + 1], teamName: val };
    }
    setPlayers(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotification(null);
    
    const validPlayers = players.map((p, i) => {
      const teamIdx = Math.floor(i / 2);
      const player: any = {
        name: p.name.trim() || `PLAYER ${i + 1}`,
        gender: p.gender
      };
      if (isTeamMode) {
        player.teamName = p.teamName?.trim() || `TEAM ${teamIdx + 1}`;
      }
      return player;
    });
    
    if (isMixMode) {
      const men = validPlayers.filter(p => p.gender === 'man').length;
      const women = validPlayers.filter(p => p.gender === 'woman').length;
      if (men !== women) {
        setNotification({ message: `Mix modes require an equal number of men and women. Current: ${men} Men, ${women} Women.`, type: 'error' });
        return;
      }
      if (validPlayers.length > 24) {
        setNotification({ message: 'Max 24 players for Mix Americano.', type: 'error' });
        return;
      }
    }

    if (isTeamMode && validPlayers.length % 2 !== 0) {
      setNotification({ message: 'Team modes require 2 players per team. Please ensure all teams have 2 players.', type: 'error' });
      return;
    }

    if (!name.trim()) {
      setNotification({ message: 'Please enter a tournament name.', type: 'error' });
      return;
    }

    if (validPlayers.length < 4) {
      setNotification({ message: 'Please enter at least 4 players to start a tournament.', type: 'error' });
      return;
    }

    if (isAmericanoVariant && courtsCount === 2 && (validPlayers.length === 5 || validPlayers.length === 6 || validPlayers.length === 7)) {
      setNotification({ message: "With 5-7 players, only 1 court can be used. The second court will be unused.", type: 'warning' });
    }

    setIsCreating(true);
    try {
      await onCreate(
        name, 
        mode, 
        validPlayers, 
        courtsCount, 
        pointsToPlay, 
        scoringMode, 
        customMatchCount || undefined, 
        swissPools, 
        playoffTeams, 
        playoffType, 
        qualifierMode, 
        playoffMode,
        mode === GameMode.MIXED ? playoffTeams : undefined,
        setsToPlay,
        gamesPerSet,
        useGoldenPoint
      );
    } catch (err) {
      console.error('Submit error:', err);
      setNotification({ message: 'Failed to create tournament. Please try again.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div 
      key="create"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-12">
        <button onClick={onCancel} className="p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div>
          <p className="label-sm mb-1">New Event</p>
          <h2 className="text-4xl font-bold text-on-surface">Create Tournament</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-sm space-y-10 border border-on-surface/5">
          
          {/* Top Row: Name, Courts, Points */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-5">
              <label className="label-sm mb-3 block">Tournament Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.G. SUMMER PADEL OPEN"
                className="w-full px-6 h-16 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium text-on-surface placeholder:text-on-surface/20"
                required
              />
            </div>

            <div className="lg:col-span-3">
              <label className="label-sm mb-3 block">Courts Count (1-15)</label>
              <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit h-16">
                <button 
                  type="button"
                  onClick={() => {
                    setDirection(-1);
                    setCourtsCount(Math.max(1, courtsCount - 1));
                  }}
                  className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="w-12 h-full flex items-center justify-center overflow-hidden relative">
                  <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.span
                      key={courtsCount}
                      custom={direction}
                      initial={(d: number) => ({ y: d === 1 ? -20 : 20, opacity: 0 })}
                      animate={{ y: 0, opacity: 1 }}
                      exit={(d: number) => ({ y: d === 1 ? 20 : -20, opacity: 0 })}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute font-bold text-2xl text-on-surface"
                    >
                      {courtsCount}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setDirection(1);
                    setCourtsCount(Math.min(15, courtsCount + 1));
                  }}
                  className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <label className="label-sm mb-3 block">Scoring System</label>
              <div className="flex bg-surface-container-low p-1.5 rounded-xl h-16">
                <button
                  type="button"
                  onClick={() => setScoringMode(ScoringMode.AMERICANO)}
                  className={`flex-1 rounded-lg font-bold text-sm transition-all ${scoringMode === ScoringMode.AMERICANO ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                >
                  Americano (Total Points)
                </button>
                <button
                  type="button"
                  onClick={() => setScoringMode(ScoringMode.TENNIS)}
                  className={`flex-1 rounded-lg font-bold text-sm transition-all ${scoringMode === ScoringMode.TENNIS ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                >
                  Tennis (Sets & Games)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {scoringMode === ScoringMode.AMERICANO ? (
              <div className="lg:col-span-12">
                <label className="label-sm mb-3 block">Points to Play</label>
                <div className="relative w-full h-16 pointer-events-auto">
                  <div className="absolute top-[70%] left-[10%] right-[10%] h-1.5 bg-surface-variant rounded-full -translate-y-1/2" />
                  
                  <div className="absolute inset-0 flex items-center w-full">
                    {[16, 21, 24, 31, 32].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPointsToPlay(p)}
                        className="relative z-10 flex flex-col items-center justify-center h-full group outline-none cursor-pointer"
                        style={{ width: '20%' }}
                      >
                        <span className={`absolute top-0 text-sm font-bold transition-all duration-300 ${pointsToPlay === p ? 'text-primary scale-110' : 'text-on-surface/40 group-hover:text-on-surface/60'}`}>
                          {p}
                        </span>
                        <div className={`absolute top-[70%] -translate-y-1/2 w-4 h-4 rounded-full transition-colors duration-300 ${pointsToPlay === p ? 'bg-transparent' : 'bg-surface-variant'}`} />
                      </button>
                    ))}
                  </div>

                  <motion.div
                    className="absolute top-[70%] -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center"
                    style={{ width: '20%' }}
                    initial={false}
                    animate={{ 
                      left: `${[16, 21, 24, 31, 32].indexOf(pointsToPlay) * 20}%`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="bg-surface-container-lowest rounded-full p-1 shadow-sm">
                      <motion.div
                        animate={{ rotate: pointsToPlay * 15 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      >
                        <PadelBall className="w-6 h-6 text-primary" />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                  <label className="label-sm mb-3 block">Match Format</label>
                  <div className="flex bg-surface-container-low p-1.5 rounded-xl h-16">
                    {[
                      { val: 1, label: '1 Set' },
                      { val: 3, label: 'Best of 3' },
                      { val: 30, label: '3rd Set MTB' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setSetsToPlay(opt.val)}
                        className={`flex-1 rounded-lg font-bold text-xs transition-all ${setsToPlay === opt.val ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                        title={opt.val === 30 ? "Best of 3 with 3rd Set Match Tie-break (10 points)" : opt.label}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-sm mb-3 block">Games per Set</label>
                  <div className="flex bg-surface-container-low p-1.5 rounded-xl h-16">
                    {[4, 6].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGamesPerSet(g)}
                        className={`flex-1 rounded-lg font-bold text-sm transition-all ${gamesPerSet === g ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                      >
                        {g} Games
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-sm mb-3 block">Deuce Rule</label>
                  <div className="flex bg-surface-container-low p-1.5 rounded-xl h-16">
                    <button
                      type="button"
                      onClick={() => setUseGoldenPoint(false)}
                      className={`flex-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${!useGoldenPoint ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                    >
                      Advantage
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseGoldenPoint(true)}
                      className={`flex-1 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${useGoldenPoint ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
                    >
                      Golden Point
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label-sm mb-4 block">Game Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: 'Single Elimination',
                  title: 'Tournament',
                  description: 'Knockout format where the winner advances and the loser is eliminated.',
                  modes: [GameMode.SINGLE_ELIMINATION, GameMode.DOUBLE_ELIMINATION, GameMode.ROUND_ROBIN, GameMode.SWISS_SYSTEM]
                },
                {
                  id: 'Americano',
                  title: 'Americano',
                  description: 'All players play with everyone else exactly one time.',
                  modes: [GameMode.NORMAL_AMERICANO, GameMode.MIX_AMERICANO, GameMode.TEAM_AMERICANO]
                },
                {
                  id: 'Mexicano',
                  title: 'Mexicano',
                  description: 'Like Americano but results in more even games based on standings.',
                  modes: [GameMode.MEXICANO, GameMode.SUPER_MEXICANO, GameMode.TEAM_MEXICANO, GameMode.MIXED_MEXICANO]
                },
                {
                  id: 'Mixed',
                  title: 'Mixed Mode',
                  description: 'Qualifier stage followed by a Playoff bracket.',
                  modes: [GameMode.MIXED]
                }
              ].map((cat) => {
                const isSelected = cat.modes.includes(mode);
                return (
                  <div
                    key={cat.id}
                    className={`p-6 rounded-2xl border-none text-left transition-all flex flex-col gap-4 ${isSelected ? 'bg-primary-container ring-2 ring-primary' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setMode(cat.modes[0])}
                      className="text-left outline-none flex-1"
                    >
                      <span className="font-bold text-lg text-on-surface block mb-2">{cat.title}</span>
                      <p className="text-sm leading-relaxed text-on-surface/70 font-medium">
                        {isSelected ? MODE_DESCRIPTIONS[mode] : cat.description}
                      </p>
                    </button>

                    {isSelected && cat.modes.length > 1 && (
                      <div className="pt-4 border-t border-on-surface/10 relative">
                        <select
                          value={mode}
                          onChange={(e) => setMode(e.target.value as GameMode)}
                          className="w-full bg-surface-container-lowest text-on-surface text-sm font-bold px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer shadow-sm"
                        >
                          {cat.modes.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-[55%] pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-on-surface/50" />
                        </div>
                      </div>
                    )}

                    {mode === GameMode.MIXED && isSelected && (
                      <div className="pt-4 border-t border-on-surface/10 space-y-4">
                        <div className="relative">
                          <label className="text-[10px] uppercase tracking-wider text-on-surface/40 block mb-1">Qualifier Mode</label>
                          <select
                            value={qualifierMode}
                            onChange={(e) => setQualifierMode(e.target.value as GameMode)}
                            className="w-full bg-surface-container-lowest text-on-surface text-sm font-bold px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer shadow-sm"
                          >
                            {Object.values(GameMode).filter(m => m !== GameMode.MIXED).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-[65%] pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-on-surface/50" />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="text-[10px] uppercase tracking-wider text-on-surface/40 block mb-1">Playoff Mode</label>
                          <select
                            value={playoffMode}
                            onChange={(e) => setPlayoffMode(e.target.value as GameMode)}
                            className="w-full bg-surface-container-lowest text-on-surface text-sm font-bold px-4 py-3 rounded-xl outline-none appearance-none cursor-pointer shadow-sm"
                          >
                            <option value={GameMode.SINGLE_ELIMINATION}>Single Elimination</option>
                            <option value={GameMode.DOUBLE_ELIMINATION}>Double Elimination</option>
                          </select>
                          <div className="absolute right-4 top-[65%] pointer-events-none">
                            <ChevronDown className="w-4 h-4 text-on-surface/50" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!([GameMode.SINGLE_ELIMINATION, GameMode.DOUBLE_ELIMINATION, GameMode.SWISS_SYSTEM] as string[]).includes(mode) && (
              <>
                <div className="mt-10">
                  <label className="label-sm mb-3 block">
                    {mode.includes('AMERICANO') || mode.includes('MEXICANO') ? "Total Stages to Play" : "Matches per Stage"}
                  </label>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit h-16">
                      <button 
                        type="button"
                        onClick={() => setCustomMatchCount(Math.max(1, currentMatchCount - 1))}
                        className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="w-16 h-full flex items-center justify-center font-bold text-2xl text-on-surface">
                        {currentMatchCount}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setCustomMatchCount(currentMatchCount + 1)}
                        className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {(mode.includes('AMERICANO') || mode.includes('MEXICANO')) && (
                      <div className="px-6 py-3 bg-primary-container/30 rounded-xl">
                        <p className="text-xs font-bold text-on-surface/60 uppercase tracking-wider mb-1">Structure Information</p>
                        <p className="text-sm font-medium text-on-surface/80">
                          {Math.floor(players.length / 4)} Matches per Stage based on {players.length} Players.
                        </p>
                      </div>
                    )}
                    {customMatchCount !== null && customMatchCount !== defaultMatches && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-surface-container-low px-4 py-3 rounded-xl">
                        <span className="text-sm font-medium text-on-surface/60">
                          {customMatchCount > defaultMatches 
                            ? "This will result in a player may match with or against same player." 
                            : "This will result in a player may not match with or against some player."}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomMatchCount(null)}
                          className="text-xs font-bold text-primary hover:text-primary/80 transition-all underline underline-offset-4"
                        >
                          Return to default ({defaultMatches})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isAmericanoVariant && players.length >= 4 && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-surface-container-low px-4 py-2 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface/40 block mb-0.5">Recommended Matches (Mrec)</span>
                      <span className="text-sm font-bold text-on-surface">{Math.floor((players.length * (players.length - 1)) / 4)}</span>
                    </div>
                    <div className="bg-surface-container-low px-4 py-2 rounded-xl">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface/40 block mb-0.5">Match Distribution</span>
                      <span className="text-sm font-bold text-on-surface">
                        {(() => {
                          const min = Math.floor((currentMatchCount * 4) / players.length);
                          const max = Math.ceil((currentMatchCount * 4) / players.length);
                          return min === max ? `${min}` : `${min} - ${max}`;
                        })()} games/player
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {(mode === GameMode.ROUND_ROBIN || mode === GameMode.MIXED) && (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {mode === GameMode.ROUND_ROBIN && (
                  <div>
                    <label className="label-sm mb-3 block">Swiss Stage Pools</label>
                    <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit h-16">
                      <button 
                        type="button"
                        onClick={() => setSwissPools(Math.max(1, swissPools - 1))}
                        className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="w-12 h-full flex items-center justify-center font-bold text-xl text-on-surface">
                        {swissPools}
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSwissPools(swissPools + 1)}
                        className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="label-sm mb-3 block">{mode === GameMode.MIXED ? "Cut-off (Teams to Advance)" : "Teams to Playoff"}</label>
                  <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit h-16">
                    <button 
                      type="button"
                      onClick={() => setPlayoffTeams(Math.max(2, playoffTeams - 1))}
                      className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-full flex items-center justify-center font-bold text-xl text-on-surface">
                      {playoffTeams}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPlayoffTeams(playoffTeams + 1)}
                      className="w-12 h-full bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                {mode === GameMode.ROUND_ROBIN && (
                  <div>
                    <label className="label-sm mb-3 block">Playoff Type</label>
                    <select 
                      value={playoffType}
                      onChange={(e) => setPlayoffType(e.target.value as 'single' | 'double')}
                      className="w-full h-16 bg-surface-container-low text-on-surface text-sm font-bold px-4 rounded-xl outline-none appearance-none cursor-pointer"
                    >
                      <option value="single">Single Elimination</option>
                      <option value="double">Double Elimination</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <label className="label-sm">
                {isTeamMode ? 'Teams (Max 16 Teams)' : 'Players (Max 32)'}
              </label>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={addPlayer}
                  disabled={isTeamMode ? players.length / 2 >= 16 : players.length >= 32}
                  className="bg-on-surface text-surface px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-on-surface/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isTeamMode ? 'Add Team' : 'Add Player'}
                </button>
                {(isTeamMode ? predefinedTeams.length > 0 : predefinedPlayers.length > 0) && (
                  <button 
                    type="button" 
                    onClick={() => setShowQuickAdd(isTeamMode ? 'team' : 'player')}
                    className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-xl text-xs font-bold hover:brightness-95 transition-all shadow-sm flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Quick Add
                  </button>
                )}
              </div>
            </div>
            {isTeamMode ? (
              <div className="space-y-3">
                {Array.from({ length: Math.floor(players.length / 2) }).map((_, teamIdx) => (
                  <div key={teamIdx} className="flex flex-col md:flex-row items-center gap-4">
                    <input 
                      type="text"
                      value={players[teamIdx * 2].teamName || ''}
                      onChange={(e) => updateTeamName(teamIdx, e.target.value)}
                      placeholder={`TEAM ${teamIdx + 1}`}
                      className="w-full md:w-48 bg-transparent border-none focus:ring-0 outline-none transition-all font-bold text-xl text-on-surface placeholder:text-on-surface/40 p-0"
                    />
                    <div className="flex-1 flex flex-col md:flex-row items-center gap-2 bg-surface-container-low p-2 rounded-xl w-full">
                      <input 
                        type="text"
                        value={players[teamIdx * 2].name}
                        onChange={(e) => updatePlayer(teamIdx * 2, e.target.value)}
                        placeholder={`PLAYER ${teamIdx * 2 + 1}`}
                        className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none transition-all font-medium text-sm text-on-surface placeholder:text-on-surface/30 min-w-0 w-full"
                      />
                      <div className="w-full md:w-px h-px md:h-6 bg-on-surface/10" />
                      <input 
                        type="text"
                        value={players[teamIdx * 2 + 1].name}
                        onChange={(e) => updatePlayer(teamIdx * 2 + 1, e.target.value)}
                        placeholder={`PLAYER ${teamIdx * 2 + 2}`}
                        className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none transition-all font-medium text-sm text-on-surface placeholder:text-on-surface/30 min-w-0 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeTeam(teamIdx)}
                        className="p-2 text-on-surface/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0 self-end md:self-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {players.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-surface-container-low p-2 rounded-xl">
                    <input 
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePlayer(idx, e.target.value)}
                      placeholder={`PLAYER ${idx + 1}`}
                      className="flex-1 px-3 py-2 bg-transparent border-none focus:ring-0 outline-none transition-all font-medium text-sm text-on-surface placeholder:text-on-surface/30 min-w-0"
                    />
                    {isMixMode && (
                      <div className="flex bg-surface-container-lowest p-1 rounded-lg shrink-0 shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateGender(idx, 'man')}
                          className={`p-1.5 rounded-md transition-all ${p.gender === 'man' ? 'bg-blue-500/10 text-blue-500' : 'text-on-surface/30 hover:text-blue-400'}`}
                          title="Man"
                        >
                          <ManIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGender(idx, 'woman')}
                          className={`p-1.5 rounded-md transition-all ${p.gender === 'woman' ? 'bg-pink-500/10 text-pink-500' : 'text-on-surface/30 hover:text-pink-400'}`}
                          title="Woman"
                        >
                          <WomanIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePlayer(idx)}
                      className="p-2 text-on-surface/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isAmericanoVariant && courtsCount === 2 && [5, 6, 7].includes(players.length) && (
          <div className="bg-amber-500/10 text-amber-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              You have selected 2 courts but only have {players.length} players. At least 8 players are required to fully utilize 2 courts. The second court will not be used.
            </p>
          </div>
        )}

        <button 
          type="submit"
          disabled={isCreating}
          className={`w-full py-6 rounded-2xl font-bold text-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-xl ${isCreating ? 'bg-surface-container-low text-on-surface/20 cursor-not-allowed' : 'bg-primary-container text-on-primary-container shadow-primary/20'}`}
        >
          {isCreating ? (
            <div className="w-6 h-6 border-2 border-on-surface/20 border-t-on-surface rounded-full animate-spin" />
          ) : (
            <>
              <Trophy className="w-6 h-6" />
              Start Tournament
            </>
          )}
        </button>

        {notification && (
          <div className={`mt-8 p-6 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-bold">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-auto p-2 hover:bg-on-surface/5 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </form>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickAdd(null)}
              className="absolute inset-0 bg-surface/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-high rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-on-surface/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface">Quick Add {showQuickAdd === 'team' ? 'Teams' : 'Players'}</h3>
                  <p className="text-sm text-on-surface/40 mt-1">Select from your predefined personnel</p>
                </div>
                <button 
                  onClick={() => setShowQuickAdd(null)}
                  className="p-3 hover:bg-on-surface/5 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {showQuickAdd === 'player' ? (
                  predefinedPlayers
                    .filter(pp => !players.some(p => p.name.toLowerCase() === pp.name.toLowerCase()))
                    .map(pp => (
                      <button
                        key={pp.id}
                        onClick={() => {
                          if (players.length >= 32) return;
                          setPlayers([...players, { name: pp.name, gender: pp.gender }]);
                          setShowQuickAdd(null);
                        }}
                        className="w-full text-left p-4 rounded-2xl hover:bg-primary-container group transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${pp.gender === 'man' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500'}`}>
                            {pp.gender === 'man' ? <ManIcon className="w-5 h-5" /> : <WomanIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface group-hover:text-on-primary-container transition-colors">{pp.name}</p>
                            <p className="text-xs text-on-surface/40 group-hover:text-on-primary-container/60 transition-colors uppercase tracking-widest">{pp.gender}</p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-on-surface/20 group-hover:text-on-primary-container transition-colors" />
                      </button>
                    ))
                ) : (
                  predefinedTeams
                    .filter(pt => !players.some(p => p.teamName?.toLowerCase() === pt.name.toLowerCase()))
                    .map(pt => (
                      <button
                        key={pt.id}
                        onClick={() => {
                          if (players.length / 2 >= 16) return;
                          setPlayers([...players, 
                            { name: pt.player1 || '', gender: 'man', teamName: pt.name },
                            { name: pt.player2 || '', gender: 'man', teamName: pt.name }
                          ]);
                          setShowQuickAdd(null);
                        }}
                        className="w-full text-left p-4 rounded-2xl hover:bg-primary-container group transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm text-on-surface group-hover:bg-on-primary-container/10">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface group-hover:text-on-primary-container transition-colors">{pt.name}</p>
                            <p className="text-xs text-on-surface/40 group-hover:text-on-primary-container/60 transition-colors uppercase tracking-widest font-black">
                              {pt.player1 || 'P1'} & {pt.player2 || 'P2'}
                            </p>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-on-surface/20 group-hover:text-on-primary-container transition-colors" />
                      </button>
                    ))
                )}
                
                {((showQuickAdd === 'player' && predefinedPlayers.length === 0) || 
                  (showQuickAdd === 'team' && predefinedTeams.length === 0)) && (
                  <div className="text-center py-12">
                    <p className="text-on-surface/40 font-medium italic">No predefined {showQuickAdd === 'team' ? 'teams' : 'players'} found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
