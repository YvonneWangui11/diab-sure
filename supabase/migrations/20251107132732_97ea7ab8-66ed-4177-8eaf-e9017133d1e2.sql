-- Create glucose_readings table
CREATE TABLE IF NOT EXISTS public.glucose_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  glucose_value INTEGER NOT NULL,
  test_time TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for glucose_readings
CREATE POLICY "Patients can manage own glucose readings"
ON public.glucose_readings
FOR ALL
USING (auth.uid() = patient_id);

CREATE POLICY "Clinicians can view glucose readings"
ON public.glucose_readings
FOR SELECT
USING (
  has_role(auth.uid(), 'clinician'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for better performance
CREATE INDEX idx_glucose_readings_patient_id ON public.glucose_readings(patient_id);
CREATE INDEX idx_glucose_readings_created_at ON public.glucose_readings(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.glucose_readings;