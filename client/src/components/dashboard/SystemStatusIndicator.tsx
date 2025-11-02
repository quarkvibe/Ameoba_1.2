import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    [key: string]: HealthCheck;
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Compact system health indicator for top bar
 * Shows traffic light (🟢🟡🔴) with popover details
 */
export default function SystemStatusIndicator() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const { data: readiness } = useQuery<SystemReadiness>({
    queryKey: ["/api/system/readiness"],
    refetchInterval: 30000,
    retry: false,
  });

  if (!readiness) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
        <span className="text-xs text-muted-foreground">Checking...</span>
      </div>
    );
  }

  const statusColor = 
    readiness.overall === 'healthy' ? 'bg-green-500' :
    readiness.overall === 'degraded' ? 'bg-yellow-500' :
    'bg-red-500';

  const statusText = 
    readiness.overall === 'healthy' ? 'Operational' :
    readiness.overall === 'degraded' ? 'Needs Attention' :
    'Critical Issues';

  const statusIcon =
    readiness.overall === 'healthy' ? '✓' :
    readiness.overall === 'degraded' ? '!' :
    '✗';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1.5 px-3 hover:bg-accent">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor} ${readiness.overall === 'healthy' ? 'animate-pulse' : ''}`}></div>
              {readiness.overall !== 'healthy' && (
                <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center`}>
                  <span className="text-[8px] font-bold">{statusIcon}</span>
                </div>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-medium">{statusText}</div>
              <div className="text-[10px] text-muted-foreground">{readiness.score}/100</div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="text-2xl">{readiness.overallIcon}</span>
              System Health
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold">{readiness.score}</div>
              <div className="text-xs text-muted-foreground">score</div>
            </div>
          </div>

          {/* Quick Status List */}
          <div className="space-y-2 text-sm">
            {Object.entries(readiness.checks || {}).map(([key, check]) => {
              const healthCheck = check as HealthCheck;
              return (
                <div key={key} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span>{healthCheck.icon}</span>
                    <span className="text-xs capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <span className={`text-xs ${getStatusColor(healthCheck.status)}`}>
                    {healthCheck.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Blockers */}
          {readiness.blockers.length > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                Critical Issues:
              </h4>
              <ul className="text-xs space-y-1">
                {readiness.blockers.slice(0, 2).map((blocker, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {readiness.warnings.length > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                Warnings:
              </h4>
              <ul className="text-xs space-y-1">
                {readiness.warnings.slice(0, 2).map((warning, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Action */}
          <div className="pt-2 border-t">
            <Button size="sm" className="w-full" variant="outline" asChild>
              <a href="?view=health">
                View Full Health Dashboard →
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

