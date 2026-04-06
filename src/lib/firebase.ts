import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
};

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, config.firestoreDatabaseId);
export const auth = getAuth(app);
