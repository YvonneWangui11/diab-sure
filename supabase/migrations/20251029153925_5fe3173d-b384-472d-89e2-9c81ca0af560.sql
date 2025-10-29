-- Drop existing policies that depend on profiles.role
DROP POLICY IF EXISTS "Doctors can view patient details" ON public.patient_details;
DROP POLICY IF EXISTS "Doctors can insert medications for their patients" ON public.medications;
DROP POLICY IF EXISTS "Doctors can view medications they prescribed" ON public.medications;
DROP POLICY IF EXISTS "Doctors can update medications they prescribed" ON public.medications;
DROP POLICY IF EXISTS "Patients can view their own medications" ON public.medications;
DROP POLICY IF EXISTS "Patients can insert their own medication logs" ON public.medication_logs;

-- Now drop the role column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Continue with the rest of the migration
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'clinician', 'admin');

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles table structure
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consent_flags JSONB DEFAULT '{}';

-- Patient details table
CREATE TABLE IF NOT EXISTS public.patient_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  diagnosis_date DATE,
  diabetes_type TEXT DEFAULT 'Type 2',
  current_treatment TEXT,
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.patient_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own details"
  ON public.patient_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clinicians can view patient details"
  ON public.patient_details FOR SELECT
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients can update own details"
  ON public.patient_details FOR UPDATE
  USING (auth.uid() = user_id);

-- Doctor details table
CREATE TABLE IF NOT EXISTS public.doctor_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialization TEXT,
  license_number TEXT,
  facility TEXT DEFAULT 'JKUAT Hospital',
  years_of_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.doctor_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view own details"
  ON public.doctor_details FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view clinician details"
  ON public.doctor_details FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Prescriptions table (FHIR-inspired MedicationRequest)
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  drug_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  quantity INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can view and manage prescriptions"
  ON public.prescriptions FOR ALL
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Medication intake logs
CREATE TABLE IF NOT EXISTS public.medication_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'late')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.medication_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own intake logs"
  ON public.medication_intake FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can view intake logs"
  ON public.medication_intake FOR SELECT
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Meal logs
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT NOT NULL,
  portion_size TEXT,
  photo_url TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own meal logs"
  ON public.meal_logs FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can view meal logs"
  ON public.meal_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Exercise logs
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  exercise_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  intensity TEXT CHECK (intensity IN ('low', 'moderate', 'high')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own exercise logs"
  ON public.exercise_logs FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can view exercise logs"
  ON public.exercise_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT 'JKUAT Hospital',
  reason TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can update appointment status"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can manage appointments"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Messages/notifications table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_clinician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('sms', 'email', 'in-app')),
  template_id TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = to_patient_id OR auth.uid() = to_clinician_id);

CREATE POLICY "Clinicians and admins can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'clinician') OR public.has_role(auth.uid(), 'admin'));

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role app_role,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Education content table
CREATE TABLE IF NOT EXISTS public.education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.education_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published content"
  ON public.education_content FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage education content"
  ON public.education_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_patient_details
  BEFORE UPDATE ON public.patient_details
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_doctor_details
  BEFORE UPDATE ON public.doctor_details
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_prescriptions
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_education_content
  BEFORE UPDATE ON public.education_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_intake;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_logs;