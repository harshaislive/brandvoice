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
        // Load settings from backend
        fetch('/api/settings', {
            headers: {
                'X-Settings-Auth': sessionStorage.getItem('settings_authenticated') || 'false'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.populateSettings(data.settings);
                } else {
                    // If unauthorized or error, show defaults
                    this.populateDefaultSettings();
                }
            })
            .catch(error => {
                console.error('Failed to load settings:', error);
                // Load default settings
                this.populateDefaultSettings();
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
            document.getElementById('temperature').value = settings.model.temperature || 0.7;
            document.getElementById('topP').value = settings.model.top_p || 0.9;
            document.getElementById('frequencyPenalty').value = settings.model.frequency_penalty || 0;
            document.getElementById('presencePenalty').value = settings.model.presence_penalty || 0;
        }
    }

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
            temperature: parseFloat(document.getElementById('temperature').value),
            top_p: parseFloat(document.getElementById('topP').value),
            frequency_penalty: parseFloat(document.getElementById('frequencyPenalty').value),
            presence_penalty: parseFloat(document.getElementById('presencePenalty').value)
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

// Initialize settings manager
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});