import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Phone, Mail, Calendar } from "lucide-react";
import type { Patient } from "@shared/schema";

export default function Patients() {
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const bloodTypeGroups = patients.reduce((acc, patient) => {
    const bloodType = patient.bloodType || 'Unknown';
    if (!acc[bloodType]) {
      acc[bloodType] = [];
    }
    acc[bloodType].push(patient);
    return acc;
  }, {} as Record<string, Patient[]>);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Patients" subtitle="Manage patient records and information" />
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className="bg-blue-100 text-blue-800">
            Total Patients: {patients.length}
          </Badge>
          {Object.entries(bloodTypeGroups).map(([bloodType, groupPatients]) => (
            <Badge key={bloodType} variant="outline">
              {bloodType}: {groupPatients.length}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground" data-testid={`patient-${patient.id}`}>
                          {patient.firstName} {patient.lastName}
                        </h3>
                        {patient.bloodType && (
                          <Badge variant="outline" className="text-xs">
                            {patient.bloodType}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {patient.email && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        
                        {patient.phoneNumber && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phoneNumber}</span>
                          </div>
                        )}
                        
                        {patient.dateOfBirth && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(patient.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {patient.emergencyContactName && (
                          <div className="text-xs text-muted-foreground">
                            Emergency: {patient.emergencyContactName}
                            {patient.emergencyContactPhone && ` (${patient.emergencyContactPhone})`}
                          </div>
                        )}
                      </div>
                      
                      {patient.address && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
                          {patient.address}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-3">
                        Registered: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {patients.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No patients found</h3>
              <p className="text-muted-foreground">
                No patients are currently registered in the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
