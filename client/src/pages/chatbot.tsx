import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
  isEmergency?: boolean;
}

// ===== COMPREHENSIVE MEDICAL KNOWLEDGE DATABASE (From your index.ts) =====
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

**Definition:** Diabetes mellitus refers to a group of metabolic disorders characterized by chronic hyperglycemia resulting from defects in insulin secretion, insulin action, or both. The persistent high blood glucose levels lead to damage of various organs, especially eyes, kidneys, nerves, heart, and blood vessels.`
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
• **Frequent Infections:** Especially skin, gum, and urinary tract infections`
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
• **SGLT2 Inhibitors:** Empagliflozin, Canagliflozin - reduce glucose reabsorption`
    ],
    'prevention': [
      `🛡️ **DIABETES PREVENTION - Evidence-Based Strategies**

**Primary Prevention (Pre-Diabetes):**
• **Weight Reduction:** 7% body weight loss through diet and exercise
• **Dietary Modifications:** Mediterranean or DASH diet patterns
• **Physical Activity:** 150+ minutes moderate exercise weekly
• **Metformin Therapy:** For high-risk individuals with prediabetes`
    ]
  },

  // STROKE
  'stroke': {
    'whatIs': [
      `🚨 **STROKE - Comprehensive Medical Emergency**

**Definition:** A stroke occurs when blood supply to part of the brain is interrupted or severely reduced, depriving brain tissue of oxygen and nutrients. Within minutes, brain cells begin to die, making stroke a medical emergency requiring prompt treatment.`
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
• **Walking Difficulty:** Dizziness, loss of balance, coordination problems`
    ],
    'treatment': [
      `🏥 **STROKE TREATMENT - Time-Critical Interventions**

**Emergency Department Management:**
• **Immediate Assessment:** Neurological examination, vital signs
• **Brain Imaging:** CT scan to rule out hemorrhage
• **Time Tracking:** Document symptom onset precisely
• **Airway Management:** Ensure adequate oxygenation`
    ],
    'prevention': [
      `🛡️ **STROKE PREVENTION - Comprehensive Strategy**

**Primary Prevention (Before First Stroke):**
• **Blood Pressure Control:** Target <130/80 mmHg
• **Cholesterol Management:** Statin therapy if indicated
• **Atrial Fibrillation Management:** Anticoagulation for high-risk patients
• **Diabetes Control:** HbA1c <7% with individualized targets`
    ]
  },

  // CANCER
  'cancer': {
    'whatIs': [
      `🎗️ **CANCER - Comprehensive Overview**

**Definition:** Cancer is a large group of diseases characterized by uncontrolled growth and spread of abnormal cells. If the spread is not controlled, it can result in death. Cancer can start almost anywhere in the human body.`
    ],
    'symptoms': [
      `🔍 **CANCER SYMPTOMS - Comprehensive Warning Signs**

**General Constitutional Symptoms:**
• **Unexplained Weight Loss:** Significant loss without trying
• **Persistent Fatigue:** Doesn't improve with rest
• **Fever/Night Sweats:** Especially recurring or unexplained
• **Pain:** Persistent, unexplained pain anywhere in body`
    ],
    'treatment': [
      `💊 **CANCER TREATMENT - Multimodal Approach**

**Surgical Oncology:**
• **Diagnostic Surgery:** Biopsy for tissue diagnosis
• **Staging Surgery:** Determine extent of disease spread
• **Curative Resection:** Complete tumor removal with margins
• **Palliative Surgery:** Relieve symptoms in advanced disease`
    ],
    'prevention': [
      `🛡️ **CANCER PREVENTION - Evidence-Based Strategies**

**Lifestyle Prevention:**
• **Tobacco Avoidance:** Complete cessation of all tobacco products
• **Healthy Weight:** BMI 18.5-24.9 throughout adulthood
• **Physical Activity:** 150+ minutes moderate exercise weekly
• **Healthy Diet:** Plant-based, limited processed meats, alcohol moderation`
    ]
  },

  // ASTHMA
  'asthma': {
    'whatIs': [
      `🌬️ **ASTHMA - Chronic Respiratory Condition**

Asthma is a chronic inflammatory disease of the airways causing breathing difficulties, wheezing, and coughing. It's characterized by reversible airflow obstruction and bronchospasm.`
    ],
    'symptoms': [
      `😮‍💨 **ASTHMA SYMPTOMS**

• Wheezing (whistling sound when breathing)
• Shortness of breath
• Chest tightness
• Coughing (often worse at night)
• Difficulty breathing during physical activity`
    ],
    'treatment': [
      `💊 **ASTHMA TREATMENT**

• Quick-relief inhalers (bronchodilators)
• Long-term control medications
• Inhaled corticosteroids
• Avoiding triggers (allergens, smoke)
• Asthma action plan
• Regular monitoring`
    ],
    'prevention': [
      `🛡️ **ASTHMA PREVENTION**

• Identify and avoid triggers
• Use medications as prescribed
• Get annual flu shots
• Maintain clean indoor air
• Manage allergies
• Regular check-ups with your doctor`
    ]
  },

  // ARTHRITIS
  'arthritis': {
    'whatIs': [
      `🦵 **ARTHRITIS - Joint Inflammation**

Arthritis is inflammation of one or more joints causing pain and stiffness. There are over 100 types, with osteoarthritis and rheumatoid arthritis being most common.`
    ],
    'symptoms': [
      `😣 **ARTHRITIS SYMPTOMS**

• Joint pain and tenderness
• Stiffness (especially morning stiffness)
• Swelling and redness
• Decreased range of motion
• Warmth around joints
• Fatigue and general discomfort`
    ],
    'treatment': [
      `💊 **ARTHRITIS TREATMENT**

• Pain relievers and anti-inflammatory drugs
• Physical therapy and exercise
• Weight management
• Hot and cold therapies
• Assistive devices
• In severe cases, joint replacement surgery`
    ],
    'prevention': [
      `🛡️ **ARTHRITIS PREVENTION**

• Maintain healthy weight
• Regular exercise
• Protect joints from injury
• Eat anti-inflammatory diet
• Practice good posture
• Get regular check-ups`
    ]
  },

  // DEPRESSION
  'depression': {
    'whatIs': [
      `🧠 **DEPRESSION - Mental Health Condition**

Depression is a common but serious mood disorder that causes persistent feelings of sadness and loss of interest. It affects how you feel, think, and handle daily activities.`
    ],
    'symptoms': [
      `😔 **DEPRESSION SYMPTOMS**

• Persistent sad, anxious, or "empty" mood
• Loss of interest in activities once enjoyed
• Changes in appetite and weight
• Sleep disturbances (insomnia or oversleeping)
• Fatigue and loss of energy
• Difficulty concentrating and making decisions`
    ],
    'treatment': [
      `💊 **DEPRESSION TREATMENT**

• Psychotherapy (talk therapy)
• Antidepressant medications
• Lifestyle changes (exercise, diet, sleep)
• Support groups
• In severe cases, electroconvulsive therapy
• Combination of therapy and medication`
    ],
    'prevention': [
      `🛡️ **DEPRESSION PREVENTION**

• Build strong social support
• Manage stress effectively
• Maintain regular sleep schedule
• Exercise regularly
• Seek help early for symptoms
• Avoid alcohol and recreational drugs`
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

// ===== CONVERSATIONAL RESPONSES (From your index.ts) =====
const conversationalResponses = {
  'greeting': [
    "Hello! I'm your MediCare Medical Assistant. I'm here to help you with health concerns, symptom analysis, and medical information. What would you like to discuss today?",
    "Hi there! I'm a medical assistant ready to help with your health questions. Please tell me what's concerning you or what medical information you need.",
    "Welcome! I specialize in medical information and symptom analysis. How can I assist you with your health concerns today?"
  ],
  
  'fever': [
    "I understand you're experiencing fever. Fever is your body's natural response to fight infection. Could you tell me:\n• How high is your temperature?\n• How long have you had the fever?\n• Any other symptoms like cough, body aches, or fatigue?",
    "Fever can indicate various conditions. To help you better, please share:\n• Your current temperature\n• Duration of the fever\n• Associated symptoms\n• Any recent travel or sick contacts"
  ],
  
  'headache': [
    "I understand you have a headache. Headaches can have many causes. Could you describe:\n• Where is the pain located?\n• How intense is it (scale 1-10)?\n• How long has it been going on?\n• Any triggers or relieving factors?",
    "Headaches can range from tension to migraines. Please tell me:\n• Type of pain (throbbing, pressure, etc.)\n• Duration and frequency\n• Any vision changes or nausea?\n• Your medical history"
  ],
  
  'cough': [
    "I understand you have a cough. Coughs can be dry or productive. Could you tell me:\n• Is it dry or producing phlegm?\n• How long have you had it?\n• Any fever, shortness of breath, or chest pain?\n• Do you smoke?",
    "Coughing can indicate respiratory issues. Please share:\n• Nature of cough (dry, wet, barking)\n• Duration and timing\n• Associated symptoms\n• Any known allergies or asthma"
  ]
};

// ===== CHATBOT LOGIC FUNCTION (From your index.ts) =====
const analyzeMedicalMessage = (message: string) => {
  const lowerMessage = message.toLowerCase().trim();

  // Check for conversational topics first
  let conversationalTopic = null;
  
  // Greeting detection
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || 
      lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || 
      lowerMessage.includes('good evening')) {
    conversationalTopic = 'greeting';
  }
  // Symptom detection
  else if (lowerMessage.includes('fever') || lowerMessage.includes('temperature') || lowerMessage.includes('hot')) {
    conversationalTopic = 'fever';
  }
  else if (lowerMessage.includes('headache') || lowerMessage.includes('head pain') || lowerMessage.includes('migraine')) {
    conversationalTopic = 'headache';
  }
  else if (lowerMessage.includes('cough') || lowerMessage.includes('coughing')) {
    conversationalTopic = 'cough';
  }
  else if (lowerMessage.includes('cold') || lowerMessage.includes('flu') || lowerMessage.includes('runny nose') || lowerMessage.includes('stuffy nose')) {
    conversationalTopic = 'cold';
  }
  else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
    conversationalTopic = 'pain';
  }
  else if (lowerMessage.includes('tired') || lowerMessage.includes('fatigue') || lowerMessage.includes('exhaust') || lowerMessage.includes('weak')) {
    conversationalTopic = 'fatigue';
  }

  // If it's a conversational topic, use conversational response
  if (conversationalTopic && conversationalResponses[conversationalTopic]) {
    const convResponses = conversationalResponses[conversationalTopic];
    const randomConvReply = convResponses[Math.floor(Math.random() * convResponses.length)];
    return randomConvReply;
  }

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
    'asthma', 'breathing problem', 'wheezing', 'shortness of breath',
    'hypertension', 'high blood pressure',
    'arthritis', 'joint pain', 'rheumatoid', 'osteoarthritis',
    'depression', 'mental health', 'anxiety', 'panic', 'stress',
    'skin rash', 'eczema', 'psoriasis', 'acne', 'hives', 'dermatitis',
    'stomach pain', 'abdominal pain', 'diarrhea', 'constipation', 'ibs', 'gerd',
    'infection', 'fever', 'flu', 'covid', 'uti', 'sinus infection'
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
    'malignant': 'cancer',
    'asthma': 'asthma',
    'breathing': 'asthma',
    'wheezing': 'asthma',
    'arthritis': 'arthritis',
    'joint': 'arthritis',
    'rheumatoid': 'arthritis',
    'depression': 'depression',
    'anxiety': 'depression',
    'mental': 'depression',
    'rash': 'skin',
    'eczema': 'skin',
    'psoriasis': 'skin',
    'acne': 'skin',
    'stomach': 'digestive',
    'abdominal': 'digestive',
    'diarrhea': 'digestive',
    'constipation': 'digestive',
    'ibs': 'digestive',
    'infection': 'infection',
    'fever': 'infection',
    'flu': 'infection',
    'covid': 'infection'
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
  return responses[randomIndex];
};

