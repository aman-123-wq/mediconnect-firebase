import admin from 'firebase-admin';

// Initialize Firebase
try {
  console.log('🔄 Initializing Firebase...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FIREBASE_PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);
  console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
  console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
  
  if (admin.apps.length === 0) {
    // For production (Render) - use environment variables
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Using production Firebase config...');
      
      // Debug: Log what we're getting from environment
      console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
      console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
      console.log('Private Key first 50 chars:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing Firebase environment variables');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        storageBucket: 'mediconnect-hms.appspot.com'
      });
    } 
    // For development - use JSON file
    else {
      console.log('💻 Using development Firebase config...');
      const serviceAccount = require('./mediconnect-hms-firebase-adminsdk-fbsvc-6916c072bf.json');
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