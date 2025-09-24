import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ChatbotResponse {
  message: string;
  action?: string;
  data?: any;
}

export async function processMessage(userMessage: string, context?: any): Promise<ChatbotResponse> {
  try {
    const systemPrompt = `You are MediCare Assistant, a helpful AI chatbot for a smart hospital management system. 
    You can help with:
    - Booking appointments
    - Checking bed availability
    - Finding doctors
    - Emergency assistance
    - General hospital information
    - Medical queries (non-diagnostic)
    
    Always be professional, empathetic, and helpful. If asked to perform actions like booking appointments, 
    respond with structured JSON that includes the action type and required data.
    
    Current hospital context: ${JSON.stringify(context || {})}
    
    Respond with JSON in this format:
    {
      "message": "your response message",
      "action": "optional action type (book_appointment, check_beds, find_doctor, emergency)",
      "data": "optional structured data for the action"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      message: result.message || "I'm here to help you with hospital services.",
      action: result.action,
      data: result.data,
    };
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return {
      message: "I apologize, but I'm experiencing technical difficulties. Please try again or contact hospital staff for immediate assistance.",
    };
  }
}

export async function analyzeSymptoms(symptoms: string): Promise<{
  urgency: "low" | "medium" | "high" | "emergency";
  recommendations: string[];
  suggestedDepartment?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a medical triage assistant. Analyze the described symptoms and provide:
          1. Urgency level (low, medium, high, emergency)
          2. General recommendations (not medical advice)
          3. Suggested hospital department if appropriate
          
          IMPORTANT: Always recommend consulting with a qualified medical professional. Never provide medical diagnosis.
          
          Respond with JSON in this format:
          {
            "urgency": "low|medium|high|emergency",
            "recommendations": ["recommendation1", "recommendation2"],
            "suggestedDepartment": "optional department name"
          }`,
        },
        {
          role: "user",
          content: `Patient describes these symptoms: ${symptoms}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      urgency: result.urgency || "medium",
      recommendations: result.recommendations || ["Please consult with a healthcare professional"],
      suggestedDepartment: result.suggestedDepartment,
    };
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return {
      urgency: "medium",
      recommendations: ["Please consult with a healthcare professional for proper evaluation"],
    };
  }
}
