import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Terminal, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SandboxViewer from '@/components/SandboxViewer';

export default function Sandbox() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </div>

                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Terminal className="w-8 h-8 text-primary" />
                        <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Code Sandbox
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Monitor and interact with the code execution sandbox. View real-time execution results, 
                        system architecture, and project analysis from the sand_box_project service.
                    </p>
                </div>
            </motion.div>

            {/* Sandbox Viewer Component */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <SandboxViewer />
            </motion.div>
        </div>
    );
}
