import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase
try {
  console.log('🔄 Initializing Firebase...');
  
  if (admin.apps.length === 0) {
    // For production (Render) - use environment variables
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Using production Firebase config...');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        storageBucket: 'mediconnect-hms.appspot.com'
      });
    } 
    // For development - use JSON file (only locally)
    else {
      console.log('💻 Using development Firebase config...');
      const serviceAccount = JSON.parse(
        fs.readFileSync('./server/mediconnect-hms-firebase-adminsdk-fbsvc-6916c072bf.json', 'utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'mediconnect-hms.appspot.com'
      });
    }
    console.log('✅ Firebase Admin initialized successfully!');
  }

} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export const db = admin.firestore();
export const auth = admin.auth();
export const bucket = admin.storage().bucket();
export default admin;