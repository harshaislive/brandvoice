-- Create settings table for Beforest Brand Voice Transformer
CREATE TABLE IF NOT EXISTS beforest_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- Insert default settings
INSERT INTO beforest_settings (setting_key, setting_value, updated_by) 
VALUES 
    ('prompts', '{
        "main": "You are the Beforest Brand Voice Transformer...",
        "transform": "Transform the following content for Beforest...",
        "justification": "Analyze the content transformation..."
    }'::jsonb, 'system'),
    ('model', '{
        "deployment": "o3-mini",
        "max_tokens": 2000,
        "reasoning_effort": "medium",
        "api_version": "2025-01-01-preview"
    }'::jsonb, 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_setting(
    p_key VARCHAR,
    p_value JSONB,
    p_updated_by VARCHAR DEFAULT 'user'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO beforest_settings (setting_key, setting_value, updated_by)
    VALUES (p_key, p_value, p_updated_by)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy access
CREATE OR REPLACE VIEW current_settings AS
SELECT 
    setting_key,
    setting_value,
    updated_at,
    updated_by
FROM beforest_settings;