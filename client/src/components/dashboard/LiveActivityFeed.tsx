import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  details?: string;
  timestamp: string;
  status: string;
  zodiacSign?: string;
  generationType?: string;
}

export default function LiveActivityFeed() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
  });

  const activities: ActivityItem[] = (metrics as any)?.recentActivity || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
      case 'completed':
      case 'published':
        return 'text-accent border-accent';
      case 'failed':
      case 'error':
        return 'text-destructive border-destructive';
      case 'generating':
      case 'processing':
        return 'text-yellow-500 border-yellow-500';
      default:
        return 'text-muted-foreground border-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
      case 'completed':
      case 'published':
        return 'fas fa-star';
      case 'failed':
      case 'error':
        return 'fas fa-times-circle';
      case 'generating':
      case 'processing':
        return 'fas fa-magic';
      case 'queued':
        return 'fas fa-clock';
      default:
        return 'fas fa-info-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="bg-card border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Live Activity Feed</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="activity-feed">
          {isLoading ? (
            // Loading skeleton
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          ) : activities.length > 0 ? (
            // Activity items
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`border-l-3 pl-3 transition-all duration-200 animate-in slide-in-from-top-1 ${getStatusColor(activity.status)}`}
                data-testid={`activity-${activity.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <i className={`${getStatusIcon(activity.status)} ${getStatusColor(activity.status).split(' ')[0]} text-sm`}></i>
                    <div>
                      <p className="text-sm text-foreground">{activity.message}</p>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground">{activity.details}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="text-center py-8">
              <i className="fas fa-star text-muted-foreground text-2xl mb-3"></i>
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as horoscopes are generated
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
