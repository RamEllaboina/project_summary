/**
 * Audio Controller - Handles Web Audio API operations
 * Manages both uploaded audio files and live microphone input
 */
class AudioController {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.stream = null;
        this.audioElement = null;
        this.isInitialized = false;
        this.isLiveAudio = false;
        this.isPlaying = false;
        
        // Audio analysis data
        this.frequencyData = null;
        this.audioData = {
            bass: 0,
            mid: 0,
            treble: 0,
            energy: 0
        };
        
        // Frequency ranges
        this.bassRange = { min: 0, max: 4 };
        this.midRange = { min: 4, max: 64 };
        this.trebleRange = { min: 64, max: 255 };
        
        // Vibration settings
        this.vibrationCooldown = false;
        this.lastVibrationTime = 0;
        this.vibrationThreshold = 200;
        this.vibrationCooldownDuration = 500;
        
        // Beat detection
        this.lastBeatTime = 0;
        this.beatThreshold = 180;
        this.beatHoldTime = 100;
        
        this.initEventListeners();
    }
    
    /**
     * Initialize Web Audio API context
     */
    async initAudioContext() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.frequencyData = new Uint8Array(bufferLength);
            
            this.isInitialized = true;
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Error initializing audio context:', error);
            throw error;
        }
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Audio file upload
        const uploadBtn = document.getElementById('uploadBtn');
        const audioFileInput = document.getElementById('audioFileInput');
        
        if (uploadBtn && audioFileInput) {
            uploadBtn.addEventListener('click', () => audioFileInput.click());
            audioFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Live audio toggle
        const liveAudioBtn = document.getElementById('liveAudioBtn');
        const toggleLiveAudio = document.getElementById('toggleLiveAudio');
        
        if (liveAudioBtn) {
            liveAudioBtn.addEventListener('click', () => this.showLiveAudioControls());
        }
        
        if (toggleLiveAudio) {
            toggleLiveAudio.addEventListener('click', () => this.toggleLiveAudio());
        }
        
        // Visualization toggle
        const toggleVisualization = document.getElementById('toggleVisualization');
        if (toggleVisualization) {
            toggleVisualization.addEventListener('click', () => this.toggleVisualization());
        }
        
        // Back button
        const backToWelcome = document.getElementById('backToWelcome');
        if (backToWelcome) {
            backToWelcome.addEventListener('click', () => this.backToWelcome());
        }
    }
    
    /**
     * Handle audio file upload
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac', 'audio/x-ms-wma'];
        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
        
        if (!isValidType) {
            this.showError('Please select a valid audio file (MP3, WAV, OGG, M4A, FLAC, AAC, WMA)');
            event.target.value = ''; // Clear the input
            return;
        }
        
        try {
            this.showLoading('Loading audio file...');
            
            await this.initAudioContext();
            
            // Create audio element
            const audioPlayer = document.getElementById('audioPlayer');
            if (!audioPlayer) throw new Error('Audio player not found');
            
            this.audioElement = audioPlayer;
            const url = URL.createObjectURL(file);
            audioPlayer.src = url;
            
            // Connect to Web Audio API
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createMediaElementSource(audioPlayer);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Update UI
            document.getElementById('fileName').textContent = file.name;
            this.showUploadControls();
            
            // Enable visualization button
            this.enableVisualization('Ready to visualize');
            
            // Add to history
            if (window.historyManager) {
                window.historyManager.addToHistory(file, 'upload');
            }
            
            // Add audio event listeners
            audioPlayer.addEventListener('play', () => this.onAudioPlay());
            audioPlayer.addEventListener('pause', () => this.onAudioPause());
            audioPlayer.addEventListener('ended', () => this.onAudioEnd());
            
            this.hideLoading();
            console.log('Audio file loaded successfully');
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.hideLoading();
            this.showError('Failed to load audio file');
            event.target.value = ''; // Clear the input on error
        }
    }
    
    /**
     * Show live audio controls
     */
    showLiveAudioControls() {
        this.showMainApp();
        document.getElementById('liveControls').style.display = 'flex';
        document.getElementById('uploadControls').style.display = 'none';
    }
    
    /**
     * Show upload controls
     */
    showUploadControls() {
        this.showMainApp();
        document.getElementById('uploadControls').style.display = 'flex';
        document.getElementById('liveControls').style.display = 'none';
    }
    
    /**
     * Toggle live audio input
     */
    async toggleLiveAudio() {
        const btn = document.getElementById('toggleLiveAudio');
        const statusDot = document.getElementById('liveStatusDot');
        const statusText = document.getElementById('liveStatusText');
        
        if (this.isLiveAudio) {
            this.stopLiveAudio();
            btn.textContent = 'Start Live Audio';
            btn.classList.remove('active');
            statusDot.classList.remove('active');
            statusText.textContent = 'Microphone Off';
            
            // Disable visualization if it was running
            if (this.isPlaying) {
                this.stopVisualization();
            }
            this.disableVisualization('Select audio source first');
        } else {
            try {
                await this.startLiveAudio();
                btn.textContent = 'Stop Live Audio';
                btn.classList.add('active');
                statusDot.classList.add('active');
                statusText.textContent = 'Microphone Active';
                
                // Enable visualization
                this.enableVisualization('Ready to visualize');
            } catch (error) {
                console.error('Error starting live audio:', error);
                this.showError('Failed to access microphone');
            }
        }
    }
    
    /**
     * Start live audio capture
     */
    async startLiveAudio() {
        try {
            await this.initAudioContext();
            
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Connect to Web Audio API
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            
            this.isLiveAudio = true;
            console.log('Live audio started');
            
            // Add live session to history
            if (window.historyManager) {
                window.historyManager.addLiveSession();
            }
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }
    
    /**
     * Stop live audio capture
     */
    stopLiveAudio() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        this.isLiveAudio = false;
        console.log('Live audio stopped');
    }
    
    /**
     * Toggle visualization
     */
    toggleVisualization() {
        const btn = document.getElementById('toggleVisualization');
        const statusDot = document.getElementById('vizStatusDot');
        const statusText = document.getElementById('vizStatusText');
        
        if (this.isPlaying) {
            this.stopVisualization();
            btn.textContent = 'Start Visualization';
            btn.classList.remove('active');
            statusDot.classList.remove('active');
            
            // Update status based on current mode
            if (this.isLiveAudio) {
                statusText.textContent = 'Ready to visualize';
            } else if (this.audioElement && this.audioElement.src) {
                statusText.textContent = 'Ready to visualize';
            } else {
                statusText.textContent = 'Select audio source first';
            }
        } else {
            this.startVisualization();
            btn.textContent = 'Stop Visualization';
            btn.classList.add('active');
            statusDot.classList.add('active');
            statusText.textContent = 'Visualizing';
        }
    }
    
    /**
     * Start visualization
     */
    startVisualization() {
        if (!this.isInitialized) {
            this.showError('Please select an audio source first');
            return;
        }
        
        // Stop demo mode when real visualization starts
        if (window.startDemoMode) {
            window.stopDemoMode();
        }
        
        // Check if we have a valid audio source
        if (this.isLiveAudio) {
            // Live audio is active
            this.isPlaying = true;
            this.analyzeAudio();
            console.log('Visualization started with live audio');
            
            // Add visualizing class
            if (window.app) {
                window.app.addVisualizingClass();
            }
            
            // Record session for the most recent live session
            if (window.historyManager) {
                const liveItems = window.historyManager.history.filter(h => h.sourceType === 'live');
                if (liveItems.length > 0) {
                    window.historyManager.recordSession(liveItems[0].id);
                }
            }
        } else if (this.audioElement && !this.audioElement.paused) {
            // Audio file is playing
            this.isPlaying = true;
            this.analyzeAudio();
            console.log('Visualization started with uploaded audio');
            
            // Add visualizing class
            if (window.app) {
                window.app.addVisualizingClass();
            }
            
            // Record session for current file
            if (window.historyManager) {
                const fileName = document.getElementById('fileName').textContent;
                const historyItem = window.historyManager.history.find(h => h.name === fileName);
                if (historyItem) {
                    window.historyManager.recordSession(historyItem.id);
                }
            }
        } else if (this.audioElement && this.audioElement.paused) {
            // Audio file is loaded but not playing
            this.showError('Please play the audio first');
        } else {
            // No audio source
            this.showError('Please select an audio source first');
        }
    }
    
    /**
     * Stop visualization
     */
    stopVisualization() {
        this.isPlaying = false;
        console.log('Visualization stopped');
        
        // Remove visualizing class
        if (window.app) {
            window.app.removeVisualizingClass();
        }
        
        // Restart demo mode when real visualization stops
        if (window.startDemoMode && this.isInitialized) {
            setTimeout(() => {
                window.startDemoMode();
            }, 1000);
        }
    }
    
    /**
     * Analyze audio data
     */
    analyzeAudio() {
        if (!this.isPlaying || !this.analyser) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Extract frequency ranges
        const bass = this.getFrequencyAverage(this.bassRange.min, this.bassRange.max);
        const mid = this.getFrequencyAverage(this.midRange.min, this.midRange.max);
        const treble = this.getFrequencyAverage(this.trebleRange.min, this.trebleRange.max);
        
        // Calculate overall energy
        const energy = (bass + mid + treble) / 3;
        
        // Update audio data
        this.audioData = { bass, mid, treble, energy };
        
        // Beat detection
        this.detectBeat(bass);
        
        // Vibration feedback
        this.checkVibration(bass);
        
        // Send data to visualizer
        if (window.visualizer) {
            window.visualizer.updateAudioData(this.audioData);
        }
        
        // Continue analysis
        requestAnimationFrame(() => this.analyzeAudio());
    }
    
    /**
     * Get average frequency value for a range
     */
    getFrequencyAverage(minIndex, maxIndex) {
        let sum = 0;
        let count = 0;
        
        for (let i = minIndex; i <= maxIndex && i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
            count++;
        }
        
        return count > 0 ? sum / count : 0;
    }
    
    /**
     * Detect beats based on bass frequencies
     */
    detectBeat(bass) {
        const currentTime = Date.now();
        
        if (bass > this.beatThreshold && currentTime - this.lastBeatTime > this.beatHoldTime) {
            this.lastBeatTime = currentTime;
            this.onBeatDetected();
        }
    }
    
    /**
     * Handle beat detection
     */
    onBeatDetected() {
        // Trigger visual effects
        if (window.app) {
            window.app.triggerBeatFlash();
        }
    }
    
    /**
     * Check and trigger vibration
     */
    checkVibration(bass) {
        const currentTime = Date.now();
        
        if (bass > this.vibrationThreshold && 
            !this.vibrationCooldown && 
            currentTime - this.lastVibrationTime > this.vibrationCooldownDuration) {
            
            this.triggerVibration();
            this.lastVibrationTime = currentTime;
            this.vibrationCooldown = true;
            
            setTimeout(() => {
                this.vibrationCooldown = false;
            }, this.vibrationCooldownDuration);
        }
    }
    
    /**
     * Trigger haptic feedback
     */
    triggerVibration() {
        if ('vibrate' in navigator) {
            navigator.vibrate(120);
        }
    }
    
    /**
     * Audio event handlers
     */
    onAudioPlay() {
        console.log('Audio playback started');
    }
    
    onAudioPause() {
        console.log('Audio playback paused');
    }
    
    onAudioEnd() {
        console.log('Audio playback ended');
        this.stopVisualization();
    }
    
    /**
     * UI Navigation methods
     */
    showMainApp() {
        document.getElementById('welcomeScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
    }
    
    backToWelcome() {
        // Stop all audio and visualization
        this.stopLiveAudio();
        this.stopVisualization();
        
        // Reset audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
        
        // Reset UI
        document.getElementById('welcomeScreen').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
        
        // Reset file input and buttons
        document.getElementById('audioFileInput').value = '';
        document.getElementById('fileName').textContent = 'No file selected';
        
        // Reset live audio button
        const liveBtn = document.getElementById('toggleLiveAudio');
        const liveStatusText = document.getElementById('liveStatusText');
        const liveStatusDot = document.getElementById('liveStatusDot');
        liveBtn.textContent = 'Start Live Audio';
        liveBtn.classList.remove('active');
        liveStatusText.textContent = 'Microphone Off';
        liveStatusDot.classList.remove('active');
        
        // Disable visualization button
        this.disableVisualization('Select audio source first');
        
        // Hide both control groups
        document.getElementById('uploadControls').style.display = 'none';
        document.getElementById('liveControls').style.display = 'none';
    }
    
    /**
     * UI Helper methods
     */
    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        loadingText.textContent = text;
        overlay.classList.add('active');
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('active');
    }
    
    showError(message) {
        console.error(message);
        // You could implement a toast notification here
        alert(message); // Simple fallback for demo
    }
    
    /**
     * Get current audio data
     */
    getAudioData() {
        return this.audioData;
    }
    
    /**
     * Enable visualization button
     */
    enableVisualization(statusText) {
        const toggleBtn = document.getElementById('toggleVisualization');
        const statusEl = document.getElementById('vizStatusText');
        toggleBtn.disabled = false;
        statusEl.textContent = statusText;
    }
    
    /**
     * Disable visualization button
     */
    disableVisualization(statusText) {
        const toggleBtn = document.getElementById('toggleVisualization');
        const statusEl = document.getElementById('vizStatusText');
        const statusDot = document.getElementById('vizStatusDot');
        toggleBtn.disabled = true;
        toggleBtn.textContent = 'Start Visualization';
        toggleBtn.classList.remove('active');
        statusEl.textContent = statusText;
        statusDot.classList.remove('active');
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopLiveAudio();
        this.stopVisualization();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }
    }
}
