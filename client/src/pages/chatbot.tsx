import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart medical responses for common symptoms
  const getSmartResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Fever detection and follow-up
    if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      if (lowerMessage.includes('38') || lowerMessage.includes('39') || lowerMessage.includes('40') || 
          lowerMessage.includes('100') || lowerMessage.includes('101') || lowerMessage.includes('102')) {
        
        const temp = lowerMessage.match(/(\d+\.?\d*)/)?.[0] || 'unknown';
        if (parseFloat(temp) >= 39.0) {
          return `🚨 HIGH FEVER ALERT (${temp}°C)\n\n• This requires immediate medical attention\n• Go to emergency department\n• Take fever reducer if available\n• Stay hydrated\n• Monitor for confusion or severe headache`;
        } else if (parseFloat(temp) >= 38.0) {
          return `🤒 MODERATE FEVER (${temp}°C)\n\n• Rest and hydrate well\n• Take acetaminophen as directed\n• Monitor every 4 hours\n• See doctor if persists >3 days\n\nHow long have you had fever?`;
        } else {
          return `🌡️ LOW FEVER (${temp}°C)\n\n• Usually not serious\n• Rest and hydration\n• Should improve in 1-2 days\n\nAny other symptoms?`;
        }
      }
      return "🤒 I understand you have fever. What is your temperature?";
    }

    // Headache responses
    if (lowerMessage.includes('headache')) {
      if (lowerMessage.includes('severe') || lowerMessage.includes('worst') || lowerMessage.includes('thunderclap')) {
        return "🚨 SEVERE HEADACHE - Could indicate emergency. Go to ER immediately if:\n• Sudden severe pain\n• With fever/stiff neck\n• With confusion/vision changes";
      }
      return "🤕 HEADACHE ASSESSMENT:\n• Rest in quiet room\n• Hydrate well\n• Over-the-counter pain relief\n• See doctor if:\n  - Persists >2 days\n  - Worsens\n  - With other symptoms";
    }

    // Cough responses
    if (lowerMessage.includes('cough')) {
      if (lowerMessage.includes('blood') || lowerMessage.includes('bleeding')) {
        return "🚨 COUGHING BLOOD - Emergency! Go to hospital immediately!";
      }
      if (lowerMessage.includes('breath') || lowerMessage.includes('breathing')) {
        return "🫁 BREATHING DIFFICULTY:\n• Sit upright\n• Stay calm\n• Seek emergency care if:\n  - Lips turn blue\n  - Can't speak\n  - Severe distress";
      }
      return "🫁 COUGH MANAGEMENT:\n• Stay hydrated\n• Honey/lozenges\n• Humidifier\n• See doctor if:\n  - Lasts >3 weeks\n  - With fever\n  - With chest pain";
    }

    // Cold/Flu symptoms
    if (lowerMessage.includes('cold') || lowerMessage.includes('flu') || 
        lowerMessage.includes('runny nose') || lowerMessage.includes('sore throat')) {
      return "🤧 COLD/FLU SYMPTOMS:\n• Rest and hydration key\n• Over-the-counter symptom relief\n• Usually improves in 7-10 days\n• Seek care if:\n  - High fever\n  - Breathing trouble\n  - Symptoms worsen";
    }

    // Pain responses
    if (lowerMessage.includes('pain')) {
      if (lowerMessage.includes('chest')) {
        return "🚨 CHEST PAIN - Could be heart-related! Emergency evaluation needed!";
      }
      if (lowerMessage.includes('abdominal') || lowerMessage.includes('stomach')) {
        return "🩺 ABDOMINAL PAIN:\n• Rest\n• Clear fluids only\n• Seek care if:\n  - Severe pain\n  - Fever\n  - Vomiting blood\n  - No improvement";
      }
      return "💊 PAIN MANAGEMENT:\n• Rest affected area\n• Over-the-counter pain relief\n• See doctor if:\n  - Severe pain\n  - Persists > few days\n  - With other symptoms";
    }

    // Duration responses
    if (lowerMessage.includes('day') || lowerMessage.includes('week') || lowerMessage.includes('month')) {
      return "⏰ SYMPTOM DURATION:\n• Monitor for changes\n• Keep hydrated\n• Rest as needed\n• Seek medical care if symptoms worsen or don't improve";
    }

    // Default medical response
    return "🩺 MEDICAL ASSISTANT:\n• Please describe your symptoms clearly\n• Include duration and severity\n• Mention any other symptoms\n• For emergencies, seek immediate care";
  };

  // Simple send message function
  // Use the actual API endpoint
// Use the actual API endpoint
const sendMessageMutation = useMutation({
  mutationFn: async (message: string) => {
    const response = await apiClient.post("/api/chatbot/message", {
      message,
      sessionId,
    });
    return response;
  },
  onSuccess: (response, sentMessage) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: sentMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Add bot response
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      message: response.message,
      isUser: false,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputMessage("");
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Success",
      description: "Chat history cleared!",
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        message: "🩺 **MEDICAL ASSISTANT READY**\n\nI can help with:\n• Symptom analysis\n• First aid guidance\n• Medical information\n• Emergency recognition\n\n**Describe your symptoms clearly for best assistance**\n\n*Note: For emergencies, call emergency services immediately.*",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Medical AI Assistant" subtitle="Get immediate symptom analysis and guidance" />
      
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Badge className="bg-green-600 text-white">
            Smart Medical Responses
          </Badge>
          <Badge className="bg-blue-500 text-white">
            Messages: {messages.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="h-[calc(100vh-200px)] flex flex-col border-2 border-green-500">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
                      {!message.isUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-green-600 text-white">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`rounded-lg p-3 ${
                          message.isUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-100 border border-green-300'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {message.isUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-500 text-white">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-green-600 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-3 bg-green-100 border border-green-300">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-6 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your symptoms (fever, headache, pain, etc.)..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 border-green-300 focus:border-green-500"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}