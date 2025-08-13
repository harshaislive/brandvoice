-- Fix the conversation update trigger to use last_activity instead of updated_at

-- Create a new function for updating last_activity
CREATE OR REPLACE FUNCTION update_last_activity_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_conversations_last_activity ON public.conversations;

-- Create a new trigger that uses the correct function
CREATE TRIGGER update_conversations_last_activity 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_last_activity_column();