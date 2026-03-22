import React, { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext();

export const useAnalysis = () => useContext(AnalysisContext);

export const AnalysisProvider = ({ children }) => {
    const [files, setFiles] = useState([]);
    const [projectMetadata, setProjectMetadata] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [currentProjectId, setCurrentProjectId] = useState(null);

    const startAnalysis = () => {
        setIsProcessing(true);
        // Simulation logic will be in Processing component or a service
    };

    const resetAnalysis = () => {
        setFiles([]);
        setProjectMetadata(null);
        setAnalysisResults(null);
        setIsProcessing(false);
        setCurrentStep(0);
    };

    return (
        <AnalysisContext.Provider
            value={{
                files,
                setFiles,
                projectMetadata,
                setProjectMetadata,
                analysisResults,
                setAnalysisResults,
                isProcessing,
                setIsProcessing,
                currentStep,
                setCurrentStep,
                currentProjectId,
                setCurrentProjectId,
                startAnalysis,
                resetAnalysis,
            }}
        >
            {children}
        </AnalysisContext.Provider>
    );
};
