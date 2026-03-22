/**
 * History Manager - Tracks and manages audio file history
 * Stores file information, timestamps, and visualization sessions
 */
class HistoryManager {
    constructor() {
        this.history = [];
        this.maxHistoryItems = 50;
        this.storageKey = 'feelTheMusic_history';
        
        this.loadHistory();
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistoryPanel());
        }
        
        // Close history panel
        const closeHistory = document.getElementById('closeHistory');
        if (closeHistory) {
            closeHistory.addEventListener('click', () => this.hideHistoryPanel());
        }
        
        // Clear history button
        const clearHistory = document.getElementById('clearHistory');
        if (clearHistory) {
            clearHistory.addEventListener('click', () => this.clearHistory());
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('historyPanel');
            if (panel && panel.classList.contains('active')) {
                if (!panel.contains(e.target) && !historyBtn.contains(e.target)) {
                    this.hideHistoryPanel();
                }
            }
        });
    }
    
    /**
     * Add audio file to history
     */
    addToHistory(file, sourceType = 'upload') {
        const historyItem = {
            id: Date.now().toString(),
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.type || 'audio/unknown',
            sourceType: sourceType, // 'upload' or 'live'
            timestamp: new Date().toISOString(),
            date: this.formatDate(new Date()),
            sessions: 0, // Number of times visualized
            lastSession: null
        };
        
        // Remove existing item with same name if it exists
        this.history = this.history.filter(item => item.name !== file.name);
        
        // Add new item to the beginning
        this.history.unshift(historyItem);
        
        // Limit history size
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
        
        console.log('Added to history:', historyItem.name);
    }
    
    /**
     * Record visualization session for a history item
     */
    recordSession(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (item) {
            item.sessions++;
            item.lastSession = new Date().toISOString();
            this.saveHistory();
            this.updateHistoryDisplay();
        }
    }
    
    /**
     * Add live audio session to history
     */
    addLiveSession() {
        const historyItem = {
            id: Date.now().toString(),
            name: `Live Session ${new Date().toLocaleString()}`,
            size: 'N/A',
            type: 'audio/live',
            sourceType: 'live',
            timestamp: new Date().toISOString(),
            date: this.formatDate(new Date()),
            sessions: 1,
            lastSession: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }
        
        this.saveHistory();
        this.updateHistoryDisplay();
        
        console.log('Added live session to history');
    }
    
    /**
     * Show history panel
     */
    showHistoryPanel() {
        const panel = document.getElementById('historyPanel');
        if (panel) {
            panel.classList.add('active');
            this.updateHistoryDisplay();
        }
    }
    
    /**
     * Hide history panel
     */
    hideHistoryPanel() {
        const panel = document.getElementById('historyPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }
    
    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const emptyHistory = document.getElementById('emptyHistory');
        
        if (!historyList || !emptyHistory) return;
        
        if (this.history.length === 0) {
            historyList.style.display = 'none';
            emptyHistory.style.display = 'block';
        } else {
            historyList.style.display = 'block';
            emptyHistory.style.display = 'none';
            
            historyList.innerHTML = '';
            this.history.forEach(item => {
                const historyElement = this.createHistoryElement(item);
                historyList.appendChild(historyElement);
            });
        }
    }
    
    /**
     * Create history element DOM
     */
    createHistoryElement(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.itemId = item.id;
        
        const typeLabel = item.sourceType === 'live' ? 'Live' : 'Upload';
        const typeClass = item.sourceType === 'live' ? 'live' : 'upload';
        
        div.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-name">${this.escapeHtml(item.name)}</div>
                <div class="history-item-type">${typeLabel}</div>
            </div>
            <div class="history-item-details">
                <div class="history-item-detail">
                    <span>📅</span>
                    <span>${item.date}</span>
                </div>
                <div class="history-item-detail">
                    <span>📊</span>
                    <span>${item.size}</span>
                </div>
                <div class="history-item-detail">
                    <span>🎵</span>
                    <span>${item.sessions} session${item.sessions !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="history-item-actions">
                ${item.sourceType === 'upload' ? `
                    <button class="history-action-btn replay-btn" data-action="replay">
                        🎵 Replay
                    </button>
                ` : ''}
                <button class="history-action-btn remove-btn" data-action="remove">
                    🗑️ Remove
                </button>
            </div>
        `;
        
        // Add event listeners
        const replayBtn = div.querySelector('.replay-btn');
        const removeBtn = div.querySelector('.remove-btn');
        
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.replayItem(item));
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeItem(item.id));
        }
        
        return div;
    }
    
    /**
     * Replay history item (for uploaded files)
     */
    replayItem(item) {
        if (item.sourceType !== 'upload') return;
        
        // Hide history panel
        this.hideHistoryPanel();
        
        // Show upload controls
        if (window.app && window.app.audioController) {
            window.app.audioController.showUploadControls();
            
            // Update UI to show file info
            document.getElementById('fileName').textContent = item.name;
            
            // Enable visualization
            window.app.audioController.enableVisualization('Ready to visualize');
            
            // Show success message
            if (window.app) {
                window.app.showSuccess(`Ready to replay: ${item.name}`);
            }
            
            // Record this replay session
            this.recordSession(item.id);
        }
    }
    
    /**
     * Remove item from history
     */
    removeItem(itemId) {
        const item = this.history.find(h => h.id === itemId);
        if (item && confirm(`Remove "${item.name}" from history?`)) {
            this.history = this.history.filter(h => h.id !== itemId);
            this.saveHistory();
            this.updateHistoryDisplay();
            
            if (window.app) {
                window.app.showSuccess('Removed from history');
            }
        }
    }
    
    /**
     * Clear all history
     */
    clearHistory() {
        if (confirm('Clear all history? This action cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryDisplay();
            
            if (window.app) {
                window.app.showSuccess('History cleared');
            }
        }
    }
    
    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }
    
    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.history = JSON.parse(saved);
                console.log(`Loaded ${this.history.length} items from history`);
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.history = [];
        }
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Format date
     */
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 1 week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
        
        // Otherwise show date
        return date.toLocaleDateString();
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get history statistics
     */
    getStats() {
        const uploadCount = this.history.filter(h => h.sourceType === 'upload').length;
        const liveCount = this.history.filter(h => h.sourceType === 'live').length;
        const totalSessions = this.history.reduce((sum, h) => sum + h.sessions, 0);
        
        return {
            totalItems: this.history.length,
            uploadCount,
            liveCount,
            totalSessions
        };
    }
}

// Initialize history manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
    console.log('History manager initialized');
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}
