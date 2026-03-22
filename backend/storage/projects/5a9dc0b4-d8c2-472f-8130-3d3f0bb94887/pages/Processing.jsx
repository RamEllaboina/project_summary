import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, BrainCircuit, Code, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/context/AnalysisContext';

const steps = [
    { id: 1, label: "Uploading Files", icon: CheckCircle, duration: 2000 },
    { id: 2, label: "Cleaning Project Structure", icon: Search, duration: 1500 },
    { id: 3, label: "Understanding Logic Flow", icon: BrainCircuit, duration: 2500 },
    { id: 4, label: "Analyzing Code & Patterns", icon: Code, duration: 3000 },
    { id: 5, label: "Detecting AI Generative Signals", icon: BrainCircuit, duration: 2000 },
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
    const { setAnalysisResults } = useAnalysis();
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        let stepIndex = 0;
        let accumulatedTime = 0;

        // Step progression logic
        const interval = setInterval(() => {
            if (stepIndex < steps.length) {
                setCurrentStep(stepIndex);
                stepIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    // Finish processing
                    setAnalysisResults({
                        // Dummy data for now
                        score: 85,
                        summary: "High quality codebase with minor issues.",
                        aiProbability: 12,
                        strengths: ["Clean Architecture", "Modular Design", "Good Comments"],
                        weaknesses: ["Missing Input Validation", "Hardcoded API Keys"],
                        tabs: {
                            overview: "The project structure is well-organized following standard React patterns. Component separation is clear.",
                            architecture: "Uses a feature-based folder structure which scales well. State management is handled via Context API effectively.",
                            codeQuality: "High consistency in code style. Variable names are descriptive. Some functions in `utils.js` could be decomposed.",
                            security: "Found 2 potential security risks: Hardcoded API keys in `config.js` and missing prop validation in form components.",
                            aiDetection: "Low probability of AI generation (12%). The code shows distinct human patterns in error handling and specific business logic implementation.",
                            realWorld: "This application has clear real-world utility for tracking inventory. It solves a tangible problem for small businesses."
                        }
                    });
                    navigate('/report');
                }, 1000);
            }
        }, 2500); // Average step time simulation

        // Progress bar mock
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) return 100;
                return p + (Math.random() * 2);
            });
        }, 100);

        // Message rotation
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % messages.length);
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, [navigate, setAnalysisResults]);

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
                            {messages[messageIndex]}
                        </motion.span>
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

            </motion.div>
        </div>
    );
}
