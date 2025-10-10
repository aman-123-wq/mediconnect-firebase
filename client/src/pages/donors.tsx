import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, MapPin, Phone, Plus } from "lucide-react";
import { apiClient } from "@/lib/api"; // ← ADD THIS IMPORT

// Define the donor type
interface OrganDonor {
  id: string;
  donorId: string;
  bloodType: string;
  organType: string;
  status: 'available' | 'processing' | 'unavailable';
  location?: { address: string };
  lastUpdated?: string;
  createdAt?: string;
}

const statusColors = {
  available: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  unavailable: "bg-red-100 text-red-800",
};

export default function Donors() {
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all");
  const [organTypeFilter, setOrganTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch donors - ← UPDATE THIS QUERY
  const { data: donors = [], isLoading } = useQuery<OrganDonor[]>({
    queryKey: ["donors", { bloodType: bloodTypeFilter, organType: organTypeFilter }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      if ((params as any).bloodType && (params as any).bloodType !== "all") {
        searchParams.set('bloodType', (params as any).bloodType);
      }
      if ((params as any).organType && (params as any).organType !== "all") {
        searchParams.set('organType', (params as any).organType);
      }
      
      const queryString = searchParams.toString();
      const url = queryString ? `/api/donors?${queryString}` : `/api/donors`;
      
      return apiClient.get(url);
    },
  });

  // Add donor mutation - ← UPDATE THIS MUTATION
  const addDonorMutation = useMutation({
    mutationFn: async (newDonor: Omit<OrganDonor, 'id'>) => {
      return apiClient.post("/api/donors", newDonor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setIsAddDialogOpen(false);
      setNewDonor(initialDonorState);
    },
    onError: (error) => {
      console.error('Error adding donor:', error);
      alert('Failed to add donor. Please try again.');
    }
  });

  const initialDonorState = {
    donorId: '',
    bloodType: '',
    organType: '',
    status: 'available' as 'available' | 'processing' | 'unavailable',
    location: { address: '' }
  };

  const [newDonor, setNewDonor] = useState(initialDonorState);

  const handleAddDonor = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDonor.bloodType || !newDonor.organType) {
      alert('Blood Type and Organ Type are required');
      return;
    }

    const donorData = {
      ...newDonor,
      donorId: newDonor.donorId || `DONOR-${Date.now()}`,
    };

    addDonorMutation.mutate(donorData);
  };

  const handleInputChange = (field: string, value: string) => {
    setNewDonor(prev => {
      if (field === 'location.address') {
        return {
          ...prev,
          location: { ...prev.location, address: value }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const availableDonors = donors.filter(d => d.status === 'available');

  return (
    <div className="min-h-screen bg-background">
      <Header title="Organ Donor Registry" subtitle="Find and manage organ donors" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800">
              Available: {availableDonors.length}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              Processing: {donors.filter(d => d.status === 'processing').length}
            </Badge>
          </div>
          
          <div className="flex space-x-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Donor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Donor</DialogTitle>
                  <DialogDescription>
                    Enter the donor information below. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddDonor}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="donorId" className="text-right">
                        Donor ID
                      </Label>
                      <Input
                        id="donorId"
                        value={newDonor.donorId}
                        onChange={(e) => handleInputChange('donorId', e.target.value)}
                        className="col-span-3"
                        placeholder="DONOR-001"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="bloodType" className="text-right">
                        Blood Type
                      </Label>
                      <Select value={newDonor.bloodType} onValueChange={(value) => handleInputChange('bloodType', value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select blood type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="organType" className="text-right">
                        Organ Type
                      </Label>
                      <Select value={newDonor.organType} onValueChange={(value) => handleInputChange('organType', value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select organ type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kidney">Kidney</SelectItem>
                          <SelectItem value="liver">Liver</SelectItem>
                          <SelectItem value="heart">Heart</SelectItem>
                          <SelectItem value="lung">Lung</SelectItem>
                          <SelectItem value="cornea">Cornea</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">
                        Status
                      </Label>
                      <Select value={newDonor.status} onValueChange={(value: 'available' | 'processing' | 'unavailable') => handleInputChange('status', value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={newDonor.location.address}
                        onChange={(e) => handleInputChange('location.address', e.target.value)}
                        className="col-span-3"
                        placeholder="Enter donor address"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addDonorMutation.isPending}
                    >
                      {addDonorMutation.isPending ? "Adding..." : "Add Donor"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={organTypeFilter} onValueChange={setOrganTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Organ Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organs</SelectItem>
                <SelectItem value="kidney">Kidney</SelectItem>
                <SelectItem value="liver">Liver</SelectItem>
                <SelectItem value="heart">Heart</SelectItem>
                <SelectItem value="lung">Lung</SelectItem>
                <SelectItem value="cornea">Cornea</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor) => (
              <Card key={donor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {donor.donorId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {donor.bloodType} • {donor.organType}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[donor.status]}>
                      {donor.status}
                    </Badge>
                  </div>
                  
                  {donor.location && donor.location.address && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{donor.location.address}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mb-4">
                    Last updated: {donor.lastUpdated ? new Date(donor.lastUpdated).toLocaleDateString() : 'N/A'}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant={donor.status === 'available' ? 'default' : 'secondary'}
                      className="flex-1"
                      disabled={donor.status !== 'available'}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {donors.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No donors found</h3>
              <p className="text-muted-foreground">
                {bloodTypeFilter !== "all" || organTypeFilter !== "all" 
                  ? "No organ donors match your current filters. Try adjusting your search criteria."
                  : "No organ donors are currently registered in the system."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}