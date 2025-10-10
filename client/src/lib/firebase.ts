import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBp6Sm50Dd1vYBlgDm_Co2X9AH4_XbIK9w",
    authDomain: "mediconnect-hms.firebaseapp.com",
    projectId: "mediconnect-hms",
    storageBucket: "mediconnect-hms.firebasestorage.app",
    messagingSenderId: "369434106177",
    appId: "1:369434106177:web:b9baa6194ee921eaaa69c0",
    measurementId: "G-3V2E65XCBY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;