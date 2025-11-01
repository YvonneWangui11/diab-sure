-- Add RLS policies for medications table
CREATE POLICY "Doctors can manage medications for their patients"
ON public.medications
FOR ALL
USING (
  auth.uid() = doctor_id 
  OR EXISTS (
    SELECT 1 FROM doctor_patients dp
    WHERE dp.doctor_id = auth.uid() 
    AND dp.patient_id = medications.patient_id
    AND dp.status = 'active'
  )
);

CREATE POLICY "Patients can view their own medications"
ON public.medications
FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Admins can manage all medications"
ON public.medications
FOR ALL
USING (has_role(auth.uid(), 'admin'));