import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";
import type { OrganDonor } from "@shared/schema";
import { apiClient } from "@/lib/api";

export default function DonorRegistry() {
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("all");
  const [organTypeFilter, setOrganTypeFilter] = useState<string>("all");

  const { data: donors = [], isLoading } = useQuery<OrganDonor[]>({
    queryKey: ["donors", { bloodType: bloodTypeFilter === "all" ? undefined : bloodTypeFilter, organType: organTypeFilter === "all" ? undefined : organTypeFilter }],
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

  const statusColors = {
    available: "bg-green-100 text-green-800",
    processing: "bg-yellow-100 text-yellow-800",
    unavailable: "bg-red-100 text-red-800",
  };

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-foreground">Nearby Organ Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
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
        <CardTitle className="text-lg font-semibold text-foreground">Nearby Organ Donors</CardTitle>
        <Link href="/donors">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-sm font-medium">
            Search
          </Button>
        </Link>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex space-x-2">
            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="flex-1" data-testid="filter-blood-type">
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Blood Type</SelectItem>
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
              <SelectTrigger className="flex-1" data-testid="filter-organ-type">
                <SelectValue placeholder="Organ Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Organ Type</SelectItem>
                <SelectItem value="kidney">Kidney</SelectItem>
                <SelectItem value="liver">Liver</SelectItem>
                <SelectItem value="heart">Heart</SelectItem>
                <SelectItem value="lung">Lung</SelectItem>
                <SelectItem value="cornea">Cornea</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {donors.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No donors found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {donors.slice(0, 3).map((donor) => (
              <div 
                key={donor.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                data-testid={`donor-${donor.donorId}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {donor.donorId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {donor.bloodType} • {donor.organType} • 
                      {donor.location && (donor.location as any).distance ? 
                        ` ${(donor.location as any).distance}` : 
                        ' Location available'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[donor.status as keyof typeof statusColors]}>
                    {donor.status}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary hover:text-primary/80 text-sm font-medium p-1"
                    disabled={donor.status !== 'available'}
                    data-testid={`button-contact-${donor.donorId}`}
                  >
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}