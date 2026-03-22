import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Code2, BrainCircuit, Share2, Download } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

const COLORS = ['#10b981', '#e5e7eb']; // Green, Gray

export default function Report() {
    const { analysisResults } = useAnalysis();
    const [score, setScore] = useState(0);

    // If no results (direct access), use dummy data
    const data = analysisResults || {
        score: 85,
        summary: "High quality codebase with minor issues.",
        aiProbability: 12,
        strengths: ["Clean Architecture", "Modular Design", "Good Comments"],
        weaknesses: ["Missing Input Validation", "Hardcoded API Keys", "Large Controllers"],
        tabs: {
            overview: "The project structure is well-organized following standard React patterns. Component separation is clear.",
            architecture: "Uses a feature-based folder structure which scales well. State management is handled via Context API effectively.",
            codeQuality: "High consistency in code style. Variable names are descriptive. Some functions in `utils.js` could be decomposed.",
            security: "Found 2 potential security risks: Hardcoded API keys in `config.js` and missing prop validation in form components.",
            aiDetection: "Low probability of AI generation (12%). The code shows distinct human patterns in error handling and specific business logic implementation.",
            realWorld: "This application has clear real-world utility for tracking inventory. It solves a tangible problem for small businesses."
        }
    };

    useEffect(() => {
        // Animate score on mount
        const timer = setTimeout(() => setScore(data.score), 500);
        return () => clearTimeout(timer);
    }, [data.score]);

    const scoreData = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Final Evaluation Report</h1>
                    <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Share</Button>
                    <Button size="sm"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
                </div>
            </div>

            {/* Top Value Props Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Overall Score Card */}
                <Card className="col-span-1 md:col-span-1 border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall Score</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="h-48 w-full relative content-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={scoreData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        startAngle={90}
                                        endAngle={-270}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {scoreData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? COLORS[0] : COLORS[1]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-5xl font-bold text-foreground">{score}</span>
                                <span className="text-sm text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Badge variant={score > 80 ? "default" : "secondary"}>Passed</Badge>
                            <Badge variant="outline">Web App</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics / AI Probability */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* AI Probability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-purple-500" />
                                AI Generation Probability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-bold text-foreground">{data.aiProbability}%</span>
                                <span className="text-sm text-muted-foreground mb-1">Low Probability</span>
                            </div>
                            <Progress value={data.aiProbability} className="h-3" />
                            <p className="text-xs text-muted-foreground">
                                Based on variable naming patterns, logic structure, and comment density.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Security Scan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                Security Health
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">2 Issues Found</span>
                                <Badge variant="destructive">Medium Risk</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Hardcoded Secrets
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Validation
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code Quality Preview */}
                    <Card className="sm:col-span-2 bg-secondary/20 border-none">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Code2 className="w-5 h-5 text-primary" /> Code Maintainability
                                </h4>
                                <p className="text-sm text-muted-foreground">Ranked in top 15% of submissions</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">A-</div>
                                <div className="text-xs text-muted-foreground">Grade</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Analysis Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="architecture">Architecture</TabsTrigger>
                    <TabsTrigger value="quality">Code Quality</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="ai">AI Detection</TabsTrigger>
                    <TabsTrigger value="impact">Impact</TabsTrigger>
                </TabsList>

                {/* Content implementation for each tab */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Strengths</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {data.strengths.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-500/50" /> {s}</div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><XCircle className="w-5 h-5" /> Weaknesses</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {data.weaknesses.map((w, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500/50" /> {w}</div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-muted/30">
                            <CardContent className="pt-6">
                                <p className="leading-relaxed text-muted-foreground">{data.tabs.overview}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="architecture">
                        <Card>
                            <CardHeader><CardTitle>System Architecture Review</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">{data.tabs.architecture}</p>
                                {/* Visual Placeholder for Architecture Diagram */}
                                <div className="h-40 w-full bg-secondary/30 rounded-lg flex items-center justify-center border border-dashed">
                                    <div className="text-center">
                                        <Share2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                        <span className="text-xs text-muted-foreground">Modular Component Diagram Generated</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quality">
                        <Card>
                            <CardHeader><CardTitle>Codebase Quality Metrics</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">{data.tabs.codeQuality}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-background border rounded-lg text-center">
                                        <div className="text-2xl font-bold">142</div>
                                        <div className="text-xs text-muted-foreground">Functions</div>
                                    </div>
                                    <div className="p-4 bg-background border rounded-lg text-center">
                                        <div className="text-2xl font-bold">92%</div>
                                        <div className="text-xs text-muted-foreground">Comment Ratio</div>
                                    </div>
                                    <div className="p-4 bg-background border rounded-lg text-center">
                                        <div className="text-2xl font-bold">A</div>
                                        <div className="text-xs text-muted-foreground">DRY Score</div>
                                    </div>
                                    <div className="p-4 bg-background border rounded-lg text-center">
                                        <div className="text-2xl font-bold">Low</div>
                                        <div className="text-xs text-muted-foreground">Cyclomatic Complexity</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="border-red-100 dark:border-red-900/20">
                            <CardHeader><CardTitle className="text-red-500">Security Vulnerabilities</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">{data.tabs.security}</p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                        <div>
                                            <h5 className="font-semibold text-sm text-red-700 dark:text-red-400">Hardcoded API Keys</h5>
                                            <p className="text-xs text-red-600/80 dark:text-red-300/70">Found AWS key pattern in config/default.json. Strongly recommend moving to environment variables.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ai">
                        <Card>
                            <CardHeader><CardTitle>AI Generative Content Detection</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="relative h-24 w-24 flex items-center justify-center bg-purple-50 rounded-full border-4 border-purple-100">
                                        <span className="text-2xl font-bold text-purple-600">{data.aiProbability}%</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">Human-Written Codebase</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            The analysis detected distinct "imperfections" and specific logic patterns that are characteristic of human developers.
                                            AI generated code typically exhibits higher uniformity.
                                        </p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground">{data.tabs.aiDetection}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="impact">
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/30">
                            <CardHeader><CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2"><Zap className="w-5 h-5" /> Real World Impact</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
                                    "This project demonstrates high potential for real-world application."
                                </p>
                                <p className="text-muted-foreground">{data.tabs.realWorld}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </motion.div>
            </Tabs>

        </div>
    );
}
