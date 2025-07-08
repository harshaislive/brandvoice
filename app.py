#!/usr/bin/env python3
"""
Beforest Brand Voice Transformer - Flask Backend
A sophisticated brand voice transformation service using Azure OpenAI
"""

import os
import logging
import uuid
import time
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import openai
from datetime import datetime
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

class BeforestBrandVoice:
    """Brand voice transformation engine for Beforest"""
    
    def __init__(self):
        self.setup_azure_openai()
        self.setup_supabase()
        self.brand_voice_prompt = self.create_brand_voice_prompt()
    
    def setup_azure_openai(self):
        """Configure Azure OpenAI client"""
        try:
            # Azure OpenAI configuration
            self.azure_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
            self.azure_key = os.getenv('AZURE_OPENAI_KEY')
            self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'o3-mini')
            self.api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2025-01-01-preview')
            
            if not self.azure_endpoint or not self.azure_key:
                logger.warning("Azure OpenAI credentials not found in environment variables")
                logger.info("Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY")
                return
            
            # Initialize Azure OpenAI client
            openai.api_type = "azure"
            openai.api_base = self.azure_endpoint
            openai.api_key = self.azure_key
            openai.api_version = self.api_version
            
            logger.info("Azure OpenAI client configured successfully")
            
        except Exception as e:
            logger.error(f"Failed to setup Azure OpenAI: {str(e)}")
    
    def setup_supabase(self):
        """Configure Supabase client"""
        try:
            self.supabase_url = os.getenv('SUPABASE_URL')
            self.supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
            
            if not self.supabase_url or not self.supabase_key:
                logger.warning("Supabase credentials not found in environment variables")
                logger.info("Analytics tracking will be disabled")
                self.supabase = None
                return
            
            # Initialize Supabase client with multiple fallback methods
            self.supabase = None
            initialization_methods = [
                self._init_supabase_method_1,
                self._init_supabase_method_2, 
                self._init_supabase_method_3,
                self._init_minimal_client
            ]
            
            for i, method in enumerate(initialization_methods, 1):
                try:
                    self.supabase = method()
                    if self.supabase:
                        logger.info(f"Supabase initialized successfully with method {i}")
                        # Test connection
                        try:
                            test = self.supabase.table('beforest_transformations').select("id").limit(1).execute()
                            logger.info("Supabase connection tested successfully")
                            break
                        except:
                            logger.debug(f"Method {i} client created but connection test failed")
                            continue
                except Exception as e:
                    logger.debug(f"Supabase initialization method {i} failed: {str(e)}")
                    continue
            
            if not self.supabase:
                logger.warning("All Supabase initialization methods failed - analytics will be disabled")
            
        except Exception as e:
            logger.error(f"Failed to setup Supabase: {str(e)}")
            self.supabase = None

    def _init_supabase_method_1(self):
        """Standard Supabase initialization"""
        try:
            return create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            logger.debug(f"Method 1 failed: {str(e)}")
            return None
    
    def _init_supabase_method_2(self):
        """Supabase initialization with options"""
        try:
            from supabase import Client, ClientOptions
            options = ClientOptions(
                auto_refresh_token=False,
                persist_session=False
            )
            return Client(self.supabase_url, self.supabase_key, options)
        except Exception as e:
            logger.debug(f"Method 2 failed: {str(e)}")
            return None
    
    def _init_supabase_method_3(self):
        """Basic client without options"""
        try:
            from supabase import Client
            return Client(self.supabase_url, self.supabase_key)
        except Exception as e:
            logger.debug(f"Method 3 failed: {str(e)}")
            return None

    def _init_minimal_client(self):
        """Create a minimal Supabase client as fallback"""
        try:
            # Try to create a basic client with minimal configuration
            import requests
            
            class MinimalSupabaseClient:
                def __init__(self, url, key):
                    self.url = url.rstrip('/')
                    self.key = key
                    self.headers = {
                        'apikey': self.key,
                        'Authorization': f'Bearer {self.key}',
                        'Content-Type': 'application/json'
                    }
                
                def table(self, table_name):
                    return MinimalTable(self.url, table_name, self.headers)
                
                def rpc(self, function_name, params=None):
                    url = f"{self.url}/rest/v1/rpc/{function_name}"
                    response = requests.post(url, json=params or {}, headers=self.headers)
                    return MinimalResponse(response.json() if response.status_code == 200 else [])
            
            class MinimalTable:
                def __init__(self, base_url, table_name, headers):
                    self.url = f"{base_url}/rest/v1/{table_name}"
                    self.headers = headers
                
                def insert(self, data):
                    response = requests.post(self.url, json=data, headers=self.headers)
                    return MinimalResponse(response.json() if response.status_code == 201 else None)
                
                def select(self, columns="*"):
                    response = requests.get(f"{self.url}?select={columns}", headers=self.headers)
                    return MinimalQuery(self.url, self.headers)
            
            class MinimalQuery:
                def __init__(self, url, headers):
                    self.url = url
                    self.headers = headers
                
                def limit(self, count):
                    return self
                
                def execute(self):
                    response = requests.get(f"{self.url}?select=id&limit=1", headers=self.headers)
                    return MinimalResponse(response.json() if response.status_code == 200 else [])
            
            class MinimalResponse:
                def __init__(self, data):
                    self.data = data if isinstance(data, list) else [data] if data else []
            
            return MinimalSupabaseClient(self.supabase_url, self.supabase_key)
            
        except Exception as e:
            logger.error(f"Failed to create minimal Supabase client: {str(e)}")
            return None
    
    def create_brand_voice_prompt(self) -> str:
        """Create the comprehensive brand voice system prompt"""
        return """You are the Beforest Brand Voice Transformer, an expert AI assistant specialized in transforming content to match Beforest's exact brand voice and communication style.

BEFOREST BRAND VOICE - STRICT REQUIREMENTS:

VOICE CHARACTERISTICS:
- Speak with calm self-assurance
- Maintain authenticity at all times
- Show respect for audience intelligence
- Never condescend or oversimplify

STRICT PROHIBITIONS - NEVER USE:
- Superlatives (amazing, incredible, revolutionary, best, ultimate, etc.)
- Hyperbole or exaggerated claims
- Poetry, flowery language, or dramatic phrasing
- Drama or emotional manipulation
- Teasing, tricking, or terrorizing language
- Buzzwords or corporate jargon

REQUIRED WRITING STYLE:
- Simple, factual sentences
- Insightful observations
- Clear, direct communication
- Trust data and facts to lead the conversation
- Use copy to spark curiosity, not convince through drama
- Let evidence speak for itself

GUIDING PRINCIPLES:
- Commitment to sound science guides everything
- Proven processes are our foundation
- Data-driven approach in all communications
- Respect for audience's ability to draw conclusions
- Authenticity over persuasion tactics

CONTENT TRANSFORMATION APPROACH:
1. Strip away any superlatives or hyperbolic language
2. Replace dramatic phrases with factual statements
3. Ensure sentences are clear and simple
4. Focus on data and proven results
5. Maintain calm, confident tone throughout
6. Present information that allows audience to draw their own conclusions
7. Spark curiosity through facts, not manipulation

AUDIENCE-SPECIFIC ADAPTATIONS:
- **Existing Clients**: Factual updates, data-driven insights
- **Prospects**: Clear value propositions based on proven results
- **Internal Team**: Direct communication, process-focused
- **Partners**: Straightforward collaboration language
- **Media**: Fact-based statements, quotable insights
- **General Public**: Educational, respectful of intelligence
- **Investors**: Data-driven performance metrics
- **Vendors**: Clear, professional expectations

Transform the provided content to strictly follow Beforest's brand voice: calm self-assurance, authenticity, respect for audience intelligence, simple factual sentences, and complete avoidance of superlatives, hyperbole, poetry, and drama. Let data and insights lead, using copy only to spark curiosity."""

    def transform_content(self, 
                         original_content: str, 
                         content_type: str, 
                         target_audience: str, 
                         additional_context: str = "") -> str:
        """Transform content using Azure OpenAI"""
        
        try:
            # Create user prompt with context
            user_prompt = f"""Transform the following content for Beforest:

ORIGINAL CONTENT:
{original_content}

CONTENT TYPE: {content_type}
TARGET AUDIENCE: {target_audience}
ADDITIONAL CONTEXT: {additional_context if additional_context else "None provided"}

Please transform this content to perfectly match Beforest's brand voice while maintaining the original message's intent and key information. Ensure the output is appropriate for the specified content type and target audience."""

            # Call Azure OpenAI with o3-mini compatible parameters
            response = openai.ChatCompletion.create(
                engine=self.deployment_name,
                messages=[
                    {"role": "system", "content": self.brand_voice_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=2000
            )
            
            transformed_content = response.choices[0].message.content.strip()
            logger.info(f"Content transformed successfully - Length: {len(transformed_content)} chars")
            
            return transformed_content
            
        except Exception as e:
            logger.error(f"Content transformation failed: {str(e)}")
            raise

    def generate_justification(self, 
                             original_content: str, 
                             transformed_content: str, 
                             content_type: str, 
                             target_audience: str) -> dict:
        """Generate justification for transformation changes"""
        
        try:
            justification_prompt = f"""Analyze the content transformation below and provide a clear justification of what changes were made and why, based on Beforest's brand voice guidelines.

BEFOREST BRAND VOICE PRINCIPLES:
- Calm self-assurance, authenticity, respect for audience intelligence
- Simple, factual sentences without superlatives or hyperbole
- Data-driven approach, sound science foundation
- No drama, teasing, or emotional manipulation

ORIGINAL CONTENT:
{original_content}

TRANSFORMED CONTENT:
{transformed_content}

CONTENT TYPE: {content_type}
TARGET AUDIENCE: {target_audience}

Please provide a concise analysis in this exact JSON format:
{{
    "key_changes": [
        "Brief description of main change 1",
        "Brief description of main change 2",
        "Brief description of main change 3"
    ],
    "brand_voice_improvements": [
        "How change aligns with calm self-assurance",
        "How change removes superlatives/drama",
        "How change respects audience intelligence"
    ],
    "audience_adaptation": "How the transformation was tailored for the target audience",
    "overall_strategy": "One sentence explaining the overall transformation approach"
}}

Keep each point concise (under 50 words). Focus only on the most significant changes."""

            # Call Azure OpenAI for justification
            response = openai.ChatCompletion.create(
                engine=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are an expert content analyst specializing in Beforest's brand voice. Provide precise, factual analysis in the requested JSON format."},
                    {"role": "user", "content": justification_prompt}
                ],
                max_completion_tokens=800
            )
            
            justification_text = response.choices[0].message.content.strip()
            
            # Try to parse as JSON, fallback to structured text if needed
            try:
                import json
                justification = json.loads(justification_text)
            except json.JSONDecodeError:
                # Fallback: create structured response from text
                justification = {
                    "key_changes": [
                        "Enhanced clarity and directness",
                        "Removed promotional language",
                        "Added factual precision"
                    ],
                    "brand_voice_improvements": [
                        "Adopted calm, confident tone",
                        "Eliminated superlatives and hype",
                        "Maintained respect for audience intelligence"
                    ],
                    "audience_adaptation": f"Tailored language and formality level for {target_audience}",
                    "overall_strategy": "Transformed content to match Beforest's authentic, data-driven communication style"
                }
            
            logger.info("Justification generated successfully")
            return justification
            
        except Exception as e:
            logger.error(f"Justification generation failed: {str(e)}")
            # Return fallback justification
            return {
                "key_changes": [
                    "Enhanced clarity and directness",
                    "Aligned with brand voice guidelines",
                    "Improved professional tone"
                ],
                "brand_voice_improvements": [
                    "Applied calm self-assurance principle",
                    "Removed dramatic or promotional language",
                    "Maintained factual, science-based approach"
                ],
                "audience_adaptation": f"Adapted tone and content for {target_audience}",
                "overall_strategy": "Transformed to match Beforest's authentic, data-driven brand voice"
            }

    def save_transformation(self, 
                          original_content: str,
                          transformed_content: str,
                          content_type: str,
                          target_audience: str,
                          additional_context: str,
                          justification: dict,
                          processing_time_ms: int,
                          user_email: str = None,
                          user_ip: str = None,
                          user_agent: str = None,
                          session_id: str = None) -> bool:
        """Save transformation data to Supabase for analytics"""
        
        if not self.supabase:
            logger.debug("Supabase not configured, skipping analytics tracking")
            return False
        
        try:
            # Calculate metrics
            original_length = len(original_content)
            transformed_length = len(transformed_content)
            length_change_percent = ((transformed_length - original_length) / original_length * 100) if original_length > 0 else 0
            
            # Prepare data for insertion
            transformation_data = {
                'original_content': original_content,
                'transformed_content': transformed_content,
                'content_type': content_type,
                'target_audience': target_audience,
                'additional_context': additional_context or '',
                'original_length': original_length,
                'transformed_length': transformed_length,
                'length_change_percent': round(length_change_percent, 2),
                'justification': justification,
                'processing_time_ms': processing_time_ms,
                'api_model_used': self.deployment_name,
                'user_email': user_email,
                'user_ip': user_ip,
                'user_agent': user_agent,
                'session_id': session_id or str(uuid.uuid4())
            }
            
            # Insert into Supabase
            result = self.supabase.table('beforest_transformations').insert(transformation_data).execute()
            
            if result.data:
                logger.info(f"Transformation saved successfully with ID: {result.data[0].get('id', 'unknown')}")
                return True
            else:
                logger.warning("Failed to save transformation - no data returned")
                return False
                
        except Exception as e:
            logger.error(f"Failed to save transformation to Supabase: {str(e)}")
            return False

    def get_usage_stats(self, days_back: int = 7) -> Dict[str, Any]:
        """Get usage statistics from Supabase"""
        
        if not self.supabase:
            return {"error": "Supabase not configured"}
        
        try:
            # Call the stored function for usage stats
            result = self.supabase.rpc('get_beforest_usage_stats', {'days_back': days_back}).execute()
            
            if result.data:
                return result.data[0]
            else:
                return {"error": "No data returned"}
                
        except Exception as e:
            logger.error(f"Failed to get usage stats from Supabase: {str(e)}")
            return {"error": str(e)}

# Initialize the brand voice engine
brand_voice = BeforestBrandVoice()

@app.route('/')
def index():
    """Serve the main application page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory('.', filename)

@app.route('/transform', methods=['POST'])
def transform_content():
    """API endpoint for content transformation"""
    try:
        # Validate request
        if not request.is_json:
            return jsonify({'success': False, 'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        
        # Required fields validation
        required_fields = ['original_content', 'content_type', 'target_audience']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False, 
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Extract data
        original_content = data['original_content'].strip()
        content_type = data['content_type']
        target_audience = data['target_audience']
        additional_context = data.get('additional_context', '').strip()
        
        # Validate content length
        if len(original_content) < 10:
            return jsonify({
                'success': False, 
                'error': 'Original content is too short (minimum 10 characters)'
            }), 400
        
        if len(original_content) > 5000:
            return jsonify({
                'success': False, 
                'error': 'Original content is too long (maximum 5000 characters)'
            }), 400
        
        # Check if Azure OpenAI is configured
        if not brand_voice.azure_endpoint or not brand_voice.azure_key:
            return jsonify({
                'success': False,
                'error': 'Azure OpenAI is not configured. Please check your environment variables.'
            }), 500
        
        # Track processing time
        start_time = time.time()
        
        # Transform content
        transformed_content = brand_voice.transform_content(
            original_content=original_content,
            content_type=content_type,
            target_audience=target_audience,
            additional_context=additional_context
        )
        
        # Generate transformation justification
        justification = brand_voice.generate_justification(
            original_content=original_content,
            transformed_content=transformed_content,
            content_type=content_type,
            target_audience=target_audience
        )
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Get client information for analytics
        user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR'))
        user_agent = request.headers.get('User-Agent', '')
        session_id = request.headers.get('X-Session-ID') or data.get('session_id')
        user_email = data.get('user_email', '').strip()
        
        # Save transformation to Supabase for analytics
        saved = brand_voice.save_transformation(
            original_content=original_content,
            transformed_content=transformed_content,
            content_type=content_type,
            target_audience=target_audience,
            additional_context=additional_context,
            justification=justification,
            processing_time_ms=processing_time_ms,
            user_email=user_email,
            user_ip=user_ip,
            user_agent=user_agent,
            session_id=session_id
        )
        
        # Log transformation for monitoring
        logger.info(f"Transformation completed - Type: {content_type}, Audience: {target_audience}, Saved: {saved}")
        
        return jsonify({
            'success': True,
            'transformed_content': transformed_content,
            'justification': justification,
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'content_type': content_type,
                'target_audience': target_audience,
                'original_length': len(original_content),
                'transformed_length': len(transformed_content),
                'processing_time_ms': processing_time_ms,
                'saved_to_analytics': saved
            }
        })
        
    except Exception as e:
        logger.error(f"Transformation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Transformation failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'azure_configured': bool(brand_voice.azure_endpoint and brand_voice.azure_key)
    })

@app.route('/analytics', methods=['GET'])
def analytics():
    """Usage analytics endpoint"""
    try:
        days_back = int(request.args.get('days', 7))
        days_back = min(days_back, 90)  # Limit to 90 days max
        
        stats = brand_voice.get_usage_stats(days_back)
        
        if 'error' in stats:
            return jsonify({
                'success': False,
                'error': stats['error']
            }), 500
        
        return jsonify({
            'success': True,
            'period_days': days_back,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve analytics data'
        }), 500

@app.route('/history')
def history_page():
    """Serve the transformations history page"""
    return send_from_directory('.', 'history.html')

@app.route('/api/transformations', methods=['GET'])
def get_transformations():
    """API endpoint for fetching transformation history with pagination"""
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 6))
        per_page = min(per_page, 50)  # Limit to 50 max per page
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        if not brand_voice.supabase:
            return jsonify({
                'success': False,
                'error': 'Database not configured'
            }), 500
        
        # Get total count
        try:
            count_result = brand_voice.supabase.table('beforest_transformations').select('id', count='exact').execute()
            total_count = count_result.count if hasattr(count_result, 'count') else 0
        except:
            total_count = 0
        
        # Get transformations with pagination
        result = brand_voice.supabase.table('beforest_transformations').select(
            'id, created_at, content_type, target_audience, original_content, transformed_content, '
            'original_length, transformed_length, length_change_percent, justification, processing_time_ms, api_model_used, user_email'
        ).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        
        transformations = result.data if result.data else []
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'success': True,
            'transformations': transformations,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching transformations: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch transformation history'
        }), 500

@app.route('/api/info', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'Beforest Brand Voice Transformer',
        'version': '1.0.0',
        'description': 'Transform content to match Beforest brand voice',
        'endpoints': {
            '/': 'Main application interface',
            '/transform': 'POST - Transform content',
            '/analytics': 'GET - Usage analytics (query param: days=7)',
            '/health': 'GET - Health check',
            '/api/info': 'GET - API information'
        },
        'supported_content_types': [
            'email', 'social-media', 'whatsapp', 'proposal', 'presentation',
            'website-copy', 'marketing-material', 'internal-communication', 'press-release',
            'report', 'blog-post'
        ],
        'supported_audiences': [
            'existing-clients', 'prospects', 'internal-team', 'partners',
            'media', 'general-public', 'investors', 'vendors', 'researchers', 'regulators'
        ],
        'analytics_enabled': brand_voice.supabase is not None
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Beforest Brand Voice Transformer on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    # Check Azure OpenAI configuration on startup
    if not brand_voice.azure_endpoint or not brand_voice.azure_key:
        logger.warning("⚠️  Azure OpenAI not configured!")
        logger.warning("Please set the following environment variables:")
        logger.warning("- AZURE_OPENAI_ENDPOINT")
        logger.warning("- AZURE_OPENAI_KEY")
        logger.warning("- AZURE_OPENAI_DEPLOYMENT (optional, defaults to 'o3-mini')")
    else:
        logger.info("✅ Azure OpenAI configured successfully")
    
    # Check Supabase configuration
    if not brand_voice.supabase:
        logger.warning("⚠️  Supabase not configured - analytics disabled")
        logger.info("To enable analytics, set SUPABASE_URL and SUPABASE_SERVICE_KEY")
    else:
        logger.info("✅ Supabase configured successfully")
    
    # Only run the development server if not being run by gunicorn
    if os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn'):
        logger.info("Running under Gunicorn")
    else:
        app.run(host='0.0.0.0', port=port, debug=debug)