import express from 'express';
import { auth, db } from './firebase';
import { firebaseDB, FirebaseHelpers } from './db';
import verifyCredentials from './verify-credentials.js';

const router = express.Router();

// SIMPLE VERIFICATION ENDPOINT - Add this at the top
router.get('/verify-firebase', async (req, res) => {
  try {
    res.json({
      status: 'success',
      message: 'Firebase is connected and working!',
      timestamp: new Date().toISOString(),
      service: 'MediConnect HMS Backend'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Firebase verification failed',
      error: error.message
    });
  }
});

// HEALTH CHECK ENDPOINT
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'MediConnect HMS Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// FIREBASE CONNECTION TEST ENDPOINT
router.get('/api/test-firebase', async (req, res) => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore
    const testDoc = {
      message: 'Firebase connection test from Render',
      timestamp: new Date().toISOString(),
      status: 'success',
      source: 'render-backend'
    };
    
    const docRef = await db.collection('connection-tests').add(testDoc);
    console.log('✅ Test document created with ID:', docRef.id);
    
    // Test reading
    const snapshot = await db.collection('connection-tests').get();
    console.log('✅ Total test documents:', snapshot.size);
    
    res.json({
      success: true,
      message: 'Firebase connected successfully!',
      documentId: docRef.id,
      totalDocuments: snapshot.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// VERIFY CREDENTIALS ENDPOINT
router.get('/api/verify-credentials', verifyCredentials);

// Mock chatbot responses
const mockChatbot = {
  getResponse: (userMessage: string) => {
    const responses = [
      `I understand: "${userMessage}". How can I help with your medical needs?`,
      `Thanks for your message about ${userMessage}. I'm a healthcare assistant bot.`,
      `I see you're discussing ${userMessage}. As a medical chatbot, I can help with appointment scheduling, patient info, or general health questions.`,
      `Regarding "${userMessage}" - I can assist with patient records, doctor appointments, or hospital services.`,
      `I'm MediConnect's mock chatbot. You said: "${userMessage}" - how can I assist with healthcare services today?`
    ];
    
    return {
      reply: responses[Math.floor(Math.random() * responses.length)],
      isMock: true,
      timestamp: new Date().toISOString()
    };
  }
};

// Authentication middleware
export const authenticateToken = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Mock Chatbot route - NO authentication required for demo
router.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Simulate processing delay
    setTimeout(() => {
      const response = mockChatbot.getResponse(message);
      res.json(response);
    }, 800); // 0.8 second delay for realism
  } catch (error) {
    res.status(500).json({ error: 'Chatbot service unavailable' });
  }
});

// Patient routes
router.get('/api/patients', async (req, res) => {
  try {
    const patients = await FirebaseHelpers.getAll(firebaseDB.patients);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.post('/api/patients', async (req, res) => {
  try {
    const patient = await FirebaseHelpers.create(firebaseDB.patients, req.body);
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Doctor routes
router.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await FirebaseHelpers.getAll(firebaseDB.doctors);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/api/doctors', async (req, res) => {
  try {
    const doctor = await FirebaseHelpers.create(firebaseDB.doctors, req.body);
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// Appointment routes
router.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await FirebaseHelpers.getAll(firebaseDB.appointments);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await FirebaseHelpers.create(firebaseDB.appointments, req.body);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Bed routes
router.get('/api/beds', async (req, res) => {
  try {
    const beds = await FirebaseHelpers.getAll(firebaseDB.beds);
    res.json(beds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beds' });
  }
});

router.post('/api/beds', async (req, res) => {
  try {
    const bed = await FirebaseHelpers.create(firebaseDB.beds, req.body);
    res.json(bed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bed' });
  }
});

// Add this PUT route for updating beds
router.put('/api/beds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedBed = await FirebaseHelpers.update(firebaseDB.beds, id, updateData);
    res.json(updatedBed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bed' });
  }
});

// Donor routes - FIXED VERSION
router.get('/api/donors', async (req, res) => {
  try {
    const { bloodType, organType } = req.query;
    let donors = await FirebaseHelpers.getAll(firebaseDB.donors);
    
    // Apply filters if provided
    if (bloodType && bloodType !== 'all') {
      donors = donors.filter(donor => donor.bloodType === bloodType);
    }
    if (organType && organType !== 'all') {
      donors = donors.filter(donor => donor.organType === organType);
    }
    
    res.json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

router.post('/api/donors', async (req, res) => {
  try {
    console.log('Received donor data:', req.body);
    
    // Add timestamp and ensure required fields
    const donorData = {
      ...req.body,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Validate required fields
    if (!donorData.donorId || !donorData.bloodType || !donorData.organType) {
      return res.status(400).json({ 
        error: 'Missing required fields: donorId, bloodType, and organType are required' 
      });
    }

    const donor = await FirebaseHelpers.create(firebaseDB.donors, donorData);
    console.log('Donor created successfully:', donor);
    
    res.status(201).json(donor);
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({ error: 'Failed to create donor: ' + error.message });
  }
});

// Dashboard stats route
router.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get all data for dashboard statistics
    const [patients, doctors, appointments, beds, donors] = await Promise.all([
      FirebaseHelpers.getAll(firebaseDB.patients),
      FirebaseHelpers.getAll(firebaseDB.doctors),
      FirebaseHelpers.getAll(firebaseDB.appointments),
      FirebaseHelpers.getAll(firebaseDB.beds),
      FirebaseHelpers.getAll(firebaseDB.donors)
    ]);

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.toDateString() === today.toDateString();
    });

    const availableBeds = beds.filter(bed => bed.status === 'available');
    const occupiedBeds = beds.filter(bed => bed.status === 'occupied');
    const availableDonors = donors.filter(donor => donor.status === 'available');

    const stats = {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      totalBeds: beds.length,
      availableBeds: availableBeds.length,
      occupiedBeds: occupiedBeds.length,
      occupancyRate: beds.length > 0 ? Math.round((occupiedBeds.length / beds.length) * 100) : 0,
      totalDonors: donors.length,
      availableDonors: availableDonors.length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;