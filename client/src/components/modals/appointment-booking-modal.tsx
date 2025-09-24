import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { insertAppointmentSchema } from "@shared/schema";
import type { Doctor, Patient } from "@shared/schema";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const bookingFormSchema = insertAppointmentSchema.extend({
  patientName: z.string().min(1, "Patient name is required"),
  department: z.string().min(1, "Department is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function AppointmentBookingModal({ isOpen, onClose }: AppointmentBookingModalProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      patientName: "",
      department: "",
      doctorId: "",
      date: "",
      time: "",
      reason: "",
    },
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
    enabled: isOpen,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: isOpen,
  });

  const selectedDepartment = form.watch("department");
  const filteredDoctors = doctors.filter(doctor => 
    !selectedDepartment || doctor.department === selectedDepartment
  );

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Find or create patient
      let patient = patients.find(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase() === data.patientName.toLowerCase()
      );
      
      if (!patient) {
        const [firstName, ...lastNameParts] = data.patientName.split(" ");
        const lastName = lastNameParts.join(" ") || firstName;
        
        const patientResponse = await apiRequest("POST", "/api/patients", {
          firstName,
          lastName,
        });
        patient = await patientResponse.json();
      }

      // Create appointment
      const appointmentDate = new Date(`${data.date}T${data.time}`);
      
      const response = await apiRequest("POST", "/api/appointments", {
        patientId: patient.id,
        doctorId: data.doctorId,
        appointmentDate: appointmentDate.toISOString(),
        reason: data.reason,
        status: "scheduled",
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Appointment booked successfully" });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const departments = Array.from(new Set(doctors.map(d => d.department)));

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Book New Appointment</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-booking-modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter patient name" {...field} data-testid="input-patient-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Doctor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-doctor">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.userId || 'Unknown'} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          min={new Date().toISOString().split('T')[0]}
                          data-testid="input-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Visit</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of symptoms or reason for visit"
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                        data-testid="textarea-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-booking"
                >
                  {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
