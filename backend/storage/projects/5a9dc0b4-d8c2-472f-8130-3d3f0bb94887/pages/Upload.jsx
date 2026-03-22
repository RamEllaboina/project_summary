import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Dropzone from '@/components/Dropzone';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FolderArchive, Code2, ShieldAlert } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function UploadPage() {
    const navigate = useNavigate();
    const { files, projectMetadata } = useAnalysis();
    const [canProceed, setCanProceed] = useState(false);

    const handleUploadComplete = () => {
        setCanProceed(true);
    };

    const handleStartAnalysis = () => {
        navigate('/processing');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12 space-y-8 relative">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl text-center space-y-2 mb-8"
            >
                <h1 className="text-3xl font-bold tracking-tight">Upload Project Files</h1>
                <p className="text-muted-foreground text-lg">
                    Drag & drop your source code folder or ZIP archive.
                </p>
            </motion.div>

            {/* Main Content Area */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-4xl bg-card border rounded-2xl shadow-sm overflow-hidden"
            >
                <div className="p-8 md:p-12 space-y-8 bg-gradient-to-b from-card to-secondary/10">

                    <Dropzone onUploadComplete={handleUploadComplete} />

                    {/* Project Summary Card (appears after upload) */}
                    {canProceed && projectMetadata && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-8 border-t pt-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <FolderArchive className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase font-bold">Files</div>
                                        <div className="font-semibold">{projectMetadata.filesCount} detected</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Code2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase font-bold">Main Stack</div>
                                        <div className="font-semibold">{projectMetadata.stack}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase font-bold">Status</div>
                                        <div className="font-semibold text-green-600">Ready to Analyze</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <Button
                                    size="lg"
                                    onClick={handleStartAnalysis}
                                    className="px-8 font-semibold text-lg shadow-lg hover:shadow-primary/25 transition-all"
                                >
                                    Start Detailed Analysis <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </div>
            </motion.div>

            {/* Footer Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm text-muted-foreground max-w-lg"
            >
                <p>🔒 Uses secure local scanning. Code is analyzed in ephemeral environments.</p>
            </motion.div>

        </div>
    );
}
