// Beforest Brand Voice Transformer - Enhanced Frontend JavaScript

class BrandVoiceTransformer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupKeyboardShortcuts();
        this.apiEndpoint = '/transform';
        this.isTransforming = false;
        this.sessionId = this.generateSessionId();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('transform-form');
        this.originalContentTextarea = document.getElementById('original-content');
        this.contentTypeSelect = document.getElementById('content-type');
        this.targetAudienceSelect = document.getElementById('target-audience');
        this.userEmailInput = document.getElementById('user-email');
        this.additionalContextInput = document.getElementById('additional-context');
        
        // Buttons
        this.transformBtn = document.getElementById('transform-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        this.copyBtn = document.getElementById('copy-btn');
        
        // Output elements
        this.outputPlaceholder = document.getElementById('output-placeholder');
        this.outputText = document.getElementById('output-text');
        this.transformationStats = document.getElementById('transformation-stats');
        this.transformationJustification = document.getElementById('transformation-justification');
        
        // Stats elements
        this.originalLengthSpan = document.getElementById('original-length');
        this.transformedLengthSpan = document.getElementById('transformed-length');
        this.lengthChangeSpan = document.getElementById('length-change');
        
        // Justification elements
        this.justificationToggle = document.querySelector('.justification-toggle');
        this.justificationContent = document.getElementById('justification-content');
        this.keyChangesList = document.getElementById('key-changes-list');
        this.brandImprovementsList = document.getElementById('brand-improvements-list');
        this.audienceAdaptation = document.getElementById('audience-adaptation');
        this.overallStrategy = document.getElementById('overall-strategy');
        
        // UI elements
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notification-text');
        this.notificationClose = document.querySelector('.notification-close');
        this.loadingSpinner = this.transformBtn.querySelector('.loading-spinner');
        this.btnText = this.transformBtn.querySelector('.btn-text');
        
        // Tips section
        this.tipsToggle = document.querySelector('.tips-toggle');
        this.tipsContent = document.getElementById('tips-content');
        
        // Modal elements
        this.shortcutsModal = document.getElementById('shortcuts-modal');
        this.modalClose = document.querySelector('.modal-close');
        this.modalOverlay = document.querySelector('.modal-overlay');
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransform();
        });
        
        // Button events
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.regenerateBtn.addEventListener('click', () => this.handleRegenerate());
        this.copyBtn.addEventListener('click', () => this.handleCopy());
        
        // Real-time validation
        this.originalContentTextarea.addEventListener('input', () => this.validateForm());
        this.contentTypeSelect.addEventListener('change', () => this.validateForm());
        this.targetAudienceSelect.addEventListener('change', () => this.validateForm());
        this.userEmailInput.addEventListener('input', () => this.validateForm());
        
        // Auto-resize textarea
        this.originalContentTextarea.addEventListener('input', this.autoResizeTextarea.bind(this));
        
        // Tips toggle
        this.tipsToggle.addEventListener('click', () => this.toggleTips());
        
        // Justification toggle
        if (this.justificationToggle) {
            this.justificationToggle.addEventListener('click', () => this.toggleJustification());
        }
        
        // Notification close
        this.notificationClose.addEventListener('click', () => this.hideNotification());
        
        // Modal events
        this.modalClose.addEventListener('click', () => this.hideShortcutsModal());
        this.modalOverlay.addEventListener('click', () => this.hideShortcutsModal());
        
        // Auto-hide notifications after click
        setTimeout(() => {
            if (this.notification.style.display !== 'none') {
                this.hideNotification();
            }
        }, 5000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to transform
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.isFormValid() && !this.isTransforming) {
                    this.handleTransform();
                }
            }
            
            // Ctrl/Cmd + K to clear
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.handleClear();
            }
            
            // ? to show shortcuts
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.showShortcutsModal();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.hideShortcutsModal();
                this.hideNotification();
            }
        });
    }

    autoResizeTextarea(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(140, textarea.scrollHeight) + 'px';
    }

    validateForm() {
        const isValid = this.isFormValid();
        this.transformBtn.disabled = !isValid || this.isTransforming;
        
        // Update form visual state
        this.updateFormState(isValid);
        return isValid;
    }

    isFormValid() {
        const emailValue = this.userEmailInput.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        return this.originalContentTextarea.value.trim() !== '' &&
               this.contentTypeSelect.value !== '' &&
               this.targetAudienceSelect.value !== '' &&
               emailValue !== '' &&
               emailPattern.test(emailValue);
    }

    updateFormState(isValid) {
        const form = this.form;
        if (isValid) {
            form.classList.add('form-valid');
            form.classList.remove('form-invalid');
        } else {
            form.classList.remove('form-valid');
            form.classList.add('form-invalid');
        }
    }

    async handleTransform() {
        if (!this.isFormValid() || this.isTransforming) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.setLoadingState(true);
        this.isTransforming = true;
        
        try {
            const transformData = {
                original_content: this.originalContentTextarea.value.trim(),
                content_type: this.contentTypeSelect.value,
                target_audience: this.targetAudienceSelect.value,
                user_email: this.userEmailInput.value.trim(),
                additional_context: this.additionalContextInput.value.trim()
            };

            const response = await this.callTransformAPI(transformData);
            
            if (response.success) {
                this.displayOutput(response.transformed_content, response.metadata, response.justification);
                this.showNotification('Content transformed successfully', 'success');
                
                // Track analytics (if needed)
                this.trackTransformation(transformData, response);
            } else {
                throw new Error(response.error || 'Transformation failed');
            }
        } catch (error) {
            console.error('Transform error:', error);
            this.showNotification(`Transformation failed: ${error.message}`, 'error');
        } finally {
            this.setLoadingState(false);
            this.isTransforming = false;
        }
    }

    async handleRegenerate() {
        if (!this.isFormValid() || this.isTransforming) {
            this.showNotification('Please ensure all fields are filled', 'error');
            return;
        }

        // Add regeneration context
        const currentContext = this.additionalContextInput.value.trim();
        const regenerateContext = currentContext ? 
            `${currentContext} (alternative version)` : 
            'Please provide an alternative version';
        
        const originalContext = this.additionalContextInput.value;
        this.additionalContextInput.value = regenerateContext;
        
        await this.handleTransform();
        
        // Restore original context
        this.additionalContextInput.value = originalContext;
    }

    async callTransformAPI(data) {
        // Add session ID to the request
        const requestData = {
            ...data,
            session_id: this.sessionId
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    displayOutput(content, metadata = {}, justification = null) {
        // Show output content
        this.outputPlaceholder.style.display = 'none';
        this.outputText.style.display = 'block';
        this.outputText.textContent = content;
        
        // Update transformation stats
        this.updateTransformationStats(metadata);
        
        // Update justification if provided
        if (justification) {
            this.updateJustification(justification);
        }
        
        // Enable action buttons
        this.regenerateBtn.disabled = false;
        this.copyBtn.disabled = false;
        
        // Add smooth scroll animation
        this.outputText.style.opacity = '0';
        this.outputText.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            this.outputText.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.outputText.style.opacity = '1';
            this.outputText.style.transform = 'translateY(0)';
        });
        
        // Scroll to output on mobile
        if (window.innerWidth <= 768) {
            this.outputText.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateTransformationStats(metadata) {
        if (!metadata) return;
        
        const originalLength = metadata.original_length || 0;
        const transformedLength = metadata.transformed_length || 0;
        const changePercent = originalLength > 0 ? 
            Math.round(((transformedLength - originalLength) / originalLength) * 100) : 0;
        
        this.originalLengthSpan.textContent = originalLength.toLocaleString();
        this.transformedLengthSpan.textContent = transformedLength.toLocaleString();
        this.lengthChangeSpan.textContent = changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
        
        // Color code the change
        if (changePercent > 0) {
            this.lengthChangeSpan.style.color = 'var(--forest-green)';
        } else if (changePercent < 0) {
            this.lengthChangeSpan.style.color = 'var(--rich-red)';
        } else {
            this.lengthChangeSpan.style.color = 'var(--text-secondary)';
        }
        
        this.transformationStats.style.display = 'block';
    }

    updateJustification(justification) {
        if (!justification || !this.transformationJustification) return;
        
        try {
            // Clear existing content
            this.keyChangesList.innerHTML = '';
            this.brandImprovementsList.innerHTML = '';
            this.audienceAdaptation.textContent = '';
            this.overallStrategy.textContent = '';
            
            // Populate key changes
            if (justification.key_changes && Array.isArray(justification.key_changes)) {
                justification.key_changes.forEach(change => {
                    const li = document.createElement('li');
                    li.textContent = change;
                    this.keyChangesList.appendChild(li);
                });
            }
            
            // Populate brand voice improvements
            if (justification.brand_voice_improvements && Array.isArray(justification.brand_voice_improvements)) {
                justification.brand_voice_improvements.forEach(improvement => {
                    const li = document.createElement('li');
                    li.textContent = improvement;
                    this.brandImprovementsList.appendChild(li);
                });
            }
            
            // Populate audience adaptation
            if (justification.audience_adaptation) {
                this.audienceAdaptation.textContent = justification.audience_adaptation;
            }
            
            // Populate overall strategy
            if (justification.overall_strategy) {
                this.overallStrategy.textContent = justification.overall_strategy;
            }
            
            // Show the justification section
            this.transformationJustification.style.display = 'block';
            
        } catch (error) {
            console.error('Error updating justification:', error);
            // Show fallback message
            this.keyChangesList.innerHTML = '<li>Enhanced content clarity and brand alignment</li>';
            this.brandImprovementsList.innerHTML = '<li>Applied Beforest brand voice principles</li>';
            this.audienceAdaptation.textContent = 'Content adapted for target audience';
            this.overallStrategy.textContent = 'Transformed to match Beforest\'s authentic, data-driven communication style';
            this.transformationJustification.style.display = 'block';
        }
    }

    async handleCopy() {
        const content = this.outputText.textContent;
        
        if (!content) {
            this.showNotification('No content to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.showNotification('Content copied to clipboard', 'success');
            
            // Visual feedback
            const originalText = this.copyBtn.textContent;
            const originalBg = this.copyBtn.style.background;
            
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.style.background = 'var(--soft-green)';
            this.copyBtn.style.color = 'var(--dark-earth)';
            
            setTimeout(() => {
                this.copyBtn.textContent = originalText;
                this.copyBtn.style.background = originalBg;
                this.copyBtn.style.color = '';
            }, 2000);
        } catch (error) {
            console.error('Copy error:', error);
            this.showNotification('Failed to copy content', 'error');
        }
    }

    handleClear() {
        // Clear all form fields
        this.originalContentTextarea.value = '';
        this.contentTypeSelect.value = '';
        this.targetAudienceSelect.value = '';
        this.userEmailInput.value = '';
        this.additionalContextInput.value = '';
        
        // Reset output
        this.outputPlaceholder.style.display = 'flex';
        this.outputText.style.display = 'none';
        this.outputText.textContent = '';
        this.transformationStats.style.display = 'none';
        if (this.transformationJustification) {
            this.transformationJustification.style.display = 'none';
        }
        
        // Disable action buttons
        this.regenerateBtn.disabled = true;
        this.copyBtn.disabled = true;
        
        // Reset textarea height
        this.originalContentTextarea.style.height = '140px';
        
        // Re-validate form
        this.validateForm();
        
        // Focus on first input
        this.originalContentTextarea.focus();
        
        this.showNotification('Form cleared', 'info');
    }

    setLoadingState(isLoading) {
        this.transformBtn.disabled = isLoading || !this.isFormValid();
        
        if (isLoading) {
            this.btnText.style.display = 'none';
            this.loadingSpinner.style.display = 'flex';
            this.transformBtn.style.cursor = 'not-allowed';
        } else {
            this.btnText.style.display = 'inline';
            this.loadingSpinner.style.display = 'none';
            this.transformBtn.style.cursor = 'pointer';
        }
    }

    // Tips functionality
    toggleTips() {
        const isExpanded = this.tipsToggle.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        this.tipsToggle.setAttribute('aria-expanded', newState);
        
        if (newState) {
            this.tipsContent.style.display = 'block';
            this.tipsToggle.querySelector('.tips-toggle-text').textContent = 'Hide';
        } else {
            this.tipsContent.style.display = 'none';
            this.tipsToggle.querySelector('.tips-toggle-text').textContent = 'Show';
        }
    }

    // Justification functionality
    toggleJustification() {
        if (!this.justificationToggle || !this.justificationContent) return;
        
        const isExpanded = this.justificationToggle.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        this.justificationToggle.setAttribute('aria-expanded', newState);
        
        if (newState) {
            this.justificationContent.style.display = 'block';
            this.justificationToggle.querySelector('.justification-toggle-text').textContent = 'Hide';
        } else {
            this.justificationContent.style.display = 'none';
            this.justificationToggle.querySelector('.justification-toggle-text').textContent = 'Show';
        }
    }

    // Modal functionality
    showShortcutsModal() {
        this.shortcutsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = this.shortcutsModal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    hideShortcutsModal() {
        this.shortcutsModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Enhanced notification system
    showNotification(message, type = 'info', duration = 4000) {
        this.notificationText.textContent = message;
        
        // Remove existing type classes
        this.notification.classList.remove('success', 'error', 'info', 'warning');
        this.notification.classList.add(type);
        
        // Show notification
        this.notification.style.display = 'block';
        
        // Auto-hide
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, duration);
    }

    hideNotification() {
        this.notification.style.display = 'none';
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
    }

    // Analytics tracking (optional)
    trackTransformation(data, response) {
        // Track usage for analytics if needed
        const event = {
            event: 'content_transformed',
            content_type: data.content_type,
            target_audience: data.target_audience,
            original_length: data.original_content.length,
            transformed_length: response.transformed_content?.length || 0,
            timestamp: new Date().toISOString()
        };
        
        console.log('Transformation event:', event);
        
        // Send to analytics service if configured
        // analytics.track(event);
    }

    // Utility methods
    generateSessionId() {
        // Generate a unique session ID for analytics tracking
        return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    getFormData() {
        return {
            original_content: this.originalContentTextarea.value.trim(),
            content_type: this.contentTypeSelect.value,
            target_audience: this.targetAudienceSelect.value,
            additional_context: this.additionalContextInput.value.trim()
        };
    }

    prefillForm(data) {
        if (data.original_content) this.originalContentTextarea.value = data.original_content;
        if (data.content_type) this.contentTypeSelect.value = data.content_type;
        if (data.target_audience) this.targetAudienceSelect.value = data.target_audience;
        if (data.additional_context) this.additionalContextInput.value = data.additional_context;
        
        this.validateForm();
        this.autoResizeTextarea({ target: this.originalContentTextarea });
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`${context} error:`, error);
        this.showNotification(`${context}: ${error.message}`, 'error');
    }

    // Theme management (for future enhancement)
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('beforest-theme', theme);
    }

    getTheme() {
        return localStorage.getItem('beforest-theme') || 'light';
    }
}

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new BrandVoiceTransformer();
        
        // Make app globally accessible for debugging
        window.brandVoiceApp = app;
        
        // Check for URL parameters to prefill form
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('content')) {
            app.prefillForm({
                original_content: urlParams.get('content'),
                content_type: urlParams.get('type'),
                target_audience: urlParams.get('audience'),
                additional_context: urlParams.get('context')
            });
        }
        
        // Initialize theme
        const theme = app.getTheme();
        if (theme !== 'light') {
            app.setTheme(theme);
        }
        
        console.log('Beforest Brand Voice Transformer initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Brand Voice Transformer:', error);
        
        // Show fallback error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; 
            background: #dc2626; color: white; 
            padding: 16px; border-radius: 8px; 
            z-index: 9999; max-width: 300px;
        `;
        errorDiv.textContent = 'Failed to initialize application. Please refresh the page.';
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
});

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('beforest-app-loaded');
}