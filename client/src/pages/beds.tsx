import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Bed, Ward } from "@shared/schema";

interface BedWithWard extends Bed {
  ward: Ward;
}

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  occupied: "bg-red-100 text-red-800 border-red-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cleaning: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function Beds() {
  const [selectedBed, setSelectedBed] = useState<BedWithWard | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: beds = [], isLoading } = useQuery<BedWithWard[]>({
    queryKey: ["/api/beds"],
  });

  const { data: wards = [] } = useQuery<Ward[]>({
    queryKey: ["/api/wards"],
  });

  const updateBedStatusMutation = useMutation({
    mutationFn: async ({ bedId, status, patientId }: { bedId: string; status: string; patientId?: string }) => {
      await apiRequest("PATCH", `/api/beds/${bedId}/status`, { status, patientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Bed status updated successfully" });
      setSelectedBed(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredBeds = beds.filter(bed => 
    statusFilter === "all" || bed.status === statusFilter
  );

  const bedsByWard = filteredBeds.reduce((acc, bed) => {
    const wardName = bed.ward.name;
    if (!acc[wardName]) {
      acc[wardName] = [];
    }
    acc[wardName].push(bed);
    return acc;
  }, {} as Record<string, BedWithWard[]>);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Bed Management" subtitle="Real-time bed availability and status" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800">
              Available: {beds.filter(b => b.status === 'available').length}
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              Occupied: {beds.filter(b => b.status === 'occupied').length}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              Maintenance: {beds.filter(b => b.status === 'maintenance').length}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              Cleaning: {beds.filter(b => b.status === 'cleaning').length}
            </Badge>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Beds</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(bedsByWard).map(([wardName, wardBeds]) => (
              <Card key={wardName}>
                <CardHeader>
                  <CardTitle>{wardName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {wardBeds.map((bed) => (
                      <div
                        key={bed.id}
                        className={`
                          w-12 h-8 border-2 rounded-sm flex items-center justify-center 
                          cursor-pointer hover:opacity-80 transition-all
                          ${statusColors[bed.status as keyof typeof statusColors]}
                        `}
                        onClick={() => setSelectedBed(bed)}
                        data-testid={`bed-${bed.bedNumber}`}
                      >
                        <span className="text-xs font-medium">
                          {bed.bedNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="text-green-600 font-medium">
                      {wardBeds.filter(b => b.status === 'available').length}
                    </span> available, 
                    <span className="text-red-600 font-medium ml-1">
                      {wardBeds.filter(b => b.status === 'occupied').length}
                    </span> occupied
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bed Details Modal */}
        {selectedBed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>
                  {selectedBed.ward.name} - Bed {selectedBed.bedNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Status</label>
                  <div className="mt-1">
                    <Badge className={statusColors[selectedBed.status as keyof typeof statusColors]}>
                      {selectedBed.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Update Status</label>
                  <Select 
                    onValueChange={(status) => {
                      updateBedStatusMutation.mutate({ 
                        bedId: selectedBed.id, 
                        status 
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1" data-testid="update-bed-status">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedBed.notes && (
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedBed.notes}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedBed(null)}
                    className="flex-1"
                    data-testid="button-close-bed-modal"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
