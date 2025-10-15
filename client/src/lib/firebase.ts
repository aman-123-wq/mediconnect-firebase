import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBp6Sm5QDd1vYBlgDm_Co2X9AH4_XbiK9w",
  authDomain: "mediconnect-hms.firebaseapp.com",
  projectId: "mediconnect-hms",
  storageBucket: "mediconnect-hms.firebasestorage.app",
  messagingSenderId: "369434106177",
  appId: "1:369434106177:web:b9baa6194ee921eaaa69c0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;