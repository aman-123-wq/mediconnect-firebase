import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { Bed, Ward } from "@shared/schema";

interface BedWithWard extends Bed {
  ward?: Ward; // Make ward optional
}

const statusColors = {
  available: "border-2 border-green-300 bg-green-100 text-green-800 hover:bg-green-200",
  occupied: "border-2 border-red-300 bg-red-100 text-red-800 hover:bg-red-200",
  maintenance: "border-2 border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  cleaning: "border-2 border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200",
};

export default function BedAvailability() {
  const [selectedBed, setSelectedBed] = useState<BedWithWard | null>(null);
  const queryClient = useQueryClient();

  const { data: beds = [], isLoading } = useQuery<BedWithWard[]>({
    queryKey: ["/api/beds"],
  });

  const updateBedStatusMutation = useMutation({
    mutationFn: async ({ bedId, status, patientId }: { bedId: string; status: string; patientId?: string }) => {
      await apiRequest("PUT", `/api/beds/${bedId}`, { status, patientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Bed status updated successfully" });
      setSelectedBed(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update bed status",
        variant: "destructive" 
      });
    },
  });

  // FIXED: Safe grouping with fallback for missing ward data
  const bedsByWard = beds.reduce((acc, bed) => {
    // Use safe access with fallback to department or default ward name
    const wardName = bed.ward?.name || bed.department || 'General Ward';
    
    if (!acc[wardName]) {
      acc[wardName] = [];
    }
    acc[wardName].push(bed);
    return acc;
  }, {} as Record<string, BedWithWard[]>);

  return (
    <>
      <Card className="lg:col-span-2 border border-border shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-foreground">Real-time Bed Availability</CardTitle>
          <div className="flex space-x-2">
            <Badge className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Available
            </Badge>
            <Badge className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              Occupied
            </Badge>
            <Badge className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              Maintenance
            </Badge>
            <Badge className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
              Cleaning
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-10 h-6 bg-muted rounded-sm"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(bedsByWard).map(([wardName, wardBeds]) => (
                <div key={wardName} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3">{wardName}</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {wardBeds.slice(0, 5).map((bed) => (
                      <div key={bed.id} className="relative">
                        <div
                          className={`
                            w-10 h-6 rounded-sm flex items-center justify-center cursor-pointer transition-colors
                            ${statusColors[bed.status as keyof typeof statusColors]}
                          `}
                          onClick={() => setSelectedBed(bed)}
                          data-testid={`bed-${bed.bedNumber}`}
                        >
                          <span className="text-xs font-medium">
                            {typeof bed.bedNumber === 'number' ? bed.bedNumber : bed.bedNumber?.replace(/^[A-Z]/, '')}
                          </span>
                        </div>
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
                    {wardBeds.filter(b => b.status === 'cleaning').length > 0 && (
                      <>
                        , <span className="text-blue-600 font-medium ml-1">
                          {wardBeds.filter(b => b.status === 'cleaning').length}
                        </span> cleaning
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bed Details Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {/* FIXED: Safe access for ward name */}
                {selectedBed.ward?.name || selectedBed.department || 'General Ward'} - Bed {selectedBed.bedNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Status</label>
                <div className="mt-1">
                  <Badge className={`
                    ${selectedBed.status === 'available' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                    ${selectedBed.status === 'occupied' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                    ${selectedBed.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                    ${selectedBed.status === 'cleaning' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                  `}>
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
    </>
  );
}