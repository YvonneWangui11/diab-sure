-- Create pinned_messages table
CREATE TABLE public.pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own pinned messages
CREATE POLICY "Users can view own pinned messages"
ON public.pinned_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can pin messages they can see
CREATE POLICY "Users can pin messages"
ON public.pinned_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id
    AND (m.from_user_id = auth.uid() OR m.to_patient_id = auth.uid() OR m.to_clinician_id = auth.uid())
  )
);

-- Users can unpin their own pinned messages
CREATE POLICY "Users can unpin messages"
ON public.pinned_messages
FOR DELETE
USING (auth.uid() = user_id);