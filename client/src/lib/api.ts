import { apiRequest } from "./queryClient";
import type { 
  InsertAppointment, 
  InsertPatient, 
  InsertOrganDonor, 
  InsertAlert,
  InsertChatMessage 
} from "@shared/schema";

// Dashboard API
export const dashboardApi = {
  getStats: () => fetch("/api/dashboard/stats").then(res => res.json()),
};

// Beds API
export const bedsApi = {
  getAll: () => fetch("/api/beds").then(res => res.json()),
  getByWard: (wardId: string) => fetch(`/api/beds/by-ward/${wardId}`).then(res => res.json()),
  updateStatus: async (bedId: string, status: string, patientId?: string) => {
    await apiRequest("PATCH", `/api/beds/${bedId}/status`, { status, patientId });
  },
};

// Wards API
export const wardsApi = {
  getAll: () => fetch("/api/wards").then(res => res.json()),
};

// Appointments API
export const appointmentsApi = {
  getAll: () => fetch("/api/appointments").then(res => res.json()),
  getToday: () => fetch("/api/appointments/today").then(res => res.json()),
  create: async (appointment: InsertAppointment) => {
    const response = await apiRequest("POST", "/api/appointments", appointment);
    return response.json();
  },
  updateStatus: async (appointmentId: string, status: string) => {
    await apiRequest("PATCH", `/api/appointments/${appointmentId}/status`, { status });
  },
};

// Doctors API
export const doctorsApi = {
  getAll: () => fetch("/api/doctors").then(res => res.json()),
  getByDepartment: (department: string) => 
    fetch(`/api/doctors/department/${department}`).then(res => res.json()),
};

// Patients API
export const patientsApi = {
  getAll: () => fetch("/api/patients").then(res => res.json()),
  create: async (patient: InsertPatient) => {
    const response = await apiRequest("POST", "/api/patients", patient);
    return response.json();
  },
};

// Organ Donors API
export const organDonorsApi = {
  getAll: () => fetch("/api/organ-donors").then(res => res.json()),
  search: (bloodType?: string, organType?: string) => {
    const params = new URLSearchParams();
    if (bloodType) params.set('bloodType', bloodType);
    if (organType) params.set('organType', organType);
    return fetch(`/api/organ-donors?${params}`).then(res => res.json());
  },
  create: async (donor: InsertOrganDonor) => {
    const response = await apiRequest("POST", "/api/organ-donors", donor);
    return response.json();
  },
  updateStatus: async (donorId: string, status: string) => {
    await apiRequest("PATCH", `/api/organ-donors/${donorId}/status`, { status });
  },
};

// Alerts API
export const alertsApi = {
  getAll: () => fetch("/api/alerts").then(res => res.json()),
  getUnread: () => fetch("/api/alerts/unread").then(res => res.json()),
  markAsRead: async (alertId: string) => {
    await apiRequest("PATCH", `/api/alerts/${alertId}/read`);
  },
  create: async (alert: InsertAlert) => {
    const response = await apiRequest("POST", "/api/alerts", alert);
    return response.json();
  },
};

// Chatbot API
export const chatbotApi = {
  sendMessage: async (message: string, sessionId: string) => {
    const response = await apiRequest("POST", "/api/chatbot/message", {
      message,
      sessionId,
    });
    return response.json();
  },
  getMessages: (sessionId: string) => 
    fetch(`/api/chatbot/messages/${sessionId}`).then(res => res.json()),
  analyzeSymptoms: async (symptoms: string) => {
    const response = await apiRequest("POST", "/api/chatbot/analyze-symptoms", {
      symptoms,
    });
    return response.json();
  },
};

// Utility functions for common operations
export const hospitalApi = {
  dashboard: dashboardApi,
  beds: bedsApi,
  wards: wardsApi,
  appointments: appointmentsApi,
  doctors: doctorsApi,
  patients: patientsApi,
  organDonors: organDonorsApi,
  alerts: alertsApi,
  chatbot: chatbotApi,
};

export default hospitalApi;
