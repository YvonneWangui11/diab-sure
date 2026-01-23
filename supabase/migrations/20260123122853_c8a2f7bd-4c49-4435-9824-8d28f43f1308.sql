-- Create function to automatically generate health alerts for critical glucose readings
CREATE OR REPLACE FUNCTION public.check_critical_glucose_reading()
RETURNS TRIGGER AS $$
DECLARE
  assigned_doctor_id uuid;
  patient_name text;
  alert_message text;
  alert_severity text;
  alert_type text;
BEGIN
  -- Check if reading is critical (below 70 or above 300 mg/dL)
  IF NEW.glucose_value < 70 OR NEW.glucose_value > 300 THEN
    -- Find the assigned doctor for this patient
    SELECT doctor_id INTO assigned_doctor_id
    FROM public.doctor_patients
    WHERE patient_id = NEW.patient_id
    AND status = 'active'
    LIMIT 1;

    -- Only create alert if patient has an assigned doctor
    IF assigned_doctor_id IS NOT NULL THEN
      -- Get patient name
      SELECT full_name INTO patient_name
      FROM public.profiles
      WHERE user_id = NEW.patient_id;

      -- Determine alert type and severity based on reading
      IF NEW.glucose_value < 70 THEN
        alert_type := 'low_glucose';
        IF NEW.glucose_value < 54 THEN
          alert_severity := 'critical';
          alert_message := format('CRITICAL: %s recorded severely low glucose of %s mg/dL at %s. Immediate attention required - risk of hypoglycemic emergency.',
            COALESCE(patient_name, 'Patient'),
            NEW.glucose_value,
            NEW.test_time);
        ELSE
          alert_severity := 'warning';
          alert_message := format('WARNING: %s recorded low glucose of %s mg/dL at %s. Monitor closely for hypoglycemia symptoms.',
            COALESCE(patient_name, 'Patient'),
            NEW.glucose_value,
            NEW.test_time);
        END IF;
      ELSE
        alert_type := 'high_glucose';
        IF NEW.glucose_value > 400 THEN
          alert_severity := 'critical';
          alert_message := format('CRITICAL: %s recorded dangerously high glucose of %s mg/dL at %s. Risk of diabetic ketoacidosis - immediate intervention needed.',
            COALESCE(patient_name, 'Patient'),
            NEW.glucose_value,
            NEW.test_time);
        ELSIF NEW.glucose_value > 300 THEN
          alert_severity := 'critical';
          alert_message := format('CRITICAL: %s recorded very high glucose of %s mg/dL at %s. Urgent follow-up recommended.',
            COALESCE(patient_name, 'Patient'),
            NEW.glucose_value,
            NEW.test_time);
        END IF;
      END IF;

      -- Insert the health alert
      INSERT INTO public.health_alerts (
        doctor_id,
        patient_id,
        alert_type,
        message,
        severity,
        resolved
      ) VALUES (
        assigned_doctor_id,
        NEW.patient_id,
        alert_type,
        alert_message,
        alert_severity,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on glucose_readings table
DROP TRIGGER IF EXISTS trigger_check_critical_glucose ON public.glucose_readings;
CREATE TRIGGER trigger_check_critical_glucose
  AFTER INSERT ON public.glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_critical_glucose_reading();