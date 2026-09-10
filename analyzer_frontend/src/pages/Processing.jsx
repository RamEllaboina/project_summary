import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, BrainCircuit, Code, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';
import { api } from '@/services/api';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const steps = [
    { id: 1, label: "Uploading Files", icon: CheckCircle, duration: 2000 },
    { id: 2, label: "Cleaning Project Structure", icon: Search, duration: 1500 },
    { id: 3, label: "Analyzing Code & Patterns", icon: Code, duration: 2500 },
    { id: 4, label: "AI Evaluation & Detection", icon: BrainCircuit, duration: 3000 },
    { id: 5, label: "Sandbox Execution", icon: BrainCircuit, duration: 2000 },
    { id: 6, label: "Generating Final Report", icon: FileText, duration: 1500 },
];

const messages = [
    "Running static analysis on components...",
    "Identifying security vulnerabilities...",
    "Comparing against 10M+ open source repos...",
    "Evaluating variable naming conventions...",
    "Checking architectural consistency...",
    "Calculating complexity scores...",
];

export default function Processing() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [error, setError] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);
    const { setAnalysisResults, currentProjectId } = useAnalysis();

    useEffect(() => {
        if (!currentProjectId) {
            console.log('❌ No project ID, redirecting to upload');
            navigate('/upload');
            return;
        }

        console.log(`🔍 Starting status polling for project: ${currentProjectId}`);

        let pollingInterval;
        let timeoutId;

        const checkStatus = async () => {
            try {
                setAttemptCount(prev => prev + 1);
                console.log(`📊 Status check #${attemptCount + 1} for ${currentProjectId}`);

                const statusData = await api.getProjectStatus(currentProjectId);
                console.log('📦 Full status response:', statusData);

                // Handle different response formats
                const currentStatus = statusData.status || statusData.data?.status;
                const progressData = statusData.progress || statusData.data?.progress || {};

                console.log(`📌 Current status: ${currentStatus}`);
                console.log(`📌 Progress:`, progressData);

                // Update progress if available
                if (progressData.percentage) {
                    setProgress(progressData.percentage);
                }

                if (progressData.currentStep) {
                    const stepMap = {
                        'uploaded': 0,
                        'cleaning': 1,
                        'analyzing': 2,
                        'ai_evaluation': 3,
                        'generating': 3,
                        'sandbox': 4,
                        'completed': 5,
                        'failed': -1
                    };
                    const stepIndex = stepMap[currentStatus] || 0;
                    setCurrentStep(stepIndex);
                }

                // Check for completion
                if (currentStatus === 'completed') {
                    console.log('✅ Analysis completed! Fetching report...');
                    clearInterval(pollingInterval);
                    clearTimeout(timeoutId);

                    try {
                        const reportData = await api.getProjectReport(currentProjectId);
                        console.log('📄 Raw report response:', reportData);

                        // Handle different response formats
                        let report = null;

                        if (reportData && typeof reportData === 'object') {
                            // Check if report is in data.report, report, or directly in data
                            if (reportData.data && reportData.data.report) {
                                report = reportData.data.report;
                            } else if (reportData.report) {
                                report = reportData.report;
                            } else if (reportData.data && typeof reportData.data === 'object') {
                                report = reportData.data;
                            } else {
                                report = reportData;
                            }
                        }

                        console.log('📄 Extracted report:', report);

                        if (report && typeof report === 'object') {
                            setAnalysisResults(report);
                            console.log('✅ Report set in context, navigating to /report');
                            navigate('/report');
                        } else {
                            console.error('❌ Invalid report format:', report);
                            setError('Failed to get report data - invalid format');
                        }
                    } catch (reportError) {
                        console.error('❌ Error fetching report:', reportError);
                        setError(`Failed to fetch report: ${reportError.message}`);
                    }
                    return;
                }

                if (currentStatus === 'failed') {
                    console.error('❌ Analysis failed:', statusData.error);
                    setError(statusData.error?.message || 'Analysis failed. Please try again.');
                    clearInterval(pollingInterval);
                    clearTimeout(timeoutId);
                    return;
                }

                // Update message based on current step
                const stepIndex = Math.min(currentStep, messages.length - 1);
                setMessageIndex(stepIndex);

            } catch (err) {
                console.error('❌ Polling error:', err);
                // Don't stop polling on transient errors
            }
        };

        // Poll every 2 seconds
        pollingInterval = setInterval(checkStatus, 2000);
        checkStatus(); // Initial check

        // Force redirect after 120 seconds if still not completed
        timeoutId = setTimeout(() => {
            console.log('⏰ Timeout - forcing navigation to report');
            // Try to get report anyway
            api.getProjectReport(currentProjectId)
                .then(reportData => {
                    console.log('📄 Timeout report fetch:', reportData);

                    let report = null;
                    if (reportData && typeof reportData === 'object') {
                        if (reportData.data && reportData.data.report) {
                            report = reportData.data.report;
                        } else if (reportData.report) {
                            report = reportData.report;
                        } else if (reportData.data && typeof reportData.data === 'object') {
                            report = reportData.data;
                        } else {
                            report = reportData;
                        }
                    }

                    if (report && typeof report === 'object') {
                        setAnalysisResults(report);
                        navigate('/report');
                    } else {
                        setError('Analysis is taking longer than expected. Please try again.');
                    }
                })
                .catch((err) => {
                    console.error('⏰ Timeout error:', err);
                    setError('Analysis is taking longer than expected. Please try again.');
                });
        }, 600000); // 10 minutes timeout instead of 120 seconds

        return () => {
            clearInterval(pollingInterval);
            clearTimeout(timeoutId);
        };
    }, [navigate, setAnalysisResults, currentProjectId]);

    // Show error if any
    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-primary/5 -z-10" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md space-y-8 text-center"
            >

                {/* Main Loading Visual */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-4 border-dotted border-secondary-foreground/10"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">AI Analysis in Progress</h2>
                    <p className="text-muted-foreground h-6 overflow-hidden">
                        <motion.span
                            key={messageIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {messages[messageIndex] || "Processing your project..."}
                        </motion.span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Project ID: {currentProjectId?.substring(0, 8)}...
                    </p>
                </div>

                <Progress value={progress} className="h-1 bg-muted" />

                {/* Steps List */}
                <div className="space-y-3 pt-6 text-left max-w-sm mx-auto">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary/5 border border-primary/10' : 'opacity-40'}
                `}
                            >
                                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                  ${isCompleted ? 'bg-primary text-primary-foreground border-primary' :
                                        isActive ? 'border-primary text-primary animate-pulse' : 'border-muted-foreground/30 text-muted-foreground'}
                `}>
                                    {isCompleted ? <CheckCircle className="w-3 h-3" /> : (index + 1)}
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                                {isActive && <Loader2 className="w-3 h-3 ml-auto animate-spin text-primary" />}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Debug info - Remove in production */}
                <div className="text-xs text-muted-foreground mt-4 opacity-50">
                    Attempt: {attemptCount} | Step: {currentStep + 1}/{steps.length}
                </div>

            </motion.div>
        </div>
    );
}