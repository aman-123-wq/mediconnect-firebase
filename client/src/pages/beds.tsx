import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Plus, RefreshCw, Users, AlertTriangle, CheckCircle, Wrench, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Bed {
  id: string;
  bedNumber: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  patientId?: string;
  patientName?: string;
  condition?: string;
  department: string;
  lastUpdated: string;
}

// Calculate stats from beds data instead of separate API call
function calculateBedStats(beds: Bed[]): {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  cleaningBeds: number;
  occupancyRate: number;
} {
  const totalBeds = beds.length;
  const availableBeds = beds.filter(bed => bed.status === 'available').length;
  const occupiedBeds = beds.filter(bed => bed.status === 'occupied').length;
  const maintenanceBeds = beds.filter(bed => bed.status === 'maintenance').length;
  const cleaningBeds = beds.filter(bed => bed.status === 'cleaning').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return {
    totalBeds,
    availableBeds,
    occupiedBeds,
    maintenanceBeds,
    cleaningBeds,
    occupancyRate
  };
}

export default function Beds() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch beds from Firebase
  const { data: beds = [], isLoading: bedsLoading, refetch: refetchBeds } = useQuery<Bed[]>({
    queryKey: ["/api/beds"],
  });

  // Calculate stats from beds data (remove separate stats API call)
  const stats = calculateBedStats(beds);

  // Update bed status mutation - FIXED: Use POST to /api/beds with bed ID in body
  const updateBedMutation = useMutation({
    mutationFn: async ({ bedId, status, patientName, condition }: { 
      bedId: string; 
      status: string; 
      patientName?: string; 
      condition?: string; 
    }) => {
      return apiRequest("PUT", `/api/beds/${bedId}`, {
        status,
        patientName: status === 'available' ? '' : (patientName || 'New Patient'),
        condition: status === 'available' ? '' : (condition || 'Admitted'),
        lastUpdated: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      toast({
        title: "Success",
        description: "Bed status updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bed status",
        variant: "destructive",
      });
    },
  });

  // Get unique departments from beds data
  const departments = ['All', ...Array.from(new Set(beds.map(bed => bed.department)))].filter(Boolean);

  const filteredBeds = selectedDepartment === 'All' 
    ? beds 
    : beds.filter(bed => bed.department === selectedDepartment);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Users className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'cleaning': return <Sparkles className="w-4 h-4" />;
      default: return <Bed className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      case 'cleaning': return 'Cleaning';
      default: return status;
    }
  };

  const handleStatusUpdate = (bedId: string, newStatus: string) => {
    updateBedMutation.mutate({ 
      bedId, 
      status: newStatus
    });
  };

  if (bedsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Bed Management" subtitle="Real-time bed availability and status" />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Bed Management" subtitle="Real-time bed availability and status" />
      
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
              <Bed className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBeds}</div>
              <p className="text-xs text-muted-foreground">
                Across all departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableBeds}</div>
              <p className="text-xs text-muted-foreground">
                Ready for new patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <Users className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.occupiedBeds}</div>
              <p className="text-xs text-muted-foreground">
                {stats.occupancyRate}% occupancy rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.maintenanceBeds + stats.cleaningBeds}
              </div>
              <p className="text-xs text-muted-foreground">
                Maintenance & cleaning
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Department Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {departments.map(dept => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Beds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => (
            <Card key={bed.id} className={`border-l-4 ${
              bed.status === 'available' ? 'border-l-green-500' :
              bed.status === 'occupied' ? 'border-l-red-500' :
              bed.status === 'maintenance' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Bed {bed.bedNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">{bed.department}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`flex items-center gap-1 ${
                      bed.status === 'available' ? 'bg-green-100 text-green-800' :
                      bed.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      bed.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {getStatusIcon(bed.status)}
                    {getStatusText(bed.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {bed.status === 'occupied' && bed.patientName && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Patient: {bed.patientName}</p>
                    {bed.condition && (
                      <p className="text-xs text-muted-foreground">Condition: {bed.condition}</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {bed.status !== 'available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(bed.id, 'available')}
                      disabled={updateBedMutation.isPending}
                    >
                      Mark Available
                    </Button>
                  )}
                  {bed.status !== 'occupied' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(bed.id, 'occupied')}
                      disabled={updateBedMutation.isPending}
                    >
                      Mark Occupied
                    </Button>
                  )}
                  {bed.status !== 'maintenance' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(bed.id, 'maintenance')}
                      disabled={updateBedMutation.isPending}
                    >
                      Maintenance
                    </Button>
                  )}
                  {bed.status !== 'cleaning' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(bed.id, 'cleaning')}
                      disabled={updateBedMutation.isPending}
                    >
                      Cleaning
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Updated: {new Date(bed.lastUpdated).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBeds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No beds found</h3>
              <p className="text-muted-foreground">
                {selectedDepartment === 'All' 
                  ? 'No beds are currently configured in the system.'
                  : `No beds found in the ${selectedDepartment} department.`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => refetchBeds()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Beds
          </Button>
        </div>
      </div>
    </div>
  );
}