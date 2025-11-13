import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemStatus {
  database: { status: string; latency?: string };
  queue: { status: string; depth?: number };
  astronomyService: { status: string; engine?: string };
  contentService: { status: string; lastGeneration?: string };
  nextJob?: { name: string; time: string };
}

export default function SystemStatus() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mock system status data (would come from backend in production)
  const systemStatus: SystemStatus = {
    database: { status: "connected", latency: "12ms" },
    queue: { status: "active", depth: 0 },
    astronomyService: { status: "active", engine: "Swiss Ephemeris" },
    contentService: { status: "active", lastGeneration: new Date().toISOString() },
    nextJob: { name: "Daily content Generation", time: "12:00 AM" },
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-accent';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
      case 'disconnected':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'active':
        return 'Active';
      case 'warning':
        return 'Warning';
      case 'error':
      case 'disconnected':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">System Status</h3>
        
        <div className="space-y-4">
          
          {/* content Service */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">content Service</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Generator</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusIndicator(systemStatus.contentService.status)}`}></div>
                <span className="text-xs text-accent">
                  {getStatusText(systemStatus.contentService.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Astronomy Service */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Astronomy Service</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{systemStatus.astronomyService.engine}</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusIndicator(systemStatus.astronomyService.status)}`}></div>
                <span className="text-xs text-accent">
                  {getStatusText(systemStatus.astronomyService.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Database</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">PostgreSQL</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusIndicator(systemStatus.database.status)}`}></div>
                <span className="text-xs text-accent">
                  {getStatusText(systemStatus.database.status)}
                  {systemStatus.database.latency && ` (${systemStatus.database.latency})`}
                </span>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Processing Queue</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Jobs Queue</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusIndicator(systemStatus.queue.status)}`}></div>
                <span className="text-xs text-accent" data-testid="text-queue-status">
                  {systemStatus.queue.depth !== undefined ? `${systemStatus.queue.depth} jobs` : getStatusText(systemStatus.queue.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Next Job */}
          {systemStatus.nextJob && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Next Scheduled Job</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{systemStatus.nextJob.name}</span>
                <span className="text-xs text-primary" data-testid="text-next-job">
                  {systemStatus.nextJob.time}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
