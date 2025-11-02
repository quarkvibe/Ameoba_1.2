import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Server, Globe, Shield, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Deployment Guide Component
 * Shows deployment status, detects conflicts, provides DNS/nginx guidance
 * 
 * Helps users deploy Amoeba alongside existing services
 */

export default function DeploymentGuide() {
  const { toast } = useToast();
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  
  // Fetch deployment analysis
  const { data: analysis, isLoading } = useQuery<any>({
    queryKey: ['/api/deployment/analyze'],
  });
  
  // Fetch deployment health
  const { data: health } = useQuery<any>({
    queryKey: ['/api/deployment/health'],
  });
  
  // Fetch existing services
  const { data: servicesData } = useQuery<any>({
    queryKey: ['/api/deployment/services'],
  });
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Configuration copied to clipboard" });
  };
  
  const getHealthBadge = (status: string) => {
    const variants: Record<string, any> = {
      optimal: 'default',
      functional: 'secondary',
      needs_attention: 'warning',
      critical: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6" />
          Deployment Integration
        </h2>
        <p className="text-muted-foreground mt-1">
          DNS configuration, service detection, and nginx setup guidance
        </p>
      </div>
      
      {/* Deployment Health */}
      {health && health.status && (
        <Card className={
          health.status === 'optimal' ? 'border-green-500' :
          health.status === 'critical' ? 'border-red-500' :
          'border-yellow-500'
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deployment Health</CardTitle>
              {getHealthBadge(health.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{health.score}/100</div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        health.score >= 90 ? 'bg-green-500' :
                        health.score >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${health.score}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {health?.issues && health.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues Found:</strong>
                    <ul className="mt-2 space-y-1">
                      {health.issues.map((issue: string, i: number) => (
                        <li key={i}>• {issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {health?.recommendations && health.recommendations.length > 0 && (
                <div>
                  <strong className="text-sm">Recommendations:</strong>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {health.recommendations.map((rec: string, i: number) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nginx">Nginx Setup</TabsTrigger>
          <TabsTrigger value="dns">DNS Config</TabsTrigger>
          <TabsTrigger value="ssl">SSL/HTTPS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amoeba Port:</span>
                <code className="font-mono">{analysis?.currentPort || '5000'}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Port Available:</span>
                {analysis?.portAvailable ? (
                  <Badge variant="default">✅ Yes</Badge>
                ) : (
                  <Badge variant="destructive">❌ Conflict</Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Public IP:</span>
                <code className="font-mono">{analysis?.publicIP || 'Detecting...'}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hostname:</span>
                <code className="font-mono">{analysis?.hostname || 'Unknown'}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nginx:</span>
                {analysis?.nginxInstalled ? (
                  <Badge variant="default">✅ Installed{analysis?.nginxRunning ? ' & Running' : ''}</Badge>
                ) : (
                  <Badge variant="secondary">Not Installed</Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSL:</span>
                {analysis?.sslAvailable ? (
                  <Badge variant="default">✅ Available</Badge>
                ) : (
                  <Badge variant="secondary">Not Configured</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Conflicting Services */}
          {analysis?.conflictingServices && Array.isArray(analysis.conflictingServices) && analysis.conflictingServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Port Conflicts Detected
                </CardTitle>
                <CardDescription>
                  Other services are using nearby ports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.conflictingServices.map((service: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{service.processName}</div>
                        <div className="text-xs text-muted-foreground">PID: {service.pid}</div>
                      </div>
                      <Badge>Port {service.port}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Existing Services */}
          {servicesData?.services && Array.isArray(servicesData.services) && servicesData.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detected Services</CardTitle>
                <CardDescription>
                  Other services running on this server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {servicesData.services.map((service: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.url && (
                          <div className="text-xs text-muted-foreground">{service.url}</div>
                        )}
                      </div>
                      <Badge variant="outline">Port {service.port}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="nginx" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nginx Reverse Proxy Setup</CardTitle>
              <CardDescription>
                Recommended for production - allows multiple services on one server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis?.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.find((r: any) => r.scenario.includes('Nginx')) && (
                <div className="space-y-4">
                  <div>
                    <strong className="text-sm">Why Use Nginx?</strong>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li>• Run multiple services on one server (main site + Amoeba)</li>
                      <li>• Different subdomains route to different apps</li>
                      <li>• SSL termination in one place</li>
                      <li>• Load balancing and caching</li>
                    </ul>
                  </div>
                  
                  {analysis?.recommendations && analysis.recommendations
                    .filter((r: any) => r.nginxConfig)
                    .map((rec: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm">Configuration:</strong>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(rec.nginxConfig)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <ScrollArea className="h-[400px]">
                          <pre className="text-xs bg-muted p-4 rounded">
                            {rec.nginxConfig}
                          </pre>
                        </ScrollArea>
                        
                        <div className="mt-4">
                          <strong className="text-sm">Steps:</strong>
                          <ol className="mt-2 space-y-2 text-sm">
                            {rec.steps.map((step: string, j: number) => (
                              <li key={j} className="text-muted-foreground">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dns" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                DNS Configuration
              </CardTitle>
              <CardDescription>
                Point your subdomain to this server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis?.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.find((r: any) => r.dnsConfig) && (
                <div>
                  {analysis.recommendations
                    .filter((r: any) => r.dnsConfig)
                    .map((rec: any, i: number) => (
                      <div key={i} className="space-y-4">
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Suggested Subdomain:</strong> {analysis?.suggestedSubdomain || 'amoeba.yourdomain.com'}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="p-4 border rounded-lg space-y-2 bg-muted">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Record Type:</div>
                            <code className="font-mono">{rec.dnsConfig.type}</code>
                            
                            <div className="text-muted-foreground">Name/Host:</div>
                            <code className="font-mono">amoeba</code>
                            
                            <div className="text-muted-foreground">Points To:</div>
                            <code className="font-mono">{rec.dnsConfig.value}</code>
                            
                            <div className="text-muted-foreground">TTL:</div>
                            <code className="font-mono">{rec.dnsConfig.ttl} (1 hour)</code>
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-sm">Steps:</strong>
                          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                            {rec.steps.map((step: string, j: number) => (
                              <li key={j}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        
                        {rec.warnings && (
                          <Alert variant="default">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Important:</strong>
                              <ul className="mt-2 space-y-1">
                                {rec.warnings.map((warning: string, j: number) => (
                                  <li key={j} className="text-xs">• {warning}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ssl" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSL/HTTPS Setup
              </CardTitle>
              <CardDescription>
                Secure your Amoeba installation with free Let's Encrypt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysis?.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.find((r: any) => r.scenario.includes('SSL')) && (
                <div className="space-y-4">
                  {analysis.recommendations
                    .filter((r: any) => r.scenario.includes('SSL'))
                    .map((rec: any, i: number) => (
                      <div key={i} className="space-y-4">
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Let's Encrypt provides free SSL certificates that auto-renew
                          </AlertDescription>
                        </Alert>
                        
                        <div>
                          <strong className="text-sm">Steps:</strong>
                          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                            {rec.steps.map((step: string, j: number) => (
                              <li key={j}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        
                        {rec.warnings && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Prerequisites:</strong>
                              <ul className="mt-2 space-y-1 text-xs">
                                {rec.warnings.map((warning: string, j: number) => (
                                  <li key={j}>• {warning}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Reference */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">🚀 Quick Deployment Scenarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Scenario A: Fresh Server (No other services)</strong>
            <p className="text-muted-foreground mt-1">
              → Access directly via http://YOUR_IP:5000 (no nginx needed initially)
            </p>
          </div>
          <div>
            <strong>Scenario B: Existing Website (example.com)</strong>
            <p className="text-muted-foreground mt-1">
              → Use nginx to route amoeba.example.com → localhost:5000
            </p>
            <p className="text-muted-foreground">
              → Main site stays at example.com
            </p>
          </div>
          <div>
            <strong>Scenario C: Multiple Apps on Server</strong>
            <p className="text-muted-foreground mt-1">
              → Each app gets subdomain: app1.example.com, app2.example.com, amoeba.example.com
            </p>
            <p className="text-muted-foreground">
              → Nginx routes each to different port
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

