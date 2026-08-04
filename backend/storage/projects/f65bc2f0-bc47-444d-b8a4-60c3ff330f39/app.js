/**
 * FlowLedger - Advanced Personal Finance Tracker
 * Main application entry point
 */

class FlowLedgerApp {
    constructor() {
        this.storage = null;
        this.transactions = null;
        this.ui = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading state
            this.showAppLoading();

            // Initialize modules in order
            this.storage = new StorageManager();
            this.transactions = new TransactionManager(this.storage);
            this.ui = new UIManager(this.transactions);

            // Initialize each module
            this.transactions.init();
            this.ui.init();

            // Setup global error handling
            this.setupErrorHandling();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Check for data migration needs
            await this.checkDataMigration();

            // Mark as initialized
            this.isInitialized = true;

            // Hide loading state
            this.hideAppLoading();

            console.log('FlowLedger initialized successfully');
        } catch (error) {
            console.error('Failed to initialize FlowLedger:', error);
            this.handleCriticalError(error);
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            this.ui?.showToast('An unexpected error occurred', 'error');
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.ui?.showToast('An unexpected error occurred', 'error');
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + N: New transaction
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.ui.elements.txTitleInput?.focus();
            }

            // Ctrl/Cmd + E: Export data
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.ui.handleExport('json');
            }

            // Ctrl/Cmd + I: Import data
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.ui.handleImport();
            }

            // Ctrl/Cmd + /: Show shortcuts help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showShortcutsHelp();
            }
        });
    }

    /**
     * Check for data migration needs
     */
    async checkDataMigration() {
        // This would handle any data migration between versions
        // For now, it's a placeholder
        const currentVersion = '1.0';
        const lastVersion = localStorage.getItem('flowledger_version');

        if (lastVersion !== currentVersion) {
            console.log(`Migrating from version ${lastVersion} to ${currentVersion}`);
            // Perform migration logic here
            localStorage.setItem('flowledger_version', currentVersion);
        }
    }

    /**
     * Show app loading state
     */
    showAppLoading() {
        const loadingHTML = `
            <div class="app-loading" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(145deg, #f0f4f8 0%, #e6ecf3 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: system-ui, 'Segoe UI', 'Inter', sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                    <h1 style="color: #1f4e6e; margin-bottom: 0.5rem;">FlowLedger</h1>
                    <p style="color: #5c6f87;">Loading your financial data...</p>
                    <div style="
                        width: 50px;
                        height: 4px;
                        background: #e2e8f0;
                        border-radius: 2px;
                        margin: 2rem auto;
                        overflow: hidden;
                    ">
                        <div style="
                            width: 30%;
                            height: 100%;
                            background: #2c7da0;
                            border-radius: 2px;
                            animation: loading 1.5s ease-in-out infinite;
                        "></div>
                    </div>
                </div>
                <style>
                    @keyframes loading {
                        0% { width: 0%; }
                        50% { width: 70%; }
                        100% { width: 0%; }
                    }
                </style>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    /**
     * Hide app loading state
     */
    hideAppLoading() {
        const loadingElement = document.querySelector('.app-loading');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            loadingElement.style.transition = 'opacity 0.3s ease';
            setTimeout(() => loadingElement.remove(), 300);
        }
    }

    /**
     * Handle critical errors
     * @param {Error} error - The error that occurred
     */
    handleCriticalError(error) {
        this.hideAppLoading();
        
        const errorHTML = `
            <div class="critical-error" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #f8f9fa;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: system-ui, 'Segoe UI', 'Inter', sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    max-width: 500px;
                    text-align: center;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="color: #c23b22; margin-bottom: 1rem;">Application Error</h1>
                    <p style="color: #5c6f87; margin-bottom: 1.5rem;">
                        FlowLedger encountered an error and couldn't start properly.
                    </p>
                    <div style="
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        margin-bottom: 1.5rem;
                        text-align: left;
                        font-family: monospace;
                        font-size: 0.9rem;
                        color: #666;
                    ">
                        ${error.message}
                    </div>
                    <button onclick="location.reload()" style="
                        background: #1f4e6e;
                        color: white;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        Reload Application
                    </button>
                </div>
            </div>
        `;

        document.body.innerHTML = errorHTML;
    }

    /**
     * Show keyboard shortcuts help
     */
    showShortcutsHelp() {
        const shortcuts = [
            { key: 'Ctrl/Cmd + N', description: 'New transaction' },
            { key: 'Ctrl/Cmd + E', description: 'Export data (JSON)' },
            { key: 'Ctrl/Cmd + I', description: 'Import data' },
            { key: 'Ctrl/Cmd + /', description: 'Show this help' },
            { key: 'Escape', description: 'Close modal/dialog' },
            { key: 'Enter', description: 'Submit form (when in input field)' }
        ];

        const shortcutsHTML = shortcuts.map(shortcut => `
            <tr>
                <td style="padding: 0.5rem; font-family: monospace; background: #f8f9fa; border-radius: 0.25rem;">${shortcut.key}</td>
                <td style="padding: 0.5rem 0.5rem 0.5rem 1rem;">${shortcut.description}</td>
            </tr>
        `).join('');

        const modalHTML = `
            <div class="shortcuts-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 1rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1f4e6e;">⌨️ Keyboard Shortcuts</h2>
                        <button onclick="this.closest('.shortcuts-modal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            cursor: pointer;
                            color: #8e9eae;
                        ">×</button>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${shortcutsHTML}
                    </table>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Get application statistics
     * @returns {Object} App statistics
     */
    getStats() {
        if (!this.isInitialized) {
            return { error: 'App not initialized' };
        }

        return {
            ...this.transactions.getStatistics(),
            storage: this.storage.getStorageStats(),
            version: '1.0.0',
            uptime: Date.now() - (this.initTime || Date.now())
        };
    }

    /**
     * Reset application to factory defaults
     */
    resetToDefaults() {
        if (confirm('Are you sure you want to reset FlowLedger to factory defaults? This will delete all your data.')) {
            this.storage.clearAllData();
            location.reload();
        }
    }

    /**
     * Export application data for backup
     */
    createBackup() {
        if (!this.isInitialized) return false;

        const allTransactions = this.transactions.getAllTransactions();
        const settings = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            categories: this.transactions.getCategories()
        };

        return this.storage.exportToJSON(allTransactions, settings);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create global app instance
    window.FlowLedger = new FlowLedgerApp();
    
    // Initialize the application
    await window.FlowLedger.init();

    // Make app available globally for debugging
    console.log('FlowLedger is available as window.FlowLedger');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowLedgerApp;
}
