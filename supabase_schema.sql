-- Beforest Brand Voice Transformer - Supabase Schema
-- This creates the table to track all content transformations

-- Create transformations table
CREATE TABLE IF NOT EXISTS transformations (
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
    
    -- Indexes for common queries
    CONSTRAINT valid_quality_score CHECK (transformation_quality_score IS NULL OR (transformation_quality_score >= 0 AND transformation_quality_score <= 5)),
    CONSTRAINT valid_feedback CHECK (user_feedback IS NULL OR (user_feedback >= 1 AND user_feedback <= 5))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transformations_created_at ON transformations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transformations_content_type ON transformations(content_type);
CREATE INDEX IF NOT EXISTS idx_transformations_target_audience ON transformations(target_audience);
CREATE INDEX IF NOT EXISTS idx_transformations_session ON transformations(session_id);
CREATE INDEX IF NOT EXISTS idx_transformations_date ON transformations(DATE(created_at));

-- Create a view for analytics
CREATE OR REPLACE VIEW transformation_analytics AS
SELECT 
    DATE(created_at) as date,
    content_type,
    target_audience,
    COUNT(*) as transformation_count,
    AVG(original_length) as avg_original_length,
    AVG(transformed_length) as avg_transformed_length,
    AVG(length_change_percent) as avg_length_change,
    AVG(processing_time_ms) as avg_processing_time
FROM transformations
GROUP BY DATE(created_at), content_type, target_audience
ORDER BY date DESC, transformation_count DESC;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_transformations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_transformations_updated_at ON transformations;
CREATE TRIGGER update_transformations_updated_at
    BEFORE UPDATE ON transformations
    FOR EACH ROW
    EXECUTE FUNCTION update_transformations_updated_at();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE transformations ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on transformations" ON transformations
    FOR ALL USING (true);

-- Create a function to get usage statistics
CREATE OR REPLACE FUNCTION get_usage_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    total_transformations BIGINT,
    unique_sessions BIGINT,
    most_common_content_type TEXT,
    most_common_audience TEXT,
    avg_original_length NUMERIC,
    avg_transformed_length NUMERIC,
    total_processing_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_transformations,
        COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
        MODE() WITHIN GROUP (ORDER BY t.content_type) as most_common_content_type,
        MODE() WITHIN GROUP (ORDER BY t.target_audience) as most_common_audience,
        AVG(t.original_length) as avg_original_length,
        AVG(t.transformed_length) as avg_transformed_length,
        (SUM(t.processing_time_ms) / 1000.0 / 3600.0) as total_processing_time_hours
    FROM transformations t
    WHERE t.created_at >= NOW() - INTERVAL '%s days' % days_back;
END;
$$ LANGUAGE plpgsql;

-- Example queries for analytics:

-- Daily usage over last 30 days
-- SELECT DATE(created_at) as date, COUNT(*) as transformations
-- FROM transformations 
-- WHERE created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- Most popular content types
-- SELECT content_type, COUNT(*) as usage_count
-- FROM transformations
-- GROUP BY content_type
-- ORDER BY usage_count DESC;

-- Average transformation metrics by audience
-- SELECT 
--     target_audience,
--     COUNT(*) as transformations,
--     AVG(length_change_percent) as avg_length_change,
--     AVG(processing_time_ms) as avg_processing_time
-- FROM transformations
-- GROUP BY target_audience
-- ORDER BY transformations DESC;

-- Comments for maintenance
COMMENT ON TABLE transformations IS 'Stores all brand voice content transformations for analytics and tracking';
COMMENT ON COLUMN transformations.justification IS 'JSONB field containing key_changes, brand_voice_improvements, audience_adaptation, and overall_strategy';
COMMENT ON COLUMN transformations.session_id IS 'Client-generated session ID to track user sessions';
COMMENT ON COLUMN transformations.transformation_quality_score IS 'ML-derived quality score (0-5) for transformation effectiveness';
COMMENT ON COLUMN transformations.user_feedback IS 'User-provided feedback rating (1-5) if feedback feature is enabled';