/**
 * Main Application Controller
 * Coordinates between audio controller and visualizer
 * Manages UI state and user interactions
 */
class MusicApp {
    constructor() {
        this.audioController = null;
        this.isInitialized = false;
        
        // UI state
        this.currentMode = null; // 'upload' or 'live'
        this.isVisualizing = false;
        
        // Beat flash element
        this.beatFlash = null;
        
        this.init();
    }
    
    /**
     * Initialize application
     */
    async init() {
        try {
            // Create beat flash element
            this.createBeatFlashElement();
            
            // Initialize audio controller
            this.audioController = new AudioController();
            
            // Initialize event listeners
            this.initEventListeners();
            this.initBeatDetection();
            
            // Initialize visualizer connection
            this.initVisualizerConnection();
            
            this.isInitialized = true;
            console.log('Music App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    /**
     * Create beat flash element
     */
    createBeatFlashElement() {
        this.beatFlash = document.querySelector('.beat-flash');
        if (!this.beatFlash) {
            this.beatFlash = document.createElement('div');
            this.beatFlash.className = 'beat-flash';
            document.body.appendChild(this.beatFlash);
        }
    }
    
    /**
     * Handle footer navigation
     */
    handleFooterNavigation(section) {
        switch(section) {
            case 'home':
                // Go back to welcome screen
                this.audioController.backToWelcome();
                this.removeVisualizingClass();
                break;
            case 'upload':
                // Go to upload mode
                this.audioController.showUploadControls();
                document.getElementById('welcomeScreen').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                break;
            case 'live':
                // Go to live audio mode
                this.audioController.showLiveAudioControls();
                document.getElementById('welcomeScreen').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                break;
            default:
                console.log('Unknown navigation section:', section);
        }
    }
    
    /**
     * Add visualizing class when audio starts
     */
    addVisualizingClass() {
        document.getElementById('mainApp').classList.add('visualizing');
        document.getElementById('visualizerSection').classList.add('hidden');
    }
    
    /**
     * Remove visualizing class when audio stops
     */
    removeVisualizingClass() {
        document.getElementById('mainApp').classList.remove('visualizing');
        document.getElementById('visualizerSection').classList.remove('hidden');
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Footer navigation links
        const footerLinks = document.querySelectorAll('.footer-link');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.handleFooterNavigation(section);
            });
        });
        
        // Audio file upload
        const uploadBtn = document.getElementById('uploadBtn');
        const audioFileInput = document.getElementById('audioFileInput');
        
        if (uploadBtn && audioFileInput) {
            uploadBtn.addEventListener('click', () => audioFileInput.click());
            audioFileInput.addEventListener('change', (e) => this.audioController.handleFileUpload(e));
        }
        
        // Live audio toggle
        const liveAudioBtn = document.getElementById('liveAudioBtn');
        const toggleLiveAudio = document.getElementById('toggleLiveAudio');
        
        if (liveAudioBtn) {
            liveAudioBtn.addEventListener('click', () => this.audioController.showLiveAudioControls());
        }
        
        if (toggleLiveAudio) {
            toggleLiveAudio.addEventListener('click', () => {
                this.audioController.toggleLiveAudio();
                // Check if live audio is starting and add visualizing class
                setTimeout(() => {
                    if (this.audioController && this.audioController.isLiveAudio && this.audioController.isPlaying) {
                        this.addVisualizingClass();
                    }
                }, 100);
            });
        }
        
