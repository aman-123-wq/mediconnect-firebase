import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    const testPatient = {
      name: 'Test Patient',
      email: 'test@example.com', 
      phone: '1234567890',
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('patients').add(testPatient);
    console.log('✅ Success! Test patient added with ID:', docRef.id);
    
    const snapshot = await db.collection('patients').get();
    console.log('✅ Success! Total patients:', snapshot.size);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFirebase();