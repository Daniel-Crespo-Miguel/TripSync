import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC4qHJqTpxNOV6m6w8RsfQ2mw-af-Obk6s',
  authDomain: 'tripsync-58144.firebaseapp.com',
  projectId: 'tripsync-58144',
  storageBucket: 'tripsync-58144.firebasestorage.app',
  messagingSenderId: '321559664765',
  appId: '1:321559664765:web:2df15c2347b7d108ac7914',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
