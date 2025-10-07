import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, Send, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
}

interface ChatbotResponse {
  message: string;
}

export default function ChatbotPage() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages from Firebase
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chatbot/messages", sessionId],
  });

  // Store message in Firebase mutation
  const storeMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string; isUser: boolean; timestamp: string }) => {
      return apiRequest("POST", "/api/chatbot/store-message", {
        sessionId,
        ...messageData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages", sessionId] });
    }
  });

  // Clear chat history mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/chatbot/messages/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbot/messages", sessionId] });
      toast({
        title: "Success",
        description: "Chat history cleared!",
      });
    }
  });

  // Send message to chatbot mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatbotResponse> => {
      const response = await apiRequest("POST", "/api/chatbot/message", {
        message,
        sessionId,
      });
      return response.json();
    },
    onSuccess: async (response, sentMessage) => {
      // Store user message in Firebase
      await storeMessageMutation.mutateAsync({
        message: sentMessage,
        isUser: true,
        timestamp: new Date().toISOString()
      });

      // Store bot response in Firebase
      await storeMessageMutation.mutateAsync({
        message: response.message,
        isUser: false,
        timestamp: new Date().toISOString()
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send welcome message when first loading
  useEffect(() => {
    if (messages.length === 0 && !messagesLoading) {
      const welcomeMessage = "Hello! I am MediCare Medical Assistant. I can help you with:\n• Disease symptoms analysis\n• Medical condition information\n• Health advice and guidance\n• Medication questions\nPlease describe your symptoms or health concerns.";
      
      // Store welcome message in Firebase
      storeMessageMutation.mutate({
        message: welcomeMessage,
        isUser: false,
        timestamp: new Date().toISOString()
      });
    }
  }, [messages.length, messagesLoading]);

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

  const clearChat = () => {
    clearChatMutation.mutate();
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Medical AI Assistant" subtitle="Get medical advice and symptom analysis" />
      
      <div className="p-6">
        {/* SUCCESS BANNER */}
        <div style={{ 
          background: 'green', 
          color: 'white', 
          padding: '10px', 
          marginBottom: '20px',
          fontSize: '18px',
          fontWeight: 'bold',
          borderRadius: '8px'
        }}>
          ✅ MEDICAL AI ASSISTANT WORKING: {messages.length} MESSAGES
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Badge className="bg-blue-500 text-white">
            Medical Consultations: {messages.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={clearChatMutation.isPending || messages.length === 0}
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
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-20">
                    <div className="text-muted-foreground">No messages yet. Start a conversation!</div>
                  </div>
                ) : (
                  messages.map((message) => (
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
                              : 'bg-green-100 border border-green-300'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
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
                  ))
                )}
                
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
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
                    placeholder="Describe your symptoms or medical concern..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 border-green-300 focus:border-green-500"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    className="bg-green-500 hover:bg-green-600"
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