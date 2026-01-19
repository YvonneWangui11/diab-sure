import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, User } from "lucide-react";
import { PatientSelector } from "./PatientSelector";

interface Appointment {
  id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  patient_name?: string;
}

interface AppointmentSchedulingProps {
  doctorId: string;
}

export const AppointmentScheduling = ({ doctorId }: AppointmentSchedulingProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const { toast } = useToast();

  const [newAppointment, setNewAppointment] = useState({
    patient_id: '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles!appointments_patient_id_fkey(full_name)
        `)
        .eq('doctor_id', doctorId)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedAppointments: Appointment[] = data?.map(apt => ({
        id: apt.id,
        patient_id: apt.patient_id,
        start_time: apt.start_time,
        end_time: apt.end_time || '',
        status: apt.status,
        notes: apt.notes,
        patient_name: (apt.profiles as any)?.full_name || 'Unknown Patient',
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.start_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          doctor_id: doctorId,
          patient_id: newAppointment.patient_id,
          start_time: newAppointment.start_time,
          end_time: newAppointment.end_time || null,
          notes: newAppointment.notes || null,
          status: 'scheduled',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });

      setIsAddingAppointment(false);
      setNewAppointment({
        patient_id: '',
        start_time: '',
        end_time: '',
        notes: '',
      });
      loadAppointments();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment",
        variant: "destructive",
      });
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });

      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAppointments();

    const subscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`
      }, () => {
        loadAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [doctorId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appointment Scheduling</h2>
          <p className="text-muted-foreground">Manage your appointments and schedule new ones</p>
        </div>
        <Dialog open={isAddingAppointment} onOpenChange={setIsAddingAppointment}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for a patient
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <PatientSelector
                doctorId={doctorId}
                value={newAppointment.patient_id}
                onValueChange={(value) => setNewAppointment(prev => ({ ...prev, patient_id: value }))}
                label="Patient *"
                required
              />
              <div className="grid gap-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={newAppointment.start_time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end_time">End Time (Optional)</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={newAppointment.end_time}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Appointment details..."
                />
              </div>
              <Button onClick={handleAddAppointment}>Schedule Appointment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming appointments</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{appointment.patient_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(appointment.start_time).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              {(appointment.notes || appointment.status === 'scheduled') && (
                <CardContent>
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground mb-3">{appointment.notes}</p>
                  )}
                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, 'completed')}>
                        Mark Complete
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
