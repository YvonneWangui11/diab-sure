import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, User, Calendar, Activity } from "lucide-react";

interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  status: string;
  last_activity?: string;
}

interface PatientListProps {
  doctorId: string;
  onSelectPatient: (patientId: string, patientName: string) => void;
}

export const PatientList = ({ doctorId, onSelectPatient }: PatientListProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Get patients mapped to this doctor
      const { data: mappings, error: mappingsError } = await supabase
        .from('doctor_patients')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (mappingsError) throw mappingsError;

      if (!mappings || mappings.length === 0) {
        setPatients([]);
        return;
      }

      const patientIds = mappings.map(m => m.patient_id);

      // Get patient profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', patientIds);

      if (profilesError) throw profilesError;

      const formattedPatients: Patient[] = profiles?.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        status: 'active',
      })) || [];

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patient list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();

    const subscription = supabase
      .channel('doctor-patients-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'doctor_patients',
        filter: `doctor_id=eq.${doctorId}`
      }, () => {
        loadPatients();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [doctorId]);

  const filteredPatients = patients.filter(patient => 
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold">My Patients</h2>
          <p className="text-muted-foreground">Manage and monitor your patients</p>
        </div>
        <Badge variant="secondary">{patients.length} patients</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No patients found matching your search' : 'No patients assigned yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectPatient(patient.user_id, patient.full_name)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{patient.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {patient.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Born: {new Date(patient.date_of_birth).toLocaleDateString()}
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {patient.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
