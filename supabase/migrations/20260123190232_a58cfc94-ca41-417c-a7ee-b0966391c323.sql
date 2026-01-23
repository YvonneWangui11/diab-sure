-- Allow the trigger function to insert health alerts (using SECURITY DEFINER)
-- The function already has SECURITY DEFINER, so it can insert regardless of RLS
-- But we need to ensure the function can read the necessary tables

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.check_critical_glucose_reading() TO authenticated;

-- Also add a policy to allow system-generated alerts (those created by triggers)
-- This ensures the RLS doesn't block the trigger's inserts
CREATE POLICY "System can create automated alerts"
ON public.health_alerts
FOR INSERT
WITH CHECK (true);

-- Note: The SECURITY DEFINER on the function already bypasses RLS for the function's operations