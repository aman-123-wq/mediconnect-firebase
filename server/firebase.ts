import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase
try {
  console.log('🔄 Initializing Firebase...');
  
  // Use the actual filename you have
  const serviceAccount = JSON.parse(
    fs.readFileSync('./server/mediconnect-hms-firebase-adminsdk-fbsvc-6916c072bf.json', 'utf8')
  );

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'mediconnect-hms.appspot.com'
    });
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