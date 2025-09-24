import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Calendar, Bed, Users, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { ChatMessage } from "@shared/schema";

interface ChatbotResponse {
  message: string;
  action?: string;
  data?: any;
}

export default function ChatbotPage() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chatbot/messages", sessionId],
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
    { label: "Book Appointment", icon: Calendar, action: "I want to book an appointment" },
    { label: "Check Beds", icon: Bed, action: "Show me available beds" },
    { label: "Find Doctor", icon: Users, action: "I need to find a doctor" },
    { label: "Emergency", icon: AlertTriangle, action: "This is an emergency" },
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      sendMessageMutation.mutate("Hello");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header title="AI Assistant" subtitle="Get help with hospital services 24/7" />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <span>MediCare Assistant</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}>
                      {!message.isUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`rounded-lg p-3 ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                        </div>
                      </div>
                      
                      {message.isUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
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
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Quick Actions */}
              {messages.length <= 2 && (
                <div className="px-6 py-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => sendMessageMutation.mutate(action.action)}
                        data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
                      >
                        <action.icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Input Area */}
              <div className="p-6 border-t border-border">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
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
