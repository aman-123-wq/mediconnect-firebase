import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, X, Calendar, Bed, Users, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { ChatMessage } from "@shared/schema";

interface ChatbotResponse {
  message: string;
  action?: string;
  data?: any;
}

export default function ChatbotFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chatbot/messages", sessionId],
    enabled: isOpen,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatbotResponse> => {
      const response = await apiRequest("POST", "/api/chatbot/message", {
        message,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages", sessionId] });
      
      // Handle special actions
      if (response.action) {
        handleChatbotAction(response.action, response.data);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChatbotAction = (action: string, data: any) => {
    switch (action) {
      case 'book_appointment':
        toast({
          title: "Appointment Booking",
          description: "Redirecting to appointment booking...",
        });
        break;
      case 'check_beds':
        toast({
          title: "Bed Availability",
          description: "Checking current bed availability...",
        });
        break;
      case 'emergency':
        toast({
          title: "Emergency Protocol",
          description: "Initiating emergency assistance protocol...",
          variant: "destructive",
        });
        break;
      default:
        break;
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "📅 Book an appointment", action: "I want to book an appointment" },
    { label: "🏥 Check bed availability", action: "Show me available beds" },
    { label: "👨‍⚕️ Find a doctor", action: "I need to find a doctor" },
    { label: "🚨 Emergency assistance", action: "This is an emergency" },
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Send welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendMessageMutation.mutate("Hello");
    }
  }, [isOpen]);

  return (
    <>
      {/* Float Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          data-testid="chatbot-trigger"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 z-50">
          <Card className="border border-border shadow-xl">
            <CardHeader className="p-4 border-b border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">MediCare Assistant</h3>
                    <p className="text-xs text-green-600">Online</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                  data-testid="chatbot-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.length === 0 && !sendMessageMutation.isPending && (
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-secondary-foreground">
                        Hello! I'm your MediCare assistant. I can help you with:
                      </p>
                      <div className="mt-2 space-y-1">
                        {quickActions.map((action, index) => (
                          <button 
                            key={index}
                            onClick={() => sendMessageMutation.mutate(action.action)}
                            className="block w-full text-left text-xs text-primary hover:underline"
                            data-testid={`quick-action-${index}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className={message.isUser ? "bg-muted" : "bg-primary text-primary-foreground"}>
                        {message.isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg p-3 max-w-xs ${
                      message.isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                ))}
                
                {sendMessageMutation.isPending && (
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 text-sm"
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="h-9 w-9"
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
