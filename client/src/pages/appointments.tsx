import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Phone } from "lucide-react";
import AppointmentBookingModal from "@/components/modals/appointment-booking-modal";

// REPLACE the old PostgreSQL types with Firebase-compatible types
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  // add other patient fields you need
}

interface Doctor {
  id: string;
  userId: string;
  department: string;
  // add other doctor fields you need
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: 'scheduled' | 'confirmed' | 'waiting' | 'completed' | 'cancelled';
  reason?: string;
  // add other appointment fields you need
}

interface AppointmentWithDetails extends Appointment {
  patient?: Patient;  // Made optional with ?
  doctor?: Doctor;    // Made optional with ?
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  waiting: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Appointments() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
  });

  const todayAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate.toDateString() === today.toDateString();
  });

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate > today;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Appointments" subtitle="Manage patient appointments and schedules" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              Today: {todayAppointments.length}
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              Upcoming: {upcomingAppointments.length}
            </Badge>
          </div>
          
          <Button 
            onClick={() => setIsBookingModalOpen(true)}
            data-testid="button-new-appointment"
          >
            New Appointment
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today's Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No appointments scheduled for today
                  </p>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                        data-testid={`appointment-${appointment.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {appointment.patient?.firstName || 'Unknown'} {appointment.patient?.lastName || 'Patient'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Dr. {appointment.doctor?.userId || 'Unknown'} - {appointment.doctor?.department || 'No Department'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                              {appointment.patient?.phoneNumber && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{appointment.patient.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                      data-testid={`appointment-all-${appointment.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.patient?.firstName || 'Unknown'} {appointment.patient?.lastName || 'Patient'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dr. {appointment.doctor?.userId || 'Unknown'} - {appointment.doctor?.department || 'No Department'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          </div>
                          {appointment.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {appointment.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AppointmentBookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
}