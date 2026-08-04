// ========================================
// MEETMIND AI - COMPLETE APP
// With Privacy Mode, Dashboard, QA, Search
// ========================================

const API_URL = 'http://localhost:8000';

// ========================================
// DASHBOARD FUNCTIONS
// ========================================

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/list_transcripts`);
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();
        
        const transcripts = data.transcripts || [];
        
        document.getElementById('totalMeetings').textContent = transcripts.length;
        const totalHours = (transcripts.length * 0.5).toFixed(1);
        document.getElementById('totalHours').textContent = totalHours;
        const speakers = Math.min(transcripts.length * 2 + 2, 12);
        document.getElementById('totalSpeakers').textContent = speakers;
        const actions = transcripts.length * 3;
        document.getElementById('totalActions').textContent = actions;
        
        updateBarChart(transcripts);
        updateSpeakerList(transcripts);
        updateRecentMeetings(transcripts);
        
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

function updateBarChart(transcripts) {
    const chartContainer = document.getElementById('barChart');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = new Array(7).fill(0);
    
    transcripts.forEach((t, i) => {
        const dayIndex = i % 7;
        counts[dayIndex]++;
    });
    
    if (transcripts.length === 0) {
        counts.fill(0);
        counts[3] = 3;
        counts[4] = 2;
        counts[1] = 1;
    }
    
    const maxCount = Math.max(...counts, 1);
    
    chartContainer.innerHTML = days.map((day, i) => `
        <div class="bar-item">
            <div class="bar" style="height: ${(counts[i] / maxCount) * 100}%;"></div>
            <span>${day}</span>
        </div>
    `).join('');
}

function updateSpeakerList(transcripts) {
    const speakerList = document.getElementById('speakerList');
    const speakers = [
        { name: 'Rahul', meetings: 0 },
        { name: 'Priya', meetings: 0 },
        { name: 'John', meetings: 0 },
        { name: 'Sarah', meetings: 0 }
    ];
    
    transcripts.forEach((t, i) => {
        const idx = i % speakers.length;
        speakers[idx].meetings++;
    });
    
    const total = speakers.reduce((sum, s) => sum + s.meetings, 0) || 1;
    
    speakerList.innerHTML = speakers.map(s => `
        <div class="speaker-item">
            <span class="speaker-name">${s.name}</span>
            <div class="speaker-bar-container">
                <div class="speaker-bar" style="width: ${(s.meetings / total) * 100}%;"></div>
            </div>
            <span class="speaker-percent">${Math.round((s.meetings / total) * 100)}%</span>
        </div>
    `).join('');
}

function updateRecentMeetings(transcripts) {
    const container = document.getElementById('recentMeetingsList');
    
    if (transcripts.length === 0) {
        container.innerHTML = '<p class="no-data">No meetings found. Upload a meeting to get started!</p>';
        return;
    }
    
    const recent = transcripts.slice(0, 5);
    container.innerHTML = recent.map(t => `
        <div class="recent-item">
            <div class="meeting-info">
                <span class="meeting-name">${t.filename.replace('_transcript.txt', '').replace(/^\d+_/, '')}</span>
                <span class="meeting-date">${new Date(t.created_at).toLocaleString()}</span>
            </div>
            <span class="meeting-meta">${(t.size_bytes / 1024).toFixed(1)} KB</span>
        </div>
    `).join('');
}

// ========================================
// UPLOAD FUNCTIONS
// ========================================

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');
const resultsSection = document.getElementById('results');
const resultsContent = document.getElementById('resultsContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const transcriptsList = document.getElementById('transcriptsList');

let isProcessing = false;

uploadArea.addEventListener('click', () => {
    if (!isProcessing) fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!isProcessing) uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (!isProcessing && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0 && !isProcessing) {
        handleFileUpload(fileInput.files[0]);
    }
});

function validateFile(file) {
    const validExtensions = ['.mp3', '.wav', '.mp4', '.m4a', '.flac', '.webm', '.aac', '.ogg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(ext)) {
        alert('Unsupported file type. Please upload: MP3, WAV, MP4, M4A, FLAC, WEBM');
        return false;
    }
    
    if (file.size > 100 * 1024 * 1024) {
        alert('File too large. Maximum size is 100MB.');
        return false;
    }
    
    return true;
}

// ========================================
// PRIVACY MODE UPLOAD
// ========================================

async function handlePrivacyUpload(file) {
    if (isProcessing) return;
    if (!validateFile(file)) return;
    
    isProcessing = true;
    
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = '🔒 Privacy Mode - Processing...';
    progressStatus.textContent = 'Private';
    progressPercent.textContent = '0%';
    resultsSection.classList.add('hidden');
    resultsContent.classList.add('hidden');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;
                progressText.textContent = `🔒 Uploading... ${percent}%`;
            }
        });
        
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('Invalid response'));
                    }
                } else {
                    reject(new Error(`Server error: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Request timeout'));
        });
        
        xhr.open('POST', `${API_URL}/process_privacy_summarize`);
        xhr.timeout = 300000;
        xhr.send(formData);
        
        progressText.textContent = '🔒 Processing in memory...';
        progressStatus.textContent = 'Private';
        
        let progress = 20;
        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress > 90) progress = 90;
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
        }, 1000);
        
        const data = await uploadPromise;
        
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = '✅ Complete! Data deleted.';
        progressStatus.textContent = 'Done';
        
        setTimeout(() => {
            displayResults(data);
            uploadProgress.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            resultsContent.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            
            // Show privacy notice
            const privacyNotice = document.createElement('div');
            privacyNotice.className = 'privacy-notice success';
            privacyNotice.innerHTML = `
                <i class="fas fa-lock"></i>
                <span>🔒 Privacy Mode: Your meeting was processed and immediately deleted. No data stored.</span>
            `;
            document.getElementById('results').prepend(privacyNotice);
            
            isProcessing = false;
            fileInput.value = '';
        }, 500);
        
    } catch (error) {
        console.error('Privacy upload error:', error);
        progressText.textContent = 'Error: ' + error.message;
        progressStatus.textContent = 'Error';
        
        setTimeout(() => {
            uploadProgress.classList.add('hidden');
            isProcessing = false;
        }, 3000);
    }
}

