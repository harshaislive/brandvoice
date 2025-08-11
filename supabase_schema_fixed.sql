-- Beforest Brand Voice Transformer - Supabase Schema (Fixed for existing projects)
-- This creates the table to track all content transformations safely

-- Create transformations table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.beforest_transformations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Input data
    original_content TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    target_audience VARCHAR(100) NOT NULL,
    additional_context TEXT,
    
    -- Output data
    transformed_content TEXT NOT NULL,
    original_length INTEGER NOT NULL,
    transformed_length INTEGER NOT NULL,
    length_change_percent DECIMAL(5,2),
    
    -- Justification data (stored as JSONB for flexibility)
    justification JSONB,
    
    -- Metadata
    user_ip INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Performance metrics
    processing_time_ms INTEGER,
    api_model_used VARCHAR(100),
    
    -- Analytics fields
    transformation_quality_score DECIMAL(3,2), -- For future ML scoring
    user_feedback INTEGER, -- 1-5 rating if we add feedback
    
    -- Constraints
    CONSTRAINT beforest_valid_quality_score CHECK (transformation_quality_score IS NULL OR (transformation_quality_score >= 0 AND transformation_quality_score <= 5)),
    CONSTRAINT beforest_valid_feedback CHECK (user_feedback IS NULL OR (user_feedback >= 1 AND user_feedback <= 5))
);

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_beforest_transformations_created_at ON public.beforest_transformations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beforest_transformations_content_type ON public.beforest_transformations(content_type);
CREATE INDEX IF NOT EXISTS idx_beforest_transformations_target_audience ON public.beforest_transformations(target_audience);
CREATE INDEX IF NOT EXISTS idx_beforest_transformations_session ON public.beforest_transformations(session_id);
-- Removed DATE function index as it requires IMMUTABLE function

-- Create a view for analytics (safe replacement if exists)
DROP VIEW IF EXISTS public.beforest_transformation_analytics;
CREATE VIEW public.beforest_transformation_analytics AS
SELECT 
    DATE(created_at) as date,
    content_type,
    target_audience,
    COUNT(*) as transformation_count,
    AVG(original_length) as avg_original_length,
    AVG(transformed_length) as avg_transformed_length,
    AVG(length_change_percent) as avg_length_change,
    AVG(processing_time_ms) as avg_processing_time
FROM public.beforest_transformations
GROUP BY DATE(created_at), content_type, target_audience
ORDER BY date DESC, transformation_count DESC;

-- Create a function to update the updated_at timestamp (safe replacement)
CREATE OR REPLACE FUNCTION public.update_beforest_transformations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at (safe replacement)
DROP TRIGGER IF EXISTS update_beforest_transformations_updated_at ON public.beforest_transformations;
CREATE TRIGGER update_beforest_transformations_updated_at
    BEFORE UPDATE ON public.beforest_transformations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_beforest_transformations_updated_at();

-- Enable RLS on our table only
ALTER TABLE public.beforest_transformations ENABLE ROW LEVEL SECURITY;

-- Create policy for our table only (safe replacement)
DROP POLICY IF EXISTS "Allow all operations on beforest_transformations" ON public.beforest_transformations;
CREATE POLICY "Allow all operations on beforest_transformations" ON public.beforest_transformations
    FOR ALL USING (true);

-- Create a function to get usage statistics (fixed - no MODE function)
CREATE OR REPLACE FUNCTION public.get_beforest_usage_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    total_transformations BIGINT,
    unique_sessions BIGINT,
    most_common_content_type TEXT,
    most_common_audience TEXT,
    avg_original_length NUMERIC,
    avg_transformed_length NUMERIC,
    total_processing_time_hours NUMERIC
) AS $$
DECLARE
    common_content_type TEXT;
    common_audience TEXT;
BEGIN
    -- Get most common content type safely
    SELECT t.content_type INTO common_content_type
    FROM public.beforest_transformations t
    WHERE t.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY t.content_type
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Get most common audience safely
    SELECT t.target_audience INTO common_audience
    FROM public.beforest_transformations t
    WHERE t.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY t.target_audience
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Return aggregated stats
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_transformations,
        COUNT(DISTINCT t.session_id)::BIGINT as unique_sessions,
        COALESCE(common_content_type, 'N/A') as most_common_content_type,
        COALESCE(common_audience, 'N/A') as most_common_audience,
        COALESCE(AVG(t.original_length), 0) as avg_original_length,
        COALESCE(AVG(t.transformed_length), 0) as avg_transformed_length,
        COALESCE((SUM(t.processing_time_ms) / 1000.0 / 3600.0), 0) as total_processing_time_hours
    FROM public.beforest_transformations t
    WHERE t.created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add helpful comments
COMMENT ON TABLE public.beforest_transformations IS 'Stores all Beforest brand voice content transformations for analytics and tracking';
COMMENT ON COLUMN public.beforest_transformations.justification IS 'JSONB field containing key_changes, brand_voice_improvements, audience_adaptation, and overall_strategy';
COMMENT ON COLUMN public.beforest_transformations.session_id IS 'Client-generated session ID to track user sessions';
COMMENT ON COLUMN public.beforest_transformations.transformation_quality_score IS 'ML-derived quality score (0-5) for transformation effectiveness';
COMMENT ON COLUMN public.beforest_transformations.user_feedback IS 'User-provided feedback rating (1-5) if feedback feature is enabled';

-- Grant necessary permissions (adjust as needed for your setup)
-- These are commented out since permissions vary by Supabase setup
-- GRANT ALL ON public.beforest_transformations TO authenticated;
-- GRANT ALL ON public.beforest_transformations TO service_role;

-- Example queries for verification:

-- Test the function
-- SELECT * FROM public.get_beforest_usage_stats(7);

-- View recent transformations
-- SELECT 
--     created_at,
--     content_type,
--     target_audience,
--     original_length,
--     transformed_length
-- FROM public.beforest_transformations
-- ORDER BY created_at DESC
-- LIMIT 5;