        // Visualization toggle
        const toggleVisualization = document.getElementById('toggleVisualization');
        if (toggleVisualization) {
            toggleVisualization.addEventListener('click', () => {
                this.audioController.toggleVisualization();
                // Check if visualization is starting and add visualizing class
                setTimeout(() => {
                    if (this.audioController && this.audioController.isPlaying) {
                        this.addVisualizingClass();
                    }
                }, 100);
            });
        }
        
        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                if (window.historyManager) {
                    window.historyManager.showHistoryPanel();
                }
            });
        }
        
        // Close history panel
        const closeHistory = document.getElementById('closeHistory');
        if (closeHistory) {
            closeHistory.addEventListener('click', () => {
                if (window.historyManager) {
                    window.historyManager.hideHistoryPanel();
                }
            });
        }
        
        // Clear history button
        const clearHistory = document.getElementById('clearHistory');
        if (clearHistory) {
            clearHistory.addEventListener('click', () => {
                if (window.historyManager) {
                    window.historyManager.clearHistory();
                }
            });
        }
        
        // Back button
        const backToWelcome = document.getElementById('backToWelcome');
        if (backToWelcome) {
            backToWelcome.addEventListener('click', () => {
                this.audioController.backToWelcome();
                this.removeVisualizingClass();
            });
        }
        
        console.log('Event listeners initialized');
    }
    
    /**
     * Initialize visualizer connection
     */
    initVisualizerConnection() {
        // Wait for visualizer to be available
        setTimeout(() => {
            if (typeof visualizer !== 'undefined') {
                window.visualizer = visualizer;
                console.log('Visualizer connected to app');
            } else {
                console.error('Visualizer not found');
            }
        }, 100);
    }
    
    /**
     * Initialize beat detection
     */
    initBeatDetection() {
        // Listen for beat events from audio controller
        document.addEventListener('beatDetected', () => {
            this.triggerBeatFlash();
        });
    }
    
    /**
     * Trigger beat flash effect
     */
    triggerBeatFlash() {
        if (!this.beatFlash) return;
        
        // Remove and re-add class to restart animation
        this.beatFlash.classList.remove('active');
        void this.beatFlash.offsetWidth; // Force reflow
        this.beatFlash.classList.add('active');
        
        // Remove class after animation completes
        setTimeout(() => {
            this.beatFlash.classList.remove('active');
        }, 200);
        
        // Trigger visualizer beat reaction
        if (window.visualizer) {
            window.visualizer.triggerBeat();
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff4458, #ff6b6b);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(255, 68, 88, 0.4);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #00ff88, #00cc66);
            color: #0a0a0a;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.4);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
    
    /**
     * Get current application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentMode: this.currentMode,
            isVisualizing: this.isVisualizing,
            audioData: this.audioController ? this.audioController.getAudioData() : null
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.audioController) {
            this.audioController.cleanup();
        }
        
        // Remove any remaining toasts
        document.querySelectorAll('.error-toast, .success-toast').forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        
        console.log('App cleanup completed');
    }
}

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicApp();
            
    // Make visualizer globally accessible
    setTimeout(() => {
        if (typeof visualizer !== 'undefined') {
            window.visualizer = visualizer;
            console.log('Visualizer connected to app');
        } else {
            console.error('Visualizer not found');
        }
    }, 100);
            
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.app.audioController) {
            // Pause visualization when page is hidden
            const wasPlaying = window.app.audioController.isPlaying;
            if (wasPlaying) {
                window.app.audioController.stopVisualization();
                // Store state to resume later
                window.app.wasPlaying = true;
            }
        } else if (!document.hidden && window.app.audioController && window.app.wasPlaying) {
            // Resume visualization when page becomes visible
            window.app.audioController.startVisualization();
            window.app.wasPlaying = false;
        }
    });
            
    // Handle window resize
    window.addEventListener('resize', () => {
        // p5.js handles canvas resize automatically
        console.log('Window resized');
    });
            
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (window.app) {
            window.app.cleanup();
        }
    });
            
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space bar to toggle visualization
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            const toggleBtn = document.getElementById('toggleVisualization');
            if (toggleBtn && !toggleBtn.disabled) {
                toggleBtn.click();
            }
        }
                
        // Escape to go back to welcome
        if (e.code === 'Escape') {
            const backBtn = document.getElementById('backToWelcome');
            if (backBtn && backBtn.offsetParent !== null) {
                backBtn.click();
            }
        }
    });
            
    console.log('Application event listeners initialized');
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicApp;
}
