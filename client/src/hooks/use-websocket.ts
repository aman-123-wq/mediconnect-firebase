import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Disable WebSocket in production (Surge doesn't support it)
    if (process.env.NODE_ENV === 'production') {
      console.log("WebSocket disabled in production");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      }
    };

    const handleWebSocketMessage = (data: { type: string; data: any }) => {
      switch (data.type) {
        case 'bedStatusUpdate':
          // Invalidate bed-related queries
          queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          
          toast({
            title: "Bed Status Updated",
            description: `Bed ${data.data?.bedNumber || ''} status changed`,
          });
          break;

        case 'newAppointment':
          // Invalidate appointment-related queries
          queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          
          toast({
            title: "New Appointment",
            description: "A new appointment has been scheduled",
          });
          break;

        case 'newDonor':
          // Invalidate donor-related queries
          queryClient.invalidateQueries({ queryKey: ["/api/organ-donors"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          
          toast({
            title: "New Donor Registered",
            description: "A new organ donor has been registered",
          });
          break;

        case 'newAlert':
          // Invalidate alert queries
          queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
          
          toast({
            title: "New Alert",
            description: data.data?.title || "A new alert has been created",
            variant: data.data?.type === 'critical' ? 'destructive' : 'default',
          });
          break;

        case 'emergencyAlert':
          // Handle emergency alerts with high priority
          toast({
            title: "🚨 EMERGENCY ALERT",
            description: data.data?.message || "Emergency situation detected",
            variant: "destructive",
          });
          
          // Invalidate all relevant queries
          queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
          queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          break;

        case 'systemUpdate':
          // Handle general system updates
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
          break;

        default:
          console.log("Unknown WebSocket message type:", data.type);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  // Return WebSocket instance for manual message sending if needed
  return wsRef.current;
}