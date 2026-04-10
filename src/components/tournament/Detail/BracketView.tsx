import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Tournament, Match, MatchStatus, GameMode } from '../../../types';

interface BracketViewProps {
  tournament: Tournament;
  matches: Match[];
  onSelectMatch: (m: Match) => void;
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}

export const BracketView = ({ tournament, matches, onSelectMatch }: BracketViewProps) => {
  if (tournament.mode === GameMode.SWISS_SYSTEM) {
    return <SwissBracket tournament={tournament} matches={matches} onSelectMatch={onSelectMatch} />;
  }
  return <EliminationBracket tournament={tournament} matches={matches} onSelectMatch={onSelectMatch} />;
};

const SwissBracket = ({ tournament, matches, onSelectMatch }: BracketViewProps) => {
  const maxStages = Math.ceil(Math.log2(tournament.players.length / 2)) + 1;
  const constraintsRef = useRef(null);
  const stages = Array.from({ length: maxStages }, (_, i) => i + 1);
  const players = tournament.players;

  const getTeamName = (playerNames: string[]) => {
    if (!playerNames.length) return null;
    const player = players.find(p => p.name === playerNames[0]);
    return player?.teamName || null;
  };

  const getRecordAtStage = (team: string[], stageLimit: number) => {
    let wins = 0;
    let losses = 0;
    const teamKey = [...team].sort().join(' & ');
    
    matches.filter(m => (m.stage || 1) < stageLimit && m.status === MatchStatus.COMPLETED).forEach(m => {
      const mTeam1 = [...m.team1].sort().join(' & ');
      const mTeam2 = [...m.team2].sort().join(' & ');
      
      if (mTeam1 === teamKey) {
        if (m.winner === 1) wins++;
        else if (m.winner === 2) losses++;
      } else if (mTeam2 === teamKey) {
        if (m.winner === 2) wins++;
        else if (m.winner === 1) losses++;
      }
    });
    return `${wins}-${losses}`;
  };

  const { width: windowWidth } = useWindowSize();
  const getScaleFactor = () => {
    if (windowWidth < 768) return 0.65;
    if (windowWidth < 1024) return 0.8;
    return 1.0;
  };
  const SCALE = getScaleFactor();
  const COLUMN_WIDTH = 320 * SCALE;
  const COLUMN_GAP = 32 * SCALE;
  
  const totalWidth = stages.length * (COLUMN_WIDTH + COLUMN_GAP) - COLUMN_GAP;
  const fitsInViewport = totalWidth < windowWidth - 48;

  return (
    <div ref={constraintsRef} className={`cursor-grab active:cursor-grabbing no-scrollbar overflow-hidden w-full flex ${fitsInViewport ? 'justify-center' : 'justify-start px-6'}`}>
      <motion.div 
        drag="x" 
        dragConstraints={fitsInViewport ? { left: 0, right: 0 } : constraintsRef}
        dragElastic={0.05}
        className="flex pb-8 pt-4 w-max relative"
        style={{ gap: `${COLUMN_GAP}px` }}
      >
      {stages.map(r => {
        const stageMatches = matches.filter(m => m.stage === r);
        const groups: Record<string, Match[]> = {};
        
        stageMatches.forEach(m => {
          const record = getRecordAtStage(m.team1, r);
          if (!groups[record]) groups[record] = [];
          groups[record].push(m);
        });

        const sortedRecords = Object.keys(groups).sort((a, b) => {
          const [wA] = a.split('-').map(Number);
          const [wB] = b.split('-').map(Number);
          return wB - wA;
        });

        return (
          <div key={r} className="flex-shrink-0" style={{ width: COLUMN_WIDTH, gap: `${32 * SCALE}px`, display: 'flex', flexDirection: 'column' }}>
            <div 
              className="bg-surface-container-low rounded-2xl flex items-center justify-between border border-on-surface/5"
              style={{ padding: `${16 * SCALE}px ${24 * SCALE}px` }}
            >
              <h3 className="font-black text-on-surface/40 uppercase tracking-widest" style={{ fontSize: `${12 * SCALE}px` }}>Stage {r}</h3>
              <span 
                className="font-bold rounded-md bg-on-surface/5 text-on-surface/30"
                style={{ fontSize: `${10 * SCALE}px`, padding: `${2 * SCALE}px ${8 * SCALE}px` }}
              >
                {stageMatches.length} Matches
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${40 * SCALE}px` }}>
              {sortedRecords.map(record => (
                <div key={record} style={{ display: 'flex', flexDirection: 'column', gap: `${16 * SCALE}px` }}>
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-px flex-1 bg-on-surface/5" />
                    <span className="font-black text-on-surface/20 uppercase tracking-[0.2em]" style={{ fontSize: `${10 * SCALE}px` }}>{record} Group</span>
                    <div className="h-px flex-1 bg-on-surface/5" />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${12 * SCALE}px` }}>
                    {groups[record].filter(m => !m.team1.includes('BYE') && !m.team2.includes('BYE')).map(m => (
                      <motion.div
                        key={m.id}
                        whileHover={!m.isSkeleton ? { scale: 1.02, y: -2 } : {}}
                        onClick={() => !m.isSkeleton && onSelectMatch(m)}
                        className={`bg-surface-container-lowest rounded-2xl shadow-sm border border-on-surface/5 transition-all ${m.isSkeleton ? 'opacity-40 grayscale cursor-default' : 'hover:shadow-xl hover:border-primary/20 cursor-pointer'}`}
                        style={{ padding: `${20 * SCALE}px`, fontSize: `${14 * SCALE}px` }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${12 * SCALE}px` }}>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col truncate max-w-[180px]">
                              {getTeamName(m.team1) && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#8A9A5B] mb-0.5 leading-none">
                                  {getTeamName(m.team1)}
                                </span>
                              )}
                              <span className={`font-bold truncate ${m.status === MatchStatus.COMPLETED && m.winner === 1 ? 'text-primary' : 'text-on-surface/60'}`}>
                                {m.team1.length > 0 ? m.team1.join(' & ') : "TBD"}
                              </span>
                            </div>
                            <span className="font-black text-lg">{m.score1}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col truncate max-w-[180px]">
                              {getTeamName(m.team2) && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#8A9A5B] mb-0.5 leading-none">
                                  {getTeamName(m.team2)}
                                </span>
                              )}
                              <span className={`font-bold truncate ${m.status === MatchStatus.COMPLETED && m.winner === 2 ? 'text-primary' : 'text-on-surface/60'}`}>
                                {m.team2.length > 0 ? m.team2.join(' & ') : "TBD"}
                              </span>
                            </div>
                            <span className="font-black text-lg">{m.score2}</span>
                          </div>
                        </div>
                        {m.status === MatchStatus.COMPLETED && (
                          <div 
                            className="border-t border-on-surface/5 flex items-center justify-between"
                            style={{ marginTop: `${12 * SCALE}px`, paddingTop: `${12 * SCALE}px` }}
                          >
                            <span className="font-bold text-on-surface/20 uppercase tracking-wider" style={{ fontSize: `${10 * SCALE}px` }}>Final Score</span>
                            <div className="flex gap-1">
                              {m.sets1.map((s, i) => (
                                <span 
                                  key={i} 
                                  className="font-bold rounded bg-on-surface/5 flex items-center justify-center text-on-surface/40"
                                  style={{ width: `${20 * SCALE}px`, height: `${20 * SCALE}px`, fontSize: `${10 * SCALE}px` }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </motion.div>
    </div>
  );
};

const EliminationBracket = ({ tournament, matches, onSelectMatch }: BracketViewProps) => {
  const constraintsRef = useRef(null);
  const isDouble = tournament.mode === GameMode.DOUBLE_ELIMINATION;
  const players = tournament.players;

  const getTeamName = (playerNames: string[]) => {
    if (!playerNames.length) return null;
    const player = players.find(p => p.name === playerNames[0]);
    return player?.teamName || null;
  };
  
  const wbMatches = matches.filter(m => !m.isLosersBracket && !m.id?.startsWith('gf'));
  const lbMatches = matches.filter(m => m.isLosersBracket);
  const gfMatches = matches.filter(m => m.id?.startsWith('gf'));

  const maxWBStage = wbMatches.length > 0 ? Math.max(...wbMatches.map(m => m.stage || 1), 1) : 1;
  const maxLBStage = lbMatches.length > 0 ? Math.max(...lbMatches.map(m => m.stage || 1), 1) : 0;

  const getStageName = (colIndex: number) => {
    if (isDouble) {
      if (colIndex === maxCols) return 'Grand Final';
      if (colIndex % 2 === 0) return `Upper Stage ${Math.floor(colIndex/2) + 1}`;
      return `Lower Stage ${Math.floor(colIndex/2) + 1}`;
    }
    
    const reverseIndex = maxCols - colIndex;
    if (reverseIndex === 0) return 'Final';
    if (reverseIndex === 1) return 'Semi Finals';
    if (reverseIndex === 2) return 'Quarter Finals';
    if (reverseIndex === 3) return 'Round of 16';
    return `Round ${colIndex + 1}`;
  };

  const getMatchCol = (m: Match) => {
    if (m.id?.startsWith('gf')) return isDouble ? (maxWBStage - 1) * 2 + 1 : maxWBStage - 1;
    if (!isDouble) return (m.stage! - 1);
    
    // Double Elimination mapping
    if (!m.isLosersBracket) return (m.stage! - 1) * 2;
    return m.stage!; 
  };

  const maxCols = isDouble ? (maxWBStage - 1) * 2 + 1 : maxWBStage - 1;
  const { width: windowWidth } = useWindowSize();

  // Responsive Scaling Factor
  const getScaleFactor = () => {
    if (windowWidth < 768) return 0.65; // Mobile
    if (windowWidth < 1024) return 0.8; // Tablet
    return 1.0; // Desktop
  };

  const SCALE = getScaleFactor();
  const MATCH_WIDTH = 280 * SCALE;
  const MATCH_HEIGHT = 100 * SCALE;
  const COLUMN_GAP = 100 * SCALE;
  const ROW_GAP = 40 * SCALE;
  const HEADER_OFFSET = 140 * SCALE; 

  const getMatchPos = (m: Match) => {
    const isLB = m.isLosersBracket;
    const isGF = m.id?.startsWith('gf');
    const col = getMatchCol(m);
    
    const x = col * (MATCH_WIDTH + COLUMN_GAP);
    let y = 0;

    if (isGF) {
      y = 300; // Center of GF
    } else if (!isLB) {
      // WB spacing: 2^(maxWB - stage)
      const stage = m.stage!;
      const spacingMultiplier = Math.pow(2, stage - 1);
      const initialOffset = (spacingMultiplier - 1) * (MATCH_HEIGHT + ROW_GAP) / 2;
      y = initialOffset + (m.matchIndex || 0) * spacingMultiplier * (MATCH_HEIGHT + ROW_GAP);
    } else {
      // LB spacing: Cluster below WB
      const stage = m.stage!;
      const wbHeightOffset = Math.pow(2, maxWBStage - 1) * (MATCH_HEIGHT + ROW_GAP) + 100;
      // LB matches are more compact
      const lbInStage = matches.filter(cm => cm.isLosersBracket && cm.stage === stage).length;
      y = wbHeightOffset + (m.matchIndex || 0) * (MATCH_HEIGHT + ROW_GAP);
    }

    return { x, y };
  };

  const matchesByCol: Record<number, Match[]> = {};
  matches.forEach(m => {
    if (m.team1.includes('BYE') || m.team2.includes('BYE')) return;
    const col = getMatchCol(m);
    if (!matchesByCol[col]) matchesByCol[col] = [];
    matchesByCol[col].push(m);
  });

  const totalWidth = (maxCols + 1) * (MATCH_WIDTH + COLUMN_GAP);
  const totalHeight = 1200 * SCALE; // Increased to accommodate LB
  const fitsInViewport = totalWidth < windowWidth - 48; // -48 for margins

  return (
    <div ref={constraintsRef} className={`cursor-grab active:cursor-grabbing no-scrollbar overflow-hidden w-full flex ${fitsInViewport ? 'justify-center' : 'justify-start px-6'}`}>
      <motion.div 
        drag="x" 
        dragConstraints={fitsInViewport ? { left: 0, right: 0 } : constraintsRef}
        dragElastic={0.05}
        className="flex pb-20 pt-10 w-max relative"
        style={{ minHeight: totalHeight }}
      >
        {/* Draw connectors first to put them behind cards */}
        <svg 
          className="absolute inset-0 pointer-events-none overflow-visible z-0" 
          style={{ width: totalWidth, height: totalHeight }}
        >
          {matches.map(m => {
            if (!m.nextMatchId || m.id?.startsWith('gf') || m.team1.includes('BYE') || m.team2.includes('BYE')) return null;
            
            const start = getMatchPos(m);
            const target = matches.find(tm => tm.logicId === m.nextMatchId || tm.id === m.nextMatchId);
            if (!target) return null;
            const end = getMatchPos(target);

            const startX = start.x + 24 + MATCH_WIDTH;
            const startY = start.y + HEADER_OFFSET + MATCH_HEIGHT / 2;
            const endX = end.x + 24;
            const endY = end.y + HEADER_OFFSET + MATCH_HEIGHT / 2;
            
            const midX = startX + (endX - startX) / 2;

            return (
              <path 
                key={`conn-${m.id}`}
                d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2 * SCALE}
                className={`${m.isSkeleton ? 'text-on-surface/5' : 'text-on-surface/10'}`}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {Array.from({ length: maxCols + 1 }).map((_, colIndex) => {
          const colMatches = (matchesByCol[colIndex] || []).sort((a, b) => (a.matchIndex || 0) - (b.matchIndex || 0));
          const isGFCol = isDouble && colIndex === maxCols;
          const isWBOnlyCol = !isDouble || (colIndex % 2 === 0 && colIndex < maxCols);
          
          // Determine layout height based on max matches in any column for this tournament
          const colHeight = 800; 

          return (
            <div key={colIndex} className="flex-shrink-0 relative" style={{ width: MATCH_WIDTH + COLUMN_GAP }}>
              <div className="px-6 mb-12">
                <div className="px-4 py-2 bg-surface-container-low/80 backdrop-blur-md rounded-xl border border-on-surface/5 inline-block shadow-sm">
                  <h3 className="font-black text-on-surface/40 uppercase tracking-[0.25em]" style={{ fontSize: `${10 * SCALE}px` }}>
                    {getStageName(colIndex)}
                  </h3>
                </div>
              </div>

              <div className="relative">
                {colMatches.map(m => {
                  const pos = getMatchPos(m);
                  const isGF = m.id?.startsWith('gf');
                  
                  // Logic for Y position
                  // WB matches use standard power-of-2 spacing
                  // LB matches are clustered below
                  return (
                    <div 
                      key={m.id} 
                      className="absolute"
                      style={{ 
                        left: 24, 
                        top: pos.y, 
                        width: MATCH_WIDTH, 
                        height: MATCH_HEIGHT, 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}
                    >
                      <motion.div
                        whileHover={!m.isSkeleton ? { scale: 1.02, x: 4 } : {}}
                        onClick={() => !m.isSkeleton && onSelectMatch(m)}
                        className={`relative z-10 bg-surface-container-lowest rounded-2xl shadow-md border-2 ${isGF ? 'border-primary/40' : 'border-on-surface/5'} transition-all w-full ${m.isSkeleton ? 'opacity-40 grayscale blur-[0.5px]' : 'hover:shadow-2xl hover:border-primary/30 cursor-pointer'}`}
                        style={{ padding: `${20 * SCALE}px` }}
                      >
                        {isGF && (
                          <div 
                            className="absolute left-1/2 -translate-x-1/2 bg-primary text-on-primary font-black uppercase rounded-full shadow-lg whitespace-nowrap"
                            style={{ 
                              top: -12 * SCALE, 
                              padding: `${4 * SCALE}px ${12 * SCALE}px`,
                              fontSize: `${9 * SCALE}px`,
                              letterSpacing: `${0.2 * SCALE}em`
                            }}
                          >
                            🏆 Grand Final {m.matchIndex === 1 ? 'Reset' : ''}
                          </div>
                        )}
                        <div className="space-y-3">
                          {[1, 2].map(tNum => {
                            const team = tNum === 1 ? m.team1 : m.team2;
                            const score = tNum === 1 ? m.score1 : m.score2;
                            const isWinner = m.status === MatchStatus.COMPLETED && m.winner === tNum;
                            const sets = tNum === 1 ? m.sets1 : m.sets2;
                            const hasSets = sets && sets.length > 0;
                            
                            return (
                              <div key={tNum} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <div 
                                      className={`rounded-full ${isWinner ? 'bg-primary' : 'bg-on-surface/5'}`} 
                                      style={{ width: `${4 * SCALE}px`, height: `${32 * SCALE}px` }}
                                    />
                                    <div className="flex flex-col truncate">
                                      {getTeamName(team) && (
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#8A9A5B] mb-0.5 leading-none">
                                          {getTeamName(team)}
                                        </span>
                                      )}
                                      <span 
                                        className={`font-bold truncate ${isWinner ? 'text-primary' : 'text-on-surface/60'}`}
                                        style={{ fontSize: `${12 * SCALE}px` }}
                                      >
                                        {team.length > 0 ? team.join(' & ') : "TBD"}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {hasSets && (
                                      <div className="flex gap-1.5 opacity-60">
                                        {sets.map((s, idx) => (
                                          <span 
                                            key={idx}
                                            className="font-bold tabular-nums"
                                            style={{ fontSize: `${11 * SCALE}px`, width: `${14 * SCALE}px`, textAlign: 'center' }}
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <span 
                                      className={`font-black text-right tabular-nums ${isWinner ? 'text-primary' : 'text-on-surface/40'}`}
                                      style={{ fontSize: `${16 * SCALE}px`, minWidth: `${24 * SCALE}px` }}
                                    >
                                      {score}
                                    </span>
                                  </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
