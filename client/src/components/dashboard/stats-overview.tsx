import { Card, CardContent } from "@/components/ui/card";
import { Bed, Calendar, Heart, Ambulance } from "lucide-react";

interface StatsOverviewProps {
  stats?: {
    availableBeds: number;
    todayAppointments: number;
    activeDonors: number;
    emergencyCases: number;
  };
  loading?: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Available Beds",
      value: stats?.availableBeds || 0,
      icon: Bed,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "↗ 12% from yesterday",
      trendColor: "text-green-600",
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "↗ 8% from yesterday",
      trendColor: "text-blue-600",
    },
    {
      title: "Active Donors",
      value: stats?.activeDonors || 0,
      icon: Heart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "↗ 3 new this week",
      trendColor: "text-purple-600",
    },
    {
      title: "Emergency Cases",
      value: stats?.emergencyCases || 0,
      icon: Ambulance,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trend: "↗ 2 in last hour",
      trendColor: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className={`text-3xl font-bold ${stat.color}`} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.color} text-xl w-6 h-6`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className={stat.trendColor}>{stat.trend}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
