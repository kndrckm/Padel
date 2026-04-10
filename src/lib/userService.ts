import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { PredefinedPlayer, PredefinedTeam } from '../types';

export const getPredefinedPlayers = async (userId: string): Promise<PredefinedPlayer[]> => {
  if (!userId) throw new Error('User ID is required');
  try {
    const q = query(collection(db, `users/${userId}/predefinedPlayers`), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PredefinedPlayer));
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const addPredefinedPlayer = async (userId: string, player: Omit<PredefinedPlayer, 'id'>) => {
  if (!userId) throw new Error('User ID is required');
  try {
    return await addDoc(collection(db, `users/${userId}/predefinedPlayers`), player);
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const updatePredefinedPlayer = async (userId: string, playerId: string, player: Partial<PredefinedPlayer>) => {
  if (!userId || !playerId) throw new Error('User and Player ID are required');
  try {
    const docRef = doc(db, `users/${userId}/predefinedPlayers`, playerId);
    await updateDoc(docRef, player);
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const deletePredefinedPlayer = async (userId: string, playerId: string) => {
  if (!userId || !playerId) throw new Error('User and Player ID are required');
  try {
    await deleteDoc(doc(db, `users/${userId}/predefinedPlayers`, playerId));
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

export const getPredefinedTeams = async (userId: string): Promise<PredefinedTeam[]> => {
  if (!userId) throw new Error('User ID is required');
  try {
    const q = query(collection(db, `users/${userId}/predefinedTeams`), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PredefinedTeam));
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const addPredefinedTeam = async (userId: string, team: Omit<PredefinedTeam, 'id'>) => {
  if (!userId) throw new Error('User ID is required');
  try {
    return await addDoc(collection(db, `users/${userId}/predefinedTeams`), team);
  } catch (error) {
    console.error('Error adding team:', error);
    throw error;
  }
};

export const updatePredefinedTeam = async (userId: string, teamId: string, team: Partial<PredefinedTeam>) => {
  if (!userId || !teamId) throw new Error('User and Team ID are required');
  try {
    const docRef = doc(db, `users/${userId}/predefinedTeams`, teamId);
    await updateDoc(docRef, team);
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

export const deletePredefinedTeam = async (userId: string, teamId: string) => {
  if (!userId || !teamId) throw new Error('User and Team ID are required');
  try {
    await deleteDoc(doc(db, `users/${userId}/predefinedTeams`, teamId));
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const getKatapgamaTeams = async (userId: string) => {
  if (!userId) return null;
  try {
    const docRef = doc(db, `users/${userId}/settings`, 'katapgama_pack');
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error loading katapgama settings:', error);
    throw error;
  }
};
