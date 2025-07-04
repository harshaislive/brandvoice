/**
 * Beforest Brand Voice Transformer - History Page
 * Handles transformation history display, pagination, and modal interactions
 */

class TransformationHistory {
    constructor() {
        this.currentPage = 1;
        this.perPage = 6;
        this.totalPages = 0;
        this.transformations = [];
        this.init();
    }

    init() {
        this.loadTransformations();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal close events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadTransformations(page = 1) {
        try {
            this.showLoading();
            
            const response = await fetch(`/api/transformations?page=${page}&per_page=${this.perPage}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load transformations');
            }
            
            this.transformations = data.transformations;
            this.currentPage = data.pagination.page;
            this.totalPages = data.pagination.total_pages;
            
            if (this.transformations.length === 0 && page === 1) {
                this.showEmptyState();
            } else {
                this.renderTransformations();
                this.renderPagination(data.pagination);
            }
            
        } catch (error) {
            console.error('Error loading transformations:', error);
            this.showError('Failed to load transformation history. Please try again.');
        }
    }

    showLoading() {
        document.getElementById('loading-state').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('transformations-grid').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    }

    showEmptyState() {
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
        document.getElementById('transformations-grid').style.display = 'none';
        document.getElementById('pagination').style.display = 'none';
    }

    showError(message) {
        document.getElementById('loading-state').style.display = 'none';
        // You could implement a proper error state here
        alert(message);
    }

    renderTransformations() {
        const grid = document.getElementById('transformations-grid');
        
        grid.innerHTML = this.transformations.map(transformation => 
            this.createTransformationCard(transformation)
        ).join('');
        
        // Add click listeners to cards
        grid.querySelectorAll('.transformation-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.openModal(this.transformations[index]);
            });
        });
        
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('transformations-grid').style.display = 'grid';
    }

    createTransformationCard(transformation) {
        const date = new Date(transformation.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const contentTypeDisplay = transformation.content_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const audienceDisplay = transformation.target_audience.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const lengthChange = transformation.length_change_percent || 0;
        const changeClass = lengthChange > 0 ? 'positive' : lengthChange < 0 ? 'negative' : 'neutral';
        const changeText = lengthChange > 0 ? `+${lengthChange}%` : `${lengthChange}%`;
        
        // Truncate preview text
        const previewText = transformation.transformed_content.length > 150 
            ? transformation.transformed_content.substring(0, 150) + '...'
            : transformation.transformed_content;

        return `
            <div class="transformation-card" data-id="${transformation.id}">
                <div class="card-header">
                    <div class="card-meta">
                        <div class="card-date">${date}</div>
                        <div class="card-type">${contentTypeDisplay}</div>
                        <div class="card-audience">For ${audienceDisplay}</div>
                    </div>
                </div>
                
                <div class="card-preview">
                    <div class="preview-text">${this.escapeHtml(previewText)}</div>
                </div>
                
                <div class="card-stats">
                    <div class="stat-group">
                        <div class="stat-item">
                            <div class="stat-value">${transformation.original_length}</div>
                            <div class="stat-label">Original</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${transformation.transformed_length}</div>
                            <div class="stat-label">Transformed</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${transformation.processing_time_ms}ms</div>
                            <div class="stat-label">Processing</div>
                        </div>
                    </div>
                    <div class="length-change ${changeClass}">
                        ${changeText}
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        
        if (pagination.total_pages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${!pagination.has_prev ? 'disabled' : ''}" 
                    onclick="history.goToPage(${pagination.page - 1})"
                    ${!pagination.has_prev ? 'disabled' : ''}>
                ← Previous
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.total_pages, pagination.page + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="history.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === pagination.page ? 'current' : ''}" 
                        onclick="history.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < pagination.total_pages) {
            if (endPage < pagination.total_pages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="history.goToPage(${pagination.total_pages})">${pagination.total_pages}</button>`;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn ${!pagination.has_next ? 'disabled' : ''}" 
                    onclick="history.goToPage(${pagination.page + 1})"
                    ${!pagination.has_next ? 'disabled' : ''}>
                Next →
            </button>
        `;
        
        // Pagination info
        const start = (pagination.page - 1) * pagination.per_page + 1;
        const end = Math.min(pagination.page * pagination.per_page, pagination.total_count);
        paginationHTML += `
            <div class="pagination-info">
                Showing ${start}-${end} of ${pagination.total_count} transformations
            </div>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        paginationContainer.style.display = 'flex';
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.loadTransformations(page);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    openModal(transformation) {
        const modal = document.getElementById('detail-modal');
        const modalContent = document.getElementById('modal-content');
        
        const date = new Date(transformation.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const contentTypeDisplay = transformation.content_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const audienceDisplay = transformation.target_audience.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const lengthChange = transformation.length_change_percent || 0;
        const changeText = lengthChange > 0 ? `+${lengthChange}%` : `${lengthChange}%`;
        
        modalContent.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4);">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-1);">${date}</div>
                        <div style="display: flex; gap: var(--space-3); align-items: center;">
                            <span class="card-type">${contentTypeDisplay}</span>
                            <span style="color: var(--text-secondary);">for ${audienceDisplay}</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Length Change</div>
                        <div style="font-weight: 600; font-size: 1.125rem; color: ${lengthChange >= 0 ? 'var(--forest-green)' : 'var(--rich-red)'};">${changeText}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
                    <div>
                        <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-3); color: var(--text-primary);">
                            📝 Original Content
                        </h4>
                        <div style="background: var(--surface-tertiary); padding: var(--space-4); border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">
                            ${this.escapeHtml(transformation.original_content)}
                        </div>
                        <div style="margin-top: var(--space-2); font-size: 0.875rem; color: var(--text-secondary);">
                            ${transformation.original_length} characters
                        </div>
                    </div>
                    
                    <div>
                        <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-3); color: var(--text-primary);">
                            ✨ Transformed Content
                        </h4>
                        <div style="background: rgba(52, 71, 54, 0.05); padding: var(--space-4); border-radius: var(--radius-md); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; max-height: 300px; overflow-y: auto; border: 1px solid rgba(52, 71, 54, 0.2);">
                            ${this.escapeHtml(transformation.transformed_content)}
                        </div>
                        <div style="margin-top: var(--space-2); font-size: 0.875rem; color: var(--text-secondary);">
                            ${transformation.transformed_length} characters
                        </div>
                    </div>
                </div>

                ${transformation.justification ? this.renderJustification(transformation.justification) : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-4); border-top: 1px solid var(--border-subtle);">
                    <div style="display: flex; gap: var(--space-6);">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">Processing Time</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${transformation.processing_time_ms}ms</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">Model</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${transformation.api_model_used || 'o3-mini'}</div>
                        </div>
                    </div>
                    <button onclick="history.copyTransformedContent('${transformation.id}')" 
                            style="padding: var(--space-2) var(--space-4); background: var(--rich-red); color: white; border: none; border-radius: var(--radius-md); font-weight: 500; cursor: pointer;">
                        Copy Transformed Content
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    renderJustification(justification) {
        if (!justification || typeof justification !== 'object') return '';
        
        return `
            <div style="margin-bottom: var(--space-6);">
                <h4 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-4); color: var(--text-primary);">
                    🎯 Transformation Analysis
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
                    <div>
                        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">Key Changes</h5>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${justification.key_changes?.map(change => 
                                `<li style="margin-bottom: var(--space-1); padding-left: var(--space-4); position: relative;">
                                    <span style="position: absolute; left: 0; color: var(--rich-red);">•</span>
                                    ${this.escapeHtml(change)}
                                </li>`
                            ).join('') || ''}
                        </ul>
                    </div>
                    <div>
                        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">Brand Voice Improvements</h5>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${justification.brand_voice_improvements?.map(improvement => 
                                `<li style="margin-bottom: var(--space-1); padding-left: var(--space-4); position: relative;">
                                    <span style="position: absolute; left: 0; color: var(--forest-green);">•</span>
                                    ${this.escapeHtml(improvement)}
                                </li>`
                            ).join('') || ''}
                        </ul>
                    </div>
                </div>
                ${justification.audience_adaptation ? `
                    <div style="margin-top: var(--space-4);">
                        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">Audience Adaptation</h5>
                        <p style="color: var(--text-secondary); line-height: 1.5; margin: 0;">${this.escapeHtml(justification.audience_adaptation)}</p>
                    </div>
                ` : ''}
                ${justification.overall_strategy ? `
                    <div style="margin-top: var(--space-4);">
                        <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: var(--space-2); color: var(--text-primary);">Overall Strategy</h5>
                        <p style="color: var(--text-secondary); line-height: 1.5; margin: 0;">${this.escapeHtml(justification.overall_strategy)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    closeModal() {
        const modal = document.getElementById('detail-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    copyTransformedContent(transformationId) {
        const transformation = this.transformations.find(t => t.id === transformationId);
        if (transformation) {
            navigator.clipboard.writeText(transformation.transformed_content).then(() => {
                // Simple feedback - you could enhance this with a proper notification
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.background = 'var(--forest-green)';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = 'var(--rich-red)';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy content to clipboard');
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for onclick handlers
function closeModal() {
    window.history.closeModal();
}

// Initialize the history page
document.addEventListener('DOMContentLoaded', () => {
    window.history = new TransformationHistory();
});