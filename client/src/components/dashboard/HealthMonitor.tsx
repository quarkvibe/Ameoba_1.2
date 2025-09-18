import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface HealthMetrics {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  lastCheck: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: HealthMetrics[];
  system: {
    cpu: number;
    memory: number;
    disk: number;
    connections: number;
  };
  checks: {
    database: boolean;
    api: boolean;
    queue: boolean;
    astronomy: boolean;
  };
}

export default function HealthMonitor() {
  const { toast } = useToast();

  const { data: healthData, isLoading, refetch } = useQuery<SystemHealth>({
    queryKey: ["/api/health/detailed"],
    queryFn: async () => {
      // Mock health data (in production this would come from backend)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        overall: 'healthy' as const,
        services: [
          {
            service: 'Horoscope Service',
            status: 'healthy' as const,
            uptime: 99.97,
            responseTime: 145,
            lastCheck: new Date().toISOString(),
            details: { lastGeneration: '2 hours ago', totalGenerated: 12 }
          },
          {
            service: 'Astronomy Service',
            status: 'healthy' as const,
            uptime: 99.95,
            responseTime: 89,
            lastCheck: new Date().toISOString(),
            details: { engine: 'Swiss Ephemeris', planetsTracked: 10 }
          },
          {
            service: 'Queue Service',
            status: 'warning' as const,
            uptime: 98.2,
            responseTime: 234,
            lastCheck: new Date().toISOString(),
            details: { pendingJobs: 3, processingRate: '45/min' }
          },
          {
            service: 'Database',
            status: 'healthy' as const,
            uptime: 99.99,
            responseTime: 12,
            lastCheck: new Date().toISOString(),
            details: { connections: 8, queries: '1.2k/min' }
          },
          {
            service: 'API Gateway',
            status: 'healthy' as const,
            uptime: 99.8,
            responseTime: 67,
            lastCheck: new Date().toISOString(),
            details: { requests: '850/min', errors: '0.1%' }
          }
        ],
        system: {
          cpu: 23,
          memory: 67,
          disk: 34,
          connections: 45
        },
        checks: {
          database: true,
          api: true,
          queue: true,
          astronomy: true
        }
      };
    },
    refetchInterval: 30000, // Check health every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'critical':
        return 'bg-red-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'fas fa-check-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'critical':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-question-circle';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const runHealthCheck = () => {
    refetch();
    toast({
      title: "Health Check",
      description: "Running comprehensive system health check...",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const services = healthData?.services || [];
  const systemMetrics = healthData?.system;
  const healthChecks = healthData?.checks;

  return (
    <div className="space-y-6">
      
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className={`fas fa-heartbeat ${getOverallStatusColor(healthData?.overall || 'healthy')}`}></i>
              System Health Monitor
              <Badge className={getStatusColor(healthData?.overall || 'healthy')}>
                {healthData?.overall?.toUpperCase()}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              onClick={runHealthCheck}
              disabled={isLoading}
              data-testid="button-run-health-check"
            >
              <i className="fas fa-stethoscope mr-2"></i>
              Run Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* System Resource Usage */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span data-testid="text-cpu-usage">{systemMetrics?.cpu}%</span>
              </div>
              <Progress value={systemMetrics?.cpu} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span data-testid="text-memory-usage">{systemMetrics?.memory}%</span>
              </div>
              <Progress value={systemMetrics?.memory} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disk Space</span>
                <span data-testid="text-disk-usage">{systemMetrics?.disk}%</span>
              </div>
              <Progress value={systemMetrics?.disk} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Connections</span>
                <span data-testid="text-connections">{systemMetrics?.connections}</span>
              </div>
              <Progress value={(systemMetrics?.connections || 0) * 2} className="h-2" />
            </div>
          </div>

          {/* Health Checks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(healthChecks || {}).map(([check, status]) => (
              <div key={check} className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                <i className={`${status ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'}`}></i>
                <span className="text-sm font-medium capitalize">{check}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between p-4 rounded-lg border bg-muted/20"
                data-testid={`service-${service.service.toLowerCase().replace(/\s+/g, '-')}`}
              >
                
                {/* Service Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <i className={`${getStatusIcon(service.status)} ${
                      service.status === 'healthy' ? 'text-green-500' :
                      service.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`}></i>
                    <div>
                      <div className="font-medium">{service.service}</div>
                      <div className="text-xs text-muted-foreground">
                        Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium" data-testid={`uptime-${service.service.toLowerCase().replace(/\s+/g, '-')}`}>
                      {formatUptime(service.uptime)}
                    </div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium" data-testid={`response-${service.service.toLowerCase().replace(/\s+/g, '-')}`}>
                      {service.responseTime}ms
                    </div>
                    <div className="text-xs text-muted-foreground">Response</div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Service Details */}
                {service.details && (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {Object.entries(service.details).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}