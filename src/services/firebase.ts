// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHxPaxpzS-3BE165zcTSP-XDkMi0tG4GM",
  authDomain: "toalhashotel.firebaseapp.com",
  projectId: "toalhashotel",
  storageBucket: "toalhashotel.firebasestorage.app",
  messagingSenderId: "732760736573",
  appId: "1:732760736573:web:ee7548628f87042524fb54"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);