// ===== MAIN CHATBOT COMPONENT =====
export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        message: `# **Welcome to MediConnect Medical Assistant**\n\nI can help you with:\n\n- **Symptom Analysis** - Fever, headache, cough, pain, etc.\n- **Medical Information** - Disease details and treatment options\n- **Emergency Detection** - Identify when you need immediate care\n- **Health Guidance** - Prevention and self-care advice\n\n---\n\n## Examples to try:\n"I have fever and headache"\n"Tell me about diabetes"\n"Chest pain and shortness of breath"\n\n---\n\n**For emergencies:** chest pain, difficulty breathing, severe bleeding - seek immediate medical care!`,
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // FIXED: Frontend-only chatbot - no API calls needed!
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('🔄 Processing message locally...');
      
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the local medical database and logic
      const response = analyzeMedicalMessage(message);
      return { message: response };
    },
    onSuccess: (data, sentMessage) => {
      console.log('✅ Chatbot response generated:', data);
      
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        message: sentMessage,
        isUser: true,
        timestamp: new Date().toISOString(),
        isEmergency: containsEmergencyKeywords(sentMessage)
      };
      
      // Add bot response
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: data.message,
        isUser: false,
        timestamp: new Date().toISOString(),
        isEmergency: containsEmergencyKeywords(data.message)
      };
      
      setMessages(prev => [...prev, userMessage, botMessage]);
      setInputMessage("");
      setIsTyping(false);
    },
    onError: (error: any) => {
      console.error('❌ Chatbot error:', error);
      setIsTyping(false);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        message: "⚠️ I'm having trouble processing your request. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Issue",
        description: "Please try your message again",
        variant: "destructive",
      });
    },
  });

  // Emergency keyword detection
  const containsEmergencyKeywords = (text: string): boolean => {
    const emergencyWords = [
      'emergency', 'chest pain', 'heart attack', 'stroke', 'bleeding',
      'unconscious', 'can\'t breathe', 'difficulty breathing', 'severe pain',
      'suicide', 'overdose', 'seizure', 'choking', 'burn', 'poison'
    ];
    return emergencyWords.some(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setIsTyping(true);
    sendMessageMutation.mutate(inputMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      message: `# **Welcome to MediConnect Medical Assistant**\n\nI can help you with:\n\n- **Symptom Analysis** - Fever, headache, cough, pain, etc.\n- **Medical Information** - Disease details and treatment options\n- **Emergency Detection** - Identify when you need immediate care\n- **Health Guidance** - Prevention and self-care advice\n\n---\n\n## Examples to try:\n"I have fever and headache"\n"Tell me about diabetes"\n"Chest pain and shortness of breath"\n\n---\n\n**For emergencies:** chest pain, difficulty breathing, severe bleeding - seek immediate medical care!`,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been cleared",
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Quick action suggestions
  const quickActions = [
    { label: "Fever & Headache", message: "I have fever and headache for 2 days" },
    { label: "Cough & Cold", message: "I have cough and runny nose" },
    { label: "Chest Pain", message: "I'm experiencing chest pain" },
    { label: "Diabetes Info", message: "Tell me about diabetes symptoms" },
    { label: "Asthma Help", message: "I have asthma and wheezing" }
  ];

  const showQuickActions = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header 
        title="Medical AI Assistant" 
        subtitle="Intelligent symptom analysis and medical guidance"
        className="bg-white/80 backdrop-blur-sm"
      />
      
      <div className="p-4 md:p-6">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={
              sendMessageMutation.isPending 
                ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
                : "bg-green-50 text-green-700 border-green-200"
            }>
              {sendMessageMutation.isPending ? "AI is thinking..." : "Online"}
            </Badge>
            <Badge className="bg-blue-500 text-white">
              Messages: {messages.filter(m => m.isUser).length}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Local AI
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={messages.length <= 1}
            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </Button>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start Examples:</h3>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputMessage(action.message);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Card className="h-[calc(100vh-220px)] flex flex-col shadow-lg overflow-hidden">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-full ${message.isUser ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <Avatar className={`w-8 h-8 flex-shrink-0 ${
                        message.isUser 
                          ? 'bg-blue-500' 
                          : message.isEmergency 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                      }`}>
                        <AvatarFallback className={`text-white ${
                          message.isUser 
                            ? 'bg-blue-500' 
                            : message.isEmergency 
                              ? 'bg-red-500' 
                              : 'bg-green-500'
                        }`}>
                          {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl p-4 relative max-w-full ${
                          message.isUser
                            ? 'bg-blue-500 text-white'
                            : message.isEmergency
                              ? 'bg-red-50 border-2 border-red-200'
                              : 'bg-green-50 border border-green-200'
                        }`}
                        style={{ 
                          maxWidth: 'min(calc(100vw - 120px), 600px)',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {/* Emergency Alert */}
                        {message.isEmergency && !message.isUser && (
                          <div className="flex items-center gap-2 mb-2 p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="text-sm font-medium text-red-700">Emergency Alert</span>
                          </div>
                        )}
                        
                        <div className={`text-sm whitespace-pre-wrap leading-relaxed break-words ${
                          message.isUser ? 'text-white' : message.isEmergency ? 'text-red-900' : 'text-green-900'
                        }`}>
                          {message.id === "welcome" ? (
                            <div className="space-y-3">
                              <h1 className="text-lg font-bold text-center mb-4">Welcome to MediConnect Medical Assistant</h1>
                              
                              <div>
                                <h3 className="font-semibold mb-2">I can help you with:</h3>
                                <ul className="space-y-2">
                                  <li><strong>Symptom Analysis</strong> - Fever, headache, cough, pain, etc.</li>
                                  <li><strong>Medical Information</strong> - Disease details and treatment options</li>
                                  <li><strong>Emergency Detection</strong> - Identify when you need immediate care</li>
                                  <li><strong>Health Guidance</strong> - Prevention and self-care advice</li>
                                </ul>
                              </div>
                              
                              <div className="border-t pt-3">
                                <h3 className="font-semibold mb-2">Examples to try:</h3>
                                <div className="space-y-1 text-sm italic">
                                  <div>"I have fever and headache"</div>
                                  <div>"Tell me about diabetes"</div>
                                  <div>"Chest pain and shortness of breath"</div>
                                </div>
                              </div>
                              
                              <div className="border-t pt-3">
                                <div className="flex items-center gap-2 text-red-600 font-semibold">
                                  <AlertTriangle className="w-4 h-4" />
                                  For emergencies:
                                </div>
                                <p className="text-sm mt-1">
                                  chest pain, difficulty breathing, severe bleeding - seek immediate medical care!
                                </p>
                              </div>
                            </div>
                          ) : (
                            message.message
                          )}
                        </div>
                        
                        <p className={`text-xs mt-2 ${
                          message.isUser ? 'text-blue-100' : message.isEmergency ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3 max-w-full">
                      <Avatar className="w-8 h-8 bg-green-500 flex-shrink-0">
                        <AvatarFallback className="bg-green-500 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl p-4 bg-green-50 border border-green-200 max-w-full">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-green-700">Analyzing your symptoms...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
                <div className="flex gap-2 mb-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your symptoms or ask a medical question..."
                    disabled={isTyping}
                    className="flex-1 focus:border-blue-400"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-blue-500 hover:bg-blue-600 px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Press Enter to send • Describe symptoms clearly for better assistance
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}