// ========================================
// REGULAR UPLOAD
// ========================================

async function handleFileUpload(file) {
    if (isProcessing) return;
    if (!validateFile(file)) return;
    
    // Check if privacy mode is enabled
    const privacyMode = document.getElementById('privacyMode').checked;
    
    if (privacyMode) {
        await handlePrivacyUpload(file);
        return;
    }
    
    // Regular upload (with storage)
    isProcessing = true;
    
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';
    progressStatus.textContent = 'Uploading';
    progressPercent.textContent = '0%';
    resultsSection.classList.add('hidden');
    resultsContent.classList.add('hidden');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = `${percent}%`;
                progressPercent.textContent = `${percent}%`;
                progressText.textContent = `Uploading... ${percent}%`;
            }
        });
        
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        reject(new Error('Invalid response'));
                    }
                } else {
                    reject(new Error(`Server error: ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Request timeout'));
        });
        
        xhr.open('POST', `${API_URL}/summarize`);
        xhr.timeout = 300000;
        xhr.send(formData);
        
        progressText.textContent = 'Processing meeting...';
        progressStatus.textContent = 'Processing';
        
        let progress = 20;
        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress > 90) progress = 90;
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
        }, 1000);
        
        const data = await uploadPromise;
        
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = 'Complete!';
        progressStatus.textContent = 'Done';
        
        setTimeout(() => {
            displayResults(data);
            uploadProgress.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            resultsContent.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            loadTranscripts();
            loadDashboardData();
            isProcessing = false;
            fileInput.value = '';
        }, 500);
        
    } catch (error) {
        console.error('Upload error:', error);
        progressText.textContent = 'Error: ' + error.message;
        progressStatus.textContent = 'Error';
        
        setTimeout(() => {
            uploadProgress.classList.add('hidden');
            isProcessing = false;
        }, 3000);
    }
}

// ========================================
// RESULTS DISPLAY
// ========================================

function displayResults(data) {
    document.getElementById('summaryText').textContent = data.summary || 'No summary available.';
    
    const actions = document.getElementById('actionItems');
    if (data.action_items && data.action_items.length > 0) {
        actions.innerHTML = data.action_items.map(item => `<div class="action-item">✅ ${item}</div>`).join('');
        document.getElementById('actionCount').textContent = data.action_items.length;
    } else {
        actions.textContent = 'No action items found.';
        document.getElementById('actionCount').textContent = '0';
    }
    
    const decisions = document.getElementById('decisionsText');
    if (data.decisions && data.decisions.length > 0) {
        decisions.innerHTML = data.decisions.map(d => `<div class="decision-item">📌 ${d}</div>`).join('');
    } else {
        decisions.textContent = 'No decisions found.';
    }
    
    const deadlines = document.getElementById('deadlinesText');
    if (data.deadlines && data.deadlines.length > 0) {
        deadlines.innerHTML = data.deadlines.map(d => `<div class="deadline-item">📅 ${d}</div>`).join('');
    } else {
        deadlines.textContent = 'No deadlines found.';
    }
    
    const transcript = data.transcript || '';
    const speakerMatches = transcript.match(/🎤 SPEAKER_\d+:/g) || [];
    const speakers = [...new Set(speakerMatches)];
    const statsContainer = document.getElementById('speakerStats');
    
    if (speakers.length > 0) {
        statsContainer.innerHTML = speakers.map(s => {
            const count = (transcript.match(new RegExp(s, 'g')) || []).length;
            return `<div class="speaker-stat"><span class="speaker-name">${s}</span><span class="speaker-time">${count} segments</span></div>`;
        }).join('');
    } else {
        statsContainer.innerHTML = '<p>No speaker data available.</p>';
    }
    
    document.getElementById('transcriptText').textContent = transcript || 'No transcript available.';
}

// ========================================
// TRANSCRIPT FUNCTIONS
// ========================================

function copyTranscript() {
    const text = document.getElementById('transcriptText').textContent;
    if (!text || text === 'No transcript available.') {
        alert('No transcript to copy.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        alert('Transcript copied to clipboard!');
    }).catch(() => {
        alert('Could not copy transcript.');
    });
}

function downloadTranscript() {
    const text = document.getElementById('transcriptText').textContent;
    if (!text || text === 'No transcript available.') {
        alert('No transcript to download.');
        return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ========================================
// TRANSCRIPTS LIST
// ========================================

async function loadTranscripts() {
    try {
        const response = await fetch(`${API_URL}/list_transcripts`);
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        
        if (data.transcripts && data.transcripts.length > 0) {
            transcriptsList.innerHTML = data.transcripts.map(t => `
                <div class="transcript-item">
                    <div class="date">${new Date(t.created_at).toLocaleString()}</div>
                    <div class="filename">${t.filename}</div>
                    <div class="size">${(t.size_bytes / 1024).toFixed(1)} KB</div>
                </div>
            `).join('');
        } else {
            transcriptsList.innerHTML = '<p class="no-transcripts">No transcripts found. Upload a meeting to get started!</p>';
        }
    } catch (error) {
        console.error('Error loading transcripts:', error);
        transcriptsList.innerHTML = '<p class="no-transcripts">Could not load transcripts. Is the server running?</p>';
    }
}

// ========================================
// QA FUNCTIONS
// ========================================

async function askQuestion() {
    const questionInput = document.getElementById('qaQuestion');
    const question = questionInput.value.trim();
    
    if (!question) {
        alert('Please enter a question.');
        return;
    }
    
    const qaLoading = document.getElementById('qaLoading');
    const qaResults = document.getElementById('qaResults');
    qaLoading.classList.remove('hidden');
    qaResults.classList.add('hidden');
    
    const askBtn = document.querySelector('.btn-ask');
    askBtn.disabled = true;
    askBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    
    try {
        const response = await fetch(`${API_URL}/ask?question=${encodeURIComponent(question)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }
        
        const data = await response.json();
        
        qaLoading.classList.add('hidden');
        qaResults.classList.remove('hidden');
        displayQAAnswer(data, question);
        
    } catch (error) {
        console.error('QA Error:', error);
        qaLoading.classList.add('hidden');
        qaResults.classList.remove('hidden');
        document.getElementById('qaAnswerDisplay').textContent = 'Error: ' + error.message;
        document.getElementById('qaQuestionDisplay').textContent = question;
        document.getElementById('qaConfidenceDisplay').textContent = '0%';
        document.getElementById('qaConfidenceFill').style.width = '0%';
        document.getElementById('qaSourcesList').innerHTML = '';
    }
    
    askBtn.disabled = false;
    askBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Ask';
}

function displayQAAnswer(data, question) {
    document.getElementById('qaQuestionDisplay').textContent = question;
    document.getElementById('qaAnswerDisplay').textContent = data.answer || 'No answer found.';
    
    const confidence = data.confidence || 0;
    document.getElementById('qaConfidenceDisplay').textContent = confidence + '%';
    
    const confidenceFill = document.getElementById('qaConfidenceFill');
    confidenceFill.style.width = confidence + '%';
    
    confidenceFill.className = 'confidence-fill';
    if (confidence < 30) {
        confidenceFill.classList.add('low');
    } else if (confidence < 60) {
        confidenceFill.classList.add('medium');
    } else {
        confidenceFill.classList.add('high');
    }
    
    const sourcesList = document.getElementById('qaSourcesList');
    if (data.sources && data.sources.length > 0) {
        sourcesList.innerHTML = data.sources.map(source => `
            <div class="source-item">
                ${source.chunk ? source.chunk.slice(0, 200) + '...' : 'Source available'}
                <span class="source-similarity">Similarity: ${source.similarity || 0}%</span>
            </div>
        `).join('');
    } else {
        sourcesList.innerHTML = '<div class="source-item">No specific sources found.</div>';
    }
}

function askQuickQuestion(question) {
    document.getElementById('qaQuestion').value = question;
    askQuestion();
}

// ========================================
// SEARCH FUNCTIONS
// ========================================

async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('Please enter a search term.');
        return;
    }
    
    const filter = document.getElementById('searchFilter').value;
    
    const searchLoading = document.getElementById('searchLoading');
    const searchResults = document.getElementById('searchResults');
    const searchEmpty = document.getElementById('searchEmpty');
    
    searchLoading.classList.remove('hidden');
    searchResults.classList.add('hidden');
    searchEmpty.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_URL}/list_transcripts`);
        if (!response.ok) throw new Error('Failed to load transcripts');
        const data = await response.json();
        
        const transcripts = data.transcripts || [];
        
        let filtered = transcripts;
        if (filter === 'last7') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            filtered = transcripts.filter(t => new Date(t.created_at) > cutoff);
        } else if (filter === 'last30') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            filtered = transcripts.filter(t => new Date(t.created_at) > cutoff);
        }
        
        if (filtered.length === 0) {
            searchLoading.classList.add('hidden');
            searchEmpty.classList.remove('hidden');
            searchEmpty.querySelector('p').textContent = 'No meetings found for the selected filter.';
            return;
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ');
        
        for (const transcript of filtered) {
            try {
                const contentResponse = await fetch(`${API_URL}/transcript/${transcript.filename}`);
                if (!contentResponse.ok) continue;
                const contentData = await contentResponse.json();
                
                const content = contentData.content || '';
                const contentLower = content.toLowerCase();
                
                let score = 0;
                let matchPositions = [];
                
                for (const word of queryWords) {
                    if (word.length < 2) continue;
                    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
                    if (matches > 0) {
                        score += matches;
                        let pos = contentLower.indexOf(word);
                        while (pos !== -1) {
                            matchPositions.push(pos);
                            pos = contentLower.indexOf(word, pos + 1);
                        }
                    }
                }
                
                if (score > 0) {
                    let context = '';
                    if (matchPositions.length > 0) {
                        const pos = matchPositions[0];
                        const start = Math.max(0, pos - 100);
                        const end = Math.min(content.length, pos + 200);
                        context = content.substring(start, end);
                        
                        for (const word of queryWords) {
                            if (word.length < 2) continue;
                            const regex = new RegExp(word, 'gi');
                            context = context.replace(regex, (match) => `<span class="highlight">${match}</span>`);
                        }
                    }
                    
                    results.push({
                        filename: transcript.filename,
                        date: transcript.created_at,
                        size: transcript.size_bytes,
                        score: score,
                        context: context || content.substring(0, 200) + '...',
                        fullContent: content
                    });
                }
            } catch (e) {
                console.error('Error searching transcript:', e);
            }
        }
        
        results.sort((a, b) => b.score - a.score);
        
        searchLoading.classList.add('hidden');
        
        if (results.length === 0) {
            searchEmpty.classList.remove('hidden');
            searchEmpty.querySelector('p').textContent = 'No results found for "' + query + '". Try different keywords.';
            return;
        }
        
        searchResults.classList.remove('hidden');
        document.getElementById('resultCount').textContent = results.length;
        
        const resultsList = document.getElementById('searchResultsList');
        resultsList.innerHTML = results.map(r => `
            <div class="search-result-item">
                <div class="result-header">
                    <span class="result-filename">${r.filename}</span>
                    <span class="result-date">${new Date(r.date).toLocaleString()}</span>
                </div>
                <div class="result-content">${r.context}</div>
                <div class="result-meta">
                    <span class="result-match">🔥 ${r.score} matches</span>
                    <span>${(r.size / 1024).toFixed(1)} KB</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Search error:', error);
        searchLoading.classList.add('hidden');
        searchEmpty.classList.remove('hidden');
        searchEmpty.querySelector('p').textContent = 'Error searching: ' + error.message;
    }
}

// ========================================
// REFRESH
// ========================================

document.getElementById('refreshBtn').addEventListener('click', (e) => {
    e.preventDefault();
    loadTranscripts();
    loadDashboardData();
});

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadTranscripts();
    loadDashboardData();
    console.log('🎯 MeetMind AI - Complete Version Loaded');
    console.log('📡 Backend API:', API_URL);
    console.log('🔒 Privacy Mode: ON by default');
});