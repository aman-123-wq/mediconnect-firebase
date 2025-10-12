import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== FIREBASE DEBUG INFO ===');
console.log('Current directory (__dirname):', __dirname);
console.log('Working directory:', process.cwd());

// Check multiple possible locations
const possiblePaths = [
  path.join(__dirname, 'firebase-service-account.json'),           // Same directory as firebase.ts
  path.join(process.cwd(), 'firebase-service-account.json'),       // Root of dist folder
  path.join(process.cwd(), 'server', 'firebase-service-account.json'), // server subfolder
];

console.log('Checking file locations:');
possiblePaths.forEach((filePath, index) => {
  console.log(`  ${index + 1}. ${filePath} - EXISTS: ${fs.existsSync(filePath)}`);
});

// Try to find the file
let serviceAccountPath = null;
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    serviceAccountPath = filePath;
    console.log(`✅ Found service account at: ${filePath}`);
    break;
  }
}

if (!serviceAccountPath) {
  console.log('❌ Service account file not found in any location!');
  console.log('Files in current directory:', fs.readdirSync(__dirname));
  console.log('Files in working directory:', fs.readdirSync(process.cwd()));
  throw new Error('Firebase service account file not found');
}

console.log(`📁 Loading service account from: ${serviceAccountPath}`);

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
console.log('✅ Service account loaded successfully');
console.log('Project ID:', serviceAccount.project_id);

// Initialize Firebase Admin
if (!admin.apps.length) {
  console.log('🔄 Initializing Firebase Admin...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
  console.log('✅ Firebase Admin initialized successfully');
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;