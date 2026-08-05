import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Workflow, Database, Server, Smartphone, MousePointerClick, AppWindow } from "lucide-react";

export function ProjectFlow({ flowData }) {
    if (!flowData) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Project Flow architecture analysis is not available for this project.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AppWindow className="w-5 h-5 text-primary" />
                        Component Overview
                    </CardTitle>
                    <CardDescription>{flowData.whatItDoes}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div className="p-4 border rounded-xl bg-secondary/10">
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Frontend</h4>
                            <div className="flex flex-wrap gap-2">
                                {flowData.techStack?.frontend?.map(tech => <Badge key={tech}>{tech}</Badge>)}
                            </div>
                        </div>
                        <div className="p-4 border rounded-xl bg-secondary/10">
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Backend</h4>
                            <div className="flex flex-wrap gap-2">
                                {flowData.techStack?.backend?.map(tech => <Badge key={tech} variant="outline">{tech}</Badge>)}
                            </div>
                        </div>
                        <div className="p-4 border rounded-xl bg-secondary/10">
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Database</h4>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">{flowData.techStack?.database}</Badge>
                            </div>
                        </div>
                        <div className="p-4 border rounded-xl bg-secondary/10">
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Tools</h4>
                            <div className="flex flex-wrap gap-2">
                                {flowData.techStack?.tools?.map(tech => <Badge key={tech} variant="secondary">{tech}</Badge>)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complete Workflow */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-blue-500" />
                            Execution Workflow
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {flowData.completeWorkflow?.map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-3 rounded-lg border bg-card relative">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                    {step.step}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">{step.action}</h4>
                                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-mono">{step.file}</Badge>
                                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs">{step.output}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* API & User Flow */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MousePointerClick className="w-5 h-5 text-orange-500" />
                                User Interactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {flowData.userFlow?.onVisit && (
                                <div className="p-3 border rounded-lg">
                                    <h5 className="font-semibold text-sm mb-2 text-orange-600">On App Visit</h5>
                                    <p className="text-sm text-foreground">{flowData.userFlow.onVisit.process} &rarr; <span className="font-medium text-primary">{flowData.userFlow.onVisit.response}</span></p>
                                    <Badge variant="outline" className="mt-2 font-mono text-xs">{flowData.userFlow.onVisit.file}</Badge>
                                </div>
                            )}
                            {flowData.userFlow?.onAction && (
                                <div className="p-3 border rounded-lg">
                                    <h5 className="font-semibold text-sm mb-2 text-orange-600">On User "{flowData.userFlow.onAction.action}"</h5>
                                    <p className="text-sm text-foreground">{flowData.userFlow.onAction.process} &rarr; <span className="font-medium text-primary">{flowData.userFlow.onAction.response}</span></p>
                                    <Badge variant="outline" className="mt-2 font-mono text-xs">{flowData.userFlow.onAction.file}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="w-5 h-5 text-purple-500" />
                                API Endpoints
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {flowData.apiEndpoints?.map((api, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={
                                                    api.method === 'GET' ? 'bg-blue-500 text-white' :
                                                        api.method === 'POST' ? 'bg-green-500 text-white' :
                                                            'bg-orange-500 text-white'
                                                }>{api.method}</Badge>
                                                <span className="font-mono text-sm font-semibold">{api.endpoint}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{api.purpose}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-xs">{api.file}</Badge>
                                    </div>
                                ))}
                                {!flowData.apiEndpoints?.length && (
                                    <span className="text-sm text-muted-foreground">No explicit API endpoints mapped.</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-green-500" />
                        Database Schema Architecture
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {flowData.databaseSchema?.collections?.map((col, idx) => (
                            <div key={idx} className="p-4 border rounded-xl shadow-sm">
                                <h4 className="font-bold text-lg mb-2 text-foreground">{col.name}</h4>
                                <p className="text-xs text-muted-foreground mb-4">{col.purpose}</p>
                                <div className="space-y-1">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fields</h5>
                                    {col.fields?.map(field => (
                                        <div key={field} className="text-sm font-mono flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> {field}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
