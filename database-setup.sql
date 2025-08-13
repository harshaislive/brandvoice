-- Users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username varchar(255) UNIQUE NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  display_name varchar(255) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  is_active boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Conversations table for chat history
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  mode varchar(50) DEFAULT 'chat' CHECK (mode IN ('chat', 'transform')),
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  is_archived boolean DEFAULT false,
  metadata jsonb,
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);

-- Messages table for chat messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  token_count integer,
  CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  setting_key varchar(255) NOT NULL,
  setting_value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_user_key_unique UNIQUE (user_id, setting_key)
);

-- Add user_id to transformations table
ALTER TABLE public.beforest_transformations 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON public.conversations(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_transformations_user_id ON public.beforest_transformations(user_id);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_last_activity 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();