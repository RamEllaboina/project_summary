import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal, ExternalLink, Play, Code2, AlertCircle } from 'lucide-react';

export default function SandboxViewer({ sandboxData }) {
    const [sandboxUrl, setSandboxUrl] = useState('http://localhost:4001');
    const [isSandboxRunning, setIsSandboxRunning] = useState(false);
    const [sandboxStatus, setSandboxStatus] = useState('checking');

    useEffect(() => {
        checkSandboxStatus();
    }, []);

    const checkSandboxStatus = async () => {
        try {
            const response = await fetch(`${sandboxUrl}/health`, {
                method: 'GET',
                timeout: 5000,
            });
            
            if (response.ok) {
                setIsSandboxRunning(true);
                setSandboxStatus('running');
            } else {
                setIsSandboxRunning(false);
                setSandboxStatus('stopped');
            }
        } catch (error) {
            setIsSandboxRunning(false);
            setSandboxStatus('stopped');
        }
    };

    const openSandbox = () => {
        window.open(sandboxUrl, '_blank');
    };

    const startSandbox = () => {
        // Instructions to start sandbox
        alert(`To start the sandbox:\n\n1. Open a new terminal\n2. Navigate to: sand_box_project\n3. Run: npm start\n4. Wait for it to start on port 4001\n\nThen refresh this page.`);
    };

    return (
        <div className="space-y-6">
            {/* Sandbox Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-500" />
                        Sandbox Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                                sandboxStatus === 'running' 
                                    ? 'bg-green-500 animate-pulse' 
                                    : 'bg-red-500'
                            }`} />
                            <span className="font-medium">
                                Sandbox is {sandboxStatus}
                            </span>
                            <Badge variant={sandboxStatus === 'running' ? 'default' : 'destructive'}>
                                {sandboxStatus === 'running' ? 'Online' : 'Offline'}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={checkSandboxStatus}
                            >
                                Check Status
                            </Button>
                            {isSandboxRunning ? (
                                <Button size="sm" onClick={openSandbox}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Sandbox
                                </Button>
                            ) : (
                                <Button size="sm" onClick={startSandbox}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Sandbox
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sandbox Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code2 className="w-5 h-5" />
                        About the Sandbox
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">What is the Sandbox?</h4>
                        <p className="text-muted-foreground">
                            The sandbox is a secure environment where your uploaded code can be executed 
                            and tested in isolation. It provides real-time feedback on code execution, 
                            dependencies, and runtime behavior.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Secure code execution in isolated environment</li>
                            <li>• Real-time output and error reporting</li>
                            <li>• Support for multiple programming languages</li>
                            <li>• Dependency management and installation</li>
                            <li>• File system access within sandbox boundaries</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Connection Info</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div><strong>URL:</strong> {sandboxUrl}</div>
                            <div><strong>Port:</strong> 4001</div>
                            <div><strong>Status:</strong> {sandboxStatus}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sandbox Results */}
            {sandboxData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Execution Results
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {sandboxData.output && (
                                <div>
                                    <h4 className="font-semibold mb-2">Output</h4>
                                    <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                                        {sandboxData.output}
                                    </pre>
                                </div>
                            )}
                            
                            {sandboxData.errors && sandboxData.errors.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 text-red-600">Errors</h4>
                                    <div className="space-y-2">
                                        {sandboxData.errors.map((error, index) => (
                                            <div key={index} className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                                                {error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {sandboxData.metrics && (
                                <div>
                                    <h4 className="font-semibold mb-2">Performance Metrics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {sandboxData.metrics.executionTime || 'N/A'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Execution Time</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {sandboxData.metrics.memoryUsage || 'N/A'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Memory Usage</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {sandboxData.metrics.dependencies || 'N/A'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Dependencies</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {sandboxData.metrics.tests || 'N/A'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Tests Run</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isSandboxRunning && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-orange-800">
                            <AlertCircle className="w-5 h-5" />
                            <div>
                                <h4 className="font-semibold">Sandbox is Offline</h4>
                                <p className="text-sm text-orange-700">
                                    Start the sandbox to execute and test your code in a secure environment.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
