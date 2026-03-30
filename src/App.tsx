/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode, FormEvent } from 'react';
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
    
    // If user is logged in, fetch their tournaments or all public ones
    // For now, we'll fetch all tournaments if public read is allowed
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Tournament));
      
      // If user is logged in, we might want to filter or just show all
      // For this app, we'll show all tournaments the user can see
      setTournaments(list);
    }, (error) => {
      // If not logged in, this might fail if we don't have public list permission
      // But we allowed public read on /tournaments/{id}, not necessarily the collection list
      // Let's check if we want public list. The request says "anyone with the link"
      // which usually means specific ID.
      console.warn('Tournaments list fetch failed (likely not logged in):', error.message);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

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
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const createTournament = async (name: string, mode: GameMode, players: Player[], courtsCount: number, pointsToPlay: number) => {
    if (!user) return;
    console.log('Creating tournament:', { name, mode, players, courtsCount, pointsToPlay });
    try {
      const tData: Omit<Tournament, 'id'> = {
        name,
        mode,
        creatorId: user.uid,
        status: 'active',
        createdAt: new Date().toISOString(),
        players,
        currentRound: 1,
        courtsCount,
        pointsToPlay
      };
      const docRef = await addDoc(collection(db, 'tournaments'), tData);
      console.log('Tournament created with ID:', docRef.id);
      
      // Initial match generation based on mode
      let matchPairs: { team1: string[], team2: string[] }[] = [];

      if (mode === GameMode.NORMAL_AMERICANO || mode === GameMode.MEXICANO || mode === GameMode.SUPER_MEXICANO) {
        const playerNames = players.map(p => p.name);
        for (let i = 0; i < playerNames.length; i += 4) {
          if (i + 3 < playerNames.length) {
            matchPairs.push({
              team1: [playerNames[i], playerNames[i+1]],
              team2: [playerNames[i+2], playerNames[i+3]]
            });
          }
        }
      } else if (mode === GameMode.TEAM_AMERICANO || mode === GameMode.TEAM_MEXICANO) {
        const teams: string[][] = [];
        for (let i = 0; i < players.length; i += 2) {
          if (i + 1 < players.length) {
            teams.push([players[i].name, players[i+1].name]);
          }
        }
        
        if (mode === GameMode.TEAM_AMERICANO) {
          // Every team plays every other team once
          for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
              matchPairs.push({ team1: teams[i], team2: teams[j] });
            }
          }
        } else {
          // TEAM_MEXICANO initial round
          for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
              matchPairs.push({ team1: teams[i], team2: teams[i+1] });
            }
          }
        }
      } else if (mode === GameMode.MIX_AMERICANO || mode === GameMode.MIXICANO) {
        const men = players.filter(p => p.gender === 'man').map(p => p.name);
        const women = players.filter(p => p.gender === 'woman').map(p => p.name);
        
        for (let i = 0; i < men.length; i += 2) {
          if (i + 1 < men.length && i + 1 < women.length) {
            matchPairs.push({
              team1: [men[i], women[i]],
              team2: [men[i+1], women[i+1]]
            });
          }
        }
      }

      console.log('Generating', matchPairs.length, 'initial matches');

      for (let i = 0; i < matchPairs.length; i++) {
        const pair = matchPairs[i];
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
          round: 1,
          court: (i % courtsCount) + 1
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

        <main className="max-w-5xl mx-auto px-4 pt-4 pb-32">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
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
              />
            )}

            {view === 'match' && selectedTournament && activeMatch && (
              <MatchScorer 
                match={activeMatch}
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
  [GameMode.NORMAL_AMERICANO]: "All players play with everyone else exactly one time.",
  [GameMode.MIX_AMERICANO]: "Teams are drawn with one woman and one man. Requires equal gender distribution (max 24 players).",
  [GameMode.MEXICANO]: "Like Americano but results in more even games. New rounds are generated based on current scoreboard standings.",
  [GameMode.MIXICANO]: "Like Mexicano but teams are always drawn as a woman and a man.",
  [GameMode.SUPER_MEXICANO]: "Like Mexicano but with extra points awarded for playing on (or closer to) the winning court.",
  [GameMode.TEAM_AMERICANO]: "Fixed teams play against all other teams exactly one time.",
  [GameMode.TEAM_MEXICANO]: "Mexicano format played with fixed teams."
};

function TournamentCreator({ onCancel, onCreate }: { onCancel: () => void, onCreate: (name: string, mode: GameMode, players: Player[], courtsCount: number, pointsToPlay: number) => Promise<void> }) {
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

  const isTeamMode = mode === GameMode.TEAM_AMERICANO || mode === GameMode.TEAM_MEXICANO;
  const isMixMode = mode === GameMode.MIX_AMERICANO || mode === GameMode.MIXICANO;

  const addPlayer = () => {
    if (isTeamMode) {
      setPlayers([...players, { name: '', gender: 'man' }, { name: '', gender: 'man' }]);
    } else {
      setPlayers([...players, { name: '', gender: players.length % 2 === 0 ? 'man' : 'woman' }]);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validPlayers = players.filter(p => p.name.trim() !== '');
    
    if (isMixMode) {
      const men = validPlayers.filter(p => p.gender === 'man').length;
      const women = validPlayers.filter(p => p.gender === 'woman').length;
      if (men !== women) {
        alert(`Mix modes require an equal number of men and women. Current: ${men} Men, ${women} Women.`);
        return;
      }
      if (validPlayers.length > 24) {
        alert('Max 24 players for Mix Americano.');
        return;
      }
    }

    if (isTeamMode && validPlayers.length % 2 !== 0) {
      alert('Team modes require 2 players per team. Please ensure all teams have 2 players.');
      return;
    }

    if (!name.trim()) {
      alert('Please enter a tournament name.');
      return;
    }

    if (validPlayers.length < 4) {
      alert('Please enter at least 4 players to start a tournament.');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate(name, mode, validPlayers, courtsCount, pointsToPlay);
    } catch (err) {
      console.error('Submit error:', err);
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
      className="max-w-3xl mx-auto"
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
          <div>
            <label className="label-sm mb-3 block">Tournament Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.G. SUMMER PADEL OPEN"
              className="w-full px-6 py-5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium text-on-surface placeholder:text-on-surface/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div>
              <label className="label-sm mb-3 block">Courts Count (1-15)</label>
              <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit">
                <button 
                  type="button"
                  onClick={() => {
                    setDirection(-1);
                    setCourtsCount(Math.max(1, courtsCount - 1));
                  }}
                  className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="w-16 h-12 flex items-center justify-center overflow-hidden relative">
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
                  className="w-12 h-12 bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="label-sm mb-6 block">Points to Play</label>
              <div className="relative pt-8 pb-4 px-2">
                {/* Toggle Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-on-surface/10 rounded-full -translate-y-1/2" />
                
                {/* Points Markers */}
                <div className="relative flex justify-between items-center h-1">
                  {[16, 21, 24, 31, 32].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPointsToPlay(p)}
                      className="relative z-10 flex flex-col items-center group"
                    >
                      <div className="w-3 h-3 rounded-full bg-on-surface/10 group-hover:bg-on-surface/20 transition-all duration-300" />
                      <span className={`absolute -top-8 text-xs font-bold transition-all duration-300 ${pointsToPlay === p ? 'text-primary scale-110' : 'text-on-surface/40'}`}>
                        {p}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Rolling Ball Animation */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-20"
                  initial={false}
                  animate={{ 
                    left: `${[16, 21, 24, 31, 32].indexOf(pointsToPlay) * 25}%`,
                    rotate: pointsToPlay * 20
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <PadelBall className="w-8 h-8 -ml-4 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>

          <div>
            <label className="label-sm mb-4 block">Game Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(GameMode).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`p-6 rounded-2xl border-none text-left transition-all flex flex-col gap-3 ${mode === m ? 'bg-primary-container ring-2 ring-primary' : 'bg-surface-container-low hover:bg-surface-container-high'}`}
                >
                  <span className="font-bold text-sm text-on-surface">{m}</span>
                  <p className="text-xs leading-relaxed text-on-surface/60 font-medium">
                    {MODE_DESCRIPTIONS[m]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <label className="label-sm">
                {isTeamMode ? 'Teams (Max 16 Teams)' : 'Players (Min 4)'}
              </label>
              <button 
                type="button" 
                onClick={addPlayer}
                className="bg-on-surface text-surface px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-on-surface/90 transition-all shadow-sm"
              >
                {isTeamMode ? '+ Add Team' : '+ Add Player'}
              </button>
            </div>
            <div className="space-y-4">
              {isTeamMode ? (
                Array.from({ length: players.length / 2 }).map((_, teamIdx) => (
                  <div key={teamIdx} className="p-8 bg-surface-container-low rounded-2xl space-y-6">
                    <span className="label-sm text-on-surface/40">Team {teamIdx + 1}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <input 
                        type="text"
                        value={players[teamIdx * 2].name}
                        onChange={(e) => updatePlayer(teamIdx * 2, e.target.value)}
                        placeholder="PLAYER 1"
                        className="px-5 py-4 bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium text-on-surface placeholder:text-on-surface/20"
                      />
                      <input 
                        type="text"
                        value={players[teamIdx * 2 + 1].name}
                        onChange={(e) => updatePlayer(teamIdx * 2 + 1, e.target.value)}
                        placeholder="PLAYER 2"
                        className="px-5 py-4 bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium text-on-surface placeholder:text-on-surface/20"
                      />
                    </div>
                  </div>
                ))
              ) : (
                players.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <input 
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePlayer(idx, e.target.value)}
                      placeholder={`PLAYER ${idx + 1}`}
                      className="flex-1 px-5 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium text-on-surface placeholder:text-on-surface/20"
                    />
                    {(isMixMode || true) && (
                      <div className="flex bg-surface-container-low p-1.5 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => updateGender(idx, 'man')}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${p.gender === 'man' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40'}`}
                        >
                          Man
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGender(idx, 'woman')}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${p.gender === 'woman' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40'}`}
                        >
                          Woman
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
      </form>
    </motion.div>
  );
}

function TournamentDetail({ tournament, matches, onBack, onSelectMatch, onDelete, onUpdate }: { tournament: Tournament, matches: Match[], onBack: () => void, onSelectMatch: (m: Match) => void, onDelete: () => void, onUpdate: (updates: Partial<Tournament>) => void }) {
  const [tab, setTab] = useState<'matches' | 'leaderboard'>('matches');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState(tournament.name);
  const [editMode, setEditMode] = useState(tournament.mode);
  const [editCourts, setEditCourts] = useState(tournament.courtsCount);
  const [editDirection, setEditDirection] = useState(1);
  const [editPoints, setEditPoints] = useState(tournament.pointsToPlay);

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?tournamentId=${tournament.id}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

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

  const leaderboard = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};
    tournament.players.forEach(p => {
      stats[p.name] = { name: p.name, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
    });

    matches.filter(m => m.status === MatchStatus.COMPLETED).forEach(m => {
      let t1Points = m.sets1.reduce((a, b) => a + b, 0) + m.score1;
      let t2Points = m.sets2.reduce((a, b) => a + b, 0) + m.score2;

      // Super Mexicano bonus points
      if (tournament.mode === GameMode.SUPER_MEXICANO && m.court) {
        const bonus = Math.max(0, 4 - m.court); // Court 1: 3, Court 2: 2, Court 3: 1
        t1Points += bonus;
        t2Points += bonus;
      }

      m.team1.forEach(p => {
        if (stats[p]) {
          stats[p].pointsFor += t1Points;
          stats[p].pointsAgainst += t2Points;
          if (m.winner === 1) stats[p].wins++;
          else if (m.winner === 2) stats[p].losses++;
        }
      });

      m.team2.forEach(p => {
        if (stats[p]) {
          stats[p].pointsFor += t2Points;
          stats[p].pointsAgainst += t1Points;
          if (m.winner === 2) stats[p].wins++;
          else if (m.winner === 1) stats[p].losses++;
        }
      });
    });

    return Object.values(stats).sort((a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst));
  }, [tournament.players, matches]);

  const generateNextRound = async () => {
    const currentRound = tournament.currentRound || 1;
    const nextRound = currentRound + 1;
    
    // Mexicano logic: sort players by current leaderboard and pair them up
    // 1st & 4th vs 2nd & 3rd (or similar to get even games)
    const sortedPlayers = leaderboard.map(s => s.name);
    const matchPairs: { team1: string[], team2: string[] }[] = [];

    if (tournament.mode === GameMode.MEXICANO || tournament.mode === GameMode.SUPER_MEXICANO || tournament.mode === GameMode.NORMAL_AMERICANO) {
      for (let i = 0; i < sortedPlayers.length; i += 4) {
        if (i + 3 < sortedPlayers.length) {
          // Pair 1st & 4th vs 2nd & 3rd for even games
          matchPairs.push({
            team1: [sortedPlayers[i], sortedPlayers[i+3]],
            team2: [sortedPlayers[i+1], sortedPlayers[i+2]]
          });
        }
      }
    } else if (tournament.mode === GameMode.MIXICANO || tournament.mode === GameMode.MIX_AMERICANO) {
      // Mixicano: 1st Man & 1st Woman vs 2nd Man & 2nd Woman (or similar)
      const men = tournament.players.filter(p => p.gender === 'man').map(p => p.name);
      const women = tournament.players.filter(p => p.gender === 'woman').map(p => p.name);
      
      // Sort men and women based on overall leaderboard position
      const sortedMen = men.sort((a, b) => {
        const aStat = leaderboard.find(s => s.name === a);
        const bStat = leaderboard.find(s => s.name === b);
        return (bStat?.wins || 0) - (aStat?.wins || 0);
      });
      const sortedWomen = women.sort((a, b) => {
        const aStat = leaderboard.find(s => s.name === a);
        const bStat = leaderboard.find(s => s.name === b);
        return (bStat?.wins || 0) - (aStat?.wins || 0);
      });

      for (let i = 0; i < sortedMen.length; i += 2) {
        if (i + 1 < sortedMen.length) {
          matchPairs.push({
            team1: [sortedMen[i], sortedWomen[i]],
            team2: [sortedMen[i+1], sortedWomen[i+1]]
          });
        }
      }
    } else if (tournament.mode === GameMode.TEAM_MEXICANO) {
      // Fixed teams Mexicano: 1st team vs 2nd team, 3rd vs 4th...
      // We need to calculate team stats
      const teamStats: Record<string, { name: string, wins: number, diff: number }> = {};
      matches.filter(m => m.status === MatchStatus.COMPLETED).forEach(m => {
        const t1 = m.team1.sort().join(' & ');
        const t2 = m.team2.sort().join(' & ');
        if (!teamStats[t1]) teamStats[t1] = { name: t1, wins: 0, diff: 0 };
        if (!teamStats[t2]) teamStats[t2] = { name: t2, wins: 0, diff: 0 };
        
        const t1Points = m.sets1.reduce((a, b) => a + b, 0) + m.score1;
        const t2Points = m.sets2.reduce((a, b) => a + b, 0) + m.score2;
        
        teamStats[t1].diff += (t1Points - t2Points);
        teamStats[t2].diff += (t2Points - t1Points);
        if (m.winner === 1) teamStats[t1].wins++;
        else if (m.winner === 2) teamStats[t2].wins++;
      });
      
      const sortedTeams = Object.values(teamStats).sort((a, b) => b.wins - a.wins || b.diff - a.diff);
      for (let i = 0; i < sortedTeams.length; i += 2) {
        if (i + 1 < sortedTeams.length) {
          matchPairs.push({
            team1: sortedTeams[i].name.split(' & '),
            team2: sortedTeams[i+1].name.split(' & ')
          });
        }
      }
    }

    try {
      for (let i = 0; i < matchPairs.length; i++) {
        const pair = matchPairs[i];
        await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
          tournamentId: tournament.id,
          team1: pair.team1,
          team2: pair.team2,
          score1: 0,
          score2: 0,
          sets1: [],
          sets2: [],
          serverIndex: 0,
          status: MatchStatus.PENDING,
          round: nextRound,
          court: i + 1
        });
      }
      await updateDoc(doc(db, 'tournaments', tournament.id!), { currentRound: nextRound });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tournaments/${tournament.id}/matches`);
    }
  };

  const isMexicanoMode = [GameMode.MEXICANO, GameMode.MIXICANO, GameMode.SUPER_MEXICANO, GameMode.TEAM_MEXICANO, GameMode.NORMAL_AMERICANO, GameMode.MIX_AMERICANO].includes(tournament.mode);
  const allMatchesCompleted = matches.length > 0 && matches.every(m => m.status === MatchStatus.COMPLETED);

  return (
    <motion.div 
      key="detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex items-start gap-6">
          <button 
            onClick={onBack} 
            className="mt-2 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all group"
          >
            <ArrowLeft className="w-6 h-6 text-on-surface/60 group-hover:text-on-surface" />
          </button>
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-4xl md:text-5xl font-bold text-on-surface tracking-tight">{tournament.name}</h2>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2.5 rounded-xl text-on-surface/20 hover:text-on-surface hover:bg-surface-container-low transition-all"
                title="Tournament Settings"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-on-surface/40">
              <span className="px-3 py-1 rounded-xl bg-surface-container-low text-on-surface/60">{tournament.mode}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
              <span>{tournament.players.length} Players</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
              <span>Round {tournament.currentRound || 1}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
              <span>{tournament.courtsCount} Courts</span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-surface/10" />
              <span>{tournament.pointsToPlay} Points</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={handleShare}
              className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface/60 hover:text-on-surface"
              title="Share Tournament"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {showShareTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 bg-on-surface text-surface text-xs font-bold rounded-xl shadow-2xl whitespace-nowrap z-10"
                >
                  Link Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-4 rounded-xl bg-surface-container-low hover:bg-destructive/10 transition-all text-on-surface/60 hover:text-destructive"
            title="Delete Tournament"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          {isMexicanoMode && allMatchesCompleted && (
            <button 
              onClick={generateNextRound}
              className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Next Round
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-surface-container-low p-1.5 rounded-2xl mb-12 w-fit">
        <button 
          onClick={() => setTab('matches')}
          className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'matches' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
        >
          Matches
        </button>
        <button 
          onClick={() => setTab('leaderboard')}
          className={`px-10 py-3.5 rounded-xl font-bold text-sm transition-all ${tab === 'leaderboard' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface/40 hover:text-on-surface/60'}`}
        >
          Leaderboard
        </button>
      </div>

      {tab === 'matches' ? (
        <div className="grid grid-cols-1 gap-6">
          {matches.map((m) => (
            <motion.div 
              key={m.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectMatch(m)}
              className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-on-surface/5 transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-8">
                <div className="text-center sm:text-right">
                  <p className="font-bold text-xl text-on-surface">{m.team1.join(' & ')}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  {m.court && <span className="label-sm text-on-surface/20">Court {m.court}</span>}
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      {m.sets1.map((s, i) => <span key={i} className="text-on-surface/20 font-bold text-sm">{s}</span>)}
                      <span className={`text-4xl font-black ${m.status === MatchStatus.COMPLETED && m.score1 > m.score2 ? 'text-primary' : 'text-on-surface'}`}>{m.score1}</span>
                    </div>
                    <span className="text-on-surface/10 font-bold text-2xl">:</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-4xl font-black ${m.status === MatchStatus.COMPLETED && m.score2 > m.score1 ? 'text-primary' : 'text-on-surface'}`}>{m.score2}</span>
                      {m.sets2.map((s, i) => <span key={i} className="text-on-surface/20 font-bold text-sm">{s}</span>)}
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-xl text-on-surface">{m.team2.join(' & ')}</p>
                </div>
              </div>
              <div className="ml-8 p-3 bg-surface-container-low rounded-xl group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                {m.status === MatchStatus.COMPLETED ? (
                  <CheckCircle className="w-6 h-6" />
                ) : m.status === MatchStatus.IN_PROGRESS ? (
                  <Play className="w-6 h-6 animate-pulse" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-on-surface/5">
                  <th className="px-10 py-6 label-sm text-on-surface/40">Rank</th>
                  <th className="px-10 py-6 label-sm text-on-surface/40">Player</th>
                  <th className="px-10 py-6 label-sm text-on-surface/40 text-center">W</th>
                  <th className="px-10 py-6 label-sm text-on-surface/40 text-center">L</th>
                  <th className="px-10 py-6 label-sm text-on-surface/40 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-on-surface/5">
                {leaderboard.map((p, idx) => (
                  <tr key={p.name} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-10 py-6">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-primary-container text-on-primary-container' : idx === 1 ? 'bg-surface-container-high text-on-surface/60' : idx === 2 ? 'bg-surface-container-low text-on-surface/40' : 'bg-surface-container-lowest text-on-surface/20 border border-on-surface/5'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-10 py-6 font-bold text-on-surface text-lg">{p.name}</td>
                    <td className="px-10 py-6 text-center font-bold text-on-surface/60">{p.wins}</td>
                    <td className="px-10 py-6 text-center font-bold text-on-surface/60">{p.losses}</td>
                    <td className="px-10 py-6 text-center font-bold text-on-surface/40">{p.pointsFor - p.pointsAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-serif font-bold text-on-surface">Settings</h3>
                  <button 
                    onClick={() => setShowSettings(false)} 
                    className="p-3 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface/40"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="label-sm mb-3 block">Tournament Name</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="label-sm mb-3 block">Game Mode</label>
                    <select 
                      value={editMode}
                      onChange={(e) => setEditMode(e.target.value as GameMode)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(GameMode).map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="label-sm mb-3 block">Courts</label>
                      <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-xl w-fit">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditDirection(-1);
                            setEditCourts(Math.max(1, editCourts - 1));
                          }}
                          className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="w-12 h-10 flex items-center justify-center overflow-hidden relative">
                          <AnimatePresence mode="popLayout" custom={editDirection}>
                            <motion.span
                              key={editCourts}
                              custom={editDirection}
                              initial={(d: number) => ({ y: d === 1 ? -15 : 15, opacity: 0 })}
                              animate={{ y: 0, opacity: 1 }}
                              exit={(d: number) => ({ y: d === 1 ? 15 : -15, opacity: 0 })}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="absolute font-bold text-xl text-on-surface"
                            >
                              {editCourts}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setEditDirection(1);
                            setEditCourts(Math.min(15, editCourts + 1));
                          }}
                          className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label-sm mb-3 block">Points</label>
                      <input 
                        type="number"
                        value={editPoints}
                        onChange={(e) => setEditPoints(parseInt(e.target.value) || 21)}
                        className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex gap-4">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-5 font-bold text-on-surface/60 rounded-xl border border-on-surface/10 hover:bg-surface-container-low transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveSettings}
                    className="flex-1 py-5 bg-primary-container text-on-primary-container rounded-xl font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-error/10 text-error rounded-xl flex items-center justify-center mx-auto mb-8">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-serif font-bold text-on-surface mb-4">Delete Tournament?</h3>
                <p className="text-on-surface/40 mb-10 text-lg">This action is permanent. All matches and scores will be lost forever.</p>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={onDelete}
                    className="w-full py-5 bg-error text-white rounded-xl font-bold shadow-lg shadow-error/10 hover:bg-error/90 transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-5 font-bold text-on-surface/60 rounded-xl hover:bg-surface-container-low transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MatchScorer({ match, onBack, onUpdate, pointsToPlay, user }: { match: Match, onBack: () => void, onUpdate: (u: Partial<Match>) => void, pointsToPlay: number, user: User | null }) {
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

  return (
    <motion.div 
      key="match"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-5xl mx-auto px-4"
    >
      <div className="flex items-center justify-between mb-12">
        <button 
          onClick={onBack} 
          className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-on-surface/5 hover:border-primary/30 hover:bg-surface-container-low transition-all group"
        >
          <ArrowLeft className="w-6 h-6 text-on-surface/60 group-hover:text-on-surface" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status === MatchStatus.IN_PROGRESS ? 'bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.5)]' : 'bg-on-surface/10'}`} />
            <span className="label-sm text-on-surface/40">{status}</span>
          </div>
          <div className="bg-on-surface px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-bold text-surface uppercase tracking-widest">Target: {pointsToPlay}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-low p-1 rounded-xl mr-2">
            <button 
              onClick={undo} 
              disabled={history.length === 0}
              className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface/60"
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button 
              onClick={redo} 
              disabled={redoStack.length === 0}
              className="p-3 rounded-xl hover:bg-surface-container-lowest disabled:opacity-20 transition-all text-on-surface/60"
              title="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={save} 
            className="flex items-center gap-3 bg-surface-container-lowest text-on-surface border border-on-surface/5 px-6 py-3.5 rounded-xl font-bold shadow-sm hover:border-primary/30 hover:bg-surface-container-low transition-all"
          >
            <Save className="w-5 h-5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activeUsers > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-primary-container/10 border border-primary-container/30 p-6 rounded-2xl flex items-start gap-5"
          >
            <div className="p-3 rounded-xl bg-primary-container text-on-primary-container">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface mb-1">Multiple Scorers Active</p>
              <p className="text-sm text-on-surface/60 leading-relaxed">There are {activeUsers} users currently viewing or editing this match. Please coordinate to avoid data conflicts.</p>
            </div>
          </motion.div>
        )}

        {/* Team 1 */}
        <div className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm border border-on-surface/5 flex flex-col items-center relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-container opacity-20 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-5 h-5 text-on-surface/20" />
            <span className="label-sm text-on-surface/20">Team One</span>
          </div>
          <div className="space-y-2 mb-12 text-center h-24 flex flex-col justify-center">
            {match.team1.map((p, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <p className="text-2xl font-serif font-bold text-on-surface">{p}</p>
                {serverIndex === i && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <PadelBall className="w-5 h-5 text-primary" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-8 mb-12">
            <button 
              onClick={() => handleScore(1, -1)} 
              className="w-16 h-16 rounded-xl bg-surface-container-low border border-on-surface/5 flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-90"
            >
              <Minus className="w-8 h-8 text-on-surface/60" />
            </button>
            <div className="relative">
              <input 
                type="number"
                value={score1}
                onChange={(e) => {
                  pushToHistory();
                  setScore1(parseInt(e.target.value) || 0);
                }}
                className="text-9xl font-black text-on-surface w-40 text-center bg-transparent border-none focus:outline-none cursor-text caret-primary tabular-nums"
              />
            </div>
            <button 
              onClick={() => handleScore(1, 1)} 
              className="w-16 h-16 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 transition-all active:scale-90 shadow-lg shadow-primary/10"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <div className="flex gap-3">
            {match.team1.map((_, i) => (
              <button
                key={i}
                onClick={() => handleServerChange(i)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${serverIndex === i ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface/40 hover:bg-surface-container-high'}`}
              >
                Server {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm border border-on-surface/5 flex flex-col items-center relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-container opacity-20 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-5 h-5 text-on-surface/20" />
            <span className="label-sm text-on-surface/20">Team Two</span>
          </div>
          <div className="space-y-2 mb-12 text-center h-24 flex flex-col justify-center">
            {match.team2.map((p, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <p className="text-2xl font-serif font-bold text-on-surface">{p}</p>
                {serverIndex === (i + 2) && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <PadelBall className="w-5 h-5 text-primary" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-8 mb-12">
            <button 
              onClick={() => handleScore(2, -1)} 
              className="w-16 h-16 rounded-xl bg-surface-container-low border border-on-surface/5 flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-90"
            >
              <Minus className="w-8 h-8 text-on-surface/60" />
            </button>
            <div className="relative">
              <input 
                type="number"
                value={score2}
                onChange={(e) => {
                  pushToHistory();
                  setScore2(parseInt(e.target.value) || 0);
                }}
                className="text-9xl font-black text-on-surface w-40 text-center bg-transparent border-none focus:outline-none cursor-text caret-primary tabular-nums"
              />
            </div>
            <button 
              onClick={() => handleScore(2, 1)} 
              className="w-16 h-16 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center hover:scale-105 transition-all active:scale-90 shadow-lg shadow-primary/10"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <div className="flex gap-3">
            {match.team2.map((_, i) => (
              <button
                key={i}
                onClick={() => handleServerChange(i + 2)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${serverIndex === (i + 2) ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface/40 hover:bg-surface-container-high'}`}
              >
                Server {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-on-surface/5 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            <div className="flex items-center gap-4">
              <span className="label-sm text-on-surface/40">Set Scores</span>
              <div className="h-px flex-1 bg-on-surface/5" />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Team 1</p>
                <div className="flex gap-3">
                  {sets1.map((s, i) => (
                    <input
                      key={i}
                      type="number"
                      value={s}
                      onChange={(e) => handleSetScoreChange(1, i, e.target.value)}
                      className="w-14 h-14 bg-surface-container-low border border-on-surface/5 rounded-xl flex items-center justify-center font-bold text-xl text-center outline-none focus:bg-surface-container-lowest focus:border-primary/30 transition-all tabular-nums"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Team 2</p>
                <div className="flex gap-3">
                  {sets2.map((s, i) => (
                    <input
                      key={i}
                      type="number"
                      value={s}
                      onChange={(e) => handleSetScoreChange(2, i, e.target.value)}
                      className="w-14 h-14 bg-surface-container-low border border-on-surface/5 rounded-xl flex items-center justify-center font-bold text-xl text-center outline-none focus:bg-surface-container-lowest focus:border-primary/30 transition-all tabular-nums"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={handleSet}
              className={`flex-1 lg:flex-none px-10 py-5 rounded-xl font-bold text-sm transition-all ${ (score1 >= pointsToPlay || score2 >= pointsToPlay) ? 'bg-surface-container-low text-on-surface border border-primary/30 shadow-sm' : 'bg-surface-container-low text-on-surface/20 border border-on-surface/5' }`}
            >
              Finish Set
            </button>
            <button 
              onClick={complete}
              className="flex-1 lg:flex-none bg-primary-container text-on-primary px-10 py-5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Finish Match
            </button>
          </div>
        </div>

        {(score1 >= pointsToPlay || score2 >= pointsToPlay) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-container/10 border border-primary-container/30 px-8 py-5 rounded-2xl font-bold text-sm text-on-surface flex items-center justify-center gap-4"
          >
            <Trophy className="w-6 h-6 text-primary" />
            <span className="tracking-wide">Target Reached! Suggested to finish set.</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
