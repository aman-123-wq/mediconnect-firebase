import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { Alert } from "@shared/schema";

interface RecentAlertsProps {
  alerts?: Alert[];
  loading?: boolean;
}

export default function RecentAlerts({ alerts, loading }: RecentAlertsProps) {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest("PATCH", `/api/alerts/${alertId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
      toast({ title: "Alert marked as read" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          border: 'border-red-200',
          bg: 'bg-red-50',
          dot: 'bg-red-500',
          title: 'text-red-800',
          description: 'text-red-600',
          time: 'text-red-500'
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          dot: 'bg-yellow-500',
          title: 'text-yellow-800',
          description: 'text-yellow-600',
          time: 'text-yellow-500'
        };
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-blue-50',
          dot: 'bg-blue-500',
          title: 'text-blue-800',
          description: 'text-blue-600',
          time: 'text-blue-500'
        };
    }
  };

  if (loading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 border border-border rounded-lg animate-pulse">
                <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => {
              const colors = getAlertColor(alert.type);
              return (
                <div 
                  key={alert.id} 
                  className={`flex items-start space-x-3 p-3 border ${colors.border} ${colors.bg} rounded-lg`}
                >
                  <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2`}></div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${colors.title}`}>
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className={`text-xs ${colors.description}`}>
                        {alert.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${colors.time}`}>
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {!alert.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => markAsReadMutation.mutate(alert.id)}
                          data-testid={`button-mark-read-${alert.id}`}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
