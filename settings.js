// Settings Page JavaScript
class SettingsManager {
    constructor() {
        this.PASSKEY_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // Default: '123456'
        this.authenticated = false;
        this.currentTab = 'prompts';
        this.templates = this.loadTemplates();
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthentication();
        this.loadCurrentSettings();
    }

    bindEvents() {
        // Authentication form
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.authenticate();
            });
        }

        // Tab switching
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    async authenticate() {
        const passkey = document.getElementById('passkey').value;
        const authButton = document.querySelector('.auth-button');
        const authButtonText = document.getElementById('authButtonText');
        const authLoading = document.getElementById('authLoading');
        const authError = document.getElementById('authError');
        const passkeyInput = document.getElementById('passkey');

        // Show loading state
        authButton.disabled = true;
        authButtonText.style.display = 'none';
        authLoading.style.display = 'block';
        authError.style.display = 'none';

        // Simulate slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        const hashedPasskey = await this.hashPasskey(passkey);

        if (hashedPasskey === this.PASSKEY_HASH) {
            this.authenticated = true;
            sessionStorage.setItem('settings_authenticated', 'true');
            
            // Success animation
            authButtonText.textContent = 'Access Granted!';
            authButtonText.style.display = 'block';
            authLoading.style.display = 'none';
            authButton.style.background = '#22c55e';
            
            setTimeout(() => {
                this.showSettings();
            }, 800);
        } else {
            // Error handling
            authButton.disabled = false;
            authButtonText.style.display = 'block';
            authLoading.style.display = 'none';
            authError.style.display = 'block';
            
            // Shake animation
            passkeyInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passkeyInput.style.animation = '';
            }, 500);
            
            // Clear input
            passkeyInput.value = '';
            passkeyInput.focus();
        }
    }

    async hashPasskey(passkey) {
        // Simple SHA-256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(passkey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    checkAuthentication() {
        if (sessionStorage.getItem('settings_authenticated') === 'true') {
            this.authenticated = true;
            this.showSettings();
        }
    }

    showSettings() {
        const authModal = document.getElementById('authModal');
        const settingsContent = document.getElementById('settingsContent');
        
        // Fade out auth modal
        authModal.style.opacity = '0';
        authModal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            authModal.style.display = 'none';
            settingsContent.classList.add('authenticated');
            
            // Fade in settings content
            settingsContent.style.opacity = '0';
            setTimeout(() => {
                settingsContent.style.transition = 'opacity 0.3s ease';
                settingsContent.style.opacity = '1';
            }, 50);
        }, 300);
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active panel
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });

        this.currentTab = tabName;
    }

    loadCurrentSettings() {
        // Load settings from backend (always from Supabase)
        fetch('/api/settings', {
            headers: {
                'X-Settings-Auth': sessionStorage.getItem('settings_authenticated') || 'false'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.settings) {
                    this.populateSettings(data.settings);
                } else {
                    console.error('Failed to load settings from Supabase:', data.error || 'Unknown error');
                    // Show error message instead of defaults
                    this.showSettingsError('Unable to load settings from database. Please check your connection.');
                }
            })
            .catch(error => {
                console.error('Failed to load settings:', error);
                // Show error message instead of defaults
                this.showSettingsError('Connection error. Unable to load settings from database.');
            });
    }

    populateSettings(settings) {
        // Populate prompts
        if (settings.prompts) {
            document.getElementById('mainPrompt').value = settings.prompts.main || '';
            document.getElementById('transformPrompt').value = settings.prompts.transform || '';
            document.getElementById('justificationPrompt').value = settings.prompts.justification || '';
        }

        // Populate model settings
        if (settings.model) {
            document.getElementById('deploymentName').value = settings.model.deployment || 'o3-mini';
            document.getElementById('maxTokens').value = settings.model.max_tokens || 2000;
            document.getElementById('reasoningEffort').value = settings.model.reasoning_effort || 'medium';
            document.getElementById('apiVersion').value = settings.model.api_version || '2025-01-01-preview';
        }
    }

    showSettingsError(message) {
        // Show error message to user instead of loading defaults
        const settingsContent = document.getElementById('settingsContent');
        if (settingsContent) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
                text-align: center;
            `;
            errorDiv.innerHTML = `
                <h3>Settings Load Error</h3>
                <p>${message}</p>
                <button onclick="window.location.reload()" style="
                    background: #dc3545;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Retry</button>
            `;
            settingsContent.insertBefore(errorDiv, settingsContent.firstChild);
        }
    }

    // DEPRECATED: This method is no longer used. Settings now always load from Supabase.
    // Keeping for reference only.
    /*
    populateDefaultSettings() {
        // Default Beforest brand voice prompt
        const defaultMainPrompt = `You are the Beforest Brand Voice Transformer, an expert AI assistant specialized in transforming content to match Beforest's exact brand voice and communication style.

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
- Let evidence speak for itself`;

        const defaultTransformPrompt = `Transform the following content for Beforest:

ORIGINAL CONTENT:
{original_content}

CONTENT TYPE: {content_type}
TARGET AUDIENCE: {target_audience}
ADDITIONAL CONTEXT: {additional_context}

Please transform this content to perfectly match Beforest's brand voice while maintaining the original message's intent and key information.`;

        const defaultJustificationPrompt = `Analyze the transformation and explain:
1. Key changes made
2. How changes align with brand voice
3. Audience-specific adaptations`;

        document.getElementById('mainPrompt').value = defaultMainPrompt;
        document.getElementById('transformPrompt').value = defaultTransformPrompt;
        document.getElementById('justificationPrompt').value = defaultJustificationPrompt;
    }
    */

    loadTemplates() {
        return {
            concise: {
                name: 'Concise & Direct',
                prompt: `Focus on brevity and impact. Requirements:
- Maximum 2-3 sentences per paragraph
- Remove all unnecessary words
- Lead with the most important information
- Use active voice exclusively
- Eliminate redundancy`
            },
            analytical: {
                name: 'Data-Driven',
                prompt: `Emphasize facts, data, and evidence. Requirements:
- Include specific numbers and metrics
- Reference studies or research when available
- Use precise technical language
- Present information objectively
- Structure content logically with clear data points`
            },
            educational: {
                name: 'Educational',
                prompt: `Explain complex concepts simply. Requirements:
- Break down technical terms
- Use analogies where appropriate
- Structure information progressively
- Provide clear examples
- Maintain expertise while being accessible`
            },
            professional: {
                name: 'Professional',
                prompt: `Formal business communication. Requirements:
- Use industry-standard terminology
- Maintain formal tone without being stiff
- Focus on business value and outcomes
- Structure with executive summary approach
- Emphasize ROI and strategic benefits`
            },
            authentic: {
                name: 'Authentic Voice',
                prompt: `Natural, conversational tone. Requirements:
- Write as if speaking to a colleague
- Use contractions where appropriate
- Include personal insights or experiences
- Maintain professionalism while being relatable
- Avoid corporate speak`
            },
            technical: {
                name: 'Technical',
                prompt: `For technical documentation. Requirements:
- Use precise technical terminology
- Include implementation details
- Structure with clear hierarchies
- Provide code examples where relevant
- Focus on accuracy over simplicity`
            }
        };
    }

    loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (template) {
            document.getElementById('templatePreview').value = template.prompt;
        }
    }

    applyTemplate() {
        const templateContent = document.getElementById('templatePreview').value;
        if (templateContent && confirm('Apply this template to the main prompt?')) {
            const currentPrompt = document.getElementById('mainPrompt').value;
            document.getElementById('mainPrompt').value = currentPrompt + '\n\n' + templateContent;
            alert('Template applied to main prompt');
        }
    }

    async savePrompts() {
        const prompts = {
            main: document.getElementById('mainPrompt').value,
            transform: document.getElementById('transformPrompt').value,
            justification: document.getElementById('justificationPrompt').value
        };

        try {
            const response = await fetch('/api/settings/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Settings-Auth': sessionStorage.getItem('settings_authenticated')
                },
                body: JSON.stringify({ prompts })
            });

            const result = await response.json();
            if (result.success) {
                alert('Prompts saved successfully');
            } else {
                alert('Failed to save prompts: ' + result.error);
            }
        } catch (error) {
            alert('Error saving prompts: ' + error.message);
        }
    }

    async saveModelSettings() {
        const modelSettings = {
            deployment: document.getElementById('deploymentName').value,
            max_tokens: parseInt(document.getElementById('maxTokens').value),
            reasoning_effort: document.getElementById('reasoningEffort').value,
            api_version: document.getElementById('apiVersion').value
        };

        try {
            const response = await fetch('/api/settings/model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Settings-Auth': sessionStorage.getItem('settings_authenticated')
                },
                body: JSON.stringify({ model: modelSettings })
            });

            const result = await response.json();
            if (result.success) {
                alert('Model settings saved successfully');
            } else {
                alert('Failed to save model settings: ' + result.error);
            }
        } catch (error) {
            alert('Error saving model settings: ' + error.message);
        }
    }
}

// Example prompts data
const EXAMPLE_PROMPTS = {
    scientific: {
        title: 'Scientific Focus',
        prompt: `You are the Beforest Scientific Communication Specialist.

CORE PRINCIPLES:
- Lead with data and research findings
- Use precise scientific terminology
- Reference studies and methodologies when relevant
- Quantify improvements and outcomes
- Maintain peer-review level accuracy

VOICE REQUIREMENTS:
- Objective, measured tone
- Hypothesis-driven language
- Evidence-based assertions only
- Clear cause-effect relationships
- No speculation without data

PROHIBITED:
- Anecdotal evidence as primary support
- Vague claims ("studies show" without specifics)
- Emotional appeals
- Marketing hyperbole
- Unsubstantiated correlations`,
        before: "Our amazing product delivers incredible results that will revolutionize your workflow! Users love how it transforms their daily operations with cutting-edge features.",
        after: "Our product demonstrates a 34% improvement in workflow efficiency based on a 90-day study of 200 users. Key metrics include 2.5 hour daily time savings and 89% task completion rate.",
        characteristics: [
            "Specific percentages and metrics replace vague claims",
            "Study parameters provide credibility",
            "Objective measurement replaces emotional language",
            "Focus on quantifiable outcomes"
        ]
    },
    minimal: {
        title: 'Ultra Minimal',
        prompt: `You are the Beforest Minimalist Voice.

CORE PRINCIPLE: Maximum impact. Minimum words.

REQUIREMENTS:
- One idea per sentence
- Active voice only
- Cut every unnecessary word
- Lead with the point
- End when done

STRUCTURE:
- Short sentences (5-10 words ideal)
- Simple words over complex
- Facts over flourish
- Direct over diplomatic

NEVER:
- Use filler phrases
- Repeat concepts
- Add decorative language
- Explain the obvious`,
        before: "We would like to take this opportunity to inform you that our comprehensive suite of solutions has been carefully designed to address the various challenges that modern businesses face in today's rapidly evolving marketplace.",
        after: "We solve modern business challenges. Our solutions adapt as markets change.",
        characteristics: [
            "Average 6 words per sentence",
            "Every word serves a purpose",
            "Complex ideas simplified",
            "Zero redundancy"
        ]
    },
    educational: {
        title: 'Educational',
        prompt: `You are the Beforest Education Specialist.

PURPOSE: Make complex simple. Never simplistic.

TEACHING APPROACH:
- Build knowledge progressively
- Define technical terms on first use
- Use analogies to familiar concepts
- Provide clear examples
- Check understanding with summaries

VOICE CHARACTERISTICS:
- Patient, never patronizing
- Encouraging curiosity
- Respecting prior knowledge
- Clear structure with signposting
- Interactive where possible

AVOID:
- Assuming too much or too little knowledge
- Academic jargon without explanation
- Overwhelming with information
- Talking down to the audience`,
        before: "Quantum computing leverages superposition and entanglement to perform computations exponentially faster than classical computers for certain problem sets.",
        after: "Quantum computing works differently than regular computers. While your laptop processes information as 1s or 0s, quantum computers use 'qubits' that can be both at once—like a coin spinning in the air. This allows them to explore many solutions simultaneously, making them powerful for specific problems like drug discovery.",
        characteristics: [
            "Technical terms explained immediately",
            "Relatable analogies (spinning coin)",
            "Progressive complexity building",
            "Practical applications mentioned"
        ]
    },
    conversational: {
        title: 'Conversational',
        prompt: `You are the Beforest Conversational Voice.

APPROACH: Professional colleague having coffee.

TONE ELEMENTS:
- Natural speech patterns
- Contractions where appropriate
- Direct address ("you")
- Occasional rhetorical questions
- Warm but not casual

MAINTAIN:
- Expertise and authority
- Factual accuracy
- Respectful distance
- Professional boundaries
- Clear communication

AVOID:
- Slang or trendy phrases
- Over-familiarity
- Emoji or excessive punctuation
- Sacrificing clarity for friendliness`,
        before: "The implementation of our systematic methodology will facilitate the optimization of your organizational processes through the utilization of advanced analytical frameworks.",
        after: "Here's how we'll improve your processes: We'll analyze what you're doing now, identify the bottlenecks, and implement proven solutions. You'll see results within the first month.",
        characteristics: [
            "Direct address creates connection",
            "Natural flow with contractions",
            "Clear sequence of events",
            "Concrete timeline provided"
        ]
    },
    technical: {
        title: 'Technical Precision',
        prompt: `You are the Beforest Technical Documentation Specialist.

REQUIREMENTS:
- IEEE/ISO standard terminology
- Precise specifications
- Version numbers and compatibility
- Implementation details
- Performance benchmarks

FORMAT:
- Structured hierarchically
- Numbered steps for procedures
- Clear prerequisites
- Expected outputs defined
- Error states documented

TONE:
- Neutral and objective
- Unambiguous instructions
- Complete information
- No assumptions about implementation

EXCLUDE:
- Marketing language
- Subjective assessments
- Vague requirements
- Incomplete specifications`,
        before: "Our API is fast and easy to use, with great documentation that helps you get started quickly!",
        after: "API response time: <200ms at p95. RESTful architecture supporting JSON/XML. Authentication via OAuth 2.0. Rate limit: 1000 requests/minute. Full OpenAPI 3.0 specification available. SDK support for Python 3.8+, Node.js 14+, Java 11+.",
        characteristics: [
            "Specific performance metrics (p95)",
            "Technical standards referenced",
            "Concrete version requirements",
            "Measurable limits defined"
        ]
    },
    storytelling: {
        title: 'Fact-Based Storytelling',
        prompt: `You are the Beforest Narrative Specialist.

APPROACH: Tell true stories. No embellishment needed.

NARRATIVE STRUCTURE:
- Clear timeline of events
- Specific people and places
- Measurable outcomes
- Logical cause and effect
- Natural conclusion

VOICE ELEMENTS:
- Descriptive but not dramatic
- Focus on actions and results
- Let facts create interest
- Chronological clarity
- Human element without sentiment

NEVER:
- Add dramatic flourishes
- Manufacture tension
- Exaggerate for effect
- Use cliffhangers
- Manipulate emotions`,
        before: "In an AMAZING turn of events, our HEROIC team CONQUERED the seemingly IMPOSSIBLE challenge, REVOLUTIONIZING the industry FOREVER!!!",
        after: "In March 2023, our team identified a processing bottleneck affecting 10,000 daily users. Over six weeks, they developed a new caching system. Result: processing time decreased from 8 seconds to 0.3 seconds. This solution now serves as the industry standard.",
        characteristics: [
            "Specific dates and numbers",
            "Clear problem-solution narrative",
            "Measurable improvements",
            "Factual impact statement"
        ]
    }
};

// Global functions for onclick handlers
function savePrompts() {
    window.settingsManager.savePrompts();
}

function saveModelSettings() {
    window.settingsManager.saveModelSettings();
}

function loadTemplate(templateKey) {
    window.settingsManager.loadTemplate(templateKey);
}

function applyTemplate() {
    window.settingsManager.applyTemplate();
}

function showExample(exampleKey) {
    const example = EXAMPLE_PROMPTS[exampleKey];
    if (!example) return;
    
    // Update active state
    document.querySelectorAll('.example-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.example-card').classList.add('active');
    
    // Update content
    document.getElementById('exampleTitle').textContent = example.title;
    document.getElementById('examplePrompt').textContent = example.prompt;
    document.getElementById('exampleBefore').textContent = example.before;
    document.getElementById('exampleAfter').textContent = example.after;
    
    // Update characteristics
    const characteristicsList = document.getElementById('exampleCharacteristics');
    characteristicsList.innerHTML = '';
    example.characteristics.forEach(char => {
        const li = document.createElement('li');
        li.textContent = char;
        characteristicsList.appendChild(li);
    });
    
    // Smooth scroll to detail
    document.getElementById('exampleDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function applyBeforestPreset() {
    if (confirm('Apply the recommended Beforest brand voice parameters? This will overwrite current model settings.')) {
        // Apply Beforest recommended settings
        document.getElementById('reasoningEffort').value = 'medium';
        document.getElementById('maxTokens').value = 2000;
        
        // Highlight the recommended row
        const recommendedRow = document.querySelector('.recommended-row');
        if (recommendedRow) {
            recommendedRow.style.animation = 'highlight 2s ease';
            setTimeout(() => {
                recommendedRow.style.animation = '';
            }, 2000);
        }
        
        alert('Beforest preset applied for o3-mini! Remember to save your settings.');
    }
}

// Export/Import Functions
async function exportSettings() {
    try {
        // Get current settings from backend
        const response = await fetch('/api/settings', {
            headers: {
                'X-Settings-Auth': sessionStorage.getItem('settings_authenticated') || 'true'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        const settings = data.settings;
        
        // Add metadata
        const exportData = {
            version: '1.0',
            exported_at: new Date().toISOString(),
            settings: settings
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beforest-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Settings exported successfully!');
    } catch (error) {
        alert('Failed to export settings: ' + error.message);
    }
}

async function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusDiv = document.getElementById('importStatus');
    statusDiv.style.display = 'block';
    
    try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data
        if (!importData.settings || !importData.version) {
            throw new Error('Invalid settings file format');
        }
        
        // Show preview
        if (!confirm(`Import settings from ${importData.exported_at}?\n\nThis will overwrite your current settings.`)) {
            statusDiv.style.display = 'none';
            return;
        }
        
        // Import prompts
        if (importData.settings.prompts) {
            const response = await fetch('/api/settings/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Settings-Auth': sessionStorage.getItem('settings_authenticated')
                },
                body: JSON.stringify({ prompts: importData.settings.prompts })
            });
            
            if (!response.ok) {
                throw new Error('Failed to import prompts');
            }
        }
        
        // Import model settings
        if (importData.settings.model) {
            const response = await fetch('/api/settings/model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Settings-Auth': sessionStorage.getItem('settings_authenticated')
                },
                body: JSON.stringify({ model: importData.settings.model })
            });
            
            if (!response.ok) {
                throw new Error('Failed to import model settings');
            }
        }
        
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.textContent = 'Settings imported successfully! Refreshing...';
        
        // Reload settings
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        statusDiv.textContent = 'Import failed: ' + error.message;
    }
    
    // Clear file input
    event.target.value = '';
}

// Initialize settings manager
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});