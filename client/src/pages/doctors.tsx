import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, UserX, Phone } from "lucide-react";
import type { Doctor } from "@shared/schema";

export default function Doctors() {
  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const availableDoctors = doctors.filter(d => d.available);
  const unavailableDoctors = doctors.filter(d => !d.available);

  const doctorsByDepartment = doctors.reduce((acc, doctor) => {
    if (!acc[doctor.department]) {
      acc[doctor.department] = [];
    }
    acc[doctor.department].push(doctor);
    return acc;
  }, {} as Record<string, Doctor[]>);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Doctors" subtitle="Manage doctor profiles and availability" />
      
      <div className="p-6">
        <div className="flex space-x-2 mb-6">
          <Badge className="bg-green-100 text-green-800">
            <UserCheck className="w-3 h-3 mr-1" />
            Available: {availableDoctors.length}
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            <UserX className="w-3 h-3 mr-1" />
            Unavailable: {unavailableDoctors.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-center space-x-3 p-4 border border-border rounded-lg">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(doctorsByDepartment).map(([department, departmentDoctors]) => (
              <Card key={department}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {department}
                    <Badge variant="outline">
                      {departmentDoctors.length} doctor{departmentDoctors.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departmentDoctors.map((doctor) => (
                      <div 
                        key={doctor.id}
                        className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                        data-testid={`doctor-${doctor.id}`}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {doctor.userId ? doctor.userId.slice(0, 2).toUpperCase() : 'DR'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                Dr. {doctor.userId || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {doctor.specialization}
                              </p>
                              {doctor.phoneNumber && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{doctor.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge 
                                className={doctor.available 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                                }
                              >
                                {doctor.available ? 'Available' : 'Unavailable'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Lic: {doctor.licenseNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {doctors.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No doctors found</h3>
              <p className="text-muted-foreground">
                No doctors are currently registered in the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
