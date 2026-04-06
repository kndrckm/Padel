/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, ReactNode, FormEvent } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  getDocFromServer,
  deleteDoc,
  getDocs,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';
import { 
  GameMode, 
  MatchStatus, 
  Tournament, 
  Match, 
  PlayerStats, 
  OperationType,
  Player
} from './types';
import { 
  Plus, 
  Minus,
  Trophy, 
  Users, 
  Play, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  LogOut, 
  ArrowLeft,
  Save,
  ChevronUp,
  ChevronDown,
  Undo2,
  Redo2,
  Loader2,
  Trash2,
  Settings,
  X,
  Share2,
  AlertTriangle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Padel Racket Icon Component
const PadelRacket = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="m18.273 21l-5.517-5.55l-.989.989q-.498.498-1.109.74q-.61.242-1.252.242t-1.268-.242t-1.122-.74L2.983 12.4q-.498-.498-.74-1.11T2 10.017t.242-1.272t.74-1.11l2.691-2.69q.498-.499 1.116-.741t1.267-.242q.642 0 1.254.242q.611.242 1.11.74l4.038 4.033q.498.498.74 1.114q.243.615.243 1.275t-.243 1.272t-.74 1.11l-1.008 1.008l5.53 5.536zm-8.887-4.56q.453 0 .891-.176q.439-.175.777-.514l2.696-2.715q.339-.333.515-.78q.175-.447.175-.894t-.175-.89t-.515-.78L9.712 5.658q-.333-.339-.766-.518q-.432-.178-.884-.178t-.885.179q-.433.178-.771.517l-2.69 2.69q-.339.339-.515.777t-.176.891t.176.896t.515.78l4.019 4.058q.332.339.765.515t.886.175m-3.868-5.379q.232 0 .387-.151q.155-.152.155-.384t-.152-.386t-.384-.155t-.386.151t-.155.384t.151.387t.384.155m1.523-1.518q.232 0 .387-.151q.155-.152.155-.384t-.152-.387t-.384-.155q-.231 0-.386.152t-.155.384t.152.387q.151.154.383.154m.156 3.216q.232 0 .387-.152t.155-.384t-.152-.396t-.384-.164t-.387.164q-.154.164-.154.396t.151.384t.384.152m1.342-4.74q.232 0 .387-.151t.155-.384t-.152-.387t-.384-.155t-.386.152t-.155.384t.152.386t.383.155m.181 3.221q.232 0 .387-.151q.154-.152.154-.384t-.151-.387t-.384-.154t-.387.151t-.155.384t.152.387t.384.154m.15 3.197q.232 0 .396-.152q.165-.152.165-.384t-.165-.387t-.396-.154t-.384.151t-.152.384t.152.387q.152.155.384.155m1.367-4.72q.232 0 .387-.164t.155-.396t-.152-.384t-.384-.152t-.386.152t-.155.384t.151.396t.384.164m.156 3.197q.232 0 .387-.152t.154-.384t-.151-.387t-.384-.154t-.387.151t-.154.384t.151.387t.384.155m1.504-1.524q.232 0 .396-.151q.165-.152.165-.384t-.165-.387t-.396-.155t-.384.152t-.151.384t.151.387t.384.154M19.13 8.77q-1.197 0-2.029-.846q-.833-.846-.833-2.042t.833-2.039T19.131 3t2.043.846t.845 2.042t-.845 2.039t-2.043.842m.005-1q.778 0 1.33-.548q.553-.549.553-1.332t-.548-1.336T19.139 4t-1.326.548q-.544.549-.544 1.332q0 .784.545 1.336q.544.553 1.322.553m.018-1.884"/>
  </svg>
);

const PadelBall = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.6881 16.5079C20.5832 16.4493 20.435 16.3627 20.2514 16.246C19.8844 16.0126 19.3751 15.6581 18.787 15.1643C17.6106 14.1765 16.1165 12.6292 14.816 10.3767C13.5156 8.12426 12.9226 6.05661 12.6553 4.54398C12.5217 3.78771 12.4694 3.16946 12.4508 2.73491C12.4415 2.51757 12.4406 2.34597 12.4422 2.22577C12.4431 2.16566 12.4495 2.04426 12.4508 2.01052C10.6072 1.9259 8.71856 2.35017 7.00167 3.34142C5.28578 4.33209 3.97456 5.75449 3.126 7.39219L3.31486 7.49547C3.41977 7.55415 3.56795 7.64072 3.75151 7.75744C4.11855 7.99083 4.6278 8.34528 5.21594 8.83912C6.39229 9.82688 7.88643 11.3743 9.18688 13.6267C10.4873 15.8792 11.0803 17.9468 11.3476 19.4594C11.4812 20.2157 11.5335 20.834 11.5521 21.2685C11.5614 21.4858 11.5623 21.6575 11.5607 21.7777V21.9932C13.4017 22.0762 15.2873 21.6517 17.0017 20.6619C18.7158 19.6723 20.0261 18.2518 20.8747 16.6162L20.6881 16.5079Z" fill="currentColor"/>
    <path d="M10.0598 21.8114C10.0611 21.7179 10.0615 21.5204 10.0535 21.3327C10.0374 20.9572 9.99142 20.4051 9.87046 19.7204C9.62854 18.3512 9.08739 16.4544 7.88784 14.3767C6.6883 12.299 5.31623 10.882 4.25137 9.98786C3.7189 9.54076 3.26381 9.2249 2.94663 9.02321C2.7881 8.9224 2.61686 8.82409 2.53523 8.77843C1.63973 11.4119 1.84135 14.4035 3.34142 17.0017C4.84147 19.5998 7.33139 21.2702 10.0598 21.8114Z" fill="currentColor"/>
    <path d="M13.9431 2.19181C13.9419 2.28533 13.9414 2.48305 13.9494 2.67075C13.9655 3.04627 14.0115 3.59833 14.1325 4.28301C14.3744 5.65227 14.9155 7.54903 16.1151 9.62671C17.3146 11.7044 18.6867 13.1214 19.7516 14.0156C20.284 14.4627 20.7391 14.7785 21.0563 14.9802C21.2148 15.081 21.3864 15.1795 21.468 15.2252C22.3636 12.5916 22.162 9.59995 20.6619 7.00167C19.1618 4.40337 16.6717 2.73296 13.9431 2.19181Z" fill="currentColor"/>
  </svg>
);

const ManIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="14" r="5" />
    <path d="M13.5 10.5L21 3" />
    <path d="M16 3H21V8" />
  </svg>
);

const WomanIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14V22" />
    <path d="M9 19H15" />
  </svg>
);

