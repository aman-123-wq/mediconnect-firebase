import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  decimal, 
  jsonb,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const bedStatusEnum = pgEnum("bed_status", ["available", "occupied", "maintenance", "cleaning"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "waiting", "completed", "cancelled"]);
export const alertTypeEnum = pgEnum("alert_type", ["critical", "warning", "info"]);
export const donorStatusEnum = pgEnum("donor_status", ["available", "processing", "unavailable"]);

// Users table for system users (doctors, staff, admins)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("staff"), // admin, doctor, staff
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  specialization: varchar("specialization").notNull(),
  department: varchar("department").notNull(),
  licenseNumber: varchar("license_number").unique().notNull(),
  phoneNumber: varchar("phone_number"),
  available: boolean("available").default(true),
  workingHours: jsonb("working_hours"), // {monday: {start: "09:00", end: "17:00"}, ...}
  createdAt: timestamp("created_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  bloodType: varchar("blood_type"),
  address: text("address"),
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  medicalHistory: text("medical_history"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wards table
export const wards = pgTable("wards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  department: varchar("department").notNull(),
  totalBeds: integer("total_beds").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Beds table
export const beds = pgTable("beds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wardId: varchar("ward_id").references(() => wards.id),
  bedNumber: varchar("bed_number").notNull(),
  status: bedStatusEnum("status").default("available"),
  patientId: varchar("patient_id").references(() => patients.id),
  lastUpdated: timestamp("last_updated").defaultNow(),
  equipment: jsonb("equipment"), // Array of equipment attached to bed
  notes: text("notes"),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  doctorId: varchar("doctor_id").references(() => doctors.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").default(30), // minutes
  status: appointmentStatusEnum("status").default("scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organ donors table
export const organDonors = pgTable("organ_donors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: varchar("donor_id").unique().notNull(), // Public donor ID like D-2024-089
  bloodType: varchar("blood_type").notNull(),
  organType: varchar("organ_type").notNull(), // kidney, liver, heart, lung, cornea
  status: donorStatusEnum("status").default("available"),
  location: jsonb("location"), // {lat: number, lng: number, address: string}
  contactInfo: jsonb("contact_info"), // Encrypted contact information
  medicalCompatibility: jsonb("medical_compatibility"), // Compatibility data
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts table for real-time notifications
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: alertTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  relatedId: varchar("related_id"), // ID of related entity (bed, patient, etc.)
  relatedType: varchar("related_type"), // Type of related entity
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages for AI chatbot
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  doctor: one(doctors, {
    fields: [users.id],
    references: [doctors.userId],
  }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  beds: many(beds),
}));

export const wardsRelations = relations(wards, ({ many }) => ({
  beds: many(beds),
}));

export const bedsRelations = relations(beds, ({ one }) => ({
  ward: one(wards, {
    fields: [beds.wardId],
    references: [wards.id],
  }),
  patient: one(patients, {
    fields: [beds.patientId],
    references: [patients.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));

// Insert schemas
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertWardSchema = createInsertSchema(wards).omit({ id: true, createdAt: true });
export const insertBedSchema = createInsertSchema(beds).omit({ id: true, lastUpdated: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertOrganDonorSchema = createInsertSchema(organDonors).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Ward = typeof wards.$inferSelect;
export type InsertWard = z.infer<typeof insertWardSchema>;
export type Bed = typeof beds.$inferSelect;
export type InsertBed = z.infer<typeof insertBedSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type OrganDonor = typeof organDonors.$inferSelect;
export type InsertOrganDonor = z.infer<typeof insertOrganDonorSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
