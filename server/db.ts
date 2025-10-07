import { db } from './firebase';

// Convert your existing Drizzle models to Firebase collections
export const firebaseDB = {
  // Patients collection
  patients: db.collection('patients'),
  
  // Doctors collection  
  doctors: db.collection('doctors'),
  
  // Appointments collection
  appointments: db.collection('appointments'),
  
  // Beds collection
  beds: db.collection('beds'),
  
  // Donors collection
  donors: db.collection('donors')
};

// Helper functions for Firebase operations
export const FirebaseHelpers = {
  async getAll(collection: any) {
    const snapshot = await collection.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getById(collection: any, id: string) {
    const doc = await collection.doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async create(collection: any, data: any) {
    const docRef = await collection.add({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  },

  async update(collection: any, id: string, data: any) {
    await collection.doc(id).update({
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id, ...data };
  },

  async delete(collection: any, id: string) {
    await collection.doc(id).delete();
    return { id };
  }
};