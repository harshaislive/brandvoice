CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  mode text NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'transform')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  token_count integer
);

CREATE TABLE IF NOT EXISTS public.beforest_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS public.beforest_transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  original_content text NOT NULL,
  content_type text NOT NULL,
  target_audience text NOT NULL,
  additional_context text,
  transformed_content text NOT NULL,
  original_length integer NOT NULL CHECK (original_length >= 0),
  transformed_length integer NOT NULL CHECK (transformed_length >= 0),
  length_change_percent double precision,
  justification jsonb,
  user_ip inet,
  user_agent text,
  session_id text,
  processing_time_ms integer CHECK (processing_time_ms >= 0),
  api_model_used text,
  transformation_quality_score double precision
    CHECK (transformation_quality_score BETWEEN 1 AND 5),
  user_feedback integer CHECK (user_feedback BETWEEN 1 AND 5),
  user_email text,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS conversations_user_created_idx
  ON public.conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_timestamp_idx
  ON public.messages (conversation_id, timestamp ASC);
CREATE INDEX IF NOT EXISTS transformations_user_created_idx
  ON public.beforest_transformations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transformations_created_idx
  ON public.beforest_transformations (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_conversation_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beforest_settings_updated_at ON public.beforest_settings;
CREATE TRIGGER beforest_settings_updated_at
  BEFORE UPDATE ON public.beforest_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_timestamp();

DROP TRIGGER IF EXISTS transformations_updated_at ON public.beforest_transformations;
CREATE TRIGGER transformations_updated_at
  BEFORE UPDATE ON public.beforest_transformations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_timestamp();

DROP TRIGGER IF EXISTS conversations_last_activity ON public.conversations;
DROP TRIGGER IF EXISTS update_conversations_last_activity ON public.conversations;
CREATE TRIGGER conversations_last_activity
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_conversation_activity();
