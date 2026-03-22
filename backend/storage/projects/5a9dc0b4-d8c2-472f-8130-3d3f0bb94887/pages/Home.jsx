import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BrainCircuit, Upload, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10 -z-10" />

            {/* Hero Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl space-y-8"
            >
                <div className="flex items-center justify-center gap-2 mb-6 text-primary font-medium tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-widest">Next-Gen Evaluation</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 pb-2">
                    AI Hackathon Judge
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
                    Upload any project and receive a <span className="text-foreground font-semibold">professional evaluation report</span> in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button
                        size="lg"
                        className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105"
                        onClick={() => navigate('/upload')}
                    >
                        <Upload className="mr-2 w-5 h-5" />
                        Upload Project
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5"
                    >
                        How it works
                    </Button>
                </div>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full"
            >
                {[
                    { icon: BrainCircuit, title: "Deep Analysis", text: "Understands code logic & architecture" },
                    { icon: CheckCircle, title: "Instant Feedback", text: "Get results in under 30 seconds" },
                    { icon: Sparkles, title: "Fair Judging", text: "Unbiased, data-driven evaluation" }
                ].map((feature, i) => (
                    <Card key={i} className="p-6 bg-background/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-colors">
                        <feature.icon className="w-8 h-8 text-primary mb-3" />
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.text}</p>
                    </Card>
                ))}
            </motion.div>

            {/* Blurred Preview Section (Visual Candy) */}
            <div className="mt-20 relative w-full max-w-5xl h-64 md:h-96 rounded-t-3xl border-t border-l border-r border-primary/10 bg-gradient-to-b from-background to-transparent overflow-hidden opacity-50 pointer-events-none mask-image-linear-to-b">
                <div className="absolute inset-x-8 top-8 bg-card rounded-xl border p-6 shadow-2xl skew-y-1 transform perspective-1000 rotate-x-6 origin-bottom scale-95 blur-[1px]">
                    <div className="flex gap-4 mb-4">
                        <div className="h-20 w-20 bg-muted rounded-full" />
                        <div className="space-y-2 flex-1">
                            <div className="h-6 w-1/3 bg-muted rounded" />
                            <div className="h-4 w-1/2 bg-muted/50 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-32 bg-muted/30 rounded-lg" />
                        <div className="h-32 bg-muted/30 rounded-lg" />
                        <div className="h-32 bg-muted/30 rounded-lg" />
                    </div>
                </div>
            </div>

        </div>
    );
}
