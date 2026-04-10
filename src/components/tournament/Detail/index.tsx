import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Share2, 
  Trash2, 
  Plus, 
  ChevronRight, 
  CheckCircle, 
  Play,
  Trophy,
  Settings,
  Zap,
  Activity
} from 'lucide-react';
import { doc, updateDoc, collection, addDoc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Tournament, Match, MatchStatus, GameMode, Player, PlayerStats, OperationType, ScoringMode } from '../../../types';
import { handleFirestoreError } from '../../../lib/firestore';
import { generateNextStageMatches } from '../../../utils/tournamentLogic';
import { BracketView } from './BracketView';
import { LeaderboardView } from './LeaderboardView';
import { MatchesView } from './MatchesView';
import { getAdvancingTeams, generatePlayoffMatches } from '../../../utils/promotionLogic';
import { Shuffle, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { KatapgamaLogo } from '../../common/KatapgamaLogo';


interface TournamentDetailProps {
  tournament: Tournament;
  matches: Match[];
  onBack: () => void;
  onSelectMatch: (m: Match) => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Tournament>) => void;
  isCreator: boolean;
  user: User | null;
}

export default function TournamentDetail({ 
  tournament, 
  matches, 
  onBack, 
  onSelectMatch, 
  onDelete, 
  onUpdate, 
  isCreator,
  user
}: TournamentDetailProps) {
  const isStageBasedMode = [
    GameMode.MEXICANO, 
    GameMode.SUPER_MEXICANO,
    GameMode.TEAM_MEXICANO,
    GameMode.MIXED_MEXICANO,
    GameMode.NORMAL_AMERICANO,
    GameMode.MIX_AMERICANO
  ].includes(tournament.mode);

  const isAmericanoVariant = [
    GameMode.NORMAL_AMERICANO,
    GameMode.MIX_AMERICANO,
    GameMode.MIXED_MEXICANO,
    GameMode.MEXICANO,
    GameMode.SUPER_MEXICANO,
    GameMode.TEAM_AMERICANO,
    GameMode.TEAM_MEXICANO
  ].includes(tournament.mode);

  const isBracketMode = [
    GameMode.SWISS_SYSTEM,
    GameMode.SINGLE_ELIMINATION,
    GameMode.DOUBLE_ELIMINATION
  ].includes(tournament.mode);

  const isMixedMode = tournament.mode === GameMode.MIXED;


  const defaultTab = isMixedMode 
    ? (tournament.playoffStarted ? 'playoff' : '1') 
    : (isBracketMode ? 'bracket' : (isStageBasedMode ? (tournament.currentStage?.toString() || '1') : '1'));

  const [tab, setTab] = useState<string>(() => {
    return sessionStorage.getItem(`active_tab_${tournament.id}`) || defaultTab;
  });

  useEffect(() => {
    sessionStorage.setItem(`active_tab_${tournament.id}`, tab);
  }, [tab, tournament.id]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [advancingTeamsPreview, setAdvancingTeamsPreview] = useState<string[][] | null>(null);
  const [isResetingPlayoff, setIsResetingPlayoff] = useState(false);


  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?tournamentId=${tournament.id}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const leaderboard = useMemo(() => {
    const isTeamMode = tournament.isKatapgama || 
                       tournament.mode.includes('Team') || 
                       (tournament.mode === GameMode.MIXED && (tournament.qualifierMode || '').includes('Team'));
    const stats: Record<string, PlayerStats> = {};
    
    // Grouping players by team for team modes
    const playerToTeam: Record<string, string> = {};
    tournament.players.forEach(p => {
      const key = isTeamMode ? (p.teamName || p.name) : p.name;
      playerToTeam[p.name] = key;
      if (!stats[key]) {
        stats[key] = {
          name: key,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          missedPoints: 0,
          matchesPlayed: 0
        };
      }
    });

    const completedMatches = matches.filter(m => m.status === MatchStatus.COMPLETED && !m.isPlayoff && !m.deleted);
    let totalPointsAllMatches = 0;

    completedMatches.forEach(m => {
      let t1Points = (m.sets1 || []).reduce((a, b) => a + b, 0) + (m.score1 || 0);
      let t2Points = (m.sets2 || []).reduce((a, b) => a + b, 0) + (m.score2 || 0);

      if (tournament.mode === GameMode.SUPER_MEXICANO && m.court) {
        const bonus = Math.max(0, 4 - m.court);
        t1Points += bonus;
        t2Points += bonus;
      }

      totalPointsAllMatches += (t1Points + t2Points);

      const t1Key = playerToTeam[m.team1[0]] || m.team1[0];
      const t2Key = playerToTeam[m.team2[0]] || m.team2[0];

      if (stats[t1Key]) {
        stats[t1Key].pointsFor += t1Points;
        stats[t1Key].pointsAgainst += t2Points;
        stats[t1Key].matchesPlayed++;
        if (m.winner === 1) stats[t1Key].wins++;
        else if (m.winner === 2) stats[t1Key].losses++;
        else if (t1Points === t2Points) stats[t1Key].ties++;
      }

      if (stats[t2Key]) {
        stats[t2Key].pointsFor += t2Points;
        stats[t2Key].pointsAgainst += t1Points;
        stats[t2Key].matchesPlayed++;
        if (m.winner === 2) stats[t2Key].wins++;
        else if (m.winner === 1) stats[t2Key].losses++;
        else if (t1Points === t2Points) stats[t2Key].ties++;
      }
    });

    const maxMatches = Math.max(...Object.values(stats).map(s => s.matchesPlayed), 0);
    const modesWithNormalization = [
      GameMode.TEAM_AMERICANO, GameMode.ROUND_ROBIN, GameMode.SWISS_SYSTEM,
      GameMode.NORMAL_AMERICANO, GameMode.MIX_AMERICANO, GameMode.MEXICANO,
      GameMode.SUPER_MEXICANO, GameMode.TEAM_MEXICANO, GameMode.MIXED_MEXICANO,
      GameMode.MIXED, GameMode.KATAPGAMA_FUN_PADEL
    ];

    const globalAvg = completedMatches.length > 0 ? totalPointsAllMatches / (completedMatches.length * 2) : 0;

    Object.values(stats).forEach(s => {
      if (modesWithNormalization.includes(tournament.mode) && maxMatches > 0) {
        const missingCount = Math.max(0, maxMatches - s.matchesPlayed);
        s.missedPoints = Math.round(missingCount * globalAvg);
      } else {
        s.missedPoints = 0;
      }
    });

    return Object.values(stats).sort((a, b) => {
      const aTotal = a.pointsFor + a.missedPoints;
      const bTotal = b.pointsFor + b.missedPoints;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      
      if (bTotal !== aTotal) return bTotal - aTotal;
      if (bDiff !== aDiff) return bDiff - aDiff;
      if (b.wins !== a.wins) return b.wins - a.wins;

      // Tie Breaker: Head-to-Head
      const h2hMatches = completedMatches.filter(m => {
        const t1Key = playerToTeam[m.team1[0]] || m.team1[0];
        const t2Key = playerToTeam[m.team2[0]] || m.team2[0];
        return (t1Key === a.name && t2Key === b.name) || (t1Key === b.name && t2Key === a.name);
      });

      if (h2hMatches.length > 0) {
        let aH2hPoints = 0;
        let bH2hPoints = 0;
        h2hMatches.forEach(m => {
          const t1Key = playerToTeam[m.team1[0]] || m.team1[0];
          const t1Pts = (m.sets1 || []).reduce((acc, curr) => acc + curr, 0) + (m.score1 || 0);
          const t2Pts = (m.sets2 || []).reduce((acc, curr) => acc + curr, 0) + (m.score2 || 0);
          
          if (t1Key === a.name) {
            aH2hPoints += t1Pts;
            bH2hPoints += t2Pts;
          } else {
            bH2hPoints += t1Pts;
            aH2hPoints += t2Pts;
          }
        });
        
        if (bH2hPoints !== aH2hPoints) {
          return bH2hPoints - aH2hPoints; // Higher H2H points wins the tiebreaker
        }
      }

      // Tie Breaker 2: Buchholz Score (Strength of Schedule)
      // If teams are perfectly tied and didn't play each other (or tied H2H), 
      // the team that played against tougher opponents (higher total points) wins the tie.
      const getBuchholz = (teamName: string) => {
        let opponentTotal = 0;
        completedMatches.forEach(m => {
          const t1Key = playerToTeam[m.team1[0]] || m.team1[0];
          const t2Key = playerToTeam[m.team2[0]] || m.team2[0];
          let opponentKey = null;
          if (t1Key === teamName) opponentKey = t2Key;
          else if (t2Key === teamName) opponentKey = t1Key;
          
          if (opponentKey && stats[opponentKey]) {
            opponentTotal += (stats[opponentKey].pointsFor + stats[opponentKey].missedPoints);
          }
        });
        return opponentTotal;
      };

      const aBuchholz = getBuchholz(a.name);
      const bBuchholz = getBuchholz(b.name);
      
      if (bBuchholz !== aBuchholz) {
        return bBuchholz - aBuchholz;
      }

      // Final fallback to ensure stable rendering if opponents performed identically
      return a.name.localeCompare(b.name);
    });
  }, [tournament, matches]);

  const generateNextStage = async () => {
    const currentStage = tournament.currentStage || 1;
    const nextStage = currentStage + 1;
    
    // For Mixed mode, we need to pass the qualifierMode as the mode for logic
    const logicTournament = isMixedMode ? { ...tournament, mode: tournament.qualifierMode as GameMode } : tournament;
    const matchPairs = generateNextStageMatches(logicTournament, matches, leaderboard);
    
    try {
      const skeletonMatches = matches.filter(m => m.stage === nextStage && m.isSkeleton && !m.isPlayoff);
      if (skeletonMatches.length > 0) {
        for (let i = 0; i < Math.min(matchPairs.length, skeletonMatches.length); i++) {
          await updateDoc(doc(db, `tournaments/${tournament.id}/matches`, skeletonMatches[i].id!), {
            team1: matchPairs[i].team1,
            team2: matchPairs[i].team2,
            isSkeleton: false,
            status: MatchStatus.PENDING
          });
        }
      } else {
        const settings = tournament.qualifierSettings || {
          scoringMode: tournament.scoringMode || ScoringMode.AMERICANO,
          pointsToPlay: tournament.pointsToPlay || 21,
          setsToPlay: tournament.setsToPlay || 1,
          gamesPerSet: tournament.gamesPerSet || 6,
          useGoldenPoint: tournament.useGoldenPoint ?? true
        };

        for (let i = 0; i < matchPairs.length; i++) {
          await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
            ...matchPairs[i],
            tournamentId: tournament.id,
            score1: 0, score2: 0, sets1: [], sets2: [],
            points1: settings.scoringMode === ScoringMode.TENNIS ? '0' : 0,
            points2: settings.scoringMode === ScoringMode.TENNIS ? '0' : 0,
            isTiebreak: false,
            scoringMode: settings.scoringMode,
            setsToPlay: settings.setsToPlay,
            gamesPerSet: settings.gamesPerSet,
            useGoldenPoint: settings.useGoldenPoint,
            pointsToPlay: settings.pointsToPlay,
            status: MatchStatus.PENDING, isSkeleton: false,
            isPlayoff: false
          });
        }
      }
      
      await onUpdate({ currentStage: nextStage });
      setTab(nextStage.toString());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tournaments/${tournament.id}`);
    }
  };

  const handleStartPlayoff = async () => {

    if (!user || !advancingTeamsPreview) return;
    
    try {
      const playoffTeamsCount = (tournament.isKatapgama || tournament.mode === GameMode.MIXED) ? 8 : (tournament.advancingTeamsCount || 8);
      const teamsToProcess = advancingTeamsPreview.slice(0, playoffTeamsCount);

      const playoffMatches = generatePlayoffMatches(
        teamsToProcess,
        tournament.playoffMode as any,
        tournament.courtsCount
      );

      const settings = tournament.playoffSettings || {
        scoringMode: ScoringMode.TENNIS,
        pointsToPlay: 21,
        setsToPlay: 3,
        gamesPerSet: 6,
        useGoldenPoint: true
      };

      for (const m of playoffMatches) {
        let finalSetsToPlay = settings.setsToPlay;
        
        if (tournament.isKatapgama) {
          // Stage 1 is QF (Bo3), Stage 2 is SF (Bo5), Stage 3 is Final (Bo5)
          if (m.stage === 1) finalSetsToPlay = 3;
          else finalSetsToPlay = 5;
        }

        await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
          ...m,
          tournamentId: tournament.id,
          isPlayoff: true,
          scoringMode: settings.scoringMode,
          setsToPlay: finalSetsToPlay,
          gamesPerSet: settings.gamesPerSet,
          useGoldenPoint: settings.useGoldenPoint,
          pointsToPlay: settings.pointsToPlay,
          points1: settings.scoringMode === ScoringMode.TENNIS ? '0' : 0,
          points2: settings.scoringMode === ScoringMode.TENNIS ? '0' : 0,
          isTiebreak: false
        });
      }

      await onUpdate({ 
        playoffStarted: true,
        advancingTeams: advancingTeamsPreview.map(t => t.join(' & '))
      });
      setTab('playoff');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tournaments/${tournament.id}`);
    }
  };

  const handleResetPlayoff = async () => {
    if (!isCreator) return;
    setIsResetingPlayoff(true);
    try {
      // Deep Purge: 
      // 1. Delete all matches explicitly marked as Playoff
      // 2. Delete any 'ghost' qualifier matches (Stage 3+) that aren't part of the 2-stage Katapgama format
      const q = query(collection(db, `tournaments/${tournament.id}/matches`));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.isPlayoff === true || (data.stage > 2 && !data.isPlayoff);
        })
        .map(doc => deleteDoc(doc.ref));
        
      await Promise.all(deletePromises);

      await onUpdate({ playoffStarted: false, advancingTeams: [] });
      setTab('1');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tournaments/${tournament.id}/playoff`);
    } finally {
      setIsResetingPlayoff(false);
    }
  };

  const shuffleAdvancingTeams = () => {
    if (!advancingTeamsPreview) return;
    const shuffled = [...advancingTeamsPreview].sort(() => Math.random() - 0.5);
    setAdvancingTeamsPreview(shuffled);
  };


  const matchesPerStage = useMemo(() => {
    const stage1Count = matches.filter(m => m.stage === 1).length;
    if (stage1Count > 0) return stage1Count;
    if (tournament.mode === GameMode.MIX_AMERICANO) {
      const men = tournament.players.filter(p => p.gender === 'man').length;
      const women = tournament.players.filter(p => p.gender === 'woman').length;
      return Math.floor(Math.min(men, women) / 2);
    }
    return Math.floor(tournament.players.length / 4);
  }, [tournament, matches]);

  const maxPossibleStages = useMemo(() => {
    if (tournament.isKatapgama) return 2; // Strict limit for Katapgama
    if (isAmericanoVariant) return tournament.numberOfMatches || 1;
    if (isStageBasedMode) return Infinity;
    if (!tournament.numberOfMatches || matchesPerStage === 0) return Infinity;
    return Math.ceil(tournament.numberOfMatches / matchesPerStage);
  }, [tournament.numberOfMatches, matchesPerStage, isStageBasedMode, isAmericanoVariant, tournament.isKatapgama]);

  const currentStageMatches = matches.filter(m => m.stage === (tournament.currentStage || 1));
  const currentStageCompleted = currentStageMatches.length > 0 && currentStageMatches.every(m => m.status === MatchStatus.COMPLETED);
  const nextStageExists = matches.some(m => m.stage === (tournament.currentStage || 1) + 1);
  const isLatestStage = tab === (tournament.currentStage || 1).toString();
  const canGenerateNextStage = user && isStageBasedMode && currentStageCompleted && !nextStageExists && (tournament.currentStage || 1) < maxPossibleStages && isLatestStage;
  const canStartPlayoffs = user && (tournament.mode === GameMode.ROUND_ROBIN || tournament.isKatapgama) && currentStageCompleted && (tournament.currentStage || 1) === maxPossibleStages && !nextStageExists && isLatestStage;

  const maxStage = useMemo(() => {
    const stagesFromMatches = matches.filter(m => !m.isPlayoff && !m.deleted).map(m => m.stage || 1);
    const tabStage = parseInt(tab);
    const limit = tournament.isKatapgama ? 2 : Infinity;
    return Math.min(limit, Math.max(1, tournament.currentStage || 1, ...stagesFromMatches, isNaN(tabStage) ? 1 : tabStage));
  }, [tournament.currentStage, matches, tab, tournament.isKatapgama]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full py-10">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="mt-2 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all group flex items-center gap-2">
                <ArrowLeft className="w-6 h-6 text-on-surface/60 group-hover:text-on-surface" />
              </button>
              {tournament.isKatapgama && (
                <KatapgamaLogo className="w-10 h-10 mt-2" />
              )}
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-3">{tournament.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-on-surface/40">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-surface-container-low text-on-surface/60 font-black uppercase tracking-widest text-[10px]">{tournament.mode}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                <span>{tournament.players.length} Players</span>
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                {!isBracketMode && !isMixedMode ? (
                  <>
                    <span>Stage {tab} of {maxPossibleStages !== Infinity ? maxPossibleStages : (tournament.numberOfMatches ?? '?')}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                  </>
                ) : (
                  <>
                    <span className="capitalize">{tab} View</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                  </>
                )}
                <span>{tournament.courtsCount} Courts</span>
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                <span>{tournament.pointsToPlay} Points</span>
                {isMixedMode && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                    <span className="text-primary font-bold">Mixed: {tournament.qualifierMode} → {tournament.playoffMode}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isMixedMode && tournament.playoffStarted && user && (
              <button 
                onClick={handleResetPlayoff} 
                disabled={isResetingPlayoff}
                className="flex items-center gap-2 px-6 py-4 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all font-bold"
              >
                <RefreshCw className={`w-5 h-5 ${isResetingPlayoff ? 'animate-spin' : ''}`} />
                Reset Playoff
              </button>
            )}
            <div className="relative">

              <button onClick={handleShare} className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface/60 hover:text-on-surface">
                <Share2 className="w-6 h-6" />
              </button>
              <AnimatePresence>
                {showShareTooltip && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-on-surface text-surface text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-10">
                    Link Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isCreator && (
              <>
                <button onClick={() => setShowSettings(true)} className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface/60 hover:text-on-surface">
                  <Settings className="w-6 h-6" />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-4 rounded-xl bg-surface-container-low hover:bg-red-500/10 transition-all text-on-surface/60 hover:text-red-500">
                  <Trash2 className="w-6 h-6" />
                </button>
              </>
            )}
            {canGenerateNextStage && (
              <button onClick={generateNextStage} className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Next Stage
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
          {(isStageBasedMode || isMixedMode) && Array.from({ length: maxStage }, (_, i) => (i + 1).toString()).map(s => (
            <button key={s} onClick={() => setTab(s)} className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${tab === s ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>
              {isMixedMode && s === "1" && maxStage === 1 ? 'Qualifier' : `Stage ${s}`}
            </button>
          ))}
          {isBracketMode && !isMixedMode && <button onClick={() => setTab('bracket')} className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'bracket' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>Bracket</button>}
          {isMixedMode && <button onClick={() => setTab('playoff')} className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'playoff' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>Playoff</button>}
          {<button onClick={() => setTab('leaderboard')} className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'leaderboard' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>Leaderboard</button>}
        </div>
      </div>


      {tab === 'bracket' ? (
        <div className="w-full"><BracketView tournament={tournament} matches={matches.filter(m => !m.isPlayoff)} onSelectMatch={onSelectMatch} /></div>
      ) : tab === 'playoff' ? (
        <div className="w-full">
          {tournament.playoffStarted ? (
            <BracketView tournament={{ ...tournament, mode: tournament.playoffMode as GameMode }} matches={matches.filter(m => m.isPlayoff && !m.deleted)} onSelectMatch={onSelectMatch} />
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="bg-surface-container-low rounded-3xl p-10 border border-on-surface/5">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-on-surface mb-1">Playoff Promotion</h3>
                    <p className="text-on-surface/40">Review advancing teams from {tournament.qualifierMode} qualifier stage</p>
                  </div>
                </div>

                {!advancingTeamsPreview ? (
                  <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-on-surface/5">
                    <AlertTriangle className="w-12 h-12 text-on-surface/20 mx-auto mb-6" />
                    <p className="text-on-surface/40 font-medium mb-8">Ready to transition to playoffs?</p>
                    <button 
                      onClick={() => setAdvancingTeamsPreview(getAdvancingTeams(leaderboard, tournament.advancingTeamsCount || 8, tournament.isKatapgama ? false : (tournament.qualifierMode === GameMode.NORMAL_AMERICANO || tournament.qualifierMode === GameMode.MEXICANO || tournament.qualifierMode === GameMode.MIX_AMERICANO), tournament.players))}
                      className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                      Process Advancing Teams
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {advancingTeamsPreview.map((team, idx) => {
                        const teamName = tournament.players.find(p => p.name === team[0] || p.name === team.join(' & '))?.teamName;
                        return (
                          <div key={idx} className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-on-surface/5">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 bg-on-surface/5 flex items-center justify-center rounded-xl font-black text-on-surface/20">{idx + 1}</span>
                              <div className="flex flex-col">
                                {teamName && <span className="text-[10px] uppercase font-black tracking-widest text-[#8A9A5B] mb-0.5">{teamName}</span>}
                                <span className="font-bold text-on-surface">{team.join(' & ')}</span>
                              </div>
                            </div>
                            {idx < (tournament.advancingTeamsCount || 8) / 2 && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg">High Seed</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-on-surface/5">
                      <button 
                        onClick={handleStartPlayoff}
                        className="flex-1 bg-primary text-on-primary py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Generate Playoff Bracket
                      </button>
                      <button 
                        onClick={shuffleAdvancingTeams}
                        className="flex items-center justify-center gap-3 px-8 py-5 bg-surface-container-high text-on-surface rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-surface-container-highest transition-all"
                      >
                        <Shuffle className="w-5 h-5" />
                        Shuffle Seeding
                      </button>
                      <button 
                        onClick={() => setAdvancingTeamsPreview(null)}
                        className="px-8 py-5 font-bold text-on-surface/40 hover:text-on-surface/60 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : tab !== 'leaderboard' ? (
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12"><MatchesView matches={matches.filter(m => !m.isPlayoff && !m.deleted)} onSelectMatch={onSelectMatch} stage={parseInt(tab)} players={tournament.players} /></div>
      ) : (
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12"><LeaderboardView tournament={leaderboard ? { ...tournament } : tournament} leaderboard={leaderboard} /></div>
      )}


      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-on-surface/20 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-8"><Trash2 className="w-10 h-10" /></div>
                <h3 className="text-3xl font-bold text-on-surface mb-4">Delete Tournament?</h3>
                <p className="text-on-surface/40 mb-10 text-lg">This action is permanent. All matches and scores will be lost forever.</p>
                <div className="flex flex-col gap-4">
                  <button onClick={onDelete} className="w-full py-5 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/10 hover:bg-red-600 transition-all">Yes, Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 font-bold text-on-surface/60 rounded-xl hover:bg-surface-container-low transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showSettings && (
          <SettingsModal 
            tournament={tournament} 
            onClose={() => setShowSettings(false)} 
            onSave={async (updates) => {
              // Call the original onUpdate first
              onUpdate(updates);
              
              // Propagation logic
              if (updates.qualifierSettings || updates.playoffSettings) {
                const s_q = updates.qualifierSettings;
                const s_p = updates.playoffSettings;
                
                const { writeBatch } = await import('firebase/firestore');
                const batch = writeBatch(db);
                let count = 0;

                if (s_q) {
                  // Propagate to all qualifier matches
                  const q_matches = matches.filter(m => !m.isPlayoff);
                  for (const m of q_matches) {
                    const ref = doc(db, `tournaments/${tournament.id}/matches`, m.id!);
                    batch.update(ref, {
                      scoringMode: s_q.scoringMode,
                      pointsToPlay: s_q.pointsToPlay,
                      setsToPlay: s_q.setsToPlay,
                      gamesPerSet: s_q.gamesPerSet,
                      useGoldenPoint: s_q.useGoldenPoint
                    });
                    count++;
                  }
                }

                if (s_p) {
                  // Propagate to all playoff matches
                  const p_matches = matches.filter(m => m.isPlayoff);
                  for (const m of p_matches) {
                    const ref = doc(db, `tournaments/${tournament.id}/matches`, m.id!);
                    batch.update(ref, {
                      scoringMode: s_p.scoringMode,
                      pointsToPlay: s_p.pointsToPlay,
                      setsToPlay: s_p.setsToPlay,
                      gamesPerSet: s_p.gamesPerSet,
                      useGoldenPoint: s_p.useGoldenPoint
                    });
                    count++;
                  }
                }

                if (count > 0) {
                  await batch.commit();
                  console.log(`Propagated settings to ${count} matches`);
                }
              }
            }} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
