import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global flag to prevent multiple initializations
let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) {
    console.log('Firebase already initialized, skipping...');
    return;
  }

  console.log('=== FIREBASE DEBUG INFO ===');
  console.log('Current directory (__dirname):', __dirname);
  console.log('Working directory:', process.cwd());

  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Firebase service account file not found at: ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);

  if (!admin.apps.length) {
    console.log('🔄 Initializing Firebase Admin...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    console.log('✅ Firebase Admin initialized successfully');
  }

  isInitialized = true;
}

// Initialize immediately
initializeFirebase();

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;