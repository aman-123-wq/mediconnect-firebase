import admin from 'firebase-admin';
import serviceAccount from './firebase-service-account.json';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;