import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, ExternalLink, Play, Activity, RefreshCw, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function SandboxViewer({ sandboxData }) {
    const [sandboxUrl] = useState('http://localhost:4002');
    const [projectFlow, setProjectFlow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [runningContainers, setRunningContainers] = useState([]);

    useEffect(() => {
        fetchSandboxData();
        fetchRunningContainers();
        
        // Refresh containers every 10 seconds
        const interval = setInterval(fetchRunningContainers, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchRunningContainers = async () => {
        try {
            console.log('Fetching running containers...');
            const response = await fetch(`${sandboxUrl}/api/containers`);
            const data = await response.json();
            console.log('Containers response:', data);
            setRunningContainers(data.containers || []);
        } catch (error) {
            console.error('Failed to fetch containers:', error);
            setRunningContainers([]);
        }
    };

    useEffect(() => {
        // Auto-open browser when successful execution is detected
        if (projectFlow && projectFlow.status === 'success' && projectFlow.url) {
            setTimeout(() => {
                window.open(projectFlow.url, '_blank');
            }, 1000); // Wait 1 second before opening
        }
    }, [projectFlow]);

    const fetchSandboxData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${sandboxUrl}/api/latest-execution`);
            if (response.ok) {
                const data = await response.json();
                setProjectFlow(data);
            } else {
                setError('No execution data available');
            }
        } catch (error) {
            setError('Could not connect to sand_box_project');
        } finally {
            setLoading(false);
        }
    };

    const openSandbox = () => {
        window.open(sandboxUrl, '_blank');
    };

    const openApplication = () => {
        if (projectFlow && projectFlow.url) {
            console.log('Attempting to open:', projectFlow.url);
            
            // Check if this is a sandbox URL
            if (projectFlow.url.includes('localhost:4002')) {
                // This is the sandbox UI, not the application
                window.open('http://localhost:4002', '_blank');
            } else if (projectFlow.port) {
                // This is the application port
                const appUrl = `http://localhost:${projectFlow.port}`;
                console.log('Opening application URL:', appUrl);
                
                // Test if the port is accessible first
                fetch(appUrl, { mode: 'no-cors' })
                    .then(() => {
                        window.open(appUrl, '_blank');
                    })
                    .catch((error) => {
                        console.error('Port not accessible:', error);
                        alert(`Application port ${projectFlow.port} is not accessible.\n\nThe container may have stopped.\n\nTry uploading the project again to start a new container.`);
                    });
            } else {
                window.open(projectFlow.url, '_blank');
            }
        } else {
            alert('No application URL available. Please upload a project first.');
        }
    };

    const testPortManually = async () => {
        if (projectFlow && projectFlow.port) {
            try {
                const response = await fetch(`http://localhost:${projectFlow.port}`, { 
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(3000)
                });
                console.log('Port test response:', response);
                window.open(`http://localhost:${projectFlow.port}`, '_blank');
            } catch (error) {
                console.error('Port test failed:', error);
                // Try opening anyway
                window.open(`http://localhost:${projectFlow.port}`, '_blank');
            }
        }
    };

    const restartContainer = async () => {
        try {
            alert('To restart the container:\n\n1. Upload your project again to the sandbox\n2. This will create a new container with a fresh port\n3. The old container will be automatically cleaned up\n\nAlternatively, you can manually clean up containers at:\nhttp://localhost:4002/api/debug/cleanup');
        } catch (error) {
            console.error('Restart info failed:', error);
        }
    };

    const checkContainerStatus = async () => {
        try {
            const response = await fetch(`${sandboxUrl}/api/debug/containers`);
            const data = await response.json();
            console.log('Container status:', data);
            alert(`Container Debug Info:\n\nRunning:\n${data.running}\n\nAll Sandbox:\n${data.all}`);
        } catch (error) {
            console.error('Container check failed:', error);
            alert('Failed to check container status');
        }
    };

    const getTestIcon = (status) => {
        if (status.includes('PASS')) return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status.includes('FAIL')) return <XCircle className="w-4 h-4 text-red-500" />;
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    };

    const getTestColor = (status) => {
        if (status.includes('PASS')) return 'text-green-600';
        if (status.includes('FAIL')) return 'text-red-600';
        return 'text-yellow-600';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading sandbox data...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-orange-800">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                            <h4 className="font-semibold">Connection Error</h4>
                            <p className="text-sm text-orange-700">{error}</p>
                            <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={fetchSandboxData}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry
                                </Button>
                                <Button size="sm" variant="outline" onClick={openSandbox}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Sandbox
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            Sand_box_project Data
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchSandboxData}
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button size="sm" variant="outline" onClick={openSandbox}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Sandbox
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Success Message */}
            {projectFlow && projectFlow.status === 'success' && projectFlow.url && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-green-800">
                            <CheckCircle className="w-6 h-6" />
                            <div>
                                <h4 className="font-semibold text-lg">🚀 Application Running Successfully!</h4>
                                <p className="text-green-600">
                                    Your app is live on{' '}
                                    <a 
                                        href={projectFlow.url} 
                                        target="_blank" 
                                        className="underline font-mono text-green-700 hover:text-green-800"
                                    >
                                        {projectFlow.url}
                                    </a>
                                </p>
                                <p className="text-sm text-green-500 mt-1">
                                    Started in {projectFlow.execution_time || 0}ms
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" onClick={openApplication} className="bg-green-600 hover:bg-green-700">
                                        <Play className="w-4 h-4 mr-2" />
                                        Open Application
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={testPortManually}>
                                        <Terminal className="w-4 h-4 mr-2" />
                                        Test Port Manually
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={checkContainerStatus}>
                                        <Activity className="w-4 h-4 mr-2" />
                                        Check Container Status
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={restartContainer}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Restart Container
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Debug Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-orange-500" />
                        Debug Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Sandbox URL:</span>
                            <span className="text-sm text-muted-foreground">{sandboxUrl}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Running Containers:</span>
                            <span className="text-sm text-muted-foreground">{runningContainers.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Latest Execution:</span>
                            <span className="text-sm text-muted-foreground">{projectFlow ? 'Available' : 'None'}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={fetchRunningContainers}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Containers
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => console.log('Debug state:', { projectFlow, runningContainers })}>
                                <Terminal className="w-4 h-4 mr-2" />
                                Log State
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Running Containers */}
            {runningContainers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            Running Applications ({runningContainers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {runningContainers.map((container, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <div>
                                            <div className="font-medium">{container.name}</div>
                                            <div className="text-sm text-muted-foreground">Port: {container.port}</div>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => window.open(container.url, '_blank')}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open App
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Data */}
            {projectFlow && (
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Execution Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Status and Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                                        projectFlow.execution_status === 'success' 
                                            ? 'bg-green-500' 
                                            : projectFlow.execution_status === 'failed'
                                            ? 'bg-red-500'
                                            : 'bg-yellow-500'
                                    }`} />
                                    <div className="font-semibold">{projectFlow.execution_status || 'Unknown'}</div>
                                    <div className="text-sm text-muted-foreground">Status</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {projectFlow.execution_time || '0'}s
                                    </div>
                                    <div className="text-sm text-muted-foreground">Execution Time</div>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {projectFlow.detected_project_type || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Project Type</div>
                                </div>
                            </div>

                            {/* Test Results */}
                            {projectFlow.test_results && projectFlow.test_results.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Functionality Tests
                                    </h4>
                                    <div className="space-y-2">
                                        {projectFlow.test_results.map((test, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {getTestIcon(test.status)}
                                                    <span className="font-medium">{test.test}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-medium ${getTestColor(test.status)}`}>
                                                        {test.status}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {test.details}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Project Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Framework:</span>
                                        <Badge variant="outline">{projectFlow.framework || 'None'}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Language:</span>
                                        <Badge variant="outline">{projectFlow.language || 'Unknown'}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Entry File:</span>
                                        <span className="text-sm text-muted-foreground">{projectFlow.entry_file || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Files Processed:</span>
                                        <span className="text-sm text-muted-foreground">{projectFlow.filtering?.processedFiles || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Files Skipped:</span>
                                        <span className="text-sm text-muted-foreground">{projectFlow.filtering?.skippedFiles || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Status:</span>
                                        <Badge variant={projectFlow.execution_status === 'success' ? "default" : "destructive"}>
                                            {projectFlow.execution_status || 'Unknown'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Executed Command */}
                            {projectFlow.executed_command && (
                                <div>
                                    <div className="text-sm font-medium mb-2">Executed Command:</div>
                                    <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                                        {projectFlow.executed_command}
                                    </pre>
                                </div>
                            )}

                            {/* Logs */}
                            {projectFlow.logs && (
                                <div>
                                    <div className="text-sm font-medium mb-2">Execution Logs:</div>
                                    <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-40 text-green-600">
                                        {projectFlow.logs}
                                    </pre>
                                </div>
                            )}

                            {/* Raw Data */}
                            <div>
                                <div className="text-sm font-medium mb-2">Raw Data:</div>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                                    {JSON.stringify(projectFlow, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
