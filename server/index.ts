import express from 'express';
import cors from 'cors';
import { db } from './firebase.js'; // Import your existing Firebase
import routes from './routes.js';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// FIX THIS - Add your Surge domain
app.use(cors({
  origin: [
    'https://mediconnect-aman.surge.sh',  // ← ADD THIS
    'http://localhost:5173', 
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']  // ← ADD METHODS
}));
app.use(express.json());
app.use(routes);
// Firebase test route - using your existing Firebase
app.get('/api/firebase-test', async (req, res) => {
  try {
    const testRef = db.collection('test');
    await testRef.add({
      message: 'Firebase connection test',
      timestamp: new Date().toISOString()
    });
    res.json({ success: true, message: 'Firebase is working!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// DEBUG ROUTE - Check what's in Firebase
app.get('/debug-patients', async (req, res) => {
  try {
    console.log("🔍 DEBUG: Fetching patients from Firebase...");
    const patientsRef = db.collection('patients');
    const snapshot = await patientsRef.get();
    
    console.log("🔍 DEBUG: Snapshot size:", snapshot.size);
    
    const patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log("🔍 DEBUG Patient:", doc.id, data);
      patients.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("🔍 DEBUG: Final patients array:", patients);
    res.json(patients);
  } catch (error) {
    console.log("🔍 DEBUG Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET all patients route - SIMPLIFIED VERSION
app.get('/patients', async (req, res) => {
  try {
    console.log("📞 /patients endpoint called");
    const patientsRef = db.collection('patients');
    const snapshot = await patientsRef.get();
    
    const patients = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      patients.push({
        id: doc.id,
        firstName: data.name?.split(' ')[0] || 'Unknown',
        lastName: data.name?.split(' ')[1] || 'Patient',
        email: data.email || '',
        phoneNumber: data.phone || '',
        bloodType: data.bloodType || 'O+',
        condition: data.condition || 'Stable',
        dateOfBirth: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        address: null,
        createdAt: data.createdAt || new Date().toISOString()
      });
    });

    console.log(`✅ Returning ${patients.length} patients to frontend`);
    res.json(patients);
  } catch (error) {
    console.log("❌ Error in /patients:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Patient creation route - using Firebase instead of PostgreSQL
app.post('/api/patients', async (req, res) => {
  try {
    const { name, email, phone, condition, bloodType } = req.body;
    
    const patientRef = db.collection('patients');
    const result = await patientRef.add({
      name,
      email, 
      phone,
      condition: condition || 'Stable',
      bloodType: bloodType || 'O+',
      createdAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Patient created successfully!',
      patientId: result.id 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// UPDATE patient route
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, condition, bloodType } = req.body;
    
    const patientRef = db.collection('patients').doc(id);
    await patientRef.update({
      name,
      email,
      phone,
      condition,
      bloodType,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Patient updated successfully!'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE patient route
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const patientRef = db.collection('patients').doc(id);
    await patientRef.delete();
    
    res.json({ 
      success: true, 
      message: 'Patient deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== BED MANAGEMENT FIREBASE ROUTES =====

// Get all beds
app.get('/api/beds', async (req, res) => {
  try {
    const bedsRef = db.collection('beds');
    const snapshot = await bedsRef.orderBy('bedNumber', 'asc').get();
    
    const beds = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      beds.push({
        id: doc.id,
        bedNumber: data.bedNumber,
        status: data.status || 'available', // available, occupied, maintenance, cleaning
        patientId: data.patientId || null,
        patientName: data.patientName || '',
        condition: data.condition || '',
        department: data.department || 'General',
        lastUpdated: data.lastUpdated || new Date().toISOString()
      });
    });

    // If no beds exist, create sample data
    if (beds.length === 0) {
      await createSampleBeds();
      return res.json(await getBedsFromFirebase());
    }

    res.json(beds);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get bed by ID
app.get('/api/beds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bedRef = db.collection('beds').doc(id);
    const doc = await bedRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Bed not found' });
    }
    
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update bed status
app.put('/api/beds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, patientId, patientName, condition } = req.body;
    
    const bedRef = db.collection('beds').doc(id);
    await bedRef.update({
      status,
      patientId: patientId || null,
      patientName: patientName || '',
      condition: condition || '',
      lastUpdated: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Bed updated successfully!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new bed
app.post('/api/beds', async (req, res) => {
  try {
    const { bedNumber, department, status } = req.body;
    
    const bedsRef = db.collection('beds');
    const result = await bedsRef.add({
      bedNumber,
      department: department || 'General',
      status: status || 'available',
      patientId: null,
      patientName: '',
      condition: '',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Bed created successfully!',
      bedId: result.id 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete bed
app.delete('/api/beds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const bedRef = db.collection('beds').doc(id);
    await bedRef.delete();
    
    res.json({ 
      success: true, 
      message: 'Bed deleted successfully!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get bed statistics
app.get('/api/beds/stats', async (req, res) => {
  try {
    const bedsRef = db.collection('beds');
    const snapshot = await bedsRef.get();
    
    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    let maintenanceBeds = 0;
    let cleaningBeds = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalBeds++;
      
      switch (data.status) {
        case 'available': availableBeds++; break;
        case 'occupied': occupiedBeds++; break;
        case 'maintenance': maintenanceBeds++; break;
        case 'cleaning': cleaningBeds++; break;
      }
    });
    
    res.json({
      totalBeds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      cleaningBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper functions
async function createSampleBeds() {
  const bedsRef = db.collection('beds');
  const sampleBeds = [
    { bedNumber: 101, department: 'ICU', status: 'occupied', patientName: 'John Smith', condition: 'Critical' },
    { bedNumber: 102, department: 'ICU', status: 'available' },
    { bedNumber: 103, department: 'General', status: 'occupied', patientName: 'Sarah Johnson', condition: 'Stable' },
    { bedNumber: 104, department: 'General', status: 'maintenance' },
    { bedNumber: 105, department: 'Pediatrics', status: 'occupied', patientName: 'Mike Wilson', condition: 'Improving' },
    { bedNumber: 106, department: 'Pediatrics', status: 'cleaning' },
    { bedNumber: 107, department: 'Surgery', status: 'available' },
    { bedNumber: 108, department: 'Surgery', status: 'occupied', patientName: 'Emma Davis', condition: 'Post-op' }
  ];

  for (const bed of sampleBeds) {
    await bedsRef.add({
      ...bed,
      patientId: bed.patientName ? `patient-${Date.now()}` : null,
      condition: bed.condition || '',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
  }
}

async function getBedsFromFirebase() {
  const bedsRef = db.collection('beds');
  const snapshot = await bedsRef.orderBy('bedNumber', 'asc').get();
  
  const beds = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    beds.push({
      id: doc.id,
      bedNumber: data.bedNumber,
      status: data.status,
      patientId: data.patientId,
      patientName: data.patientName,
      condition: data.condition,
      department: data.department,
      lastUpdated: data.lastUpdated
    });
  });
  return beds;
}
// ===== DONOR ROUTES =====
// ===== DONOR ROUTES =====
app.get('/api/donors', async (req, res) => {
  try {
    console.log("📋 GET /api/donors called");
    const donorsRef = db.collection('donors');
    const snapshot = await donorsRef.get();
    
    const donors = [];
    snapshot.forEach(doc => {
      donors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Returning ${donors.length} donors`);
    res.json(donors);
  } catch (error) {
    console.error('❌ Error fetching donors:', error);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

app.post('/api/donors', async (req, res) => {
  try {
    console.log('🎯 POST /api/donors called with data:', req.body);
    
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

    const donorRef = db.collection('donors');
    const result = await donorRef.add(donorData);
    
    console.log('✅ Donor created with ID:', result.id);
    
    res.json({ 
      success: true, 
      id: result.id,
      ...donorData
    });
  } catch (error) {
    console.error('❌ Error creating donor:', error);
    res.status(500).json({ error: 'Failed to create donor: ' + error.message });
  }
});


// ===== CHATBOT FIREBASE INTEGRATION ROUTES =====

// Store chatbot message in Firebase
app.post('/api/chatbot/store-message', async (req, res) => {
  try {
    const { sessionId, message, isUser, timestamp } = req.body;
    
    const messageRef = db.collection('chatbot_messages').doc(sessionId);
    const messagesCollection = messageRef.collection('messages');
    
    await messagesCollection.add({
      message,
      isUser,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Message stored successfully!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get chatbot message history from Firebase
app.get('/api/chatbot/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const messageRef = db.collection('chatbot_messages').doc(sessionId);
    const messagesCollection = messageRef.collection('messages');
    const snapshot = await messagesCollection.orderBy('timestamp', 'asc').get();
    
    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        message: data.message,
        isUser: data.isUser,
        timestamp: data.timestamp
      });
    });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load message history' 
    });
  }
});

// Clear chat history
app.delete('/api/chatbot/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const messageRef = db.collection('chatbot_messages').doc(sessionId);
    await messageRef.delete();
    
    res.json({ 
      success: true, 
      message: 'Chat history cleared successfully!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== MAIN CHATBOT LOGIC =====

// Comprehensive Medical Knowledge Database
// SMART CHATBOT WITH DISEASE UNDERSTANDING
let conversationMemory = {};

app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const lowerMessage = message.toLowerCase().trim();

    // Initialize conversation memory
    if (!conversationMemory[sessionId]) {
      conversationMemory[sessionId] = {
        currentDisease: null,
        symptomDetails: {},
        askedQuestions: [],
        conversationStep: 0
      };
    }

    const memory = conversationMemory[sessionId];

    // DISEASE DETECTION
    const detectDisease = (message: string) => {
      if (message.includes('fever') || message.includes('temperature') || message.includes('hot')) return 'fever';
      if (message.includes('headache') || message.includes('migraine')) return 'headache';
      if (message.includes('cough') || message.includes('coughing')) return 'cough';
      if (message.includes('cold') || message.includes('flu') || message.includes('runny nose')) return 'cold';
      if (message.includes('stomach') || message.includes('abdominal') || message.includes('diarrhea')) return 'stomach';
      if (message.includes('chest pain') || message.includes('heart')) return 'heart';
      if (message.includes('breathing') || message.includes('breath') || message.includes('asthma')) return 'breathing';
      if (message.includes('pain') || message.includes('hurt')) return 'pain';
      return null;
    };

    // SYMPTOM ANALYSIS AND RESPONSE
    const analyzeSymptoms = (disease: string, details: any) => {
      switch (disease) {
        case 'fever':
          if (!details.temperature) {
            return "🤒 **FEVER ASSESSMENT**\n\nI understand you have fever. To help you better:\n\n**What is your temperature?**\n• Please provide the number (e.g., 38.5°C or 101°F)\n• This helps determine severity";
          }
          
          const temp = parseFloat(details.temperature);
          if (temp >= 39.5) {
            return `🚨 **HIGH FEVER EMERGENCY - ${details.temperature}°C**\n\n**Immediate Actions Required:**\n• Go to emergency department now\n• This could indicate serious infection\n• Take acetaminophen if available\n• Drink plenty of water\n• Monitor for confusion or severe headache`;
          } else if (temp >= 38.0) {
            if (!details.duration) {
              return `🌡️ **MODERATE FEVER - ${details.temperature}°C**\n\n**Current Assessment:**\n• Moderate fever requiring attention\n• Rest and hydration essential\n\n**How long have you had this fever?**\n• Hours? Days?`;
            }
            
            const duration = details.duration;
            if (duration.includes('day') && parseInt(duration) > 3) {
              return `⏰ **PROLONGED FEVER - ${details.temperature}°C for ${duration}**\n\n**Medical Attention Needed:**\n• Fever lasting multiple days requires doctor visit\n• Could indicate bacterial infection\n• Please see healthcare provider today`;
            } else {
              return `💊 **FEVER MANAGEMENT - ${details.temperature}°C for ${duration}**\n\n**Recommended Care:**\n• Rest and hydrate well\n• Take fever reducers as directed\n• Monitor temperature every 4 hours\n• See doctor if not improving in 24 hours`;
            }
          } else {
            return `🌡️ **LOW-GRADE FEVER - ${details.temperature}°C**\n\n**Guidance:**\n• Usually not serious\n• Rest and hydration should help\n• Monitor for other symptoms\n• Should improve in 1-2 days`;
          }

        case 'headache':
          if (!details.severity) {
            return "🤕 **HEADACHE ASSESSMENT**\n\nI understand you have a headache.\n\n**How would you describe the pain?**\n• Mild, Moderate, or Severe?\n• Throbbing or constant?";
          }
          
          if (details.severity.includes('severe') || details.severity.includes('worst')) {
            return "🚨 **SEVERE HEADACHE - POTENTIAL EMERGENCY**\n\n**Seek Immediate Care If:**\n• Sudden severe headache\n• With fever and stiff neck\n• With confusion or vision changes\n• After head injury\n\n**Otherwise:**\n• Rest in dark room\n• Hydrate well\n• Over-the-counter pain relief";
          } else {
            return "💊 **HEADACHE MANAGEMENT**\n\n**Self-Care:**\n• Rest in quiet environment\n• Stay hydrated\n• Consider pain relievers\n• Cold compress on forehead\n\n**See Doctor If:**\n• Headache persists >2 days\n• Worsens significantly\n• With other symptoms";
          }

        case 'cough':
          if (!details.type) {
            return "🫁 **COUGH ASSESSMENT**\n\nI understand you have a cough.\n\n**What type of cough?**\n• Dry (no mucus)\n• Wet/productive (with mucus)\n• Barking sound";
          }
          
          if (details.type.includes('blood') || lowerMessage.includes('blood')) {
            return "🚨 **COUGHING BLOOD - EMERGENCY!**\n\n**Go to Hospital Immediately!**\n• This is a serious symptom\n• Could indicate lung problems\n• Don't wait - seek care now";
          }
          
          if (details.type.includes('breath') || lowerMessage.includes('breathing')) {
            return "🫁 **BREATHING DIFFICULTY**\n\n**Urgent Care Needed:**\n• Sit upright and stay calm\n• Use emergency inhaler if available\n• Go to ER if:\n  - Lips turn blue\n  - Can't speak normally\n  - Severe distress";
          }
          
          return "💊 **COUGH CARE**\n\n**Management:**\n• Stay well hydrated\n• Honey or lozenges\n• Humidifier at night\n• Avoid irritants\n\n**See Doctor If:**\n• Lasts >3 weeks\n• With fever or chest pain\n• Breathing difficulties";

        case 'cold':
          return "🤧 **COLD/FLU SYMPTOMS**\n\n**Typical Care:**\n• Rest and hydration are essential\n• Over-the-counter symptom relief\n• Usually improves in 7-10 days\n\n**Seek Medical Care If:**\n• High fever (>39°C)\n• Breathing difficulties\n• Symptoms worsen after 1 week\n• Severe headache or body aches";

        case 'stomach':
          if (!details.symptoms) {
            return "🩺 **STOMACH ISSUES**\n\nI understand you have stomach problems.\n\n**What specific symptoms?**\n• Pain, nausea, vomiting, diarrhea?\n• Location of discomfort?";
          }
          
          if (details.symptoms.includes('blood') || details.symptoms.includes('severe pain')) {
            return "🚨 **ABDOMINAL EMERGENCY**\n\n**Seek Immediate Care For:**\n• Severe abdominal pain\n• Vomiting blood\n• Black stools\n• High fever with pain";
          }
          
          return "💊 **STOMACH CARE**\n\n**General Guidance:**\n• Clear fluids only initially\n• BRAT diet (bananas, rice, applesauce, toast)\n• Rest\n• Avoid dairy and fatty foods\n\n**See Doctor If:**\n• Symptoms persist >2 days\n• Dehydration signs\n• Severe pain";

        case 'heart':
          return "🚨 **CHEST/HEART SYMPTOMS**\n\n**THIS COULD BE SERIOUS!**\n\n**Seek Emergency Care Immediately If:**\n• Chest pain or pressure\n• Pain radiating to arm/jaw\n• Shortness of breath\n• Nausea with sweating\n• Dizziness or fainting\n\n**Don't wait - call emergency services!**";

        case 'breathing':
          return "🫁 **BREATHING DIFFICULTIES**\n\n**Urgent Assessment Needed:**\n\n**Go to Emergency If:**\n• Can't catch your breath\n• Lips/fingernails blue\n• Severe wheezing\n• Can't speak full sentences\n\n**Otherwise:**\n• Sit upright\n• Stay calm\n• Use rescue inhaler if available\n• Seek medical care today";

        default:
          return "🩺 **SYMPTOM ASSESSMENT**\n\nI understand you're not feeling well. Please describe:\n\n• **Specific symptoms** you're experiencing\n• **How long** they've been present\n• **Severity** (mild, moderate, severe)\n• **Any other** related symptoms\n\nThis helps me provide better guidance.";
      }
    };

    // CONVERSATION FLOW MANAGEMENT
    const detectedDisease = detectDisease(lowerMessage);
    
    if (!memory.currentDisease && detectedDisease) {
      // New disease detected
      memory.currentDisease = detectedDisease;
      memory.conversationStep = 1;
      const response = analyzeSymptoms(detectedDisease, memory.symptomDetails);
      return res.json({ message: response });
    }

    if (memory.currentDisease) {
      // Continue existing conversation
      if (memory.conversationStep === 1) {
        // Store symptom details based on disease
        switch (memory.currentDisease) {
          case 'fever':
            if (lowerMessage.match(/\d+\.?\d*/)) {
              memory.symptomDetails.temperature = lowerMessage.match(/\d+\.?\d*/)[0];
              memory.conversationStep = 2;
            }
            break;
          case 'headache':
            memory.symptomDetails.severity = lowerMessage;
            memory.conversationStep = 2;
            break;
          case 'cough':
            memory.symptomDetails.type = lowerMessage;
            memory.conversationStep = 2;
            break;
          case 'stomach':
            memory.symptomDetails.symptoms = lowerMessage;
            memory.conversationStep = 2;
            break;
        }
      }

      const response = analyzeSymptoms(memory.currentDisease, memory.symptomDetails);
      return res.json({ message: response });
    }

    // Default response for unrecognized input
    const defaultResponse = `🩺 **MEDICAL ASSISTANT**\n\nI'm here to help with your health concerns. Please describe:\n\n• **Specific symptoms** (fever, headache, cough, pain, etc.)\n• **How you're feeling**\n• **Duration** of symptoms\n• **Any concerns** you have\n\nI'll provide appropriate medical guidance based on your description.`;
    
    res.json({ message: defaultResponse });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({ 
      message: "I'm experiencing technical difficulties. For immediate medical concerns, please contact healthcare professionals directly." 
    });
  }
});

    // ===== ORIGINAL MEDICAL ENCYCLOPEDIA FUNCTIONALITY =====
    // Extensive Medical Knowledge Base
    const medicalDatabase = {
      // CARDIOVASCULAR DISEASES
      'heart disease': {
        'whatIs': [
          `❤️ **HEART DISEASE - Comprehensive Overview**

**Definition:** Heart disease describes a range of conditions that affect your heart. Diseases under the heart disease umbrella include blood vessel diseases, coronary artery disease, heart rhythm problems (arrhythmias), and heart defects you're born with (congenital heart defects).

**Pathophysiology:** 
• Coronary artery disease involves plaque buildup in heart arteries
• Reduced blood flow leads to angina (chest pain)
• Complete blockage causes heart attack (myocardial infarction)
• Heart failure occurs when heart can't pump effectively

**Epidemiology:**
• Leading cause of death worldwide
• Affects both men and women
• Risk increases with age
• Family history plays significant role`
        ],
        'symptoms': [
          `🫀 **HEART DISEASE SYMPTOMS - Detailed Analysis**

**Cardiovascular Symptoms:**
• **Chest Pain (Angina):** Pressure, tightness, squeezing sensation in chest
• **Shortness of Breath:** Difficulty breathing during activity or at rest
• **Palpitations:** Irregular heartbeats, fluttering sensation
• **Fatigue:** Unusual tiredness, especially with physical activity

**Circulatory Symptoms:**
• **Leg Swelling:** Fluid retention in legs, ankles, feet
• **Cold Extremities:** Poor circulation to hands and feet
• **Dizziness:** Lightheadedness, especially when standing
• **Fainting Spells:** Sudden loss of consciousness

**Advanced Symptoms:**
• **Heart Attack Signs:** Chest pain radiating to arm/jaw, nausea, sweating
• **Heart Failure Signs:** Difficulty breathing when lying down, waking up breathless
• **Arrhythmia Signs:** Racing heartbeat, slow pulse, irregular rhythm

**Gender-Specific Symptoms:**
• **Men:** Typically experience classic chest pain
• **Women:** More likely to have neck/jaw pain, nausea, fatigue`
        ],
        'treatment': [
          `💊 **HEART DISEASE TREATMENT - Comprehensive Approach**

**Medication Therapy:**
• **Statins:** Atorvastatin, Rosuvastatin - lower cholesterol
• **Beta-blockers:** Metoprolol, Atenolol - reduce heart rate and blood pressure
• **ACE Inhibitors:** Lisinopril, Enalapril - improve heart function
• **Antiplatelets:** Aspirin, Clopidogrel - prevent blood clots
• **Diuretics:** Furosemide, Hydrochlorothiazide - reduce fluid buildup

**Surgical Interventions:**
• **Angioplasty & Stenting:** Opens blocked arteries
• **Coronary Bypass:** Creates new blood flow paths around blockages
• **Pacemaker/ICD:** Regulates heart rhythm
• **Valve Repair/Replacement:** Fixes damaged heart valves

**Lifestyle Modifications:**
• **Cardiac Rehabilitation:** Supervised exercise program
• **Dietary Changes:** Heart-healthy eating pattern
• **Stress Management:** Meditation, yoga, counseling
• **Smoking Cessation:** Complete tobacco avoidance

**Monitoring & Follow-up:**
• Regular cardiology appointments
• Blood pressure monitoring at home
• Cholesterol level checks every 4-6 months
• Cardiac imaging as recommended`
        ],
        'prevention': [
          `🛡️ **HEART DISEASE PREVENTION - Complete Strategy**

**Primary Prevention (Before Disease Develops):**
• **Blood Pressure Control:** Maintain <120/80 mmHg
• **Cholesterol Management:** LDL <100 mg/dL, HDL >40 mg/dL
• **Weight Management:** BMI 18.5-24.9
• **Diabetes Control:** HbA1c <7%

**Dietary Prevention:**
• **Mediterranean Diet:** Rich in fruits, vegetables, whole grains
• **Sodium Restriction:** <2,300 mg daily (<1,500 mg if high risk)
• **Healthy Fats:** Omega-3s from fish, nuts, olive oil
• **Fiber Intake:** 25-30 grams daily from whole foods

**Exercise Prevention:**
• **Aerobic Exercise:** 150 minutes moderate or 75 minutes vigorous weekly
• **Strength Training:** 2+ days weekly targeting major muscle groups
• **Flexibility:** Daily stretching routine
• **Consistency:** Regular, sustainable activity pattern

**Risk Factor Management:**
• **Smoking:** Complete cessation - no exceptions
• **Alcohol:** Moderate consumption (1 drink women, 2 drinks men daily)
• **Stress:** Regular relaxation techniques
• **Sleep:** 7-9 hours quality sleep nightly

**Screening & Early Detection:**
• Annual physical exams after age 40
• Regular blood pressure checks
• Cholesterol screening every 4-6 years
• Diabetes screening if overweight or family history`
        ]
      },

      // DIABETES
      'diabetes': {
        'whatIs': [
          `🩺 **DIABETES MELLITUS - Comprehensive Medical Overview**

**Definition:** Diabetes mellitus refers to a group of metabolic disorders characterized by chronic hyperglycemia resulting from defects in insulin secretion, insulin action, or both. The persistent high blood glucose levels lead to damage of various organs, especially eyes, kidneys, nerves, heart, and blood vessels.

**Types and Classification:**
• **Type 1 Diabetes:** Autoimmune destruction of pancreatic beta cells leading to absolute insulin deficiency
• **Type 2 Diabetes:** Progressive insulin secretory defect with insulin resistance
• **Gestational Diabetes:** Glucose intolerance with onset during pregnancy
• **Other Types:** Genetic defects, drug-induced, disease-related

**Pathophysiology:**
• **Type 1:** Autoantibodies destroy insulin-producing cells
• **Type 2:** Cellular resistance to insulin action with relative insulin deficiency
• **Both Types:** Lead to impaired glucose uptake and utilization

**Epidemiology:**
• Global prevalence: 8.8% of adult population
• Type 2 accounts for 90-95% of all cases
• Increasing incidence in children and adolescents
• Strong genetic and environmental components`
        ],
        'symptoms': [
          `🔍 **DIABETES SYMPTOMS - Comprehensive List**

**Classic Hyperglycemia Symptoms:**
• **Polyuria:** Excessive urination, especially at night
• **Polydipsia:** Extreme thirst and dry mouth
• **Polyphagia:** Increased hunger despite eating
• **Weight Loss:** Unexplained weight reduction despite increased appetite

**General Symptoms:**
• **Fatigue:** Persistent tiredness and lack of energy
• **Blurred Vision:** Fluctuating eyesight, difficulty focusing
• **Slow Healing:** Cuts and sores take longer to heal
• **Frequent Infections:** Especially skin, gum, and urinary tract infections

**Neurological Symptoms:**
• **Peripheral Neuropathy:** Tingling, numbness, burning in hands and feet
• **Autonomic Neuropathy:** Digestive issues, dizziness, sexual dysfunction
• **Mononeuropathy:** Sudden weakness of specific nerves

**Advanced Complications:**
• **Retinopathy:** Vision changes, floaters, potential blindness
• **Nephropathy:** Swelling, protein in urine, kidney dysfunction
• **Cardiovascular:** Chest pain, shortness of breath, palpitations

**Emergency Symptoms:**
• **Diabetic Ketoacidosis (Type 1):** Nausea, vomiting, abdominal pain, fruity breath
• **Hyperosmolar State (Type 2):** Extreme thirst, confusion, seizures, coma`
        ],
        'treatment': [
          `💉 **DIABETES TREATMENT - Comprehensive Management**

**Blood Glucose Monitoring:**
• **Frequency:** 4-7 times daily for insulin users, as needed for others
• **Target Ranges:** Fasting 80-130 mg/dL, Postprandial <180 mg/dL
• **HbA1c Testing:** Every 3-6 months, target <7%
• **Continuous Monitors:** Real-time glucose tracking available

**Medication Management - Type 2:**
• **Metformin:** First-line therapy, improves insulin sensitivity
• **Sulfonylureas:** Glipizide, Glyburide - stimulate insulin secretion
• **DPP-4 Inhibitors:** Sitagliptin, Saxagliptin - enhance incretin effect
• **SGLT2 Inhibitors:** Empagliflozin, Canagliflozin - reduce glucose reabsorption
• **GLP-1 Agonists:** Liraglutide, Semaglutide - multiple beneficial effects

**Insulin Therapy:**
• **Basal Insulin:** Long-acting (Glargine, Detemir) for background coverage
• **Bolus Insulin:** Rapid-acting (Lispro, Aspart) for meal coverage
• **Premixed Insulins:** Combination products for convenience
• **Insulin Pumps:** Continuous subcutaneous insulin infusion

**Lifestyle Interventions:**
• **Medical Nutrition Therapy:** Individualized meal planning
• **Physical Activity:** 150 minutes weekly moderate exercise
• **Weight Management:** 5-10% weight loss significantly improves control
• **Stress Reduction:** Mindfulness, adequate sleep, counseling

**Complication Prevention:**
• **Annual Eye Exams:** Dilated retinal examination
• **Foot Care:** Daily inspection, proper footwear, podiatry care
• **Kidney Protection:** ACE inhibitors/ARBs, regular urine protein checks
• **Cardiac Risk Reduction:** Statins, blood pressure control, aspirin`
        ],
        'prevention': [
          `🛡️ **DIABETES PREVENTION - Evidence-Based Strategies**

**Primary Prevention (Pre-Diabetes):**
• **Weight Reduction:** 7% body weight loss through diet and exercise
• **Dietary Modifications:** Mediterranean or DASH diet patterns
• **Physical Activity:** 150+ minutes moderate exercise weekly
• **Metformin Therapy:** For high-risk individuals with prediabetes

**Nutritional Prevention:**
• **Carbohydrate Management:** Focus on low glycemic index foods
• **Fiber Intake:** 25-30 grams daily from whole food sources
• **Healthy Fats:** Monounsaturated and polyunsaturated fats
• **Portion Control:** Mindful eating, appropriate serving sizes

**Lifestyle Modification:**
• **Regular Exercise:** Combination of aerobic and resistance training
• **Sleep Hygiene:** 7-9 hours quality sleep, treat sleep apnea
• **Stress Management:** Regular relaxation practices
• **Smoking Cessation:** Complete tobacco avoidance

**Risk Factor Management:**
• **Blood Pressure:** Maintain <130/80 mmHg
• **Cholesterol:** LDL <100 mg/dL, triglycerides <150 mg/dL
• **Waist Circumference:** <40 inches men, <35 inches women
• **Alcohol:** Moderate consumption if any

**Screening & Monitoring:**
• **High-Risk Screening:** Start at age 35 or earlier with risk factors
• **Regular Testing:** Fasting glucose, HbA1c every 1-3 years
• **Family History:** Enhanced monitoring if first-degree relative affected
• **Pregnancy:** Gestational diabetes screening at 24-28 weeks`
        ]
      },

      // STROKE
      'stroke': {
        'whatIs': [
          `🚨 **STROKE - Comprehensive Medical Emergency**

**Definition:** A stroke, also known as cerebrovascular accident (CVA), occurs when blood supply to part of the brain is interrupted or severely reduced, depriving brain tissue of oxygen and nutrients. Within minutes, brain cells begin to die, making stroke a medical emergency requiring prompt treatment.

**Types of Stroke:**
• **Ischemic Stroke (87%):** Caused by blockage of blood vessels supplying the brain
• **Hemorrhagic Stroke (13%):** Caused by bleeding into or around the brain
• **Transient Ischemic Attack (TIA):** "Mini-stroke" with temporary symptoms

**Pathophysiology:**
• **Ischemic:** Thrombus or embolus blocks cerebral artery
• **Hemorrhagic:** Ruptured blood vessel causes intracranial bleeding
• **Both Types:** Lead to neuronal cell death and neurological deficits

**Risk Factors:**
• **Non-modifiable:** Age, gender, race, family history
• **Modifiable:** Hypertension, smoking, diabetes, atrial fibrillation
• **Lifestyle:** Physical inactivity, poor diet, alcohol abuse, obesity`
        ],
        'symptoms': [
          `⚠️ **STROKE SYMPTOMS - Emergency Recognition**

**FAST Assessment (Critical for Recognition):**
• **F - Face Drooping:** One side of face droops or feels numb
• **A - Arm Weakness:** One arm drifts downward when raised
• **S - Speech Difficulty:** Slurred, strange, or difficult speech
• **T - Time to Call Emergency:** Immediate 911 call crucial

**Additional Common Symptoms:**
• **Sudden Numbness:** Especially on one side of the body
• **Confusion:** Trouble understanding or speaking
• **Vision Problems:** Blurred, blackened, or double vision
• **Walking Difficulty:** Dizziness, loss of balance, coordination problems
• **Severe Headache:** Sudden, intense headache with no known cause

**Specific Symptom Patterns:**
• **Left Brain Stroke:** Right-sided weakness, speech/language problems
• **Right Brain Stroke:** Left-sided weakness, spatial perception issues
• **Brainstem Stroke:** Vertigo, swallowing difficulties, coma
• **Cerebellar Stroke:** Loss of coordination, vomiting, headache

**Progression Patterns:**
• **Sudden Onset:** Symptoms appear abruptly, often maximal at onset
• **Stuttering Progression:** Symptoms worsen over hours
• **TIA Resolution:** Symptoms completely resolve within 24 hours

**Emergency Red Flags:**
• **Worsening Symptoms:** Progressive neurological deterioration
• **Decreased Consciousness:** Drowsiness, stupor, coma
• **Seizures:** Convulsions following symptom onset
• **Severe Headache:** "Worst headache of life" with hemorrhage`
        ],
        'treatment': [
          `🏥 **STROKE TREATMENT - Time-Critical Interventions**

**Emergency Department Management:**
• **Immediate Assessment:** Neurological examination, vital signs
• **Brain Imaging:** CT scan to rule out hemorrhage
• **Time Tracking:** Document symptom onset precisely
• **Airway Management:** Ensure adequate oxygenation

**Acute Ischemic Stroke Treatment:**
• **Thrombolytics:** tPA administration within 4.5 hours of onset
• **Thrombectomy:** Mechanical clot removal within 24 hours for large vessel occlusion
• **Blood Pressure Management:** Careful control to maintain perfusion
• **Glucose Control:** Maintain 140-180 mg/dL range

**Hemorrhagic Stroke Management:**
• **Blood Pressure Control:** Aggressive reduction to limit bleeding
• **Coagulation Correction:** Reverse anticoagulants if present
• **Surgical Intervention:** Evacuation of hematoma if indicated
• **ICP Monitoring:** For patients with elevated intracranial pressure

**Comprehensive Stroke Unit Care:**
• **Multidisciplinary Team:** Neurologists, nurses, therapists
• **Swallowing Assessment:** Before oral intake to prevent aspiration
• **Mobility Protocol:** Early mobilization when medically stable
• **Secondary Prevention:** Initiate preventive medications

**Rehabilitation Phase:**
• **Physical Therapy:** Mobility, balance, strength training
• **Occupational Therapy:** Activities of daily living retraining
• **Speech Therapy:** Language, cognition, swallowing rehabilitation
• **Psychological Support:** Depression screening, counseling

**Long-term Management:**
• **Medication Adherence:** Antiplatelets, statins, blood pressure drugs
• **Risk Factor Control:** Strict management of comorbidities
• **Lifestyle Modification:** Diet, exercise, smoking cessation
• **Regular Follow-up:** Neurology, primary care coordination`
        ],
        'prevention': [
          `🛡️ **STROKE PREVENTION - Comprehensive Strategy**

**Primary Prevention (Before First Stroke):**
• **Blood Pressure Control:** Target <130/80 mmHg
• **Cholesterol Management:** Statin therapy if indicated
• **Atrial Fibrillation Management:** Anticoagulation for high-risk patients
• **Diabetes Control:** HbA1c <7% with individualized targets

**Lifestyle Modifications:**
• **Smoking Cessation:** Complete tobacco avoidance
• **Healthy Diet:** DASH or Mediterranean dietary pattern
• **Regular Exercise:** 150 minutes moderate activity weekly
• **Weight Management:** BMI 18.5-24.9
• **Alcohol Moderation:** ≤1 drink women, ≤2 drinks men daily

**Medication Prevention:**
• **Antiplatelets:** Aspirin, Clopidogrel for high-risk patients
• **Anticoagulants:** Warfarin, DOACs for atrial fibrillation
• **Statins:** For patients with elevated cardiovascular risk
• **Antihypertensives:** Individualized based on comorbidities

**Surgical/Procedural Prevention:**
• **Carotid Endarterectomy:** For symptomatic carotid stenosis >50%
• **Carotid Stenting:** Alternative to endarterectomy in selected patients
• **PFO Closure:** For cryptogenic stroke with patent foramen ovale

**Risk Factor Screening:**
• **Annual Physical:** Blood pressure, pulse regularity check
• **Carotid Ultrasound:** If bruit detected or high-risk patient
• **Cardiac Monitoring:** For cryptogenic stroke evaluation
• **Laboratory Testing:** Lipid panel, glucose, renal function

**Patient Education:**
• **Symptom Recognition:** FAST mnemonic education
• **Emergency Response:** Immediate 911 activation
• **Medication Adherence:** Importance of consistent use
• **Follow-up Compliance:** Regular healthcare provider visits`
        ]
      },

      // CANCER
      'cancer': {
        'whatIs': [
          `🎗️ **CANCER - Comprehensive Overview**

**Definition:** Cancer is a large group of diseases characterized by uncontrolled growth and spread of abnormal cells. If the spread is not controlled, it can result in death. Cancer can start almost anywhere in the human body, which is made up of trillions of cells.

**Hallmarks of Cancer:**
• **Sustained Proliferation:** Continuous cell division signaling
• **Evading Growth Suppressors:** Bypassing normal growth controls
• **Resisting Cell Death:** Avoiding programmed cell death (apoptosis)
• **Enable Replicative Immortality:** Unlimited division potential
• **Inducing Angiogenesis:** Creating new blood vessels
• **Activating Invasion/Metastasis:** Spreading to other tissues

**Cancer Classification:**
• **Carcinomas:** Epithelial tissues (80-90% of cancers)
• **Sarcomas:** Connective tissues (bone, muscle, fat)
• **Leukemias:** Blood-forming tissues
• **Lymphomas:** Immune system tissues
• **Central Nervous System:** Brain and spinal cord

**Cancer Development:**
• **Initiation:** DNA damage creates mutated cell
• **Promotion:** Mutated cell begins dividing
• **Progression:** Tumor becomes malignant and invasive
• **Metastasis:** Cancer spreads to distant sites`
        ],
        'symptoms': [
          `🔍 **CANCER SYMPTOMS - Comprehensive Warning Signs**

**General Constitutional Symptoms:**
• **Unexplained Weight Loss:** Significant loss without trying
• **Persistent Fatigue:** Doesn't improve with rest
• **Fever/Night Sweats:** Especially recurring or unexplained
• **Pain:** Persistent, unexplained pain anywhere in body

**Site-Specific Symptoms:**
• **Breast Changes:** Lump, thickening, nipple changes, skin changes
• **Skin Changes:** New mole, changing mole, non-healing sore
• **Digestive Issues:** Persistent indigestion, swallowing difficulties
• **Respiratory:** Persistent cough, hoarseness, coughing blood

**System-Specific Warning Signs:**
• **Hematological:** Easy bruising, bleeding, frequent infections
• **Neurological:** Headaches, seizures, vision changes, balance problems
• **Genitourinary:** Blood in urine, urinary changes, testicular lumps
• **Gynecological:** Abnormal bleeding, pelvic pain, discharge changes

**Advanced Disease Symptoms:**
• **Cachexia:** Severe weight and muscle loss
• **Obstruction Symptoms:** Bowel, urinary, or airway blockage
• **Metastatic Symptoms:** Bone pain, neurological deficits, liver enlargement
• **Paraneoplastic Syndromes:** Remote effects of cancer on other systems

**Emergency Cancer Symptoms:**
• **Superior Vena Cava Syndrome:** Facial swelling, breathing difficulty
• **Spinal Cord Compression:** Back pain, leg weakness, incontinence
• **Hypercalcemia:** Confusion, abdominal pain, excessive thirst
• **Tumor Lysis Syndrome:** After chemotherapy in sensitive tumors`
        ],
        'treatment': [
          `💊 **CANCER TREATMENT - Multimodal Approach**

**Surgical Oncology:**
• **Diagnostic Surgery:** Biopsy for tissue diagnosis
• **Staging Surgery:** Determine extent of disease spread
• **Curative Resection:** Complete tumor removal with margins
• **Palliative Surgery:** Relieve symptoms in advanced disease
• **Reconstructive Surgery:** Restore form and function after resection

**Radiation Therapy:**
• **External Beam Radiation:** Precise targeting from outside body
• **Brachytherapy:** Radioactive sources placed inside body
• **Stereotactic Radiosurgery:** Highly focused radiation for small tumors
• **Palliative Radiation:** Pain control, bleeding management

**Systemic Therapies:**
• **Chemotherapy:** Cytotoxic drugs targeting rapidly dividing cells
• **Immunotherapy:** Checkpoint inhibitors, CAR-T cell therapy
• **Targeted Therapy:** Drugs targeting specific molecular alterations
• **Hormone Therapy:** For hormone-sensitive cancers (breast, prostate)
• **Supportive Care:** Anti-emetics, growth factors, pain management

**Treatment Planning Considerations:**
• **Cancer Stage:** Determines treatment intensity and goals
• **Patient Factors:** Age, comorbidities, performance status
• **Molecular Profiling:** Genetic mutations guiding targeted therapy
• **Patient Preferences:** Quality of life considerations

**Multidisciplinary Approach:**
• **Tumor Boards:** Multiple specialists reviewing complex cases
• **Integrated Care:** Coordination between oncology specialties
• **Survivorship Planning:** Long-term follow-up and monitoring
• **Palliative Care:** Symptom management throughout treatment`
        ],
        'prevention': [
          `🛡️ **CANCER PREVENTION - Evidence-Based Strategies**

**Lifestyle Prevention:**
• **Tobacco Avoidance:** Complete cessation of all tobacco products
• **Healthy Weight:** BMI 18.5-24.9 throughout adulthood
• **Physical Activity:** 150+ minutes moderate exercise weekly
• **Healthy Diet:** Plant-based, limited processed meats, alcohol moderation
• **Sun Protection:** Avoid excessive sun, use sunscreen, protective clothing

**Screening and Early Detection:**
• **Breast Cancer:** Mammography starting age 40-50 based on risk
• **Cervical Cancer:** Pap smears and HPV testing per guidelines
• **Colorectal Cancer:** Colonoscopy starting age 45-50
• **Lung Cancer:** Low-dose CT for high-risk smokers/ex-smokers
• **Prostate Cancer:** PSA discussion starting age 50-55

**Vaccination Prevention:**
• **HPV Vaccine:** Prevents cervical, anal, throat cancers
• **Hepatitis B Vaccine:** Prevents liver cancer
• **Consider:** Based on individual risk factors and guidelines

**Environmental and Occupational:**
• **Radiation Minimization:** Medical imaging only when necessary
• **Chemical Exposure:** Workplace safety protocols
• **Air Quality:** Reduce exposure to pollutants and radon
• **Water Safety:** Ensure clean drinking water sources

**Genetic Counseling and Testing:**
• **High-Risk Families:** BRCA, Lynch syndrome, other hereditary cancers
• **Risk-Reducing Interventions:** Enhanced screening, preventive medications
• **Surgical Prevention:** Prophylactic surgery in selected high-risk cases

**Public Health Initiatives:**
• **Cancer Registries:** Track incidence and outcomes
• **Screening Programs:** Population-based early detection
• **Health Education:** Public awareness of risk factors
• **Policy Initiatives:** Tobacco control, environmental regulations`
        ]
      },

      // Default responses for unknown queries
      'default': {
        'general': [
          "I'm here to help with your health concerns. Please describe your symptoms or tell me what medical information you're looking for. I can help with symptom analysis, disease information, treatment options, and prevention strategies.",
          "I understand you have health questions. Could you please describe your symptoms or specify what medical topic you'd like information about? I'm here to provide detailed medical guidance.",
          "Thank you for sharing your health concern. To help you better, please describe your symptoms in detail or let me know what specific medical information you need."
        ]
      }
    };

    // Enhanced question type detection
    const isWhatIsQuestion = lowerMessage.includes('what is') || lowerMessage.includes("what's") || 
                            lowerMessage.includes('tell me about') || lowerMessage.includes('explain');
    const isSymptomQuestion = lowerMessage.includes('symptom') || lowerMessage.includes('sign') || 
                             lowerMessage.includes('feel') || lowerMessage.includes('pain') ||
                             lowerMessage.includes('warning');
    const isTreatmentQuestion = lowerMessage.includes('treatment') || lowerMessage.includes('cure') || 
                              lowerMessage.includes('medicine') || lowerMessage.includes('therapy') ||
                              lowerMessage.includes('medication');
    const isPreventionQuestion = lowerMessage.includes('prevent') || lowerMessage.includes('avoid') || 
                               lowerMessage.includes('reduce risk') || lowerMessage.includes('protection');

    // Disease detection with partial matching
    let detectedDisease = null;
    const diseaseKeywords = [
      'heart disease', 'heart attack', 'cardiac',
      'diabetes', 'blood sugar', 
      'stroke', 'brain attack', 'cerebrovascular',
      'cancer', 'tumor', 'malignant',
      'asthma', 'breathing problem',
      'hypertension', 'high blood pressure',
      'arthritis', 'joint pain',
      'depression', 'mental health'
    ];

    for (const disease of diseaseKeywords) {
      if (lowerMessage.includes(disease)) {
        detectedDisease = disease.split(' ')[0]; // Take first word as key
        break;
      }
    }

    // Map to proper keys
    const diseaseMap = {
      'heart': 'heart disease',
      'cardiac': 'heart disease',
      'diabetes': 'diabetes',
      'stroke': 'stroke',
      'cancer': 'cancer',
      'tumor': 'cancer',
      'malignant': 'cancer'
    };

    if (diseaseMap[detectedDisease]) {
      detectedDisease = diseaseMap[detectedDisease];
    }

    // Determine response category
    let responseCategory = 'general';
    if (isWhatIsQuestion) responseCategory = 'whatIs';
    else if (isSymptomQuestion) responseCategory = 'symptoms';
    else if (isTreatmentQuestion) responseCategory = 'treatment';
    else if (isPreventionQuestion) responseCategory = 'prevention';

    // Get appropriate response
    let responses;
    if (detectedDisease && medicalDatabase[detectedDisease] && medicalDatabase[detectedDisease][responseCategory]) {
      responses = medicalDatabase[detectedDisease][responseCategory];
    } else if (detectedDisease && medicalDatabase[detectedDisease]) {
      responses = medicalDatabase[detectedDisease]['whatIs']; // Default to whatIs
    } else {
      responses = medicalDatabase['default']['general'];
    }

    const randomIndex = Math.floor(Math.random() * responses.length);
    const reply = responses[randomIndex];

    res.json({ 
      message: reply
    });


    const errorMessages = [
      "I'm experiencing technical difficulties. For comprehensive medical information and personal health advice, please consult with qualified healthcare professionals.",
      "Temporary connection issue. For detailed medical guidance and personalized health information, please contact our medical team directly.",
      "Service interruption detected. For reliable, comprehensive medical information, please speak with healthcare providers who can address your specific health concerns."
    ];
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    
    res.status(500).json({ 
      error: randomError
    });
  }
});

// Mock message history endpoint - ADD THIS MISSING ROUTE
app.get('/api/chatbot/messages', async (req, res) => {
  try {
    // Return empty array - we don't store message history for this demo
    res.json([]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to load message history' 
    });
  }
});

// Existing routes...
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'MediConnect API is running!',
    status: 'success'
  });
});

// ADD THE MISSING SERVER START
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
