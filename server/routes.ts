import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { processMessage, analyzeSymptoms } from "./openai";
import { insertAppointmentSchema, insertPatientSchema, insertOrganDonorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    
    ws.on('close', () => {
      connectedClients.delete(ws);
    });
  });

  // Broadcast real-time updates
  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Dashboard API
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const availableBeds = await storage.getBedsByStatus('available');
      const todayAppointments = await storage.getAppointmentsByDate(new Date());
      const activeDonors = await storage.getAllOrganDonors();
      const occupiedBeds = await storage.getBedsByStatus('occupied');
      const emergencyCases = 0; // Will be calculated with proper bed-ward relationship

      res.json({
        availableBeds: availableBeds.length,
        todayAppointments: todayAppointments.length,
        activeDonors: activeDonors.filter(d => d.status === 'available').length,
        emergencyCases: emergencyCases || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Beds API
  app.get('/api/beds', async (req, res) => {
    try {
      const beds = await storage.getBedsWithWardInfo();
      res.json(beds);
    } catch (error) {
      console.error('Error fetching beds:', error);
      res.status(500).json({ message: 'Failed to fetch beds' });
    }
  });

  app.get('/api/beds/by-ward/:wardId', async (req, res) => {
    try {
      const beds = await storage.getBedsByWard(req.params.wardId);
      res.json(beds);
    } catch (error) {
      console.error('Error fetching beds by ward:', error);
      res.status(500).json({ message: 'Failed to fetch beds' });
    }
  });

  app.patch('/api/beds/:id/status', async (req, res) => {
    try {
      const { status, patientId } = req.body;
      await storage.updateBedStatus(req.params.id, status, patientId);
      
      // Broadcast real-time update
      const updatedBed = await storage.getBed(req.params.id);
      broadcastUpdate('bedStatusUpdate', updatedBed);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating bed status:', error);
      res.status(500).json({ message: 'Failed to update bed status' });
    }
  });

  // Wards API
  app.get('/api/wards', async (req, res) => {
    try {
      const wards = await storage.getAllWards();
      res.json(wards);
    } catch (error) {
      console.error('Error fetching wards:', error);
      res.status(500).json({ message: 'Failed to fetch wards' });
    }
  });

  // Appointments API
  app.get('/api/appointments', async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsWithDetails();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.get('/api/appointments/today', async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByDate(new Date());
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      // Broadcast real-time update
      broadcastUpdate('newAppointment', appointment);
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(400).json({ message: 'Failed to create appointment' });
    }
  });

  app.patch('/api/appointments/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateAppointmentStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Failed to update appointment status' });
    }
  });

  // Doctors API
  app.get('/api/doctors', async (req, res) => {
    try {
      const doctors = await storage.getAllDoctors();
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Failed to fetch doctors' });
    }
  });

  app.get('/api/doctors/department/:department', async (req, res) => {
    try {
      const doctors = await storage.getDoctorsByDepartment(req.params.department);
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors by department:', error);
      res.status(500).json({ message: 'Failed to fetch doctors' });
    }
  });

  // Patients API
  app.get('/api/patients', async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ message: 'Failed to fetch patients' });
    }
  });

  app.post('/api/patients', async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(400).json({ message: 'Failed to create patient' });
    }
  });

  // Organ Donors API
  app.get('/api/organ-donors', async (req, res) => {
    try {
      const { bloodType, organType } = req.query;
      const donors = await storage.searchOrganDonors(
        bloodType as string, 
        organType as string
      );
      res.json(donors);
    } catch (error) {
      console.error('Error fetching organ donors:', error);
      res.status(500).json({ message: 'Failed to fetch organ donors' });
    }
  });

  app.post('/api/organ-donors', async (req, res) => {
    try {
      const validatedData = insertOrganDonorSchema.parse(req.body);
      const donor = await storage.createOrganDonor(validatedData);
      
      // Broadcast real-time update
      broadcastUpdate('newDonor', donor);
      
      res.status(201).json(donor);
    } catch (error) {
      console.error('Error creating organ donor:', error);
      res.status(400).json({ message: 'Failed to create organ donor' });
    }
  });

  // Alerts API
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  app.get('/api/alerts/unread', async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching unread alerts:', error);
      res.status(500).json({ message: 'Failed to fetch unread alerts' });
    }
  });

  app.patch('/api/alerts/:id/read', async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({ message: 'Failed to mark alert as read' });
    }
  });

  // Chatbot API
  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      // Save user message
      await storage.createChatMessage({
        sessionId,
        message,
        isUser: true,
      });
      
      // Process with AI
      const response = await processMessage(message);
      
      // Save AI response
      await storage.createChatMessage({
        sessionId,
        message: response.message,
        isUser: false,
      });
      
      res.json(response);
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  app.get('/api/chatbot/messages/:sessionId', async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chatbot/analyze-symptoms', async (req, res) => {
    try {
      const { symptoms } = req.body;
      const analysis = await analyzeSymptoms(symptoms);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      res.status(500).json({ message: 'Failed to analyze symptoms' });
    }
  });

  return httpServer;
}
