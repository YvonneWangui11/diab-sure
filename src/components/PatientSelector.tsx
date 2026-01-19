import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface Patient {
  user_id: string;
  full_name: string;
  email: string;
}

interface PatientSelectorProps {
  doctorId: string;
  value: string;
  onValueChange: (patientId: string) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export const PatientSelector = ({
  doctorId,
  value,
  onValueChange,
  disabled = false,
  required = false,
  label = "Select Patient",
}: PatientSelectorProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [doctorId]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Get patients mapped to this doctor
      const { data: mappings, error: mappingsError } = await supabase
        .from("doctor_patients")
        .select("patient_id")
        .eq("doctor_id", doctorId)
        .eq("status", "active");

      if (mappingsError) throw mappingsError;

      if (!mappings || mappings.length === 0) {
        setPatients([]);
        return;
      }

      const patientIds = mappings.map((m) => m.patient_id);

      // Get patient profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", patientIds)
        .order("full_name", { ascending: true });

      if (profilesError) throw profilesError;
      setPatients(profiles || []);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="patient-selector">{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading} required={required}>
        <SelectTrigger id="patient-selector" className="w-full">
          <SelectValue placeholder={loading ? "Loading patients..." : "Select a patient"} />
        </SelectTrigger>
        <SelectContent>
          {patients.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No patients assigned
            </div>
          ) : (
            patients.map((patient) => (
              <SelectItem key={patient.user_id} value={patient.user_id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.full_name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({patient.email})
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};