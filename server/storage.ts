import {
  users,
  doctors,
  patients,
  wards,
  beds,
  appointments,
  organDonors,
  alerts,
  chatMessages,
  type User,
  type Doctor,
  type Patient,
  type Ward,
  type Bed,
  type Appointment,
  type OrganDonor,
  type Alert,
  type ChatMessage,
  type InsertDoctor,
  type InsertPatient,
  type InsertWard,
  type InsertBed,
  type InsertAppointment,
  type InsertOrganDonor,
  type InsertAlert,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  
  // Doctor operations
  getDoctor(id: string): Promise<Doctor | undefined>;
  getAllDoctors(): Promise<Doctor[]>;
  getDoctorsByDepartment(department: string): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctorAvailability(id: string, available: boolean): Promise<void>;
  
  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient>;
  
  // Ward operations
  getWard(id: string): Promise<Ward | undefined>;
  getAllWards(): Promise<Ward[]>;
  createWard(ward: InsertWard): Promise<Ward>;
  
  // Bed operations
  getBed(id: string): Promise<Bed | undefined>;
  getAllBeds(): Promise<Bed[]>;
  getBedsByWard(wardId: string): Promise<Bed[]>;
  getBedsByStatus(status: string): Promise<Bed[]>;
  updateBedStatus(id: string, status: string, patientId?: string): Promise<void>;
  getBedsWithWardInfo(): Promise<Array<Bed & { ward: Ward }>>;
  
  // Appointment operations
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<void>;
  getAppointmentsWithDetails(): Promise<Array<Appointment & { patient: Patient; doctor: Doctor }>>;
  
  // Organ donor operations
  getOrganDonor(id: string): Promise<OrganDonor | undefined>;
  getAllOrganDonors(): Promise<OrganDonor[]>;
  getOrganDonorsByType(organType: string): Promise<OrganDonor[]>;
  getOrganDonorsByBloodType(bloodType: string): Promise<OrganDonor[]>;
  searchOrganDonors(bloodType?: string, organType?: string): Promise<OrganDonor[]>;
  createOrganDonor(donor: InsertOrganDonor): Promise<OrganDonor>;
  updateOrganDonorStatus(id: string, status: string): Promise<void>;
  
  // Alert operations
  getAlert(id: string): Promise<Alert | undefined>;
  getAllAlerts(): Promise<Alert[]>;
  getUnreadAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  
  // Chat operations
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  // Doctor operations
  async getDoctor(id: string): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }
  
  async getAllDoctors(): Promise<Doctor[]> {
    return await db.select().from(doctors).orderBy(asc(doctors.department));
  }
  
  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    return await db.select().from(doctors)
      .where(eq(doctors.department, department))
      .orderBy(asc(doctors.id));
  }
  
  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db.insert(doctors).values(doctor).returning();
    return newDoctor;
  }
  
  async updateDoctorAvailability(id: string, available: boolean): Promise<void> {
    await db.update(doctors)
      .set({ available })
      .where(eq(doctors.id, id));
  }
  
  // Patient operations
  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }
  
  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(asc(patients.lastName));
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [newPatient] = await db.insert(patients).values(patient).returning();
    return newPatient;
  }
  
  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient> {
    const [updatedPatient] = await db.update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return updatedPatient;
  }
  
  // Ward operations
  async getWard(id: string): Promise<Ward | undefined> {
    const [ward] = await db.select().from(wards).where(eq(wards.id, id));
    return ward;
  }
  
  async getAllWards(): Promise<Ward[]> {
    return await db.select().from(wards).orderBy(asc(wards.name));
  }
  
  async createWard(ward: InsertWard): Promise<Ward> {
    const [newWard] = await db.insert(wards).values(ward).returning();
    return newWard;
  }
  
  // Bed operations
  async getBed(id: string): Promise<Bed | undefined> {
    const [bed] = await db.select().from(beds).where(eq(beds.id, id));
    return bed;
  }
  
  async getAllBeds(): Promise<Bed[]> {
    return await db.select().from(beds).orderBy(asc(beds.bedNumber));
  }
  
  async getBedsByWard(wardId: string): Promise<Bed[]> {
    return await db.select().from(beds)
      .where(eq(beds.wardId, wardId))
      .orderBy(asc(beds.bedNumber));
  }
  
  async getBedsByStatus(status: string): Promise<Bed[]> {
    return await db.select().from(beds)
      .where(eq(beds.status, status as any))
      .orderBy(asc(beds.bedNumber));
  }
  
  async updateBedStatus(id: string, status: string, patientId?: string): Promise<void> {
    await db.update(beds)
      .set({ 
        status: status as any, 
        patientId: patientId || null,
        lastUpdated: new Date()
      })
      .where(eq(beds.id, id));
  }
  
  async getBedsWithWardInfo(): Promise<Array<Bed & { ward: Ward }>> {
    return await db.select({
      id: beds.id,
      wardId: beds.wardId,
      bedNumber: beds.bedNumber,
      status: beds.status,
      patientId: beds.patientId,
      lastUpdated: beds.lastUpdated,
      equipment: beds.equipment,
      notes: beds.notes,
      ward: {
        id: wards.id,
        name: wards.name,
        department: wards.department,
        totalBeds: wards.totalBeds,
        createdAt: wards.createdAt,
      }
    })
    .from(beds)
    .innerJoin(wards, eq(beds.wardId, wards.id))
    .orderBy(asc(wards.name), asc(beds.bedNumber));
  }
  
  // Appointment operations
  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }
  
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
  }
  
  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    return await db.select().from(appointments)
      .where(and(
        gte(appointments.appointmentDate, startOfDay),
        lte(appointments.appointmentDate, endOfDay)
      ))
      .orderBy(asc(appointments.appointmentDate));
  }
  
  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.appointmentDate));
  }
  
  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }
  
  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await db.update(appointments)
      .set({ status: status as any })
      .where(eq(appointments.id, id));
  }
  
  async getAppointmentsWithDetails(): Promise<Array<Appointment & { patient: Patient; doctor: Doctor }>> {
    return await db.select({
      id: appointments.id,
      patientId: appointments.patientId,
      doctorId: appointments.doctorId,
      appointmentDate: appointments.appointmentDate,
      duration: appointments.duration,
      status: appointments.status,
      reason: appointments.reason,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      patient: {
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        email: patients.email,
        phoneNumber: patients.phoneNumber,
        dateOfBirth: patients.dateOfBirth,
        bloodType: patients.bloodType,
        address: patients.address,
        emergencyContactName: patients.emergencyContactName,
        emergencyContactPhone: patients.emergencyContactPhone,
        medicalHistory: patients.medicalHistory,
        createdAt: patients.createdAt,
      },
      doctor: {
        id: doctors.id,
        userId: doctors.userId,
        specialization: doctors.specialization,
        department: doctors.department,
        licenseNumber: doctors.licenseNumber,
        phoneNumber: doctors.phoneNumber,
        available: doctors.available,
        workingHours: doctors.workingHours,
        createdAt: doctors.createdAt,
      }
    })
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .orderBy(desc(appointments.appointmentDate));
  }
  
  // Organ donor operations
  async getOrganDonor(id: string): Promise<OrganDonor | undefined> {
    const [donor] = await db.select().from(organDonors).where(eq(organDonors.id, id));
    return donor;
  }
  
  async getAllOrganDonors(): Promise<OrganDonor[]> {
    return await db.select().from(organDonors).orderBy(desc(organDonors.lastUpdated));
  }
  
  async getOrganDonorsByType(organType: string): Promise<OrganDonor[]> {
    return await db.select().from(organDonors)
      .where(eq(organDonors.organType, organType))
      .orderBy(desc(organDonors.lastUpdated));
  }
  
  async getOrganDonorsByBloodType(bloodType: string): Promise<OrganDonor[]> {
    return await db.select().from(organDonors)
      .where(eq(organDonors.bloodType, bloodType))
      .orderBy(desc(organDonors.lastUpdated));
  }
  
  async searchOrganDonors(bloodType?: string, organType?: string): Promise<OrganDonor[]> {
    if (bloodType && organType) {
      return await db.select().from(organDonors)
        .where(and(
          eq(organDonors.bloodType, bloodType),
          eq(organDonors.organType, organType)
        ))
        .orderBy(desc(organDonors.lastUpdated));
    } else if (bloodType) {
      return await db.select().from(organDonors)
        .where(eq(organDonors.bloodType, bloodType))
        .orderBy(desc(organDonors.lastUpdated));
    } else if (organType) {
      return await db.select().from(organDonors)
        .where(eq(organDonors.organType, organType))
        .orderBy(desc(organDonors.lastUpdated));
    }
    
    return await db.select().from(organDonors).orderBy(desc(organDonors.lastUpdated));
  }
  
  async createOrganDonor(donor: InsertOrganDonor): Promise<OrganDonor> {
    const [newDonor] = await db.insert(organDonors).values(donor).returning();
    return newDonor;
  }
  
  async updateOrganDonorStatus(id: string, status: string): Promise<void> {
    await db.update(organDonors)
      .set({ 
        status: status as any,
        lastUpdated: new Date()
      })
      .where(eq(organDonors.id, id));
  }
  
  // Alert operations
  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }
  
  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }
  
  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(eq(alerts.isRead, false))
      .orderBy(desc(alerts.createdAt));
  }
  
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }
  
  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id));
  }
  
  // Chat operations
  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.timestamp));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
