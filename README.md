# Beforest Brand Voice Transformer

A sophisticated web application that transforms any content to match Beforest's unique brand voice and communication style. Built with a rich HTML/CSS/JavaScript frontend and Python Flask backend powered by Azure OpenAI.

## Features

- **Rich UI**: Modern, responsive interface following Beforest's brand guidelines
- **Smart Transformation**: AI-powered content transformation using Azure OpenAI
- **Multiple Content Types**: Support for emails, social media, proposals, presentations, and more
- **Audience Targeting**: Tailored transformations for different audiences
- **Real-time Processing**: Instant content transformation with loading states
- **Copy & Regenerate**: Easy content management with clipboard integration

## Brand Voice Characteristics

- **Assertive**: Confident and authoritative communication
- **Authentic**: Genuine, transparent, and honest messaging  
- **Approachable**: Accessible language that's conversational yet professional

## Setup Instructions

### Prerequisites

- Python 3.8+
- Azure OpenAI account with GPT-4 deployment
- Modern web browser

### Installation

1. **Clone or download the project files**

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Azure OpenAI**:
   - Copy `.env.example` to `.env`
   - Fill in your Azure OpenAI credentials:
     ```
     AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
     AZURE_OPENAI_KEY=your-azure-openai-key-here
     AZURE_OPENAI_DEPLOYMENT=gpt-4
     ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to `http://localhost:5000`

## Usage

1. **Enter Original Content**: Paste your content in the input area
2. **Select Content Type**: Choose from email, social media, proposal, etc.
3. **Choose Target Audience**: Select your intended audience
4. **Add Context** (Optional): Provide additional context or requirements
5. **Transform**: Click the transform button to get brand-aligned content
6. **Copy or Regenerate**: Use the action buttons to copy or get variations

## API Endpoints

- `GET /` - Main application interface
- `POST /transform` - Transform content (JSON API)
- `GET /health` - Health check
- `GET /api/info` - API information

### Transform API Example

```javascript
fetch('/transform', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    original_content: "Your content here",
    content_type: "email",
    target_audience: "existing-clients",
    additional_context: "Urgent response needed"
  })
})
```

## Supported Content Types

- Email
- Social Media Post
- Business Proposal
- Presentation
- Website Copy
- Marketing Material
- Internal Communication
- Press Release

## Supported Audiences

- Existing Clients
- Prospects
- Internal Team
- Partners
- Media
- General Public
- Investors
- Vendors

## File Structure

```
brand_voice/
├── index.html          # Main application interface
├── styles.css          # Beforest brand styling
├── script.js           # Frontend JavaScript
├── app.py              # Flask backend server
├── requirements.txt    # Python dependencies
├── .env.example        # Environment configuration template
├── brand_doc.md        # Beforest brand guidelines
└── README.md           # This file
```

## Deployment

### Local Development
```bash
python app.py
```

### Production (using Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Variables for Production
- `FLASK_ENV=production`
- `PORT=5000` (or your preferred port)
- Set all Azure OpenAI credentials

## Security Notes

- Never commit your `.env` file with real credentials
- Use environment variables for all sensitive configuration
- The application includes CORS support for frontend integration
- Input validation is implemented for all API endpoints

## Troubleshooting

### Common Issues

1. **"Azure OpenAI not configured" error**:
   - Ensure your `.env` file exists with correct Azure OpenAI credentials
   - Verify your Azure OpenAI deployment name is correct

2. **Frontend not loading**:
   - Check that all files are in the same directory
   - Ensure Flask is serving static files correctly

3. **Transform button not working**:
   - Check browser console for JavaScript errors
   - Verify all required fields are filled
   - Check network tab for API request status

### Getting Help

- Check the browser console for error messages
- Review Flask application logs
- Verify Azure OpenAI service status and quotas

## License

© 2024 Beforest. All rights reserved.