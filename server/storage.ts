import { db } from './firebase';
import { Collections } from './firebase-schema';

// Patient Operations
export const patientStorage = {
  async create(patientData: any) {
    const docRef = db.collection(Collections.PATIENTS).doc();
    const patient = {
      id: docRef.id,
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(patient);
    return patient;
  },

  async getAll() {
    const snapshot = await db.collection(Collections.PATIENTS).get();
    return snapshot.docs.map(doc => doc.data());
  },

  async getById(id: string) {
    const doc = await db.collection(Collections.PATIENTS).doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async update(id: string, patientData: any) {
    const docRef = db.collection(Collections.PATIENTS).doc(id);
    await docRef.update({
      ...patientData,
      updatedAt: new Date().toISOString(),
    });
    const updatedDoc = await docRef.get();
    return updatedDoc.data();
  },

  async delete(id: string) {
    await db.collection(Collections.PATIENTS).doc(id).delete();
    return { id };
  }
};

// Doctor Operations
export const doctorStorage = {
  async create(doctorData: any) {
    const docRef = db.collection(Collections.DOCTORS).doc();
    const doctor = {
      id: docRef.id,
      ...doctorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(doctor);
    return doctor;
  },

  async getAll() {
    const snapshot = await db.collection(Collections.DOCTORS).get();
    return snapshot.docs.map(doc => doc.data());
  },

  async getById(id: string) {
    const doc = await db.collection(Collections.DOCTORS).doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async update(id: string, doctorData: any) {
    const docRef = db.collection(Collections.DOCTORS).doc(id);
    await docRef.update({
      ...doctorData,
      updatedAt: new Date().toISOString(),
    });
    const updatedDoc = await docRef.get();
    return updatedDoc.data();
  },

  async delete(id: string) {
    await db.collection(Collections.DOCTORS).doc(id).delete();
    return { id };
  }
};

// Appointment Operations
export const appointmentStorage = {
  async create(appointmentData: any) {
    const docRef = db.collection(Collections.APPOINTMENTS).doc();
    const appointment = {
      id: docRef.id,
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(appointment);
    return appointment;
  },

  async getAll() {
    const snapshot = await db.collection(Collections.APPOINTMENTS).get();
    return snapshot.docs.map(doc => doc.data());
  },

  async getById(id: string) {
    const doc = await db.collection(Collections.APPOINTMENTS).doc(id).get();
    return doc.exists ? doc.data() : null;
  },

  async update(id: string, appointmentData: any) {
    const docRef = db.collection(Collections.APPOINTMENTS).doc(id);
    await docRef.update({
      ...appointmentData,
      updatedAt: new Date().toISOString(),
    });
    const updatedDoc = await docRef.get();
    return updatedDoc.data();
  },

  async delete(id: string) {
    await db.collection(Collections.APPOINTMENTS).doc(id).delete();
    return { id };
  },

  async getByPatientId(patientId: string) {
    const snapshot = await db.collection(Collections.APPOINTMENTS)
      .where('patientId', '==', patientId)
      .get();
    return snapshot.docs.map(doc => doc.data());
  },

  async getByDoctorId(doctorId: string) {
    const snapshot = await db.collection(Collections.APPOINTMENTS)
      .where('doctorId', '==', doctorId)
      .get();
    return snapshot.docs.map(doc => doc.data());
  }
};

// User Operations
export const userStorage = {
  async create(userData: any) {
    const docRef = db.collection(Collections.USERS).doc();
    const user = {
      id: docRef.id,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.set(user);
    return user;
  },

  async getByEmail(email: string) {
    const snapshot = await db.collection(Collections.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    return snapshot.empty ? null : snapshot.docs[0].data();
  },

  async getById(id: string) {
    const doc = await db.collection(Collections.USERS).doc(id).get();
    return doc.exists ? doc.data() : null;
  }
};