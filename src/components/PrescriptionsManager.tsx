import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, Plus, Search, Filter, Calendar, User, Clock, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PatientSelector } from "./PatientSelector";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

interface Prescription {
  id: string;
  patient_id: string;
  clinician_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  quantity: number | null;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  status: string;
  created_at: string;
  patient_name?: string;
}

interface PrescriptionsManagerProps {
  clinicianId: string;
}

export const PrescriptionsManager = ({ clinicianId }: PrescriptionsManagerProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: "",
    drug_name: "",
    dosage: "",
    frequency: "",
    quantity: "",
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: "",
    instructions: "",
  });

  useEffect(() => {
    loadPrescriptions();

    const channel = supabase
      .channel('prescriptions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => loadPrescriptions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicianId]);

  const loadPrescriptions = async () => {
    try {
      const { data: prescriptionsData, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('clinician_id', clinicianId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (prescriptionsData && prescriptionsData.length > 0) {
        const patientIds = [...new Set(prescriptionsData.map(p => p.patient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', patientIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const prescriptionsWithNames = prescriptionsData.map(prescription => ({
          ...prescription,
          patient_name: profileMap.get(prescription.patient_id) || 'Unknown Patient'
        }));

        setPrescriptions(prescriptionsWithNames);
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: "",
      drug_name: "",
      dosage: "",
      frequency: "",
      quantity: "",
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: "",
      instructions: "",
    });
  };

  const handleCreatePrescription = async () => {
    if (!formData.patient_id || !formData.drug_name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          clinician_id: clinicianId,
          patient_id: formData.patient_id,
          drug_name: formData.drug_name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          quantity: formData.quantity ? parseInt(formData.quantity) : null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          instructions: formData.instructions || null,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: "Prescription Created",
        description: "New prescription has been created successfully",
      });

      resetForm();
      setIsAddingPrescription(false);
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrescription = async () => {
    if (!editingPrescription) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          drug_name: formData.drug_name,
          dosage: formData.dosage,
          frequency: formData.frequency,
          quantity: formData.quantity ? parseInt(formData.quantity) : null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          instructions: formData.instructions || null,
        })
        .eq('id', editingPrescription.id);

      if (error) throw error;

      toast({
        title: "Prescription Updated",
        description: "Prescription has been updated successfully",
      });

      setEditingPrescription(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (prescriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus })
        .eq('id', prescriptionId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Prescription marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update prescription status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

      if (error) throw error;

      toast({
        title: "Prescription Deleted",
        description: "Prescription has been deleted",
      });
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    }
  };

  const startEdit = (prescription: Prescription) => {
    setFormData({
      patient_id: prescription.patient_id,
      drug_name: prescription.drug_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      quantity: prescription.quantity?.toString() || "",
      start_date: prescription.start_date,
      end_date: prescription.end_date || "",
      instructions: prescription.instructions || "",
    });
    setEditingPrescription(prescription);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesSearch = !searchQuery || 
      prescription.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.drug_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const activePrescriptions = prescriptions.filter(p => p.status === 'active').length;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading prescriptions..." />;
  }

  const PrescriptionForm = () => (
    <div className="space-y-4 py-4">
      {!editingPrescription && (
        <div className="space-y-2">
          <Label>Patient *</Label>
          <PatientSelector
            doctorId={clinicianId}
            value={formData.patient_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
            required
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Drug Name *</Label>
          <Input
            placeholder="e.g., Metformin"
            value={formData.drug_name}
            onChange={(e) => setFormData(prev => ({ ...prev, drug_name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Dosage *</Label>
          <Input
            placeholder="e.g., 500mg"
            value={formData.dosage}
            onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once_daily">Once Daily</SelectItem>
              <SelectItem value="twice_daily">Twice Daily</SelectItem>
              <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
              <SelectItem value="four_times_daily">Four Times Daily</SelectItem>
              <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
              <SelectItem value="every_8_hours">Every 8 Hours</SelectItem>
              <SelectItem value="every_12_hours">Every 12 Hours</SelectItem>
              <SelectItem value="as_needed">As Needed</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            placeholder="e.g., 30"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Instructions</Label>
        <Textarea
          placeholder="Additional instructions for the patient..."
          value={formData.instructions}
          onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
              </div>
              <Pill className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Active</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activePrescriptions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {prescriptions.filter(p => 
                    new Date(p.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Prescriptions</h2>
          <p className="text-muted-foreground">Manage patient prescriptions</p>
        </div>
        <Dialog open={isAddingPrescription} onOpenChange={setIsAddingPrescription}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Fill in the prescription details for your patient
              </DialogDescription>
            </DialogHeader>
            <PrescriptionForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddingPrescription(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrescription}>Create Prescription</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPrescription} onOpenChange={(open) => { if (!open) { setEditingPrescription(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prescription</DialogTitle>
            <DialogDescription>
              Update the prescription details
            </DialogDescription>
          </DialogHeader>
          <PrescriptionForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPrescription(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrescription}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient or drug name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      {filteredPrescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions found"
          description={prescriptions.length === 0 
            ? "You haven't created any prescriptions yet" 
            : "No prescriptions match your current filters"
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{prescription.patient_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          <span>{prescription.drug_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{prescription.dosage}</TableCell>
                      <TableCell className="capitalize">
                        {prescription.frequency.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(prescription.start_date), 'MMM d, yyyy')}</div>
                          {prescription.end_date && (
                            <div className="text-muted-foreground">
                              to {format(new Date(prescription.end_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(prescription.status || 'active')}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {prescription.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(prescription)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(prescription.id, 'completed')}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(prescription.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 text-orange-500" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(prescription.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
