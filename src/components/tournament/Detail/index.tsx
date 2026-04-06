import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Share2, 
  Trash2, 
  Plus, 
  ChevronRight, 
  CheckCircle, 
  Play,
  Trophy
} from 'lucide-react';
import { doc, updateDoc, collection, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Tournament, Match, MatchStatus, GameMode, Player, PlayerStats, OperationType } from '../../../types';
import { handleFirestoreError } from '../../../lib/firestore';
import { generateNextStageMatches } from '../../../utils/tournamentLogic';
import { BracketView } from './BracketView';
import { LeaderboardView } from './LeaderboardView';
import { MatchesView } from './MatchesView';

interface TournamentDetailProps {
  tournament: Tournament;
  matches: Match[];
  onBack: () => void;
  onSelectMatch: (m: Match) => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Tournament>) => void;
  isCreator: boolean;
}

export default function TournamentDetail({ 
  tournament, 
  matches, 
  onBack, 
  onSelectMatch, 
  onDelete, 
  onUpdate, 
  isCreator 
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

  const defaultTab = isBracketMode ? 'bracket' : (isStageBasedMode ? (tournament.currentStage?.toString() || '1') : '1');
  const [tab, setTab] = useState<string>(defaultTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?tournamentId=${tournament.id}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  const leaderboard = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};
    tournament.players.forEach(p => {
      stats[p.name] = { 
        name: p.name, 
        wins: 0, 
        losses: 0, 
        ties: 0, 
        pointsFor: 0, 
        pointsAgainst: 0, 
        missedPoints: 0, 
        matchesPlayed: 0 
      };
    });

    const completedMatches = matches.filter(m => m.status === MatchStatus.COMPLETED);
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

      m.team1.forEach(p => {
        if (stats[p]) {
          stats[p].pointsFor += t1Points;
          stats[p].pointsAgainst += t2Points;
          stats[p].matchesPlayed++;
          if (m.winner === 1) stats[p].wins++;
          else if (m.winner === 2) stats[p].losses++;
          else if (t1Points === t2Points) stats[p].ties++;
        }
      });

      m.team2.forEach(p => {
        if (stats[p]) {
          stats[p].pointsFor += t2Points;
          stats[p].pointsAgainst += t1Points;
          stats[p].matchesPlayed++;
          if (m.winner === 2) stats[p].wins++;
          else if (m.winner === 1) stats[p].losses++;
          else if (t1Points === t2Points) stats[p].ties++;
        }
      });
    });

    const maxMatches = Math.max(...Object.values(stats).map(s => s.matchesPlayed), 0);
    const modesWithNormalization = [
      GameMode.TEAM_AMERICANO, GameMode.ROUND_ROBIN, GameMode.SWISS_SYSTEM,
      GameMode.NORMAL_AMERICANO, GameMode.MIX_AMERICANO, GameMode.MEXICANO,
      GameMode.SUPER_MEXICANO, GameMode.TEAM_MEXICANO, GameMode.MIXED_MEXICANO
    ];

    Object.values(stats).forEach(s => {
      if (modesWithNormalization.includes(tournament.mode) && s.matchesPlayed > 0 && maxMatches > 0) {
        const adjustedTotal = s.pointsFor * (maxMatches / s.matchesPlayed);
        s.missedPoints = Math.round(adjustedTotal - s.pointsFor);
      } else {
        s.missedPoints = 0;
      }
    });

    return Object.values(stats).sort((a, b) => {
      const aTotal = a.pointsFor + a.missedPoints;
      const bTotal = b.pointsFor + b.missedPoints;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      return bTotal - aTotal || bDiff - aDiff || b.wins - a.wins;
    });
  }, [tournament, matches]);

  const generateNextStage = async () => {
    const currentStage = tournament.currentStage || 1;
    const nextStage = currentStage + 1;
    
    const matchPairs = generateNextStageMatches(tournament, matches, leaderboard);
    
    try {
      const skeletonMatches = matches.filter(m => m.stage === nextStage && m.isSkeleton);
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
        for (let i = 0; i < matchPairs.length; i++) {
          await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
            ...matchPairs[i],
            tournamentId: tournament.id,
            score1: 0, score2: 0, sets1: [], sets2: [],
            status: MatchStatus.PENDING, isSkeleton: false
          });
        }
      }
      
      await onUpdate({ currentStage: nextStage });
      setTab(nextStage.toString());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tournaments/${tournament.id}`);
    }
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
    if (isAmericanoVariant) return tournament.numberOfMatches || 1;
    if (isStageBasedMode) return Infinity;
    if (!tournament.numberOfMatches || matchesPerStage === 0) return Infinity;
    return Math.ceil(tournament.numberOfMatches / matchesPerStage);
  }, [tournament.numberOfMatches, matchesPerStage, isStageBasedMode, isAmericanoVariant]);

  const currentStageMatches = matches.filter(m => m.stage === (tournament.currentStage || 1));
  const currentStageCompleted = currentStageMatches.length > 0 && currentStageMatches.every(m => m.status === MatchStatus.COMPLETED);
  const nextStageExists = matches.some(m => m.stage === (tournament.currentStage || 1) + 1);
  const isLatestStage = tab === (tournament.currentStage || 1).toString();
  const canGenerateNextStage = isCreator && isStageBasedMode && currentStageCompleted && !nextStageExists && (tournament.currentStage || 1) < maxPossibleStages && isLatestStage;
  const canStartPlayoffs = isCreator && tournament.mode === GameMode.ROUND_ROBIN && currentStageCompleted && (tournament.currentStage || 1) === tournament.numberOfMatches && !nextStageExists && isLatestStage;

  const maxStage = useMemo(() => {
    const stagesFromMatches = matches.map(m => m.stage || 1);
    const tabStage = parseInt(tab);
    return Math.max(1, tournament.currentStage || 1, ...stagesFromMatches, isNaN(tabStage) ? 1 : tabStage);
  }, [tournament.currentStage, matches, tab]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full py-10">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-start gap-6">
            <button onClick={onBack} className="mt-2 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all group">
              <ArrowLeft className="w-6 h-6 text-on-surface/60 group-hover:text-on-surface" />
            </button>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight mb-3">{tournament.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-on-surface/40">
                <span className="px-3 py-1 rounded-xl bg-surface-container-low text-on-surface/60">{tournament.mode}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                <span>{tournament.players.length} Players</span>
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
                {!isBracketMode ? (
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
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
              <button onClick={() => setShowDeleteConfirm(true)} className="p-4 rounded-xl bg-surface-container-low hover:bg-red-500/10 transition-all text-on-surface/60 hover:text-red-500">
                <Trash2 className="w-6 h-6" />
              </button>
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
          {!isBracketMode && Array.from({ length: maxStage }, (_, i) => (i + 1).toString()).map(s => (
            <button key={s} onClick={() => setTab(s)} className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${tab === s ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>
              Stage {s}
            </button>
          ))}
          {isBracketMode && <button onClick={() => setTab('bracket')} className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'bracket' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>Bracket</button>}
          {<button onClick={() => setTab('leaderboard')} className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'leaderboard' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>Leaderboard</button>}
        </div>
      </div>

      {tab === 'bracket' ? (
        <div className="w-full"><BracketView tournament={tournament} matches={matches} onSelectMatch={onSelectMatch} /></div>
      ) : tab !== 'leaderboard' ? (
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12"><MatchesView matches={matches} onSelectMatch={onSelectMatch} stage={parseInt(tab)} /></div>
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
      </AnimatePresence>
    </motion.div>
  );
}
