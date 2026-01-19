-- =========================================
-- PRODUCTION SECURITY HARDENING MIGRATION
-- =========================================

-- 1. Fix doctor_details policy: Remove overly permissive "true" policy
-- Only allow patients to view their assigned doctor's details
DROP POLICY IF EXISTS "Authenticated users can view doctor profiles" ON doctor_details;

-- Create a proper policy that restricts doctor profile viewing to:
-- a) The doctor themselves
-- b) Patients assigned to that doctor
-- c) Admins
CREATE POLICY "Patients can view assigned doctor profiles"
ON doctor_details
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM doctor_patients dp 
    WHERE dp.patient_id = auth.uid() 
    AND dp.doctor_id = doctor_details.user_id 
    AND dp.status = 'active'
  )
);

-- 2. Fix clinician policies to check active doctor-patient relationship
-- Glucose readings: Restrict to assigned patients only
DROP POLICY IF EXISTS "Clinicians can view glucose readings" ON glucose_readings;
CREATE POLICY "Clinicians can view assigned patient glucose readings"
ON glucose_readings
FOR SELECT
USING (
  auth.uid() = patient_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND EXISTS (
      SELECT 1 FROM doctor_patients dp 
      WHERE dp.doctor_id = auth.uid() 
      AND dp.patient_id = glucose_readings.patient_id 
      AND dp.status = 'active'
    )
  )
);

-- Meal logs: Restrict to assigned patients only
DROP POLICY IF EXISTS "Clinicians can view meal logs" ON meal_logs;
CREATE POLICY "Clinicians can view assigned patient meal logs"
ON meal_logs
FOR SELECT
USING (
  auth.uid() = patient_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND EXISTS (
      SELECT 1 FROM doctor_patients dp 
      WHERE dp.doctor_id = auth.uid() 
      AND dp.patient_id = meal_logs.patient_id 
      AND dp.status = 'active'
    )
  )
);

-- Exercise logs: Restrict to assigned patients only
DROP POLICY IF EXISTS "Clinicians can view exercise logs" ON exercise_logs;
CREATE POLICY "Clinicians can view assigned patient exercise logs"
ON exercise_logs
FOR SELECT
USING (
  auth.uid() = patient_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND EXISTS (
      SELECT 1 FROM doctor_patients dp 
      WHERE dp.doctor_id = auth.uid() 
      AND dp.patient_id = exercise_logs.patient_id 
      AND dp.status = 'active'
    )
  )
);

-- Medication intake: Restrict to assigned patients only
DROP POLICY IF EXISTS "Clinicians can view intake logs" ON medication_intake;
CREATE POLICY "Clinicians can view assigned patient intake logs"
ON medication_intake
FOR SELECT
USING (
  auth.uid() = patient_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND EXISTS (
      SELECT 1 FROM doctor_patients dp 
      WHERE dp.doctor_id = auth.uid() 
      AND dp.patient_id = medication_intake.patient_id 
      AND dp.status = 'active'
    )
  )
);

-- 3. Fix prescriptions policy: Restrict to only assigned patients
DROP POLICY IF EXISTS "Clinicians can view and manage prescriptions" ON prescriptions;

CREATE POLICY "Clinicians can view assigned patient prescriptions"
ON prescriptions
FOR SELECT
USING (
  auth.uid() = patient_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND (
      auth.uid() = clinician_id 
      OR EXISTS (
        SELECT 1 FROM doctor_patients dp 
        WHERE dp.doctor_id = auth.uid() 
        AND dp.patient_id = prescriptions.patient_id 
        AND dp.status = 'active'
      )
    )
  )
);

CREATE POLICY "Clinicians can insert prescriptions for assigned patients"
ON prescriptions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinician'::app_role) 
    AND auth.uid() = clinician_id
    AND EXISTS (
      SELECT 1 FROM doctor_patients dp 
      WHERE dp.doctor_id = auth.uid() 
      AND dp.patient_id = prescriptions.patient_id 
      AND dp.status = 'active'
    )
  )
);

CREATE POLICY "Clinicians can update own prescriptions"
ON prescriptions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'clinician'::app_role) AND auth.uid() = clinician_id)
);

CREATE POLICY "Clinicians can delete own prescriptions"
ON prescriptions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'clinician'::app_role) AND auth.uid() = clinician_id)
);

-- 4. Fix appointments policy: Restrict clinician access to their own appointments
DROP POLICY IF EXISTS "Clinicians can manage appointments" ON appointments;

CREATE POLICY "Clinicians can manage own appointments"
ON appointments
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = doctor_id
);

-- 5. Add audit log insert policy via service role trigger
-- This prevents users from inserting fake audit logs while allowing the system to create them
CREATE POLICY "System can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (false);  -- No direct inserts allowed; use server-side functions

-- 6. Restrict data retention policies viewing to admins only
DROP POLICY IF EXISTS "Authenticated users can view retention policies" ON data_retention_policies;
CREATE POLICY "Only admins can view retention policies"
ON data_retention_policies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Add message update policy for read receipts
CREATE POLICY "Users can mark messages as read"
ON messages
FOR UPDATE
USING (
  auth.uid() = to_patient_id 
  OR auth.uid() = to_clinician_id
)
WITH CHECK (
  auth.uid() = to_patient_id 
  OR auth.uid() = to_clinician_id
);

-- 8. Create function for secure audit logging (uses service role)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_target_entity text,
  p_target_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role app_role;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's primary role
  SELECT role INTO v_user_role 
  FROM user_roles 
  WHERE user_id = v_user_id 
  LIMIT 1;
  
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    target_entity,
    target_id,
    metadata
  ) VALUES (
    v_user_id,
    v_user_role,
    p_action,
    p_target_entity,
    p_target_id,
    p_metadata
  );
END;
$$;