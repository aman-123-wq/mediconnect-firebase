import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase if not already initialized
let db;

try {
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'mediconnect-hms.appspot.com'
    });
    console.log('✅ Firebase initialized in test file');
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('❌ Firebase init failed in test:', error);
}

// Export as API endpoint function
export default async function testFirebase(req, res) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    console.log('Testing Firebase connection...');
    
    const testPatient = {
      name: 'Test Patient',
      email: 'test@example.com', 
      phone: '1234567890',
      createdAt: new Date().toISOString(),
      test: true
    };
    
    // Add test patient
    const docRef = await db.collection('patients').add(testPatient);
    console.log('✅ Success! Test patient added with ID:', docRef.id);
    
    // Get total patients count
    const snapshot = await db.collection('patients').get();
    
    res.json({
      success: true,
      message: 'Firebase test completed successfully! 🎉',
      patientId: docRef.id,
      totalPatients: snapshot.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}