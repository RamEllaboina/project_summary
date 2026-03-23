import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, ExternalLink, Play, Activity, RefreshCw, AlertCircle } from 'lucide-react';

export default function SandboxViewer({ sandboxData }) {
    const [sandboxUrl] = useState('http://localhost:4001');
    const [projectFlow, setProjectFlow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSandboxData();
    }, []);

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
