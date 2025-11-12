-- Create data retention policies table
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create data retention flags table to track data that needs review
CREATE TABLE IF NOT EXISTS public.data_retention_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  action_taken TEXT, -- 'deleted', 'retained', 'pending'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_flags ENABLE ROW LEVEL SECURITY;

-- Policies for data_retention_policies
CREATE POLICY "Admins can manage retention policies"
  ON public.data_retention_policies
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view retention policies"
  ON public.data_retention_policies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies for data_retention_flags
CREATE POLICY "Admins can manage retention flags"
  ON public.data_retention_flags
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view flags for their own data"
  ON public.data_retention_flags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default retention policies
INSERT INTO public.data_retention_policies (data_type, retention_days, is_active) VALUES
  ('glucose_readings', 730, true), -- 2 years
  ('meal_logs', 730, true),
  ('exercise_logs', 730, true),
  ('medication_logs', 1095, true), -- 3 years
  ('appointments', 1825, true), -- 5 years
  ('prescriptions', 2555, true), -- 7 years
  ('audit_logs', 2555, true) -- 7 years
ON CONFLICT (data_type) DO NOTHING;