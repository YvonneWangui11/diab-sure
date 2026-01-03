-- Add parent_message_id column to messages table for threading
ALTER TABLE public.messages 
ADD COLUMN parent_message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;

-- Create index for efficient thread queries
CREATE INDEX idx_messages_parent_message_id ON public.messages(parent_message_id);

-- Add thread_id to track the root of each conversation thread
ALTER TABLE public.messages 
ADD COLUMN thread_id uuid;

-- Create index for thread_id
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);