import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MapPin, Phone } from "lucide-react";
import type { OrganDonor } from "@shared/schema";

const statusColors = {
  available: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  unavailable: "bg-red-100 text-red-800",
};

export default function Donors() {
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all");
  const [organTypeFilter, setOrganTypeFilter] = useState<string>("all");

  const { data: donors = [], isLoading } = useQuery<OrganDonor[]>({
    queryKey: ["/api/organ-donors", { bloodType: bloodTypeFilter === "all" ? undefined : bloodTypeFilter, organType: organTypeFilter === "all" ? undefined : organTypeFilter }],
    queryFn: ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      if ((params as any).bloodType) searchParams.set('bloodType', (params as any).bloodType);
      if ((params as any).organType) searchParams.set('organType', (params as any).organType);
      return fetch(`${url}?${searchParams}`).then(res => res.json());
    },
  });

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
            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="w-32" data-testid="filter-blood-type">
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
              <SelectTrigger className="w-32" data-testid="filter-organ-type">
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
                        <p className="font-medium text-foreground" data-testid={`donor-id-${donor.donorId}`}>
                          {donor.donorId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {donor.bloodType} • {donor.organType}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[donor.status as keyof typeof statusColors]}>
                      {donor.status}
                    </Badge>
                  </div>
                  
                  {donor.location && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {donor.location && typeof donor.location === 'object' && 'address' in donor.location ? 
                          (donor.location as any).address : 'Location available'}
                      </span>
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
                      data-testid={`button-contact-${donor.donorId}`}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-details-${donor.donorId}`}>
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
                No organ donors match your current filters. Try adjusting your search criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