// Error Handling Function
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      try {
        const parsed = JSON.parse(event.message);
        setErrorMessage(parsed.error || 'A database error occurred.');
      } catch {
        setErrorMessage(event.message || 'An unexpected error occurred.');
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-brand-neutral flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-brand-primary text-brand-secondary py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'match'>('list');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // URL Parameter Check for Public Viewing
  useEffect(() => {
    if (!isAuthReady) return;
    
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('tournamentId');
    
    if (tournamentId) {
      const fetchTournament = async () => {
        try {
          const tDoc = await getDoc(doc(db, 'tournaments', tournamentId));
          if (tDoc.exists()) {
            const tData = { id: tDoc.id, ...tDoc.data() } as Tournament;
            setSelectedTournament(tData);
            setView('detail');
          }
        } catch (error) {
          console.error('Error fetching public tournament:', error);
        }
      };
      fetchTournament();
    }
  }, [isAuthReady]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Tournaments Listener
  useEffect(() => {
    if (!isAuthReady) return;
    
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Tournament));
      setTournaments(list);
      
      // Update selectedTournament if it's in the list
      if (selectedTournament) {
        const updated = list.find(t => t.id === selectedTournament.id);
        if (updated) {
          setSelectedTournament(updated);
        }
      }
    }, (error) => {
      console.warn('Tournaments list fetch failed (likely not logged in):', error.message);
    });

    return () => unsubscribe();
  }, [isAuthReady, selectedTournament?.id]);

  // Matches Listener
  useEffect(() => {
    if (!selectedTournament) return;

    const q = query(collection(db, `tournaments/${selectedTournament.id}/matches`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Match));
      setMatches(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `tournaments/${selectedTournament.id}/matches`));

    return () => unsubscribe();
  }, [selectedTournament]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login Error:', error);
      alert(`Login failed: ${error.message}\n\nTroubleshooting:\n1. Wait 5 minutes for the new API key to activate.\n2. Ensure this app's URL is added to Firebase Auth -> Settings -> Authorized Domains.`);
    }
  };

  const handleLogout = () => signOut(auth);

  const createTournament = async (name: string, mode: GameMode, players: Player[], courtsCount: number, pointsToPlay: number, numberOfMatches?: number, swissPools?: number, playoffTeams?: number, playoffType?: 'single' | 'double') => {
    if (!user) return;
    
    // Assign default names to empty players
    const processedPlayers = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `Player ${i + 1}`
    }));

    console.log('Creating tournament:', { name, mode, players: processedPlayers, courtsCount, pointsToPlay, numberOfMatches, swissPools, playoffTeams, playoffType });
    try {
      if (mode === GameMode.SINGLE_ELIMINATION || mode === GameMode.DOUBLE_ELIMINATION) {
        const teams: string[][] = [];
        for (let i = 0; i < processedPlayers.length; i += 2) {
          if (i + 1 < processedPlayers.length) {
            teams.push([processedPlayers[i].name, processedPlayers[i+1].name]);
          }
        }
        
        if (teams.length < 2) {
          alert(`Cannot generate matches for ${mode} with the current players. Please ensure you have enough players.`);
          return;
        }

        // Pad teams to power of 2
        const powerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
        const byes = powerOf2 - teams.length;
        for (let i = 0; i < byes; i++) {
          teams.push(['BYE', 'BYE']);
        }

        // Shuffle teams randomly
        for (let i = teams.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [teams[i], teams[j]] = [teams[j], teams[i]];
        }

        const tData: any = {
          name,
          mode,
          creatorId: user.uid,
          status: 'active',
          createdAt: new Date().toISOString(),
          players: processedPlayers,
          currentRound: 1,
          courtsCount,
          pointsToPlay,
        };

        const actualTeamsCount = Math.floor(processedPlayers.length / 2);
        if (mode === GameMode.SINGLE_ELIMINATION) {
          tData.numberOfMatches = actualTeamsCount > 1 ? actualTeamsCount - 1 : 0;
        } else if (mode === GameMode.DOUBLE_ELIMINATION) {
          tData.numberOfMatches = actualTeamsCount > 1 ? (actualTeamsCount - 1) * 2 + 1 : 0;
        } else if (numberOfMatches !== undefined) {
          tData.numberOfMatches = numberOfMatches;
        }

        if (swissPools !== undefined) tData.swissPools = swissPools;
        if (playoffTeams !== undefined) tData.playoffTeams = playoffTeams;
        if (playoffType !== undefined) tData.playoffType = playoffType;

        const docRef = await addDoc(collection(db, 'tournaments'), tData);
        const tId = docRef.id;

        // Generate bracket
        const totalRounds = Math.log2(powerOf2);
        const matchesByRound: { id: string, ref: any, data: any }[][] = Array.from({ length: totalRounds }, () => []);
        
        for (let r = 0; r < totalRounds; r++) {
          const matchesInRound = powerOf2 / Math.pow(2, r + 1);
          for (let m = 0; m < matchesInRound; m++) {
            const matchId = `wb-${r + 1}-${m}`;
            const matchRef = doc(db, `tournaments/${tId}/matches`, matchId);
            
            const nextMatchId = r < totalRounds - 1 ? `wb-${r + 2}-${Math.floor(m / 2)}` : (mode === GameMode.DOUBLE_ELIMINATION ? 'gf-1' : null);

            const matchData: any = {
              tournamentId: tId,
              team1: r === 0 ? teams[m * 2] : ['TBD'],
              team2: r === 0 ? teams[m * 2 + 1] : ['TBD'],
              score1: 0,
              score2: 0,
              sets1: [],
              sets2: [],
              serverIndex: 0,
              status: MatchStatus.PENDING,
              round: r + 1,
              court: m + 1,
              matchIndex: m,
            };

            if (nextMatchId !== null) {
              matchData.nextMatchId = nextMatchId;
            }

            matchesByRound[r].push({
              id: matchId,
              ref: matchRef,
              data: matchData
            });
          }
        }

        // Handle BYEs in the first round
        for (let m = 0; m < matchesByRound[0].length; m++) {
          const match = matchesByRound[0][m];
          if (match.data.team1[0] === 'BYE') {
            match.data.status = MatchStatus.COMPLETED;
            match.data.winner = 2;
            match.data.score2 = pointsToPlay;
          } else if (match.data.team2[0] === 'BYE') {
            match.data.status = MatchStatus.COMPLETED;
            match.data.winner = 1;
            match.data.score1 = pointsToPlay;
          }
        }

        // Advance BYE winners
        for (let r = 0; r < totalRounds - 1; r++) {
          for (let m = 0; m < matchesByRound[r].length; m++) {
            const match = matchesByRound[r][m];
            if (match.data.status === MatchStatus.COMPLETED && match.data.nextMatchId) {
              const winner = match.data.winner === 1 ? match.data.team1 : match.data.team2;
              const nextMatchIdx = matchesByRound[r + 1].findIndex(nm => nm.id === match.data.nextMatchId);
              if (nextMatchIdx !== -1) {
                const isTeam1 = match.data.matchIndex % 2 === 0;
                matchesByRound[r + 1][nextMatchIdx].data[isTeam1 ? 'team1' : 'team2'] = winner;
              }
            }
          }
        }

        // Save WB matches
        for (let r = 0; r < totalRounds; r++) {
          for (let m = 0; m < matchesByRound[r].length; m++) {
            await setDoc(matchesByRound[r][m].ref, matchesByRound[r][m].data);
          }
        }

        if (mode === GameMode.DOUBLE_ELIMINATION) {
          // Initial LB round
          const lbRound1Matches = powerOf2 / 2;
          for (let i = 0; i < lbRound1Matches; i++) {
            const matchId = `lb-1-${i}`;
            await setDoc(doc(db, `tournaments/${tId}/matches`, matchId), {
              tournamentId: tId,
              team1: ['TBD'],
              team2: ['TBD'],
              score1: 0,
              score2: 0,
              sets1: [],
              sets2: [],
              serverIndex: 0,
              status: MatchStatus.PENDING,
              round: 1,
              court: i + 1,
              matchIndex: i,
              isLosersBracket: true
            });
          }
          
          // Grand Final
          await setDoc(doc(db, `tournaments/${tId}/matches`, 'gf-1'), {
            tournamentId: tId,
            team1: ['TBD'],
            team2: ['TBD'],
            score1: 0,
            score2: 0,
            sets1: [],
            sets2: [],
            serverIndex: 0,
            status: MatchStatus.PENDING,
            round: totalRounds + 1,
            court: 1
          });
        }

        console.log(`${mode} bracket generated`);
        setView('list');
        return;
      }

      // Initial match generation based on mode
      let matchPairs: { team1: string[], team2: string[] }[] = [];

      if (mode === GameMode.NORMAL_AMERICANO || mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO) {
        const playerNames = processedPlayers.map(p => p.name);
        const n = playerNames.length;
        const totalMatches = numberOfMatches || Math.max(1, Math.floor((n * (n - 1)) / 4));
        
        // For all modes, we only generate the first round initially.
        const targetInitialMatches = totalMatches;
        
        const allPossiblePairs: [string, string][] = [];
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            allPossiblePairs.push([playerNames[i], playerNames[j]]);
          }
        }

        const playedMatches = new Set<string>();
        const pairUsageCount = new Map<string, number>();
        allPossiblePairs.forEach(p => pairUsageCount.set([...p].sort().join(','), 0));

        while (matchPairs.length < targetInitialMatches) {
          const sortedPairs = [...allPossiblePairs].sort((a, b) => 
            pairUsageCount.get([...a].sort().join(','))! - pairUsageCount.get([...b].sort().join(','))! || Math.random() - 0.5
          );

          let foundMatch = false;
          const playersUsedInThisRound = new Set<string>();
          for (let i = 0; i < sortedPairs.length; i++) {
            const p1 = sortedPairs[i];
            if (playersUsedInThisRound.has(p1[0]) || playersUsedInThisRound.has(p1[1])) continue;

            for (let j = i + 1; j < sortedPairs.length; j++) {
              const p2 = sortedPairs[j];
              if (playersUsedInThisRound.has(p2[0]) || playersUsedInThisRound.has(p2[1])) continue;
              
              const playersInMatch = new Set([...p1, ...p2]);
              if (playersInMatch.size !== 4) continue;
              
              const matchKey = [...p1].sort().join(',') + ' vs ' + [...p2].sort().join(',');
              const reverseMatchKey = [...p2].sort().join(',') + ' vs ' + [...p1].sort().join(',');
              
              if (playedMatches.has(matchKey) || playedMatches.has(reverseMatchKey)) continue;
              
              matchPairs.push({ team1: p1, team2: p2 });
              playedMatches.add(matchKey);
              pairUsageCount.set([...p1].sort().join(','), pairUsageCount.get([...p1].sort().join(','))! + 1);
              pairUsageCount.set([...p2].sort().join(','), pairUsageCount.get([...p2].sort().join(','))! + 1);
              playersUsedInThisRound.add(p1[0]);
              playersUsedInThisRound.add(p1[1]);
              playersUsedInThisRound.add(p2[0]);
              playersUsedInThisRound.add(p2[1]);
              foundMatch = true;
              break;
            }
            if (foundMatch) break;
          }
          
          if (!foundMatch) break;
        }
        // Store total matches in tournament object
        numberOfMatches = totalMatches;
      } else if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.TEAM_MEXICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.SWISS_SYSTEM) {
        const teams: string[][] = [];
        for (let i = 0; i < processedPlayers.length; i += 2) {
          if (i + 1 < processedPlayers.length) {
            teams.push([processedPlayers[i].name, processedPlayers[i+1].name]);
          }
        }
        
        if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.SWISS_SYSTEM) {
          // Generate only the first round
          const numTeams = teams.length;
          const isOdd = numTeams % 2 !== 0;
          const scheduleTeams = isOdd ? [...teams, ['BYE', 'BYE']] : [...teams];
          const n = scheduleTeams.length;
          const matchesPerRound = Math.max(1, Math.floor(numTeams / 2));
          
          for (let i = 0; i < n / 2; i++) {
            const t1 = scheduleTeams[i];
            const t2 = scheduleTeams[n - 1 - i];
            if (t1[0] !== 'BYE' && t2[0] !== 'BYE') {
              matchPairs.push({ team1: t1, team2: t2 });
            }
          }
          numberOfMatches = matchesPerRound;
        } else {
          // TEAM_MEXICANO, SWISS_SYSTEM, DOUBLE_ELIMINATION, SINGLE_ELIMINATION initial round
          for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
              matchPairs.push({ team1: teams[i], team2: teams[i+1] });
            }
          }
        }
      } else if (mode === GameMode.MIX_AMERICANO) {
        const men = processedPlayers.filter(p => p.gender === 'man').map(p => p.name);
        const women = processedPlayers.filter(p => p.gender === 'woman').map(p => p.name);
        const n = Math.min(men.length, women.length);
        const matchesPerRound = Math.max(1, Math.floor(n / 2));
        const totalMatches = numberOfMatches || (n >= 2 ? (n % 2 === 0 ? n - 1 : n) * matchesPerRound : 1);
        
        const targetInitialMatches = (mode === GameMode.MIX_AMERICANO) ? totalMatches : matchesPerRound;

        const allPossibleMixedPairs: [string, string][] = [];
        for (let i = 0; i < men.length; i++) {
          for (let j = 0; j < women.length; j++) {
            allPossibleMixedPairs.push([men[i], women[j]]);
          }
        }

        const playedMatches = new Set<string>();
        const pairUsageCount = new Map<string, number>();
        allPossibleMixedPairs.forEach(p => pairUsageCount.set([...p].sort().join(','), 0));

        while (matchPairs.length < targetInitialMatches) {
          const sortedPairs = [...allPossibleMixedPairs].sort((a, b) => 
            pairUsageCount.get([...a].sort().join(','))! - pairUsageCount.get([...b].sort().join(','))! || Math.random() - 0.5
          );

          let foundMatch = false;
          const playersUsedInThisRound = new Set<string>();
          for (let i = 0; i < sortedPairs.length; i++) {
            const p1 = sortedPairs[i];
            if (playersUsedInThisRound.has(p1[0]) || playersUsedInThisRound.has(p1[1])) continue;

            for (let j = i + 1; j < sortedPairs.length; j++) {
              const p2 = sortedPairs[j];
              if (playersUsedInThisRound.has(p2[0]) || playersUsedInThisRound.has(p2[1])) continue;
              
              const playersInMatch = new Set([...p1, ...p2]);
              if (playersInMatch.size !== 4) continue;
              
              const matchKey = [...p1].sort().join(',') + ' vs ' + [...p2].sort().join(',');
              const reverseMatchKey = [...p2].sort().join(',') + ' vs ' + [...p1].sort().join(',');
              
              if (playedMatches.has(matchKey) || playedMatches.has(reverseMatchKey)) continue;
              
              matchPairs.push({ team1: p1, team2: p2 });
              playedMatches.add(matchKey);
              pairUsageCount.set([...p1].sort().join(','), pairUsageCount.get([...p1].sort().join(','))! + 1);
              pairUsageCount.set([...p2].sort().join(','), pairUsageCount.get([...p2].sort().join(','))! + 1);
              playersUsedInThisRound.add(p1[0]);
              playersUsedInThisRound.add(p1[1]);
              playersUsedInThisRound.add(p2[0]);
              playersUsedInThisRound.add(p2[1]);
              foundMatch = true;
              break;
            }
            if (foundMatch) break;
          }
          
          if (!foundMatch) break;
        }
        // Store total matches in tournament object
        numberOfMatches = totalMatches;
      }

      if (matchPairs.length === 0) {
        alert(`Cannot generate matches for ${mode} with the current players. Please ensure you have enough players (e.g., minimum 4 players for most modes, or equal men/women for mix modes).`);
        return;
      }

      const tData: any = {
        name,
        mode,
        creatorId: user.uid,
        status: 'active',
        createdAt: new Date().toISOString(),
        players: processedPlayers,
        currentRound: 1,
        courtsCount,
        pointsToPlay,
      };

      if (numberOfMatches !== undefined) tData.numberOfMatches = numberOfMatches;
      if (swissPools !== undefined) tData.swissPools = swissPools;
      if (playoffTeams !== undefined) tData.playoffTeams = playoffTeams;
      if (playoffType !== undefined) tData.playoffType = playoffType;

      const docRef = await addDoc(collection(db, 'tournaments'), tData);
      console.log('Tournament created with ID:', docRef.id);

      console.log('Generating', matchPairs.length, 'initial matches');

      for (let i = 0; i < matchPairs.length; i++) {
        const pair = matchPairs[i];
        const n = processedPlayers.length;
        const isMix = mode === GameMode.MIX_AMERICANO;
        let matchesPerRound = numberOfMatches || 1;
        
        if (isMix) {
          const men = processedPlayers.filter(p => p.gender === 'man').length;
          const women = processedPlayers.length - men;
          matchesPerRound = numberOfMatches || Math.max(1, Math.floor(Math.min(men, women) / 2));
        } else if (!numberOfMatches) {
          matchesPerRound = Math.max(1, Math.floor(n / 4));
        }

        const round = Math.floor(i / matchesPerRound) + 1;
        const court = (i % courtsCount) + 1;

        await addDoc(collection(db, `tournaments/${docRef.id}/matches`), {
          tournamentId: docRef.id,
          team1: pair.team1,
          team2: pair.team2,
          score1: 0,
          score2: 0,
          sets1: [],
          sets2: [],
          serverIndex: 0,
          status: MatchStatus.PENDING,
          round: round,
          court: court
        });
      }

      console.log('Tournament setup complete');
      setView('list');
    } catch (error) {
      console.error('Create Tournament Error:', error);
      alert(`Failed to create tournament: ${error instanceof Error ? error.message : 'Unknown error'}`);
      handleFirestoreError(error, OperationType.CREATE, 'tournaments');
    }
  };

  const updateMatchScore = async (matchId: string, updates: Partial<Match>) => {
    if (!selectedTournament) return;
    try {
      await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, matchId), updates);
      
      // If bracket match completed, handle progression
      if (updates.status === MatchStatus.COMPLETED && updates.winner) {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const winningTeam = updates.winner === 1 ? match.team1 : match.team2;
        const losingTeam = updates.winner === 1 ? match.team2 : match.team1;

        // Advance winner in Winners Bracket or to Grand Final
        if (match.nextMatchId) {
          const nextMatch = matches.find(m => m.id === match.nextMatchId);
          if (nextMatch) {
            const isTeam1 = match.matchIndex! % 2 === 0;
            await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, nextMatch.id!), {
              [isTeam1 ? 'team1' : 'team2']: winningTeam
            });
          }
        }

        // Handle Double Elimination specific logic
        if (selectedTournament.mode === GameMode.DOUBLE_ELIMINATION) {
          // If WB match, move loser to LB
          if (matchId.startsWith('wb-')) {
            const [_, roundStr, matchIdxStr] = matchId.split('-');
            const round = parseInt(roundStr);
            const matchIdx = parseInt(matchIdxStr);

            // Loser of WB Round 1 goes to LB Round 1
            if (round === 1) {
              const lbMatchId = `lb-1-${Math.floor(matchIdx / 2)}`;
              const lbMatch = matches.find(m => m.id === lbMatchId);
              if (lbMatch) {
                const isTeam1 = matchIdx % 2 === 0;
                await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, lbMatchId), {
                  [isTeam1 ? 'team1' : 'team2']: losingTeam
                });
              }
            }
            // For higher rounds, it gets more complex. 
            // In a standard DE, losers of WB Round 2 go to LB Round 2, etc.
            // This is a simplified version.
          }

          // If LB match, advance winner in LB
          if (matchId.startsWith('lb-')) {
            const [_, roundStr, matchIdxStr] = matchId.split('-');
            const round = parseInt(roundStr);
            const matchIdx = parseInt(matchIdxStr);

            // Simplified LB progression: winner of LB-1 goes to LB-2, etc.
            // In reality, LB has more rounds than WB.
            const nextLbMatchId = `lb-${round + 1}-${Math.floor(matchIdx / 2)}`;
            const nextLbMatch = matches.find(m => m.id === nextLbMatchId);
            if (nextLbMatch) {
              const isTeam1 = matchIdx % 2 === 0;
              await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, nextLbMatchId), {
                [isTeam1 ? 'team1' : 'team2']: winningTeam
              });
            } else if (round >= 1) {
              // If no more LB rounds, winner of LB goes to Grand Final
              await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, 'gf-1'), {
                team2: winningTeam
              });
            }
          }
          
          // If WB Final completed (last round of WB), winner goes to GF team1
          const totalWbRounds = Math.ceil(Math.log2(selectedTournament.players.length / 2));
          if (matchId === `wb-${totalWbRounds}-0`) {
             await updateDoc(doc(db, `tournaments/${selectedTournament.id}/matches`, 'gf-1'), {
                team1: winningTeam
              });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tournaments/${selectedTournament.id}/matches/${matchId}`);
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      // Delete all matches first
      const matchesRef = collection(db, `tournaments/${id}/matches`);
      const matchesSnap = await getDocs(matchesRef);
      const deletePromises = matchesSnap.docs.map(m => deleteDoc(m.ref));
      await Promise.all(deletePromises);

      // Delete the tournament
      await deleteDoc(doc(db, 'tournaments', id));
      setView('list');
      setSelectedTournament(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tournaments/${id}`);
    }
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      await updateDoc(doc(db, 'tournaments', id), updates);
      if (selectedTournament && selectedTournament.id === id) {
        setSelectedTournament({ ...selectedTournament, ...updates });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tournaments/${id}`);
    }
  };

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <PadelBall className="w-12 h-12 text-primary animate-pulse mb-4" />
          <p className="text-on-surface/60 font-medium">Loading Padel Maker...</p>
        </motion.div>
      </div>
    );
  }

  if (!user && !selectedTournament) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest p-12 rounded-2xl shadow-2xl shadow-on-surface/5 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-primary/10">
            <PadelRacket className="w-10 h-10 text-on-primary-container" />
          </div>
          <p className="label-sm mb-2">The Digital Country Club</p>
          <h1 className="text-4xl font-bold text-on-surface mb-4">Tournament Padel Maker</h1>
          <p className="text-on-surface/60 font-medium mb-12">Organize and track your padel tournaments with ease.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-primary-container text-on-primary-container py-4 rounded-xl font-bold hover:brightness-95 transition-all active:scale-95 shadow-lg shadow-primary/10"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-surface text-on-surface font-sans pb-32">
        {/* Floating Navigation FAB */}
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
          <AnimatePresence>
            {showSettingsMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="bg-surface-container-lowest border border-on-surface/5 rounded-3xl shadow-2xl p-2 min-w-[240px] overflow-hidden mb-2"
              >
                <div className="p-4 border-b border-on-surface/5 mb-2">
                  <p className="text-sm font-bold text-on-surface">{user?.displayName}</p>
                  <p className="text-[10px] text-on-surface/40 uppercase tracking-wider truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    setView('list');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-2xl transition-colors font-bold text-sm text-on-surface"
                >
                  <Users className="w-5 h-5" />
                  Tournaments
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors font-bold text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="w-16 h-16 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all group relative"
          >
            <motion.div
              animate={{ rotate: showSettingsMenu ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <PadelBall className="w-8 h-8" />
            </motion.div>
          </button>
        </div>

        <main className="w-full px-4 pt-4 pb-32">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="max-w-5xl mx-auto"
              >
                {tournaments.length === 0 ? (
                  <div className="flex flex-col items-center justify-start pt-0 pb-16 text-center">
                    <p className="label-sm mb-4">Welcome to the Club</p>
                    <h2 className="text-5xl font-bold text-on-surface mb-16 max-w-lg">Your Tournaments</h2>
                    
                    <div className="mb-20">
                      <div className="w-24 h-24 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <PadelBall className="w-12 h-12 text-on-surface/20" />
                      </div>
                      <p className="text-on-surface/40 font-medium text-xl">No tournaments yet. Create your first one!</p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <button 
                        onClick={() => setView('create')}
                        className="w-32 h-32 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/10 group"
                      >
                        <Plus className="w-16 h-16 group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                      <span className="text-2xl font-bold text-on-surface">New Tournament</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-16">
                      <div>
                        <p className="label-sm mb-2">Overview</p>
                        <h2 className="text-4xl font-bold text-on-surface">Your Tournaments</h2>
                      </div>
                      <button 
                        onClick={() => setView('create')}
                        className="flex items-center gap-3 bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold hover:brightness-95 transition-all active:scale-95 shadow-lg shadow-primary/10"
                      >
                        <Plus className="w-6 h-6" />
                        New Tournament
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {tournaments.map((t) => (
                        <div 
                          key={t.id}
                          onClick={() => {
                            setSelectedTournament(t);
                            setView('detail');
                          }}
                          className="bg-surface-container-lowest p-10 rounded-2xl hover:shadow-2xl hover:shadow-on-surface/5 transition-all cursor-pointer group relative overflow-hidden border border-on-surface/5"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-start justify-between mb-8">
                            <div>
                              <span className={`label-sm px-3 py-1 rounded-lg mb-4 inline-block ${t.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-on-surface/5 text-on-surface/60'}`}>
                                {t.status}
                              </span>
                              <h3 className="text-2xl font-bold text-on-surface">{t.name}</h3>
                            </div>
                            <div className="p-3 bg-surface-container-low rounded-xl group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                              <ChevronRight className="w-6 h-6" />
                            </div>
                          </div>
                          <div className="flex items-center gap-8 text-sm font-medium text-on-surface/60">
                            <div className="flex items-center gap-2.5">
                              <PadelBall className="w-5 h-5 text-on-surface/30" />
                              {t.players.length} Players
                            </div>
                            <div className="flex items-center gap-2.5">
                              <PadelBall className="w-5 h-5 text-on-surface/30" />
                              {t.mode}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </>
              )}
            </motion.div>
            )}

            {view === 'create' && (
              <TournamentCreator 
                onCancel={() => setView('list')} 
                onCreate={createTournament} 
              />
            )}

            {view === 'detail' && selectedTournament && (
              <TournamentDetail 
                tournament={selectedTournament}
                matches={matches}
                onBack={() => setView('list')}
                onSelectMatch={(m) => {
                  setActiveMatch(m);
                  setView('match');
                }}
                onDelete={() => deleteTournament(selectedTournament.id!)}
                onUpdate={(updates) => updateTournament(selectedTournament.id!, updates)}
                isCreator={user?.uid === selectedTournament.creatorId}
              />
            )}

            {view === 'match' && selectedTournament && activeMatch && (
              <MatchScorer 
                match={activeMatch}
                tournament={selectedTournament}
                onBack={() => setView('detail')}
                onUpdate={(updates) => updateMatchScore(activeMatch.id!, updates)}
                pointsToPlay={selectedTournament.pointsToPlay || 24}
                user={user}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  [GameMode.SINGLE_ELIMINATION]: "Knockout format where the winner advances and the loser is eliminated.",
  [GameMode.DOUBLE_ELIMINATION]: "A knockout format where you must lose two matches to be eliminated.",
  [GameMode.ROUND_ROBIN]: "A mix of Swiss stage followed by a playoff bracket (Single or Double Elimination).",
  [GameMode.SWISS_SYSTEM]: "Non-eliminating format where you play opponents with a similar win/loss record.",
  [GameMode.NORMAL_AMERICANO]: "All players play with everyone else exactly one time.",
  [GameMode.MIX_AMERICANO]: "Teams are drawn with one woman and one man. Requires equal gender distribution (max 24 players).",
  [GameMode.MEXICANO]: "Starts with an Americano qualifier round, then switches to dynamic Mexicano matchmaking.",
  [GameMode.SUPER_MEXICANO]: "Like Mexicano but with extra points awarded for playing on (or closer to) the winning court.",
  [GameMode.TEAM_AMERICANO]: "Fixed teams play against all other teams exactly one time.",
  [GameMode.TEAM_MEXICANO]: "Mexicano format played with fixed teams.",
  [GameMode.MIXED_MEXICANO]: "Dynamic mixed matchmaking based on leaderboard rankings."
};

function TournamentCreator({ onCancel, onCreate }: { onCancel: () => void, onCreate: (name: string, mode: GameMode, players: Player[], courtsCount: number, pointsToPlay: number, numberOfMatches?: number, swissPools?: number, playoffTeams?: number, playoffType?: 'single' | 'double') => Promise<void> }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<GameMode>(GameMode.NORMAL_AMERICANO);
  const [courtsCount, setCourtsCount] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for up, -1 for down
  const [pointsToPlay, setPointsToPlay] = useState(24);
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
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'warning' } | null>(null);

  const isTeamMode = mode === GameMode.TEAM_AMERICANO || mode === GameMode.TEAM_MEXICANO || mode === GameMode.ROUND_ROBIN || mode === GameMode.DOUBLE_ELIMINATION || mode === GameMode.SWISS_SYSTEM || mode === GameMode.SINGLE_ELIMINATION;
  const isMixMode = mode === GameMode.MIX_AMERICANO || mode === GameMode.MIXED_MEXICANO;
  const isAmericanoVariant = mode === GameMode.NORMAL_AMERICANO || mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO || mode === GameMode.MIXED_MEXICANO;

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
        const rounds = n - 1;
        const matchesPerRound = Math.floor(teamsCount / 2);
        return rounds * matchesPerRound;
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
           return courts * (customMatchCount || 1);
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
    
    // Map empty names to default "PLAYER X" and assign default team names if empty
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
      await onCreate(name, mode, validPlayers, courtsCount, pointsToPlay, customMatchCount || undefined, swissPools, playoffTeams, playoffType);
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
              <label className="label-sm mb-3 block">Points to Play</label>
              <div className="relative w-full h-16">
                {/* Background Line */}
                <div className="absolute top-[70%] left-[10%] right-[10%] h-1.5 bg-surface-variant rounded-full -translate-y-1/2" />
                
                {/* Buttons */}
                <div className="absolute inset-0 flex items-center w-full">
                  {[16, 21, 24, 31, 32].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPointsToPlay(p)}
                      className="relative z-10 flex flex-col items-center justify-center h-full group outline-none cursor-pointer"
                      style={{ width: '20%' }}
                    >
                      {/* Label */}
                      <span className={`absolute top-0 text-sm font-bold transition-all duration-300 ${pointsToPlay === p ? 'text-primary scale-110' : 'text-on-surface/40 group-hover:text-on-surface/60'}`}>
                        {p}
                      </span>
                      {/* Node Circle */}
                      <div className={`absolute top-[70%] -translate-y-1/2 w-4 h-4 rounded-full transition-colors duration-300 ${pointsToPlay === p ? 'bg-transparent' : 'bg-surface-variant'}`} />
                    </button>
                  ))}
                </div>

                {/* Animated Ball */}
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
                  modes: [GameMode.NORMAL_AMERICANO, GameMode.MIX_AMERICANO, GameMode.TEAM_AMERICANO, GameMode.SWISS_SYSTEM]
                },
                {
                  id: 'Mexicano',
                  title: 'Mexicano',
                  description: 'Like Americano but results in more even games based on standings.',
                  modes: [GameMode.MEXICANO, GameMode.SUPER_MEXICANO, GameMode.TEAM_MEXICANO, GameMode.MIXED_MEXICANO]
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
                  </div>
                );
              })}
            </div>
            
            <div className="mt-10">
              <label className="label-sm mb-3 block">Matches per Round</label>
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

            {mode === GameMode.ROUND_ROBIN && (
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div>
                  <label className="label-sm mb-3 block">Teams to Playoff</label>
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
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <label className="label-sm">
                {isTeamMode ? 'Teams (Max 16 Teams)' : 'Players (Max 32)'}
              </label>
              <button 
                type="button" 
                onClick={addPlayer}
                disabled={isTeamMode ? players.length / 2 >= 16 : players.length >= 32}
                className="bg-on-surface text-surface px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-on-surface/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTeamMode ? '+ Add Team' : '+ Add Player'}
              </button>
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
    </motion.div>
  );
}

