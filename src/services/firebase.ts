// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage'; // ← ADICIONE ESTA LINHA

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBHxPaxpzS-3BE165zcTSP-XDkMi0tG4GM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "toalhashotel.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "toalhashotel",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "toalhashotel.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "732760736573",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:732760736573:web:ee7548628f87042524fb54"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const storage = getStorage(app); // ← ADICIONE ESTA LINHA

// Habilitar persistência offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência offline falhou: múltiplas abas abertas');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistência offline não suportada pelo navegador');
  }
});

// Conectar emuladores em desenvolvimento
if (import.meta.env.DEV) {
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}