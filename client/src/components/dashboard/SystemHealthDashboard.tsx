import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  details?: any;
  icon: '🟢' | '🟡' | '🔴';
  timestamp: string;
}

interface SystemReadiness {
  overall: 'healthy' | 'degraded' | 'critical';
  overallIcon: '🟢' | '🟡' | '🔴';
  score: number;
  checks: {
    aiCredentials: HealthCheck;
    emailCredentials: HealthCheck;
    aiAgent: HealthCheck;
    database: HealthCheck;
    encryption: HealthCheck;
    templates: HealthCheck;
    scheduledJobs: HealthCheck;
    queueHealth: HealthCheck;
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  timestamp: string;
}

export default function SystemHealthDashboard() {
  const { data: readiness, isLoading } = useQuery<SystemReadiness>({
    queryKey: ["/api/system/readiness"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Health Check Failed</AlertTitle>
        <AlertDescription>
          Unable to check system readiness. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-500">Healthy</Badge>;
      case 'degraded': return <Badge className="bg-yellow-500">Needs Attention</Badge>;
      case 'critical': return <Badge className="bg-red-500">Critical</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  const checks = Object.entries(readiness.checks);

  return (
    <div className="space-y-4">
      {/* Overall Status Card */}
      <Card className="border-2" style={{ 
        borderColor: readiness.overall === 'healthy' ? '#22c55e' : 
                      readiness.overall === 'degraded' ? '#eab308' : '#ef4444' 
      }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{readiness.overallIcon}</span>
              <div>
                <CardTitle className="text-2xl">System Readiness</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last checked: {new Date(readiness.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{readiness.score}/100</div>
              {getStatusBadge(readiness.overall)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={readiness.score} className="h-3" />
          
          {/* Blockers */}
          {readiness.blockers.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Critical Issues Preventing Operation</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {readiness.blockers.map((blocker, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{blocker}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {readiness.warnings.length > 0 && readiness.blockers.length === 0 && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {readiness.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {readiness.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span>💡</span> Recommendations
              </h4>
              <ul className="space-y-1 text-sm">
                {readiness.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {checks.map(([key, check]) => (
          <Card key={key} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-2xl ${getStatusColor(check.status)}`}>
                  {check.icon}
                </span>
                {check.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {check.status === 'degraded' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {check.status === 'critical' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
              
              <h3 className="font-semibold text-sm mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              
              <p className="text-xs text-muted-foreground mb-3">
                {check.message}
              </p>

              {check.details && (
                <div className="text-xs space-y-1">
                  {check.details.action && (
                    <div className="flex items-start gap-1 text-blue-600 dark:text-blue-400">
                      <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{check.details.action}</span>
                    </div>
                  )}
                  {check.details.total !== undefined && (
                    <div className="text-muted-foreground">
                      Total: {check.details.total} | Active: {check.details.active || 0}
                    </div>
                  )}
                  {check.details.providers && (
                    <div className="text-muted-foreground">
                      Providers: {check.details.providers.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {(readiness.blockers.length > 0 || readiness.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions to Fix Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {readiness.checks.aiCredentials.status !== 'healthy' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="?view=ai-credentials">
                    <span className="mr-2">🔑</span>
                    Add AI Credential
                  </a>
                </Button>
              )}
              
              {readiness.checks.emailCredentials.status !== 'healthy' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="?view=email-credentials">
                    <span className="mr-2">📧</span>
                    Add Email Credential
                  </a>
                </Button>
              )}
              
              {readiness.checks.templates.status !== 'healthy' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="?view=content-config">
                    <span className="mr-2">📝</span>
                    Create Template
                  </a>
                </Button>
              )}
              
              {readiness.checks.scheduledJobs.status !== 'healthy' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="?view=schedule">
                    <span className="mr-2">⏰</span>
                    Schedule Job
                  </a>
                </Button>
              )}

              {readiness.checks.encryption.status !== 'healthy' && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="?view=settings">
                    <span className="mr-2">🔐</span>
                    Configure Encryption
                  </a>
                </Button>
              )}

              {readiness.overall === 'healthy' && (
                <Button className="w-full justify-start" variant="default" asChild>
                  <a href="?view=generation">
                    <span className="mr-2">🚀</span>
                    Generate Content Now
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


