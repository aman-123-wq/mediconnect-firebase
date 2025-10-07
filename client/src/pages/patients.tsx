import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  condition?: string;
  bloodType?: string;
}

export default function Patients() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    condition: "Stable",
    bloodType: "O+"
  });

  const { data: patients = [], isLoading, refetch } = useQuery<Patient[]>({
    queryKey: ["patients-data"],
    queryFn: () => 
      fetch('http://localhost:3000/patients')
        .then(r => r.json())
        .then(data => data)
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ADD PATIENT
  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone
        })
      });
      
      const result = await response.json();
      console.log('✅ Patient created:', result);
      
      resetForm();
      refetch();
      
    } catch (error) {
      console.error('❌ Error creating patient:', error);
    }
  };

  // EDIT PATIENT
  const editPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          condition: formData.condition,
          bloodType: formData.bloodType
        })
      });
      
      const result = await response.json();
      console.log('✅ Patient updated:', result);
      
      resetForm();
      refetch();
      
    } catch (error) {
      console.error('❌ Error updating patient:', error);
    }
  };

  // DELETE PATIENT
  const deletePatient = async (patientId: string) => {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/patients/${patientId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      console.log('✅ Patient deleted:', result);
      
      refetch();
      
    } catch (error) {
      console.error('❌ Error deleting patient:', error);
    }
  };

  // START EDITING
  const startEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phoneNumber,
      condition: patient.condition || "Stable",
      bloodType: patient.bloodType || "O+"
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      condition: "Stable",
      bloodType: "O+"
    });
    setEditingPatient(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Patients" subtitle="Manage patient records and information" />
      
      <div className="p-6">
        {/* ADD PATIENT BUTTON */}
        <div className="mb-4">
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {showForm ? "Cancel" : "+ Add New Patient"}
          </Button>
        </div>

        {/* PATIENT FORM */}
        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingPatient ? "Edit Patient" : "Add New Patient"}
            </h3>
            <form onSubmit={editingPatient ? editPatient : addPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Improving">Improving</option>
                    <option value="Observation">Under Observation</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                  {editingPatient ? "Update Patient" : "Create Patient"}
                </Button>
                {editingPatient && (
                  <Button type="button" onClick={resetForm} className="bg-gray-500 hover:bg-gray-600">
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </Card>
        )}

        {/* PATIENT COUNT */}
        <div className="mb-4">
          <Badge className="bg-blue-500 text-white">
            Total Patients: {patients.length}
          </Badge>
        </div>

        {/* PATIENTS LIST */}
        {isLoading ? (
          <div>Loading patients...</div>
        ) : patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h3>
                    <Badge className={
                      patient.condition === "Critical" ? "bg-red-500" :
                      patient.condition === "Improving" ? "bg-yellow-500" :
                      patient.condition === "Observation" ? "bg-blue-500" : "bg-green-500"
                    }>
                      {patient.condition}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p>📧 {patient.email}</p>
                    <p>📞 {patient.phoneNumber}</p>
                    <p>🩸 Blood Type: {patient.bloodType || "Not specified"}</p>
                    <p className="text-sm text-gray-500">ID: {patient.id}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => startEdit(patient)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => deletePatient(patient.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-red-500 font-bold">NO PATIENTS FOUND</h3>
              <p>Click "Add New Patient" to create your first patient record.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}