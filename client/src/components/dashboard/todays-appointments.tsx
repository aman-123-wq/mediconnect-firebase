import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock } from "lucide-react";
import { Link } from "wouter";
import { apiClient } from "@/lib/api"; // ← ADD apiClient IMPORT

interface Appointment {
  id: string;
  appointmentDate: string;
  status: 'scheduled' | 'confirmed' | 'waiting' | 'completed' | 'cancelled';
  patientId: string;
  doctorId: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  doctor: {
    userId: string;
    department: string;
    specialization: string;
  };
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  waiting: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function TodaysAppointments() {
  // FIXED: Use apiClient and correct query key
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["appointments"], // ← CHANGE FROM ["/api/appointments"]
    queryFn: () => apiClient.get("/api/appointments") // ← USE apiClient
  });

  // Filter today's appointments
  const todayAppointments = appointments.filter(appointment => {
    const today = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);
    return appointmentDate.toDateString() === today.toDateString();
  }).slice(0, 3); // Show only first 3

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-foreground">Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold text-foreground">Today's Appointments</CardTitle>
        <Link href="/appointments">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-sm font-medium">
            View All
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent>
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                data-testid={`appointment-${appointment.id}`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {appointment.doctor.userId || 'Unknown'} - {appointment.doctor.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.doctor.specialization}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm font-medium text-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <Badge className={statusColors[appointment.status]}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}