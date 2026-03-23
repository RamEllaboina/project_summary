import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, Zap, Code, Code2, AlertTriangle, CheckCircle, XCircle, Globe, Package, Clock, Cpu, Activity, Terminal, Play, ExternalLink, RefreshCw, FolderOpen, Share2, Download, BrainCircuit, ShieldCheck, CheckCircle2, Lightbulb, Users, Building, GraduationCap, Smartphone, TrendingUp, Award } from 'lucide-react';
import Footer from '@/components/Footer';
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

    // Helper functions for dynamic innovation analysis
    const extractProjectCharacteristics = (projectData) => {
        const language = projectData.language?.toLowerCase() || 'unknown';
        const complexity = projectData.metrics?.complexity || {};
        const files = projectData.importantFiles || [];
        const overview = aiEvaluation?.overview || data.overview || '';
        
        console.log('Analyzing project data:', { language, filesCount: files.length, complexity, overview });
        
        // Extract unique project characteristics from actual data
        const characteristics = {
            primaryLanguage: language,
            fileCount: files.length,
            complexity: complexity.average_cyclomatic_complexity || 0,
            maintainability: complexity.maintainability_index || 0,
            hasFrontend: files.some(f => {
                const path = (f.path || '').toLowerCase();
                const content = (f.content || '').toLowerCase();
                return path.includes('.js') || path.includes('.jsx') || path.includes('.html') || path.includes('.css') || 
                       content.includes('react') || content.includes('jsx') || content.includes('component') || content.includes('dom');
            }),
            hasBackend: files.some(f => {
                const path = (f.path || '').toLowerCase();
                const content = (f.content || '').toLowerCase();
                return path.includes('.py') || path.includes('.js') || path.includes('.ts') || 
                       content.includes('express') || content.includes('flask') || content.includes('django') || content.includes('api');
            }),
            hasDatabase: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('database') || content.includes('sql') || content.includes('mongodb') || 
                       content.includes('mysql') || content.includes('postgresql') || content.includes('mongoose');
            }),
            hasAPI: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('api') || content.includes('express') || content.includes('fastapi') || 
                       content.includes('endpoint') || content.includes('router') || content.includes('app.get');
            }),
            hasAuth: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('auth') || content.includes('login') || content.includes('jwt') || 
                       content.includes('bcrypt') || content.includes('password') || content.includes('session');
            }),
            hasUI: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('react') || content.includes('vue') || content.includes('angular') || 
                       content.includes('component') || content.includes('render') || content.includes('jsx');
            }),
            hasEcommerce: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('cart') || content.includes('shop') || content.includes('product') || 
                       content.includes('order') || content.includes('payment') || content.includes('ecommerce');
            }),
            hasRealtime: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('socket') || content.includes('websocket') || content.includes('real-time') || 
                       content.includes('chat') || content.includes('messaging') || content.includes('live');
            }),
            hasDashboard: files.some(f => {
                const content = (f.content || '').toLowerCase();
                return content.includes('dashboard') || content.includes('chart') || content.includes('analytics') || 
                       content.includes('graph') || content.includes('metric');
            }),
            projectType: detectProjectType(files, language),
            uniqueFeatures: extractUniqueFeatures(files, overview)
        };
        
        console.log('Extracted characteristics:', characteristics);
        return characteristics;
    };

    const detectProjectType = (files, language) => {
        const fileContents = files.map(f => f.content || '').join(' ').toLowerCase();
        
        console.log('Detecting project type from content:', fileContents.substring(0, 500));
        
        // More specific detection with priority order
        if (fileContents.includes('react') || fileContents.includes('jsx') || fileContents.includes('component')) {
            if (fileContents.includes('cart') || fileContents.includes('shop') || fileContents.includes('product')) {
                return 'React E-commerce Platform';
            }
            if (fileContents.includes('dashboard') || fileContents.includes('admin')) {
                return 'React Admin Dashboard';
            }
            if (fileContents.includes('blog') || fileContents.includes('post') || fileContents.includes('article')) {
                return 'React Blog Platform';
            }
            return 'React Web Application';
        }
        
        if (fileContents.includes('express') || fileContents.includes('api') || fileContents.includes('endpoint')) {
            if (fileContents.includes('auth') || fileContents.includes('jwt')) {
                return 'Authentication API Service';
            }
            if (fileContents.includes('database') || fileContents.includes('mongo')) {
                return 'Database API Service';
            }
            return 'REST API Backend';
        }
        
        if (fileContents.includes('flask') || fileContents.includes('django')) {
            if (fileContents.includes('user') && fileContents.includes('auth')) {
                return 'User Management System';
            }
            if (fileContents.includes('blog') || fileContents.includes('post')) {
                return 'Python Blog Platform';
            }
            return 'Python Web Application';
        }
        
        if (fileContents.includes('database') && (fileContents.includes('crud') || fileContents.includes('create') || fileContents.includes('read'))) {
            return 'Database Management System';
        }
        
        if (fileContents.includes('machine learning') || fileContents.includes('tensorflow') || fileContents.includes('sklearn') || fileContents.includes('model')) {
            return 'Machine Learning Project';
        }
        
        if (fileContents.includes('game') || fileContents.includes('canvas') || fileContents.includes('animation') || fileContents.includes('score')) {
            return 'Game Application';
        }
        
        if (fileContents.includes('ecommerce') || fileContents.includes('shopping') || fileContents.includes('cart') || fileContents.includes('payment')) {
            return 'E-commerce Platform';
        }
        
        if (fileContents.includes('blog') || fileContents.includes('post') || fileContents.includes('comment') || fileContents.includes('article')) {
            return 'Blog/CMS Platform';
        }
        
        if (fileContents.includes('chat') || fileContents.includes('messaging') || fileContents.includes('socket') || fileContents.includes('websocket')) {
            return 'Real-time Communication Platform';
        }
        
        if (fileContents.includes('dashboard') || fileContents.includes('analytics') || fileContents.includes('chart') || fileContents.includes('graph')) {
            return 'Analytics Dashboard';
        }
        
        if (fileContents.includes('todo') || fileContents.includes('task') || fileContents.includes('list')) {
            return 'Task Management Application';
        }
        
        if (fileContents.includes('weather') || fileContents.includes('forecast')) {
            return 'Weather Application';
        }
        
        if (fileContents.includes('calculator') || fileContents.includes('math')) {
            return 'Calculator Application';
        }
        
        return `${language.charAt(0).toUpperCase() + language.slice(1)} Application`;
    };

    const extractUniqueFeatures = (files, overview) => {
        const features = [];
        const fileContents = files.map(f => f.content || '').join(' ').toLowerCase();
        
        console.log('Extracting features from content:', fileContents.substring(0, 300));
        
        // More specific feature detection
        if (fileContents.includes('authentication') || fileContents.includes('login') || fileContents.includes('register') || fileContents.includes('signin')) {
            features.push('User Authentication System');
        }
        if (fileContents.includes('database') || fileContents.includes('sql') || fileContents.includes('mongodb') || fileContents.includes('mysql')) {
            features.push('Database Integration');
        }
        if (fileContents.includes('api') || fileContents.includes('rest') || fileContents.includes('endpoint') || fileContents.includes('router')) {
            features.push('REST API Development');
        }
        if (fileContents.includes('upload') || fileContents.includes('file') || fileContents.includes('multer')) {
            features.push('File Upload System');
        }
        if (fileContents.includes('search') || fileContents.includes('filter') || fileContents.includes('query')) {
            features.push('Search Functionality');
        }
        if (fileContents.includes('chart') || fileContents.includes('graph') || fileContents.includes('dashboard') || fileContents.includes('analytics')) {
            features.push('Data Visualization');
        }
        if (fileContents.includes('real-time') || fileContents.includes('socket') || fileContents.includes('websocket') || fileContents.includes('live')) {
            features.push('Real-time Updates');
        }
        if (fileContents.includes('responsive') || fileContents.includes('mobile') || fileContents.includes('bootstrap') || fileContents.includes('tailwind')) {
            features.push('Responsive Design');
        }
        if (fileContents.includes('security') || fileContents.includes('jwt') || fileContents.includes('bcrypt') || fileContents.includes('encryption')) {
            features.push('Security Implementation');
        }
        if (fileContents.includes('test') || fileContents.includes('jest') || fileContents.includes('unittest') || fileContents.includes('mocha')) {
            features.push('Testing Framework');
        }
        if (fileContents.includes('cart') || fileContents.includes('shop') || fileContents.includes('product') || fileContents.includes('ecommerce')) {
            features.push('E-commerce Functionality');
        }
        if (fileContents.includes('payment') || fileContents.includes('stripe') || fileContents.includes('paypal')) {
            features.push('Payment Processing');
        }
        if (fileContents.includes('react') || fileContents.includes('component') || fileContents.includes('jsx')) {
            features.push('React Components');
        }
        if (fileContents.includes('express') || fileContents.includes('flask') || fileContents.includes('django')) {
            features.push('Web Framework');
        }
        if (fileContents.includes('crud') || (fileContents.includes('create') && fileContents.includes('read') && fileContents.includes('update') && fileContents.includes('delete'))) {
            features.push('CRUD Operations');
        }
        
        return features.length > 0 ? features : ['Custom Application Development'];
    };

    const generateProjectTitle = (characteristics) => {
        const { projectType, uniqueFeatures, primaryLanguage } = characteristics;
        
        const titles = {
            'React Web Application': `React ${uniqueFeatures.includes('User Authentication') ? 'Authentication' : 'Interactive'} Platform`,
            'REST API Backend': `${primaryLanguage.charAt(0).toUpperCase() + primaryLanguage.slice(1)} API Service`,
            'Python Web Application': `Python Web ${uniqueFeatures.includes('Database Integration') ? 'Database' : 'Application'} Platform`,
            'Database Management System': `Database ${uniqueFeatures.includes('Search Functionality') ? 'Search & Management' : 'Management'} System`,
            'Machine Learning Project': `ML ${uniqueFeatures.includes('Data Visualization') ? 'Analytics' : 'Prediction'} Platform`,
            'E-commerce Platform': `Online ${uniqueFeatures.includes('User Authentication') ? 'Shopping' : 'E-commerce'} Platform`,
            'Blog/CMS Platform': `Content ${uniqueFeatures.includes('Real-time Features') ? 'Management' : 'Publishing'} System`,
            'Real-time Communication': `Live ${uniqueFeatures.includes('File Upload System') ? 'Media Sharing' : 'Messaging'} Platform`,
            'Analytics Dashboard': `Data ${uniqueFeatures.includes('Real-time Features') ? 'Real-time' : 'Business'} Analytics Platform`
        };
        
        return titles[projectType] || `${projectType} - Innovative Solution`;
    };

    const getSpecificUseCases = (characteristics) => {
        const { projectType, uniqueFeatures, primaryLanguage } = characteristics;
        
        console.log('Getting specific use cases for:', projectType, uniqueFeatures);
        
        const useCases = {
            'React Web Application': {
                who: ['Frontend Developers', 'UI/UX Designers', 'Web Development Teams'],
                usage: 'Building interactive user interfaces and modern web applications with React components',
                helpful: 'Provides reusable React patterns, state management, and component architecture for web development'
            },
            'React E-commerce Platform': {
                who: ['E-commerce Developers', 'Online Retail Businesses', 'Product Managers'],
                usage: 'Creating online shopping experiences with product catalogs and payment processing',
                helpful: 'Implements shopping cart functionality, user authentication, and payment integration for online stores'
            },
            'React Admin Dashboard': {
                who: ['Admin Panel Developers', 'System Administrators', 'Business Analysts'],
                usage: 'Building administrative interfaces for data management and system control',
                helpful: 'Provides dashboard components, data visualization, and administrative controls for business applications'
            },
            'React Blog Platform': {
                who: ['Content Creators', 'Blog Developers', 'Digital Publishers'],
                usage: 'Creating blog platforms with article management and user engagement',
                helpful: 'Implements content management, article publishing, and user interaction features for blogging platforms'
            },
            'Authentication API Service': {
                who: ['Backend Developers', 'Security Engineers', 'Mobile App Teams'],
                usage: 'Providing secure authentication and authorization services for applications',
                helpful: 'Offers JWT-based authentication, user management, and security best practices for API development'
            },
            'Database API Service': {
                who: ['Backend Developers', 'Database Administrators', 'Full Stack Engineers'],
                usage: 'Building data-driven APIs with database integration and CRUD operations',
                helpful: 'Provides database connectivity, data modeling, and API endpoints for data-centric applications'
            },
            'REST API Backend': {
                who: ['Backend Developers', 'Mobile App Developers', 'System Integrators'],
                usage: 'Creating scalable backend services and RESTful APIs for data management',
                helpful: 'Offers API design patterns, data processing logic, and integration capabilities for modern applications'
            },
            'Python Web Application': {
                who: ['Python Developers', 'Data Scientists', 'Web Application Teams'],
                usage: 'Building Python-based web applications with modern frameworks and data processing',
                helpful: 'Demonstrates Python web frameworks, data handling, and server-side development capabilities'
            },
            'User Management System': {
                who: ['Backend Developers', 'System Administrators', 'Product Managers'],
                usage: 'Managing user accounts, authentication, and authorization systems',
                helpful: 'Provides user registration, login systems, and access control for application security'
            },
            'Python Blog Platform': {
                who: ['Content Developers', 'Python Web Developers', 'Digital Publishers'],
                usage: 'Creating blog platforms with Python backend and content management',
                helpful: 'Implements server-side rendering, content management, and Python web development patterns'
            },
            'Database Management System': {
                who: ['Database Developers', 'Backend Engineers', 'Data Analysts'],
                usage: 'Managing database operations, data storage, and information retrieval systems',
                helpful: 'Provides efficient database design, query optimization, and data management capabilities'
            },
            'Machine Learning Project': {
                who: ['Data Scientists', 'ML Engineers', 'Research Teams', 'AI Developers'],
                usage: 'Developing machine learning models, data processing pipelines, and predictive analytics',
                helpful: 'Shows ML pipeline implementation, model training, and data science methodologies'
            },
            'E-commerce Platform': {
                who: ['E-commerce Developers', 'Online Business Owners', 'Digital Marketing Teams'],
                usage: 'Building online shopping platforms with payment processing and inventory management',
                helpful: 'Implements e-commerce workflows, payment gateways, and online retail solutions'
            },
            'Blog/CMS Platform': {
                who: ['Content Creators', 'Web Developers', 'Digital Marketers', 'Publishing Teams'],
                usage: 'Creating content management systems for publishing blogs and managing digital content',
                helpful: 'Provides content creation tools, publishing workflows, and audience engagement features'
            },
            'Real-time Communication Platform': {
                who: ['Chat App Developers', 'Social Platform Teams', 'Communication Engineers'],
                usage: 'Building real-time messaging applications with live communication features',
                helpful: 'Implements WebSocket connections, live messaging, and real-time data synchronization'
            },
            'Analytics Dashboard': {
                who: ['Data Analysts', 'Business Intelligence Teams', 'Product Managers', 'Executives'],
                usage: 'Creating data visualization dashboards and business analytics platforms',
                helpful: 'Transforms raw data into actionable insights with charts, graphs, and metrics'
            },
            'Game Application': {
                who: ['Game Developers', 'Interactive Media Teams', 'Entertainment Companies'],
                usage: 'Building interactive games and entertainment applications with graphics and animations',
                helpful: 'Demonstrates game logic, animation techniques, and interactive user experiences'
            },
            'Task Management Application': {
                who: ['Productivity App Developers', 'Project Managers', 'Business Teams'],
                usage: 'Creating task management tools for organizing work and improving productivity',
                helpful: 'Provides task tracking, project organization, and workflow management capabilities'
            },
            'Weather Application': {
                who: ['Weather App Developers', 'Meteorology Data Providers', 'Mobile Developers'],
                usage: 'Building weather forecasting applications with real-time data and location services',
                helpful: 'Implements API integration, data visualization, and location-based services'
            },
            'Calculator Application': {
                who: ['Educational App Developers', 'Students', 'Math Enthusiasts'],
                usage: 'Creating calculation tools for mathematical operations and problem-solving',
                helpful: 'Demonstrates mathematical logic, user interface design, and computational accuracy'
            }
        };
        
        const defaultUseCase = {
            who: ['Software Developers', 'Project Teams', 'Technology Enthusiasts'],
            usage: `${primaryLanguage} application development and innovation`,
            helpful: 'Demonstrates modern development practices and technical solutions'
        };
        
        return useCases[projectType] || defaultUseCase;
    };

    const getTargetAudience = (projectData) => {
        const characteristics = extractProjectCharacteristics(projectData);
        const useCases = getSpecificUseCases(characteristics);
        
        return useCases.who.map((audience, idx) => ({
            icon: idx === 0 ? Code : idx === 1 ? Building : idx === 2 ? GraduationCap : Users,
            title: audience,
            description: useCases.usage,
            usage: useCases.helpful
        }));
    };

    const getRealWorldApplications = (projectData) => {
        const characteristics = extractProjectCharacteristics(projectData);
        const { projectType, uniqueFeatures } = characteristics;
        
        const applications = {
            'React Web Application': [
                { industry: 'Web Development', usage: 'Modern SPA development and component libraries', companies: ['React Teams', 'Web Agencies', 'Startups'] },
                { industry: 'E-commerce', usage: 'Interactive shopping experiences', companies: ['Retail Companies', 'Online Stores'] },
                { industry: 'Education', usage: 'Learning platforms and educational tools', companies: ['EdTech Companies', 'Online Schools'] }
            ],
            'REST API Backend': [
                { industry: 'Software Integration', usage: 'System integration and data services', companies: ['Enterprise Software', 'SaaS Companies'] },
                { industry: 'Mobile Development', usage: 'Backend services for mobile apps', companies: ['App Development', 'Mobile Startups'] },
                { industry: 'Cloud Services', usage: 'Cloud-native application backends', companies: ['Cloud Providers', 'DevOps Teams'] }
            ],
            'Python Web Application': [
                { industry: 'Data Science', usage: 'Data processing and analysis platforms', companies: ['Data Labs', 'Research Institutes'] },
                { industry: 'Automation', usage: 'Business process automation', companies: ['Manufacturing', 'Logistics'] },
                { industry: 'Education', usage: 'Educational tools and platforms', companies: ['Schools', 'Training Centers'] }
            ]
        };
        
        return applications[projectType] || [
            { industry: 'Software Development', usage: 'Custom application development', companies: ['Tech Companies', 'Development Teams'] },
            { industry: 'Business Solutions', usage: 'Business process optimization', companies: ['Enterprises', 'Consulting'] }
        ];
    };

    const getInnovationLevel = (level) => {
        const levels = {
            'high': 'breakthrough',
            'moderate': 'advanced', 
            'basic': 'fundamental',
            'innovative': 'cutting-edge'
        };
        return levels[level] || 'emerging';
    };

    const scoreData = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    // Helper to get Issues count
    const securityIssuesCount = data.issues?.filter(i => i.category === 'Security')?.length || 0;

    return (
        <>
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
                                                .sort(([,a], [,b]) => b.avg_cc - a.avg_cc)
                                                .map(([ext, data]) => (
                                                <div key={ext} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                ext === '.js' ? 'bg-yellow-500' :
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
                                                                className={`h-2 rounded-full ${
                                                                    data.avg_cc > 15 ? 'bg-red-500' :
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
                                                    .filter(([,extData]) => extData.files && extData.files.length > 0)
                                                    .map(([ext, extData]) => (
                                                        <div key={ext} className="border rounded-lg p-4">
                                                            <div className="font-medium mb-2 flex items-center gap-2">
                                                                <span className={`px-2 py-1 rounded text-xs text-white ${
                                                                    ext === '.js' ? 'bg-yellow-500' :
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
                                                                                <span className={`font-semibold ${
                                                                                    file.cc > 15 ? 'text-red-600' :
                                                                                    file.cc > 10 ? 'text-orange-600' :
                                                                                    file.cc > 5 ? 'text-yellow-600' : 'text-green-600'
                                                                                }`}>
                                                                                    {file.cc}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-sm">
                                                                                <span className="text-muted-foreground">MI:</span>
                                                                                <span className={`font-semibold ${
                                                                                    file.mi < 50 ? 'text-red-600' :
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
                        <div className="space-y-6">
                            {/* Project Innovation Header */}
                            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                                <CardHeader>
                                    <CardTitle className="text-2xl flex items-center gap-3">
                                        <Lightbulb className="w-6 h-6" />
                                        {generateProjectTitle(extractProjectCharacteristics(data))}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold mb-2">
                                                {extractProjectCharacteristics(data).projectType}
                                            </div>
                                            <div className="text-sm opacity-90">Project Type</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold mb-2">
                                                {aiEvaluation?.innovation?.level || data.innovation?.level || "Basic"}
                                            </div>
                                            <div className="text-sm opacity-90">Innovation Level</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-3xl font-bold mb-2">
                                                {extractProjectCharacteristics(data).uniqueFeatures.length}+
                                            </div>
                                            <div className="text-sm opacity-90">Unique Features</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Project Title and Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-purple-500" />
                                        Project Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            {generateProjectTitle(extractProjectCharacteristics(data))}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {aiEvaluation?.overview || data.overview || `This ${extractProjectCharacteristics(data).projectType.toLowerCase()} demonstrates ${extractProjectCharacteristics(data).uniqueFeatures.join(', ').toLowerCase()} with modern development practices.`}
                                        </p>
                                    </div>
                                    
                                    {/* Detected Features */}
                                    <div>
                                        <h4 className="font-semibold mb-2 text-purple-600">Detected Features</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {extractProjectCharacteristics(data).uniqueFeatures.map((feature, idx) => (
                                                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                                                        <Lightbulb className="w-3 h-3 mr-1" />
                                                        {feature}
                                                    </Badge>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Project Characteristics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <div className="text-lg font-semibold">{extractProjectCharacteristics(data).fileCount}</div>
                                            <div className="text-sm text-gray-600">Files</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <div className="text-lg font-semibold">{extractProjectCharacteristics(data).primaryLanguage}</div>
                                            <div className="text-sm text-gray-600">Language</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <div className="text-lg font-semibold">{extractProjectCharacteristics(data).complexity.toFixed(1)}</div>
                                            <div className="text-sm text-gray-600">Complexity</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <div className="text-lg font-semibold">{extractProjectCharacteristics(data).maintainability}</div>
                                            <div className="text-sm text-gray-600">Maintainability</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Target Audience & Use Cases */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Who It Helps */}
                                <Card className="border-green-200 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-green-700">
                                            <Users className="w-5 h-5" />
                                            Target Audience
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {getTargetAudience(data).map((audience, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="p-2 rounded-lg bg-white/50">
                                                    <audience.icon className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-green-800">{audience.title}</h4>
                                                    <p className="text-sm text-green-600">{audience.description}</p>
                                                    <div className="mt-2">
                                                        <Badge variant="outline" className="text-xs bg-white/70">
                                                            💡 {audience.usage}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Real World Applications */}
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-blue-700">
                                            <Globe className="w-5 h-5" />
                                            Real World Applications
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {getRealWorldApplications(data).map((app, idx) => (
                                            <div key={idx} className="p-3 bg-white/50 rounded-lg">
                                                <h4 className="font-semibold text-blue-800 mb-1">{app.industry}</h4>
                                                <p className="text-sm text-blue-600 mb-2">{app.usage}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {app.companies.map((company, companyIdx) => (
                                                        <Badge key={companyIdx} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                            🏢 {company}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Impact Metrics */}
                            <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                <CardHeader>
                                    <CardTitle className="text-2xl flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6" />
                                        Project Impact Metrics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                        <div>
                                            <div className="text-3xl font-bold">{Math.round(score * 0.8)}%</div>
                                            <div className="text-sm opacity-90">Code Quality</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">{Math.max(0, 100 - aiProbability)}%</div>
                                            <div className="text-sm opacity-90">Human Authenticity</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">{(aiEvaluation?.innovation?.score || data.innovation?.score || Math.round(score / 20)) * 10}%</div>
                                            <div className="text-sm opacity-90">Innovation Index</div>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">{extractProjectCharacteristics(data).uniqueFeatures.length}</div>
                                            <div className="text-sm opacity-90">Features Detected</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Innovation Assessment */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BrainCircuit className="w-5 h-5 text-purple-500" />
                                        How This Project Helps
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose max-w-none">
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            This <strong>{extractProjectCharacteristics(data).projectType.toLowerCase()}</strong> helps <strong>{getTargetAudience(data).map(a => a.title).join(', ')}</strong> by providing <strong>{getSpecificUseCases(extractProjectCharacteristics(data)).usage.toLowerCase()}</strong>. 
                                            The project demonstrates <strong>{extractProjectCharacteristics(data).uniqueFeatures.join(', ').toLowerCase()}</strong> and can be applied in <strong>{getRealWorldApplications(data).map(a => a.industry).join(', ')}</strong> industries.
                                        </p>
                                        
                                        {/* Specific Benefits */}
                                        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <h4 className="font-semibold text-purple-800 mb-3">Key Benefits & Use Cases</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <h5 className="font-medium text-purple-700 mb-2">🎯 Who Benefits:</h5>
                                                    <ul className="space-y-1 text-sm text-purple-600">
                                                        {getTargetAudience(data).map((audience, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                                <span><strong>{audience.title}</strong> - {audience.usage}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-purple-700 mb-2">🌍 Where It's Used:</h5>
                                                    <ul className="space-y-1 text-sm text-purple-600">
                                                        {getRealWorldApplications(data).map((app, idx) => (
                                                            <li key={idx} className="flex items-start gap-2">
                                                                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                                <span><strong>{app.industry}</strong> - {app.usage}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Innovation Suggestions */}
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-blue-800 mb-2">Enhancement Opportunities</h4>
                                            <ul className="space-y-2 text-sm text-blue-700">
                                                {(aiEvaluation?.suggestions?.technical || data.suggestions?.technical || [
                                                    `Add more ${extractProjectCharacteristics(data).uniqueFeatures.length > 2 ? 'advanced' : 'unique'} features to increase innovation score`,
                                                    `Implement ${extractProjectCharacteristics(data).hasAPI ? 'API documentation' : 'REST API endpoints'} for better integration`,
                                                    `Consider ${extractProjectCharacteristics(data).hasDatabase ? 'optimizing database queries' : 'adding database integration'} for scalability`
                                                ]).map((suggestion, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sandbox">
                        <SandboxViewer />
                    </TabsContent>

                </motion.div>
            </Tabs>

        </div>
        
        {/* Footer - Only on Report page */}
        <Footer />
        </>
    );
}
