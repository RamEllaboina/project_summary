import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';

import { Shield, Zap, Code2, AlertTriangle, CheckCircle, XCircle, Globe, Package, Clock, Cpu, Activity, Terminal, Play, ExternalLink, RefreshCw, FolderOpen, Share2, Download, BrainCircuit, ShieldCheck, CheckCircle2 } from 'lucide-react';

import Footer from '@/components/Footer';

import { useAnalysis } from '@/context/AnalysisContext';

import SandboxViewer from '@/components/SandboxViewer';
import { ProjectFlow } from '@/components/ProjectFlow';



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



    // Calculate overall score from correct locations

    const overallScore = (data.qualityScore && data.structureScore && data.securityScore)

        ? Math.round((data.qualityScore + data.structureScore + data.securityScore) / 3)

        : data.metrics?.qualityScore

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
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 md:grid-cols-4 mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="flow">Project Flow</TabsTrigger>
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

                                        <div>

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

                                        </div>

                                    ) : (

                                        <span className="text-muted-foreground">No strengths analyzed yet.</span>

                                    )}

                                </CardContent>

                            </Card>

                            <Card>

                                <CardHeader><CardTitle className="text-red-500 flex items-center gap-2"><XCircle className="w-5 h-5" /> Weaknesses</CardTitle></CardHeader>

                                <CardContent className="space-y-2">

                                    {aiEvaluation?.weaknesses || data.weaknesses ? (

                                        <div>

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

                                        </div>

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

                    <TabsContent value="flow">
                        <ProjectFlow flowData={aiEvaluation?.projectFlow} />
                    </TabsContent>

                    <TabsContent value="architecture">

                        <Card>

                            <CardHeader><CardTitle>Complexity Analysis</CardTitle></CardHeader>

                            <CardContent className="space-y-6">

                                {/* Overall Complexity Metrics */}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.max_complexity || 0}</div>

                                        <div className="text-sm text-muted-foreground">Max Cyclomatic Complexity</div>

                                    </div>

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.average_cyclomatic_complexity?.toFixed(2) || 0}</div>

                                        <div className="text-sm text-muted-foreground">Avg Complexity</div>

                                    </div>

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.complex_functions || 0}</div>

                                        <div className="text-sm text-muted-foreground">Complex Functions</div>

                                    </div>

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.total_files || 0}</div>

                                        <div className="text-sm text-muted-foreground">Total Files</div>

                                    </div>

                                </div>



                                {/* Complexity by File Extension */}

                                {data.metrics?.complexity?.complexity_by_extension && Object.keys(data.metrics.complexity.complexity_by_extension).length > 0 && (

                                    <div>

                                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">

                                            <Code2 className="w-5 h-5 text-blue-500" />

                                            Complexity by File Extension

                                        </h4>



                                        {/* Extension Summary Cards */}

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

                                            {Object.entries(data.metrics.complexity.complexity_by_extension)

                                                .sort(([, a], [, b]) => b.avg_cc - a.avg_cc)

                                                .map(([ext, data]) => (

                                                    <div key={ext} className="border rounded-lg p-4">

                                                        <div className="flex items-center justify-between mb-3">

                                                            <div className="flex items-center gap-2">

                                                                <div className={`w-3 h-3 rounded-full ${ext === '.js' ? 'bg-yellow-500' :

                                                                    ext === '.py' ? 'bg-blue-500' :

                                                                        ext === '.html' ? 'bg-orange-500' :

                                                                            ext === '.css' ? 'bg-purple-500' :

                                                                                ext === '.jsx' ? 'bg-cyan-500' :

                                                                                    ext === '.ts' ? 'bg-indigo-500' :

                                                                                        'bg-gray-500'

                                                                    }`}></div>

                                                                <span className="font-medium text-lg">

                                                                    {ext === 'no_extension' ? 'No Extension' : ext}

                                                                </span>

                                                            </div>

                                                            <Badge variant={

                                                                data.avg_cc > 15 ? 'destructive' :

                                                                    data.avg_cc > 10 ? 'destructive' :

                                                                        data.avg_cc > 5 ? 'default' : 'secondary'

                                                            }>

                                                                {data.avg_cc > 15 ? 'Very High' :

                                                                    data.avg_cc > 10 ? 'High' :

                                                                        data.avg_cc > 5 ? 'Medium' : 'Low'}

                                                            </Badge>

                                                        </div>



                                                        <div className="grid grid-cols-2 gap-3 text-sm">

                                                            <div>

                                                                <div className="text-muted-foreground">Files</div>

                                                                <div className="font-semibold">{data.file_count}</div>

                                                            </div>

                                                            <div>

                                                                <div className="text-muted-foreground">Avg Complexity</div>

                                                                <div className="font-semibold">{data.avg_cc}</div>

                                                            </div>

                                                            <div>

                                                                <div className="text-muted-foreground">Max Complexity</div>

                                                                <div className="font-semibold">{data.max_cc}</div>

                                                            </div>

                                                            <div>

                                                                <div className="text-muted-foreground">Maintainability</div>

                                                                <div className="font-semibold">{data.avg_mi}</div>

                                                            </div>

                                                        </div>



                                                        {/* Progress Bar for Complexity */}

                                                        <div className="mt-3">

                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">

                                                                <span>Complexity Level</span>

                                                                <span>{Math.min(100, (data.avg_cc / 20) * 100).toFixed(0)}%</span>

                                                            </div>

                                                            <div className="w-full bg-gray-200 rounded-full h-2">

                                                                <div

                                                                    className={`h-2 rounded-full ${data.avg_cc > 15 ? 'bg-red-500' :

                                                                        data.avg_cc > 10 ? 'bg-orange-500' :

                                                                            data.avg_cc > 5 ? 'bg-yellow-500' : 'bg-green-500'

                                                                        }`}

                                                                    style={{ width: `${Math.min(100, (data.avg_cc / 20) * 100)}%` }}

                                                                ></div>

                                                            </div>

                                                        </div>

                                                    </div>

                                                ))}

                                        </div>



                                        {/* Most Complex Files by Extension */}

                                        <div className="space-y-4">

                                            <h5 className="font-semibold text-md">Most Complex Files by Extension</h5>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                                {Object.entries(data.metrics.complexity.complexity_by_extension)

                                                    .filter(([, extData]) => extData.files && extData.files.length > 0)

                                                    .map(([ext, extData]) => (

                                                        <div key={ext} className="border rounded-lg p-4">

                                                            <div className="font-medium mb-2 flex items-center gap-2">

                                                                <span className={`px-2 py-1 rounded text-xs text-white ${ext === '.js' ? 'bg-yellow-500' :

                                                                    ext === '.py' ? 'bg-blue-500' :

                                                                        ext === '.html' ? 'bg-orange-500' :

                                                                            ext === '.css' ? 'bg-purple-500' :

                                                                                ext === '.jsx' ? 'bg-cyan-500' :

                                                                                    ext === '.ts' ? 'bg-indigo-500' :

                                                                                        'bg-gray-500'

                                                                    }`}>

                                                                    {ext === 'no_extension' ? 'No Extension' : ext}

                                                                </span>

                                                                <span className="text-sm text-muted-foreground">

                                                                    Top {Math.min(3, extData.files.length)} files

                                                                </span>

                                                            </div>



                                                            <div className="space-y-2">

                                                                {extData.files.slice(0, 3).map((file, idx) => (

                                                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">

                                                                        <div className="flex items-center gap-2">

                                                                            <span className="text-sm font-medium truncate max-w-32" title={file.name}>

                                                                                {file.name}

                                                                            </span>

                                                                        </div>

                                                                        <div className="flex items-center gap-3">

                                                                            <div className="text-sm">

                                                                                <span className="text-muted-foreground">CC:</span>

                                                                                <span className={`font-semibold ${file.cc > 15 ? 'text-red-600' :

                                                                                    file.cc > 10 ? 'text-orange-600' :

                                                                                        file.cc > 5 ? 'text-yellow-600' : 'text-green-600'

                                                                                    }`}>

                                                                                    {file.cc}

                                                                                </span>

                                                                            </div>

                                                                            <div className="text-sm">

                                                                                <span className="text-muted-foreground">MI:</span>

                                                                                <span className={`font-semibold ${file.mi < 50 ? 'text-red-600' :

                                                                                    file.mi < 70 ? 'text-orange-600' :

                                                                                        file.mi < 85 ? 'text-yellow-600' : 'text-green-600'

                                                                                    }`}>

                                                                                    {file.mi}

                                                                                </span>

                                                                            </div>

                                                                        </div>

                                                                    </div>

                                                                ))}

                                                            </div>

                                                        </div>

                                                    ))}

                                            </div>

                                        </div>

                                    </div>

                                )}



                                {/* Additional Complexity Stats */}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.total_loc || 0}</div>

                                        <div className="text-sm text-muted-foreground">Total Lines of Code</div>

                                    </div>

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.file_types || 0}</div>

                                        <div className="text-sm text-muted-foreground">File Types</div>

                                    </div>

                                    <div className="p-4 border rounded">

                                        <div className="text-xl font-bold">{data.metrics?.complexity?.dependency_count || 0}</div>

                                        <div className="text-sm text-muted-foreground">Dependencies</div>

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

                                <div className="space-y-4">

                                    {/* Project Title and Basic Info */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Project Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <span className="font-medium text-purple-700 dark:text-purple-400">
                                                    {data.projectId || 'Unknown Project'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                <span className="text-purple-700 dark:text-purple-400 text-sm">
                                                    {data.language || 'Unknown Language'} • {data.projectType || 'Unknown Type'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Innovation Level and Score */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-medium text-blue-900 dark:text-blue-200">
                                            Innovation Level: {aiEvaluation?.innovation?.level || data.innovation?.level || "Unknown"}
                                        </p>
                                        {aiEvaluation?.innovation?.score && (
                                            <Badge variant="outline" className="text-sm">
                                                Score: {aiEvaluation.innovation.score}/10
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Target Audience / Usefulness */}
                                    {aiEvaluation?.overview && (
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Usefulness & Target Users</h4>
                                            <p className="text-indigo-700 dark:text-indigo-400 leading-relaxed text-sm">
                                                {aiEvaluation.overview}
                                            </p>
                                        </div>
                                    )}

                                    {/* Innovation Assessment */}
                                    {aiEvaluation?.innovation?.assessment && (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Innovation Assessment</h4>
                                            <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                                                {aiEvaluation.innovation.assessment}
                                            </p>
                                        </div>
                                    )}

                                    {/* Novel Features */}
                                    {aiEvaluation?.innovation?.novelFeatures && aiEvaluation.innovation.novelFeatures.length > 0 && (
                                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Novel Features</h4>
                                            <div className="space-y-2">
                                                {aiEvaluation.innovation.novelFeatures.map((feature, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                                        <span className="text-green-700 dark:text-green-400 text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Production Readiness with Progress Bar */}
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3">Production Readiness</h4>

                                        {/* Production Readiness Level */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Readiness Level</span>
                                                <span className="text-sm text-amber-600 dark:text-amber-500">
                                                    {aiEvaluation?.innovation?.level === 'high' ? 'High' :
                                                        aiEvaluation?.innovation?.level === 'medium' ? 'Medium' : 'Low'}
                                                </span>
                                            </div>
                                            <Progress
                                                value={aiEvaluation?.innovation?.level === 'high' ? 85 :
                                                    aiEvaluation?.innovation?.level === 'medium' ? 60 : 30}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Detailed Assessment */}
                                        <div className="text-amber-700 dark:text-amber-400 leading-relaxed text-sm">
                                            {aiEvaluation?.realWorldReadiness || data.realWorldReadiness || "Analysis pending..."}
                                        </div>

                                        {/* Production Metrics */}
                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                            <div className="text-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                                                <div className="text-lg font-bold text-amber-800 dark:text-amber-300">
                                                    {aiEvaluation?.innovation?.level === 'high' ? '85%' :
                                                        aiEvaluation?.innovation?.level === 'medium' ? '60%' : '30%'}
                                                </div>
                                                <div className="text-xs text-amber-600 dark:text-amber-400">Ready</div>
                                            </div>
                                            <div className="text-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                                                <div className="text-lg font-bold text-amber-800 dark:text-amber-300">
                                                    {aiEvaluation?.innovation?.score ? `${aiEvaluation.innovation.score}/10` : 'N/A'}
                                                </div>
                                                <div className="text-xs text-amber-600 dark:text-amber-400">Quality</div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </CardContent>

                        </Card>

                    </TabsContent>



                    <TabsContent value="sandbox">

                        <SandboxViewer sandboxData={data.sandbox} />

                    </TabsContent>

                </motion.div>

            </Tabs>



            {/* Footer - Only on Report page */}
            <Footer />
        </div >

    );

}

