// Frontend AI Detection Integration Example
// This shows how to properly call the AI detection microservice

class AIDetectionManager {
    constructor() {
        this.aiDetectionUrl = 'http://localhost:8003/detect';
        this.mainAnalysisUrl = 'http://localhost:8002/evaluate';
    }

    // Main Code Analysis (uses primary API key)
    async analyzeCode(projectData) {
        try {
            const response = await fetch(this.mainAnalysisUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                throw new Error(`Main analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            console.log('✅ Main Analysis Results:');
            console.log('   Project:', result.projectId);
            console.log('   Quality Score:', result.qualityScore);
            console.log('   Structure Score:', result.structureScore);
            
            return result;
        } catch (error) {
            console.error('❌ Main Analysis Error:', error.message);
            throw error;
        }
    }

    // AI Detection (uses secondary API key)
    async detectAIGeneration(projectData) {
        try {
            const response = await fetch(this.aiDetectionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                throw new Error(`AI detection failed: ${response.status}`);
            }

            const result = await response.json();
            const aiDetection = result.aiDetection || {};
            
            console.log('✅ AI Detection Results:');
            console.log('   Project ID:', result.projectId);
            console.log('   Analysis Method:', result.analysisMethod);
            console.log('   File Count:', result.fileCount);
            
            // Extract AI detection information
            const aiLevel = aiDetection.level || 'low';
            const aiScore = aiDetection.score || 0;
            const aiConfidence = aiDetection.confidence || 0;
            const aiReasoning = aiDetection.reasoning || 'No reasoning provided';
            
            console.log('🤖 AI Detection Analysis:');
            console.log('   Level:', aiLevel.toUpperCase());
            console.log('   Score:', aiScore);
            console.log('   Confidence:', Math.round(aiConfidence * 100) + '%');
            console.log('   Reasoning:', aiReasoning);
            
            // Extract detailed signals
            const signals = aiDetection.signals || {};
            if (signals.ai_phrases && signals.ai_phrases.length > 0) {
                console.log('📋 AI Phrases Found:', signals.ai_phrases);
            }
            
            if (signals.naming_issues && signals.naming_issues.length > 0) {
                console.log('📝 Naming Issues:', signals.naming_issues);
            }
            
            if (signals.structure_patterns && signals.structure_patterns.length > 0) {
                console.log('🔄 Structure Patterns:', signals.structure_patterns);
            }
            
            // Extract suspicious files
            const suspiciousFiles = aiDetection.suspicious_files || [];
            if (suspiciousFiles.length > 0) {
                console.log('🚨 Suspicious Files:');
                suspiciousFiles.forEach(file => {
                    console.log(`   - ${file.file}: ${file.issues.join(', ')}`);
                });
            }
            
            // Calculate AI generation probability for UI
            const aiProbability = this.calculateAIProbability(aiLevel, aiScore);
            console.log('📊 AI Generation Probability:', aiProbability + '%');
            
            return {
                ...result,
                aiGenerationProbability: aiProbability,
                aiLevel: aiLevel,
                aiScore: aiScore,
                aiConfidence: aiConfidence,
                aiReasoning: aiReasoning
            };
            
        } catch (error) {
            console.error('❌ AI Detection Error:', error.message);
            throw error;
        }
    }

    // Calculate AI generation probability (0-100%)
    calculateAIProbability(level, score) {
        if (level === 'high' || score >= 8.0) {
            return 85 + Math.min(score * 2, 15); // 85-100%
        } else if (level === 'medium' || score >= 5.0) {
            return 50 + (score * 5); // 50-75%
        } else {
            return Math.min(score * 20, 25); // 0-25%
        }
    }

    // Format AI detection result for UI display
    formatAIResult(aiData) {
        const probability = aiData.aiGenerationProbability || 0;
        const level = aiData.aiLevel || 'low';
        
        return {
            probability: probability,
            level: level,
            label: this.getAIDetectionLabel(probability, level),
            color: this.getAIDetectionColor(probability),
            message: this.getAIDetectionMessage(probability, level, aiData.aiReasoning)
        };
    }

    getAIDetectionLabel(probability, level) {
        if (probability >= 85) return 'AI Generated';
        if (probability >= 50) return 'Likely AI';
        if (probability >= 25) return 'Possibly AI';
        return 'Human Written';
    }

    getAIDetectionColor(probability) {
        if (probability >= 85) return '#ff4444'; // Red
        if (probability >= 50) return '#ff9800'; // Orange
        if (probability >= 25) return '#ffc107'; // Yellow
        return '#28a745'; // Green
    }

    getAIDetectionMessage(probability, level, reasoning) {
        if (probability >= 85) {
            return `High probability of AI generation (${probability}%). ${reasoning}`;
        } else if (probability >= 50) {
            return `Medium probability of AI generation (${probability}%). ${reasoning}`;
        } else if (probability >= 25) {
            return `Low probability of AI generation (${probability}%). ${reasoning}`;
        } else {
            return `Very low probability of AI generation (${probability}%). ${reasoning}`;
        }
    }
}

// Usage Example:
const aiDetector = new AIDetectionManager();

// Example project data
const projectData = {
    projectId: 'frontend-test',
    language: 'JavaScript',
    metrics: {
        qualityScore: 75,
        structureScore: 70,
        securityScore: 65
    },
    importantFiles: [
        {
            path: 'test.js',
            content: `// Generated by AI assistant
const data = [];
function func() { 
    console.log('As an AI assistant, I created this'); 
    return data; 
}`
        }
    ],
    readme: 'Test project for AI detection'
};

// Test AI detection
aiDetector.detectAIGeneration(projectData)
    .then(result => {
        const formattedResult = aiDetector.formatAIResult(result);
        
        console.log('🎯 Final AI Detection Result:');
        console.log('   Label:', formattedResult.label);
        console.log('   Probability:', formattedResult.probability + '%');
        console.log('   Color:', formattedResult.color);
        console.log('   Message:', formattedResult.message);
        
        // Update UI
        updateAIDetectionUI(formattedResult);
    })
    .catch(error => {
        console.error('AI detection failed:', error);
    });

// Function to update UI with AI detection results
function updateAIDetectionUI(aiResult) {
    // Update probability display
    const probabilityElement = document.getElementById('ai-probability');
    if (probabilityElement) {
        probabilityElement.textContent = aiResult.probability + '%';
        probabilityElement.style.color = aiResult.color;
    }
    
    // Update label
    const labelElement = document.getElementById('ai-label');
    if (labelElement) {
        labelElement.textContent = aiResult.label;
        labelElement.style.color = aiResult.color;
    }
    
    // Update message
    const messageElement = document.getElementById('ai-message');
    if (messageElement) {
        messageElement.textContent = aiResult.message;
    }
    
    // Update progress bar
    const progressBar = document.getElementById('ai-progress');
    if (progressBar) {
        progressBar.style.width = aiResult.probability + '%';
        progressBar.style.backgroundColor = aiResult.color;
    }
}

export default AIDetectionManager;