function BracketMatchCard({ match, onSelect }: { match: Match, onSelect: (m: Match) => void }) {
  const isBye = match.team1[0] === 'BYE' || match.team2[0] === 'BYE';
  if (isBye) return null;

  return (
    <motion.div
      onClick={() => onSelect(match)}
      className="bg-surface-container-lowest border border-on-surface/5 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden w-[240px]"
    >
      {[ { t: match.team1, s: match.score1, win: match.winner === 1 }, { t: match.team2, s: match.score2, win: match.winner === 2 }].map((team, idx) => (
        <div 
          key={idx} 
          className={`px-3 py-2 flex items-center justify-between ${idx === 0 ? 'border-b border-on-surface/5' : ''} ${team.win ? 'bg-[#8A9A5B]/10' : ''}`}
        >
          <span className={`text-sm font-bold truncate max-w-[160px] ${team.win ? 'text-[#8A9A5B]' : 'text-on-surface'}`}>
            {team.t.join(' & ')}
          </span>
          <span className={`text-sm font-black tabular-nums ${team.win ? 'text-[#8A9A5B]' : 'text-on-surface/40'}`}>
            {match.status === MatchStatus.PENDING ? '-' : team.s}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

function BracketLines({ x1, y1, x2, y2, color, ...props }: { x1: number, y1: number, x2: number, y2: number, color?: string, key?: string }) {
  const midX = x1 + 24; // Small indentation before turning
  const path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  return (
    <path
      d={path}
      stroke={color || "rgba(0,0,0,0.1)"}
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function TournamentDetail({ tournament, matches, onBack, onSelectMatch, onDelete, onUpdate, isCreator }: { tournament: Tournament, matches: Match[], onBack: () => void, onSelectMatch: (m: Match) => void, onDelete: () => void, onUpdate: (updates: Partial<Tournament>) => void, isCreator: boolean }) {
  const isRoundBasedMode = [
    GameMode.MEXICANO, 
    GameMode.SUPER_MEXICANO,
    GameMode.TEAM_MEXICANO,
    GameMode.MIXED_MEXICANO,
    GameMode.ROUND_ROBIN,
    GameMode.MIX_AMERICANO
  ].includes(tournament.mode);

  const isBracketMode = tournament.mode === GameMode.SINGLE_ELIMINATION || tournament.mode === GameMode.DOUBLE_ELIMINATION;

  const [tab, setTab] = useState<string>(isRoundBasedMode ? (tournament.currentRound?.toString() || '1') : isBracketMode ? 'bracket' : 'leaderboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const bracketRef = useRef<HTMLDivElement>(null);

  // Settings form state
  const [editName, setEditName] = useState(tournament.name);
  const [editMode, setEditMode] = useState(tournament.mode);
  const [editCourts, setEditCourts] = useState(tournament.courtsCount);
  const [editPoints, setEditPoints] = useState(tournament.pointsToPlay);

  useEffect(() => {
    setEditName(tournament.name);
    setEditMode(tournament.mode);
    setEditCourts(tournament.courtsCount);
    setEditPoints(tournament.pointsToPlay);
  }, [tournament]);

  const handleSaveSettings = () => {
    onUpdate({
      name: editName,
      mode: editMode,
      courtsCount: editCourts,
      pointsToPlay: editPoints
    });
    setShowSettings(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?tournamentId=${tournament.id}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    if (!scrollRef.current) return;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.removeProperty('user-select');
  };

  const rounds = useMemo(() => {
    const rSet = new Set<number>();
    matches.forEach(m => rSet.add(m.round));
    return Array.from(rSet).sort((a, b) => a - b);
  }, [matches]);

  const bracketData = useMemo(() => {
    if (!isBracketMode) return null;
    const wb = matches.filter(m => !m.isLosersBracket && !m.id?.startsWith('gf-')).sort((a, b) => a.round - b.round || a.matchIndex! - b.matchIndex!);
    const lb = matches.filter(m => m.isLosersBracket).sort((a, b) => a.round - b.round || a.matchIndex! - b.matchIndex!);
    const gf = matches.find(m => m.id === 'gf-1');
    return { wb, lb, gf };
  }, [matches, isBracketMode]);

  const { bracketHeight, bracketWidth, wbStartY, lbStartY, gfX, getMatchY } = useMemo(() => {
    if (!bracketData) return { bracketHeight: 0, bracketWidth: 0, wbStartY: 0, lbStartY: 0, gfX: 0, getMatchY: (r: number, i: number, s: number) => 0 };
    
    const maxWbRounds = Math.max(...bracketData.wb.map(m => m.round), 1);
    const round1Count = bracketData.wb.filter(m => m.round === 1).length || 1;
    const powerOf2Count = Math.pow(2, Math.ceil(Math.log2(round1Count)));

    const roundWidth = 280;
    const matchHeight = 100;
    const matchGap = 40;
    const unit = matchHeight + matchGap;
    
    const getMatchY = (round: number, matchIndex: number, startY: number) => {
      const offset = (Math.pow(2, round - 1) - 1) * (unit / 2);
      const spacing = Math.pow(2, round - 1) * unit;
      return startY + offset + (matchIndex * spacing);
    };

    const wbHeight = powerOf2Count * unit;
    const wbStartY = 40;
    
    let lbHeight = 0;
    let lbStartY = 0;
    if (bracketData.lb.length > 0) {
      const lbRound1Count = bracketData.lb.filter(m => m.round === 1).length || 1;
      const lbPowerOf2 = Math.pow(2, Math.ceil(Math.log2(lbRound1Count)));
      lbHeight = lbPowerOf2 * unit;
      lbStartY = wbHeight + 120; // Extra gap between WB and LB
    }

    const totalHeight = Math.max(wbHeight + (lbHeight ? lbHeight + 200 : 80), 600);
    const totalWidth = (maxWbRounds + (bracketData.gf ? 1 : 0)) * roundWidth + 100;
    const gfX = (maxWbRounds) * roundWidth + 40;

    return { bracketHeight: totalHeight, bracketWidth: totalWidth, wbStartY, lbStartY, gfX, getMatchY };
  }, [bracketData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all">
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="label-sm bg-primary-container/10 text-primary-container px-2 py-0.5 rounded uppercase tracking-wider">{tournament.mode}</span>
                <span className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">{new Date(tournament.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="text-4xl font-bold text-on-surface">{tournament.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={handleShare} className="p-4 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-high transition-all flex items-center gap-2 font-bold text-sm">
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <AnimatePresence>
                {showShareTooltip && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-on-surface text-surface text-[10px] font-bold rounded-lg whitespace-nowrap z-50">
                    Link Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isCreator && (
              <button onClick={() => setShowSettings(true)} className="p-4 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-high transition-all">
                <Settings className="w-5 h-5" />
              </button>
            )}
            {isCreator && (
              <button onClick={() => setShowDeleteConfirm(true)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-2xl mb-10 w-fit">
          {isBracketMode && (
            <button onClick={() => setTab('bracket')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'bracket' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>
              Bracket
            </button>
          )}
          {isRoundBasedMode && rounds.map(r => (
            <button key={r} onClick={() => setTab(r.toString())} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === r.toString() ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>
              Round {r}
            </button>
          ))}
          <button onClick={() => setTab('leaderboard')} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'leaderboard' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}>
            Leaderboard
          </button>
        </div>
      </div>

      <div className="w-full">
        {tab === 'bracket' && isBracketMode && bracketData && (
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing no-scrollbar scroll-smooth"
          >
            <div 
              style={{ 
                width: bracketWidth <= window.innerWidth ? '100%' : `${bracketWidth}px`,
                height: `${bracketHeight}px`,
                display: bracketWidth <= window.innerWidth ? 'flex' : 'block',
                justifyContent: 'center',
                minHeight: '600px',
                position: 'relative'
              }}
              className="px-8"
            >
              <div 
                style={{ 
                  position: 'relative',
                  width: `${bracketWidth}px`,
                  height: '100%'
                }}
              >
                <svg 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ width: bracketWidth, height: bracketHeight }}
                >
                  {/* WB Connectors */}
                  {bracketData.wb.map(m => {
                    if (!m.nextMatchId) return null;
                    const nextMatch = matches.find(nm => nm.id === m.nextMatchId);
                    if (!nextMatch) return null;
                    
                    const x1 = (m.round - 1) * 280 + 240;
                    const y1 = getMatchY(m.round, m.matchIndex!, wbStartY) + 50;
                    const x2 = (nextMatch.round - 1) * 280;
                    const y2 = getMatchY(nextMatch.round, nextMatch.matchIndex!, wbStartY) + 50;
                    
                    return <BracketLines key={`line-wb-${m.id}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
                  })}

                  {/* LB Connectors */}
                  {bracketData.lb.map(m => {
                    const nextMatch = matches.find(nm => nm.id === m.nextMatchId);
                    if (!nextMatch) return null;
                    
                    const x1 = (m.round - 1) * 280 + 240;
                    const y1 = getMatchY(m.round, m.matchIndex!, lbStartY) + 50;
                    const x2 = (nextMatch.round - 1) * 280;
                    const y2 = getMatchY(nextMatch.round, nextMatch.matchIndex!, lbStartY) + 50;
                    
                    return <BracketLines key={`line-lb-${m.id}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
                  })}
                </svg>

                {/* WB Matches */}
                {bracketData.wb.map(m => (
                  <div 
                    key={m.id} 
                    style={{ 
                      position: 'absolute', 
                      left: (m.round - 1) * 280, 
                      top: getMatchY(m.round, m.matchIndex!, wbStartY) 
                    }}
                  >
                    <BracketMatchCard match={m} onSelect={onSelectMatch} />
                  </div>
                ))}

                {/* LB Matches */}
                {bracketData.lb.map(m => (
                  <div 
                    key={m.id} 
                    style={{ 
                      position: 'absolute', 
                      left: (m.round - 1) * 280, 
                      top: getMatchY(m.round, m.matchIndex!, lbStartY) 
                    }}
                  >
                    <BracketMatchCard match={m} onSelect={onSelectMatch} />
                  </div>
                ))}

                {/* Grand Final */}
                {bracketData.gf && (
                  <div style={{ position: 'absolute', left: gfX, top: getMatchY(bracketData.gf.round, 0, wbStartY) }}>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 text-center">Grand Final</p>
                    <BracketMatchCard match={bracketData.gf} onSelect={onSelectMatch} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="max-w-5xl mx-auto px-4">
            <Leaderboard matches={matches} players={tournament.players} mode={tournament.mode} />
          </div>
        )}

        {isRoundBasedMode && rounds.includes(parseInt(tab)) && (
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.filter(m => m.round === parseInt(tab)).map((m, i) => (
                <MatchCard key={m.id || i} match={m} onSelect={onSelectMatch} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-surface-container-lowest w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-bold text-on-surface">Tournament Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-surface-container-low rounded-xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-8">
                  <div>
                    <label className="label-sm mb-3 block">Tournament Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-6 h-16 bg-surface-container-low rounded-xl font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="label-sm mb-3 block">Courts</label>
                      <input type="number" value={editCourts} onChange={(e) => setEditCourts(parseInt(e.target.value))} className="w-full px-6 h-16 bg-surface-container-low rounded-xl font-medium outline-none" />
                    </div>
                    <div>
                      <label className="label-sm mb-3 block">Points</label>
                      <input type="number" value={editPoints} onChange={(e) => setEditPoints(parseInt(e.target.value))} className="w-full px-6 h-16 bg-surface-container-low rounded-xl font-medium outline-none" />
                    </div>
                  </div>
                  <button onClick={handleSaveSettings} className="w-full py-5 bg-primary-container text-on-primary-container rounded-xl font-bold hover:brightness-95 transition-all shadow-lg shadow-primary/10">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-surface-container-lowest w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8"><AlertTriangle className="w-10 h-10" /></div>
                <h3 className="text-2xl font-bold text-on-surface mb-3">Delete Tournament?</h3>
                <p className="text-on-surface/40 mb-10 text-lg">This action is permanent.</p>
                <div className="flex flex-col gap-4">
                  <button onClick={onDelete} className="w-full py-5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">Yes, Delete</button>
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

function PadelCourt({ 
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
}: { 
  team1: string[], 
  team2: string[], 
  serverIndex: number, 
  team1Name: string | null, 
  team2Name: string | null,
  score1: number,
  score2: number,
  onScoreUpdate: (team: 1 | 2, delta: number) => void,
  onScoreSet: (team: 1 | 2, value: number) => void,
  onServerChange: (idx: number) => void,
  pointsToPlay: number
}) {
  const handleInputChange = (team: 1 | 2, val: string) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 2);
    const num = sanitized === '' ? 0 : parseInt(sanitized);
    onScoreSet(team, num);
  };

  const isTargetReached = (score1 + score2) >= pointsToPlay;

  return (
    <div className="w-full mt-8">
      <div className="relative aspect-[2/1] bg-[#8A9A5B] rounded-[2.5rem] border-[6px] border-white overflow-hidden shadow-2xl">
        {/* Court Lines */}
        <div className="absolute inset-0 flex">
          {/* Left Side (Team 1) */}
          <div className="flex-1 border-r-[3px] border-white relative">
            {/* Service Line (Vertical) - 30% from left edge */}
            <div className="absolute top-0 left-[30%] w-[3px] h-full bg-white" />
            {/* Horizontal Line - only from service line to net */}
            <div className="absolute top-1/2 left-[30%] w-[70%] h-[3px] bg-white -translate-y-1/2" />
          </div>
          {/* Right Side (Team 2) */}
          <div className="flex-1 relative">
            {/* Service Line (Vertical) - 30% from right edge */}
            <div className="absolute top-0 right-[30%] w-[3px] h-full bg-white" />
            {/* Horizontal Line - only from service line to net */}
            <div className="absolute top-1/2 right-[30%] w-[70%] h-[3px] bg-white -translate-y-1/2" />
          </div>
        </div>

        {/* Net */}
        <div className="absolute top-0 left-1/2 w-1.5 h-full bg-white/40 backdrop-blur-sm -translate-x-1/2 flex flex-col justify-between py-4">
          <div className="w-6 h-1.5 bg-white -translate-x-2 rounded-full shadow-sm" />
          <div className="w-6 h-1.5 bg-white -translate-x-2 rounded-full shadow-sm" />
        </div>

        {/* Team Names - Vertical on edges */}
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
          {/* Team 1 Controls (Left) */}
          <div className="flex-1 relative">
            {/* Score Input - Centered vertically with the + button */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="relative flex items-center justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={score1}
                  onChange={(e) => handleInputChange(1, e.target.value)}
                  className="w-64 bg-transparent text-9xl font-black text-white text-center outline-none drop-shadow-lg tabular-nums focus:scale-110 transition-transform"
                />
              </div>
            </div>
            {/* Plus Button - On the center line, 50% bigger */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(1, 1)}
                className="w-32 h-32 rounded-[2.5rem] bg-[#FDE047] text-[#1A1A1A] flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-2xl shadow-[#FDE047]/30"
              >
                <Plus className="w-16 h-16" />
              </button>
            </div>
            {/* Minus Button - Below Plus, aligned with bottom player */}
            <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(1, -1)}
                className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Team 2 Controls (Right) */}
          <div className="flex-1 relative">
            {/* Score Input - Centered vertically with the + button */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div className="relative flex items-center justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={score2}
                  onChange={(e) => handleInputChange(2, e.target.value)}
                  className="w-64 bg-transparent text-9xl font-black text-white text-center outline-none drop-shadow-lg tabular-nums focus:scale-110 transition-transform"
                />
              </div>
            </div>
            {/* Plus Button - On the center line, 50% bigger */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <button 
                onClick={() => onScoreUpdate(2, 1)}
                className="w-32 h-32 rounded-[2.5rem] bg-[#FDE047] text-[#1A1A1A] flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-2xl shadow-[#FDE047]/30"
              >
                <Plus className="w-16 h-16" />
              </button>
            </div>
            {/* Minus Button - Below Plus, aligned with bottom player */}
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
          {/* Team 1 (Left) */}
          <div className="absolute top-1/4 left-[7.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team1[0]} isServer={serverIndex === 0} onClick={() => onServerChange(0)} />
          </div>
          <div className="absolute top-3/4 left-[7.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <PlayerMarker name={team1[1]} isServer={serverIndex === 1} onClick={() => onServerChange(1)} />
          </div>

          {/* Team 2 (Right) */}
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
}

function PlayerMarker({ name, isServer, onClick }: { name: string, isServer: boolean, onClick: () => void }) {
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
}

function MatchScorer({ match, tournament, onBack, onUpdate, pointsToPlay, user }: { match: Match, tournament: Tournament, onBack: () => void, onUpdate: (u: Partial<Match>) => void, pointsToPlay: number, user: User | null }) {
  const [score1, setScore1] = useState(match.score1);
  const [score2, setScore2] = useState(match.score2);
  const [sets1, setSets1] = useState(match.sets1);
  const [sets2, setSets2] = useState(match.sets2);
  const [serverIndex, setServerIndex] = useState(match.serverIndex);
  const [status, setStatus] = useState(match.status);
  const [activeUsers, setActiveUsers] = useState<number>(0);

  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const players = [...match.team1, ...match.team2];

  // Presence Tracking
  useEffect(() => {
    if (!match.id || !match.tournamentId) return;

    // Use user.uid if logged in, otherwise a random session ID
    const presenceId = user?.uid || `guest-${Math.random().toString(36).substr(2, 9)}`;
    const presenceRef = doc(db, `tournaments/${match.tournamentId}/matches/${match.id}/presence`, presenceId);

    const registerPresence = async () => {
      try {
        await setDoc(presenceRef, {
          timestamp: new Date().toISOString(),
          userId: user?.uid || 'guest',
          email: user?.email || 'Guest'
        });
      } catch (error) {
        console.error('Error registering presence:', error);
      }
    };

    registerPresence();

    // Listen for other users
    const q = query(collection(db, `tournaments/${match.tournamentId}/matches/${match.id}/presence`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveUsers(snapshot.size);
    });

    // Cleanup
    return () => {
      unsubscribe();
      deleteDoc(presenceRef).catch(err => console.error('Error removing presence:', err));
    };
  }, [match.id, match.tournamentId, user]);

  const pushToHistory = () => {
    setHistory([...history, { score1, score2, sets1, sets2, serverIndex }]);
    setRedoStack([]);
  };

  const handleScore = (team: 1 | 2, delta: number) => {
    pushToHistory();
    if (team === 1) setScore1(Math.max(0, score1 + delta));
    else setScore2(Math.max(0, score2 + delta));
  };

  const handleScoreSet = (team: 1 | 2, value: number) => {
    pushToHistory();
    if (team === 1) setScore1(Math.min(99, Math.max(0, value)));
    else setScore2(Math.min(99, Math.max(0, value)));
  };

  const handleSet = () => {
    pushToHistory();
    setSets1([...sets1, score1]);
    setSets2([...sets2, score2]);
    setScore1(0);
    setScore2(0);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack([...redoStack, { score1, score2, sets1, sets2, serverIndex }]);
    setHistory(history.slice(0, -1));
    
    setScore1(prev.score1);
    setScore2(prev.score2);
    setSets1(prev.sets1);
    setSets2(prev.sets2);
    setServerIndex(prev.serverIndex);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory([...history, { score1, score2, sets1, sets2, serverIndex }]);
    setRedoStack(redoStack.slice(0, -1));

    setScore1(next.score1);
    setScore2(next.score2);
    setSets1(next.sets1);
    setSets2(next.sets2);
    setServerIndex(next.serverIndex);
  };

  const handleServerChange = (idx: number) => {
    pushToHistory();
    setServerIndex(idx);
  };

  const handleSetScoreChange = (team: 1 | 2, setIdx: number, val: string) => {
    pushToHistory();
    const newVal = parseInt(val) || 0;
    if (team === 1) {
      const newSets = [...sets1];
      newSets[setIdx] = newVal;
      setSets1(newSets);
    } else {
      const newSets = [...sets2];
      newSets[setIdx] = newVal;
      setSets2(newSets);
    }
  };

  const save = () => {
    onUpdate({
      score1,
      score2,
      sets1,
      sets2,
      serverIndex,
      status: MatchStatus.IN_PROGRESS
    });
  };

  const complete = () => {
    const s1 = sets1.length + (score1 > score2 ? 1 : 0);
    const s2 = sets2.length + (score2 > score1 ? 1 : 0);
    onUpdate({
      score1,
      score2,
      sets1,
      sets2,
      status: MatchStatus.COMPLETED,
      winner: s1 > s2 ? 1 : 2
    });
    onBack();
  };

  const totalScore = score1 + score2;

  const getTeamName = (playerNames: string[]) => {
    if (!tournament.mode.includes('Team')) return null;
    const p = tournament.players.find(p => p.name === playerNames[0]);
    return p?.teamName || null;
  };

  const team1Name = getTeamName(match.team1);
  const team2Name = getTeamName(match.team2);

  const isTargetReached = (score1 + score2) >= pointsToPlay;

  return (
    <motion.div 
      key="match"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF3] -mx-4 px-4 py-12"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="relative flex items-center justify-between mb-12">
          <div className="flex-1">
            <button 
              onClick={onBack} 
              className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center hover:bg-surface-container-low transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
            </button>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <motion.div 
              layout
              className={`px-8 py-3 rounded-full shadow-lg flex items-center gap-3 whitespace-nowrap transition-colors duration-500 ${isTargetReached ? 'bg-[#FDE047] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A]'}`}
            >
              {isTargetReached ? (
                <>
                  <Trophy className="w-5 h-5 text-[#1A1A1A]" />
                  <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Target Reached</span>
                </>
              ) : (
                <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.2em]">Target: {pointsToPlay}</span>
              )}
            </motion.div>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="flex bg-[#F0EEE6] p-1 rounded-2xl">
              <button 
                onClick={undo} 
                disabled={history.length === 0}
                className="p-3 rounded-xl hover:bg-white disabled:opacity-20 transition-all text-[#1A1A1A]"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button 
                onClick={redo} 
                disabled={redoStack.length === 0}
                className="p-3 rounded-xl hover:bg-white disabled:opacity-20 transition-all text-[#1A1A1A]"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={save} 
              className="flex items-center gap-3 bg-white text-[#1A1A1A] px-8 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all"
            >
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {activeUsers > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-[#FDE047]/10 border border-[#FDE047]/20 p-6 rounded-3xl flex items-center gap-5"
          >
            <AlertTriangle className="w-6 h-6 text-[#FDE047]" />
            <p className="text-sm font-bold text-[#1A1A1A]">
              {activeUsers} people are currently scoring this match.
            </p>
          </motion.div>
        )}

        {/* Padel Court View - Moved up to replace score cards */}
        <PadelCourt 
          team1={match.team1} 
          team2={match.team2} 
          serverIndex={serverIndex}
          team1Name={team1Name}
          team2Name={team2Name}
          score1={score1}
          score2={score2}
          onScoreUpdate={handleScore}
          onScoreSet={handleScoreSet}
          onServerChange={handleServerChange}
          pointsToPlay={pointsToPlay}
        />

        {/* Bottom Panel */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#F0EEE6] mt-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">Set Scores</span>
                <div className="h-px flex-1 bg-[#F0EEE6]" />
              </div>
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">Team 1</p>
                  <div className="flex gap-3">
                    {sets1.map((s, i) => (
                      <input
                        key={i}
                        type="number"
                        value={s}
                        onChange={(e) => handleSetScoreChange(1, i, e.target.value)}
                        className="w-16 h-16 bg-[#FDFBF3] border border-[#F0EEE6] rounded-2xl flex items-center justify-center font-bold text-2xl text-center outline-none focus:bg-white focus:border-[#FDE047] transition-all tabular-nums"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">Team 2</p>
                  <div className="flex gap-3">
                    {sets2.map((s, i) => (
                      <input
                        key={i}
                        type="number"
                        value={s}
                        onChange={(e) => handleSetScoreChange(2, i, e.target.value)}
                        className="w-16 h-16 bg-[#FDFBF3] border border-[#F0EEE6] rounded-2xl flex items-center justify-center font-bold text-2xl text-center outline-none focus:bg-white focus:border-[#FDE047] transition-all tabular-nums"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={handleSet}
                className="flex-1 lg:flex-none px-12 py-6 rounded-2xl font-bold text-sm bg-[#FDFBF3] text-[#1A1A1A] border border-[#F0EEE6] hover:bg-[#F0EEE6] transition-all"
              >
                Finish Set
              </button>
              <button 
                onClick={complete}
                className="flex-1 lg:flex-none bg-[#FDE047] text-[#1A1A1A] px-12 py-6 rounded-2xl font-bold shadow-xl shadow-[#FDE047]/20 hover:scale-105 active:scale-95 transition-all"
              >
                Finish Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
