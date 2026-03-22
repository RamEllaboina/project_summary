import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Code2, BrainCircuit, Share2, Download, Terminal } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';
import SandboxViewer from '@/components/SandboxViewer';

const COLORS = ['#10b981', '#e5e7eb']; // Green, Gray

export default function Report() {
    const { analysisResults } = useAnalysis();
    const [score, setScore] = useState(0);

    // Data Mapping
    const data = analysisResults || {
        // Fallback or loading state if accessed directly without results
        metrics: { qualityScore: 0, structureScore: 0, securityScore: 0, complexity: {} },
        issues: [],
        aiEvaluation: null
    };

    // Get AI evaluation and detection from correct locations
    // AI detection can come from either AI engine (root level) or dedicated service
    const aiDetection = data.aiDetection || data.aiEvaluation?.aiDetection || {};
    const aiEvaluation = data.aiEvaluation || {};
    
    // Calculate AI probability from score (0-10 scale to 0-100 percentage)
    const aiScore = aiDetection?.score || 0;
    const aiLevel = aiDetection?.level || 'low';
    
    let aiProbability = 0;
    if (aiLevel === 'high' || aiScore >= 8.0) {
        aiProbability = 85 + Math.min(aiScore * 2, 15); // 85-100%
    } else if (aiLevel === 'medium' || aiScore >= 5.0) {
        aiProbability = 50 + (aiScore * 5); // 50-75%
    } else {
        aiProbability = Math.min(aiScore * 20, 25); // 0-25%
    }

    // Calculate overall score if not present
    const overallScore = data.metrics?.qualityScore
        ? Math.round((data.metrics.qualityScore + data.metrics.structureScore + data.metrics.securityScore) / 3)
        : 0;

    useEffect(() => {
        const timer = setTimeout(() => setScore(overallScore), 500);
        return () => clearTimeout(timer);
    }, [overallScore]);

    const scoreData = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    // Helper to get Issues count
    const securityIssuesCount = data.issues?.filter(i => i.category === 'Security')?.length || 0;

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
                            <Badge variant={score > 70 ? "default" : "secondary"}>{score > 70 ? "Passed" : "Needs Work"}</Badge>
                            <Badge variant="outline">{data.language || "Project"}</Badge>
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
                                <span className="text-4xl font-bold text-foreground">{aiProbability}%</span>
                                <span className="text-sm text-muted-foreground mb-1">{aiProbability < 30 ? "Human Written" : "AI Assisted"}</span>
                            </div>
                            <Progress value={aiProbability} className="h-3" />
                            <p className="text-xs text-muted-foreground">
                                Analysis of code patterns and structure.
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
                                <span className="text-lg font-semibold">{securityIssuesCount} Issues Found</span>
                                <Badge variant={securityIssuesCount > 0 ? "destructive" : "default"}>
                                    {securityIssuesCount > 0 ? "Attention Needed" : "Secure"}
                                </Badge>
                            </div>
                            <div className="space-y-2 h-16 overflow-y-auto">
                                {data.issues?.filter(i => i.category === 'Security').slice(0, 2).map((issue, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> {issue.message.substring(0, 30)}...
                                    </div>
                                ))}
                                {securityIssuesCount === 0 && <span className="text-sm text-muted-foreground">No critical issues found.</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Code Quality Preview */}
                    <Card className="sm:col-span-2 bg-secondary/20 border-none">
                        <CardContent className="pt-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <Code2 className="w-5 h-5 text-primary" /> Code Quality
                                </h4>
                                <p className="text-sm text-muted-foreground">Maintainability Index based on complexity analysis</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{Math.round(data.metrics?.complexity?.maintainability_index || 0)}</div>
                                <div className="text-xs text-muted-foreground">Index</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Analysis Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 md:grid-cols-4 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="architecture">Complexity</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="ai">AI Detection</TabsTrigger>
                    <TabsTrigger value="impact">Innovation</TabsTrigger>
                    <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
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
                                    {aiEvaluation?.strengths || data.strengths ? (
                                        <>
                                            {(aiEvaluation?.strengths?.technical || data.strengths?.technical)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-green-600 mb-2">Technical</h4>
                                                    {(aiEvaluation?.strengths?.technical || data.strengths?.technical).map((s, i) => (
                                                        <div key={`tech-${i}`} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-500/50" /> {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {(aiEvaluation?.strengths?.architectural || data.strengths?.architectural)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-green-600 mb-2">Architectural</h4>
                                                    {(aiEvaluation?.strengths?.architectural || data.strengths?.architectural).map((s, i) => (
                                                        <div key={`arch-${i}`} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-500/50" /> {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {(aiEvaluation?.strengths?.performance || data.strengths?.performance)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-green-600 mb-2">Performance</h4>
                                                    {(aiEvaluation?.strengths?.performance || data.strengths?.performance).map((s, i) => (
                                                        <div key={`perf-${i}`} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-500/50" /> {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">No strengths analyzed yet.</span>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><XCircle className="w-5 h-5" /> Weaknesses</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {aiEvaluation?.weaknesses || data.weaknesses ? (
                                        <>
                                            {(aiEvaluation?.weaknesses?.technical || data.weaknesses?.technical)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-red-600 mb-2">Technical</h4>
                                                    {(aiEvaluation?.weaknesses?.technical || data.weaknesses?.technical).map((w, i) => (
                                                        <div key={`tech-${i}`} className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500/50" /> {w}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {(aiEvaluation?.weaknesses?.architectural || data.weaknesses?.architectural)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-red-600 mb-2">Architectural</h4>
                                                    {(aiEvaluation?.weaknesses?.architectural || data.weaknesses?.architectural).map((w, i) => (
                                                        <div key={`arch-${i}`} className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500/50" /> {w}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {(aiEvaluation?.weaknesses?.performance || data.weaknesses?.performance)?.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-sm text-red-600 mb-2">Performance</h4>
                                                    {(aiEvaluation?.weaknesses?.performance || data.weaknesses?.performance).map((w, i) => (
                                                        <div key={`perf-${i}`} className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500/50" /> {w}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">No weaknesses identified yet.</span>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-muted/30">
                            <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-muted-foreground">
                                    {aiEvaluation?.realWorldReadiness || data.realWorldReadiness || "Analysis pending..."}
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="architecture">
                        <Card>
                            <CardHeader><CardTitle>Complexity Analysis</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded">
                                        <div className="text-xl font-bold">{data.metrics?.complexity?.max_complexity || 0}</div>
                                        <div className="text-sm text-muted-foreground">Max Cyclomatic Complexity</div>
                                    </div>
                                    <div className="p-4 border rounded">
                                        <div className="text-xl font-bold">{data.metrics?.complexity?.average_cyclomatic_complexity?.toFixed(2) || 0}</div>
                                        <div className="text-sm text-muted-foreground">Avg Complexity</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quality">
                        <Card>
                            <CardHeader><CardTitle>Code Quality Issues</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3 h-64 overflow-y-auto">
                                    {data.issues?.filter(i => i.category === 'Quality').map((issue, idx) => (
                                        <div key={idx} className="p-3 bg-muted rounded border flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-sm">{issue.message}</div>
                                                <div className="text-xs text-muted-foreground">{issue.file}:{issue.line}</div>
                                            </div>
                                            <Badge variant="outline">{issue.severity}</Badge>
                                        </div>
                                    ))}
                                    {data.issues?.filter(i => i.category === 'Quality').length === 0 && <p>No quality issues found.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="border-red-100 dark:border-red-900/20">
                            <CardHeader><CardTitle className="text-red-500">Security Vulnerabilities</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.issues?.filter(i => i.category === 'Security').map((issue, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/20">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                            <div>
                                                <h5 className="font-semibold text-sm text-red-700 dark:text-red-400">{issue.message}</h5>
                                                <p className="text-xs text-red-600/80 dark:text-red-300/70">Location: {issue.file}:{issue.line}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {data.issues?.filter(i => i.category === 'Security').length === 0 && <p>No security issues found.</p>}
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
                                        <span className="text-2xl font-bold text-purple-600">{Math.round(aiProbability)}%</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{aiProbability < 50 ? "Human-Dominant Codebase" : "AI-Assisted Codebase"}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {aiProbability < 30 ? "The analysis detected distinct imperfections and specific logic patterns that are characteristic of human developers." :
                                                "The code exhibits patterns often associated with AI generation, such as high uniformity and specific comment styles."}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Badge variant={aiLevel === 'high' ? 'destructive' : aiLevel === 'medium' ? 'default' : 'secondary'}>
                                                Level: {aiLevel?.toUpperCase()}
                                            </Badge>
                                            <Badge variant="outline">
                                                Score: {aiScore}/10
                                            </Badge>
                                            <Badge variant="outline">
                                                Confidence: {Math.round((aiDetection?.confidence || 0) * 100)}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* AI Detection Details */}
                                {aiDetection?.reasoning && (
                                    <div className="mt-6 p-4 bg-muted rounded-lg">
                                        <h5 className="font-semibold mb-2">AI Detection Reasoning</h5>
                                        <p className="text-sm text-muted-foreground">{aiDetection.reasoning}</p>
                                    </div>
                                )}
                                
                                {/* AI Signals */}
                                {aiDetection?.signals && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {aiDetection.signals.ai_phrases && (
                                            <div className="p-4 border rounded-lg">
                                                <h5 className="font-semibold mb-2 text-red-600">AI Phrases Found</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {(Array.isArray(aiDetection.signals.ai_phrases) ? aiDetection.signals.ai_phrases : [aiDetection.signals.ai_phrases]).map((phrase, idx) => (
                                                        <Badge key={idx} variant="destructive" className="text-xs">
                                                            {phrase}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {aiDetection.signals.naming_issues && (
                                            <div className="p-4 border rounded-lg">
                                                <h5 className="font-semibold mb-2 text-amber-600">Naming Issues</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {(Array.isArray(aiDetection.signals.naming_issues) ? aiDetection.signals.naming_issues : [aiDetection.signals.naming_issues]).map((name, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="impact">
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/30">
                            <CardHeader><CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2"><Zap className="w-5 h-5" /> Innovation & Real World</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-4">
                                    Level: {aiEvaluation?.innovation?.level || data.innovation?.level || "Unknown"}
                                </p>
                                <p className="text-muted-foreground">{aiEvaluation?.realWorldReadiness || data.realWorldReadiness}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sandbox">
                        <SandboxViewer sandboxData={data.sandbox} />
                    </TabsContent>

                </motion.div>
            </Tabs>

        </div>
    );
}
