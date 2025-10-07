import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsOverview from "@/components/dashboard/stats-overview";
import BedAvailability from "@/components/dashboard/bed-availability";
import RecentAlerts from "@/components/dashboard/recent-alerts";
import TodaysAppointments from "@/components/dashboard/todays-appointments";
import DonorRegistry from "@/components/dashboard/donor-registry";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts/unread"],
  });

  // Connect to WebSocket for real-time updates
  useWebSocket();

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Hospital Dashboard" 
        subtitle={`Today, ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`}
        unreadAlerts={(alerts as any)?.length || 0}
      />
      
      <div className="p-6 space-y-6">
        <StatsOverview stats={stats as any} loading={statsLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BedAvailability />
          </div>
          <div className="space-y-6">
            <RecentAlerts alerts={alerts as any} loading={alertsLoading} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysAppointments />
          <DonorRegistry />
        </div>
      </div>
    </div>
  );
}