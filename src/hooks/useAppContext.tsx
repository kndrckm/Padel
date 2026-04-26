import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onSnapshot, 
  query, 
  collection, 
  orderBy, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Tournament, Match, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore';

interface AppContextType {
  user: User | null;
  isAuthReady: boolean;
  tournaments: Tournament[];
  connectionStatus: 'online' | 'offline';
  handleLogin: () => Promise<void>;
  handleLogout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAuth must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Network status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Set initial state
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tournaments Listener
  useEffect(() => {
    if (!isAuthReady) return;
    
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Tournament));
      setTournaments(list);
    }, (error) => {
      console.warn('Tournaments list fetch failed:', error.message);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login Error:', error);
      alert(`Login failed: ${error.message}\n\nEnsure this app's URL is added to Firebase Auth -> Settings -> Authorized Domains.`);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <AppContext.Provider value={{ user, isAuthReady, tournaments, connectionStatus, handleLogin, handleLogout }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to subscribe to a single tournament document and its matches sub-collection.
 * Used by TournamentDetail and MatchScorer routes.
 */
export function useTournamentData(tournamentId: string | undefined) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Tournament document listener
  useEffect(() => {
    if (!tournamentId) {
      setTournament(null);
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const tRef = doc(db, 'tournaments', tournamentId);
    const unsubscribe = onSnapshot(tRef, (docSnap) => {
      if (docSnap.exists()) {
        setTournament({ id: docSnap.id, ...docSnap.data() } as Tournament);
      } else {
        setTournament(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Tournament fetch error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Matches sub-collection listener
  useEffect(() => {
    if (!tournamentId) {
      setMatches([]);
      return;
    }

    const q = query(collection(db, `tournaments/${tournamentId}/matches`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Match));
      setMatches(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `tournaments/${tournamentId}/matches`));

    return () => unsubscribe();
  }, [tournamentId]);

  return { tournament, matches, loading };
}
