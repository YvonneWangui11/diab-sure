-- Create deletion requests table for GDPR compliance
CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('account', 'data')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Patients can create and view their own deletion requests
CREATE POLICY "Patients can create own deletion requests"
ON public.deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can view own deletion requests"
ON public.deletion_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and manage all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.deletion_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all deletion requests"
ON public.deletion_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_deletion_requests_updated_at
BEFORE UPDATE ON public.deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();