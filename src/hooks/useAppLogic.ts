import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  query, 
  collection, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc 
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

export type ViewState = 'list' | 'create' | 'detail' | 'match';

export function useAppLogic() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [view, setView] = useState<ViewState>('list');
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

  // Tournaments Listener
  useEffect(() => {
    if (!isAuthReady) return;
    
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Tournament[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Tournament));
      setTournaments(list);
      
      if (selectedTournament) {
        const updated = list.find(t => t.id === selectedTournament.id);
        if (updated) setSelectedTournament(updated);
      }
    }, (error) => {
      console.warn('Tournaments list fetch failed (likely not logged in):', error.message);
    });

    return () => unsubscribe();
  }, [isAuthReady, selectedTournament?.id]);

  // Matches Listener
  useEffect(() => {
    if (!selectedTournament) {
      setMatches([]);
      return;
    }

    const q = query(collection(db, `tournaments/${selectedTournament.id}/matches`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Match));
      setMatches(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `tournaments/${selectedTournament.id}/matches`));

    return () => unsubscribe();
  }, [selectedTournament?.id]);

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

  return {
    user,
    isAuthReady,
    tournaments,
    selectedTournament,
    setSelectedTournament,
    matches,
    view,
    setView,
    activeMatch,
    setActiveMatch,
    handleLogin,
    handleLogout
  };
}
