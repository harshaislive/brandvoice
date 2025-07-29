# Settings Page Documentation

## Overview
The settings page allows authorized team leads to configure prompts and model parameters for the Beforest Brand Voice Transformer.

## Access
- Navigate to `/settings` or click the ⚙️ Settings link in the header
- Default passkey: `123456` (CHANGE THIS IN PRODUCTION)
- Authentication persists for the session

## Features

### 1. Prompts Configuration
- **Main Brand Voice Prompt**: Core system prompt defining Beforest's voice
- **Transformation Instructions**: Template for content transformation
- **Justification Analysis**: Template for explaining changes

Available variables in prompts:
- `{content_type}` - Type of content being transformed
- `{target_audience}` - Target audience for the content
- `{additional_context}` - Any additional context provided
- `{original_content}` - The original content to transform

### 2. Model Settings
- **Deployment Name**: Azure OpenAI deployment (default: o3-mini)
- **Max Tokens**: Maximum completion length (100-4000)
- **Temperature**: Creativity level (0-2, default: 0.7)
- **Top P**: Nucleus sampling (0-1, default: 0.9)
- **Frequency Penalty**: Reduce repetition (-2 to 2, default: 0)
- **Presence Penalty**: Encourage new topics (-2 to 2, default: 0)

### 3. Templates Library
Pre-built prompt templates:
- **Concise & Direct**: For brief, impactful communications
- **Data-Driven**: Emphasize facts and analytics
- **Educational**: Explain complex concepts simply
- **Professional**: Formal business communications
- **Authentic Voice**: Natural, conversational tone
- **Technical**: For technical documentation

### 4. Best Practices
Built-in guidance for prompt engineering:
- Be specific and clear
- Provide context
- Use examples
- Structure your prompts
- Iterate and test
- Beforest-specific guidelines

## Security

### Changing the Passkey
1. Generate a new SHA-256 hash for your passkey
2. Update `DEFAULT_PASSKEY_HASH` in `app.py`
3. Or update via the API endpoint (requires current authentication)

### Production Recommendations
1. Use environment variable for `FLASK_SECRET_KEY`
2. Store settings in database instead of JSON file
3. Implement proper user authentication system
4. Add audit logging for settings changes
5. Use role-based access control

## API Endpoints

### Get Settings
```
GET /api/settings
Header: X-Settings-Auth: true
```

### Update Prompts
```
POST /api/settings/prompts
Header: X-Settings-Auth: true
Body: {
    "prompts": {
        "main": "...",
        "transform": "...",
        "justification": "..."
    }
}
```

### Update Model Settings
```
POST /api/settings/model
Header: X-Settings-Auth: true
Body: {
    "model": {
        "deployment": "o3-mini",
        "max_tokens": 2000,
        "temperature": 0.7,
        "top_p": 0.9,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }
}
```

## Usage Tips

1. **Test Changes**: Always test prompt changes with sample content
2. **Document Changes**: Keep track of what prompts work best
3. **Incremental Updates**: Make small changes and test
4. **Backup Settings**: Export settings before major changes
5. **Team Collaboration**: Share successful prompt templates

## Troubleshooting

- **Settings not saving**: Check file permissions for `settings.json`
- **Authentication failing**: Clear session storage and try again
- **Changes not reflecting**: Restart the Flask application
- **Invalid prompts**: Ensure all variables are properly formatted