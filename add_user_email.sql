-- Add user_email column to track who created each transformation
ALTER TABLE public.beforest_transformations 
ADD COLUMN user_email VARCHAR(255) NULL;

-- Add index for user_email for faster filtering
CREATE INDEX IF NOT EXISTS idx_beforest_transformations_user_email 
ON public.beforest_transformations USING btree (user_email);

-- Add comment to document the new column
COMMENT ON COLUMN public.beforest_transformations.user_email 
IS 'Email address of the user who created this transformation';