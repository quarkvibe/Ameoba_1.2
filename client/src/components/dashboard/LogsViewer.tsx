import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  details?: any;
  requestId?: string;
}

interface LogsData {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

export default function LogsViewer() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [logLevel, setLogLevel] = useState("all");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Mock logs data (in production this would come from backend)
  const mockLogs: LogEntry[] = [
    {
      timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
      level: 'info',
      service: 'horoscope-service',
      message: 'Successfully generated horoscope for Leo',
      details: { zodiacSign: 'leo', duration: '2.3s' },
    },
    {
      timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
      level: 'info',
      service: 'astronomy-service',
      message: 'Planetary positions calculated',
      details: { method: 'Swiss Ephemeris', planets: 10 },
    },
    {
      timestamp: new Date(Date.now() - 1000 * 180).toISOString(),
      level: 'warn',
      service: 'queue-service',
      message: 'Queue processing slightly delayed',
      details: { queueDepth: 5, estimatedDelay: '30s' },
    },
    {
      timestamp: new Date(Date.now() - 1000 * 300).toISOString(),
      level: 'info',
      service: 'cron-service',
      message: 'Daily horoscope generation scheduled',
      details: { nextRun: '2025-09-19T00:00:00.000Z' },
    },
    {
      timestamp: new Date(Date.now() - 1000 * 600).toISOString(),
      level: 'error',
      service: 'astronomy-service',
      message: 'Swiss Ephemeris not available, falling back to Astronomy Engine',
      details: { fallback: true, precision: 'high' },
    },
  ];

  const { data: logsData, isLoading, refetch } = useQuery<LogsData>({
    queryKey: ["/api/logs", { filter, logLevel, limit: 100 }],
    queryFn: async () => {
      // Mock API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredLogs = mockLogs;
      if (filter) {
        filteredLogs = mockLogs.filter(log => 
          log.message.toLowerCase().includes(filter.toLowerCase()) ||
          log.service.toLowerCase().includes(filter.toLowerCase())
        );
      }
      if (logLevel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === logLevel);
      }
      
      return {
        logs: filteredLogs,
        total: filteredLogs.length,
        page: 1,
        limit: 100,
      };
    },
    refetchInterval: isAutoRefresh ? 10000 : false, // Refresh every 10 seconds if auto-refresh is on
  });

  // WebSocket for real-time log updates
  useWebSocket({
    onMessage: (message) => {
      if (message.type === 'new_log_entry') {
        const newLog = message.data as LogEntry;
        setLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep latest 100 logs
        
        if (newLog.level === 'error') {
          toast({
            title: "System Error",
            description: `${newLog.service}: ${newLog.message}`,
            variant: "destructive",
          });
        }
      }
    },
  });

  useEffect(() => {
    if (logsData?.logs) {
      setLogs(logsData.logs);
    }
  }, [logsData]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'warn':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-primary text-primary-foreground';
      case 'debug':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return 'fas fa-times-circle';
      case 'warn':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      case 'debug':
        return 'fas fa-bug';
      default:
        return 'fas fa-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()} ${log.service}: ${log.message}${
        log.details ? ' | ' + JSON.stringify(log.details) : ''
      }`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amoeba-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "System logs have been downloaded as a text file.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="flex-1 h-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Log Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-file-alt text-primary"></i>
              System Logs
              <Badge variant="secondary" data-testid="text-log-count">
                {logs.length} entries
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                data-testid="button-toggle-auto-refresh"
              >
                <i className={`fas ${isAutoRefresh ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                {isAutoRefresh ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                data-testid="button-export-logs"
              >
                <i className="fas fa-download mr-1"></i>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Filter logs (message, service)..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
                data-testid="input-log-filter"
              />
            </div>
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="w-40" data-testid="select-log-level">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-logs"
            >
              <i className="fas fa-refresh mr-1"></i>
              Refresh
            </Button>
          </div>

          {/* Log Entries */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto" data-testid="logs-container">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors font-mono text-sm"
                  data-testid={`log-entry-${index}`}
                >
                  {/* Timestamp */}
                  <div className="text-muted-foreground min-w-[80px] text-xs">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  
                  {/* Level Badge */}
                  <Badge className={`${getLevelColor(log.level)} min-w-[60px] justify-center text-xs`}>
                    <i className={`${getLevelIcon(log.level)} mr-1`}></i>
                    {log.level.toUpperCase()}
                  </Badge>
                  
                  {/* Service */}
                  <div className="text-primary font-medium min-w-[120px] text-xs">
                    {log.service}
                  </div>
                  
                  {/* Message */}
                  <div className="flex-1 text-foreground">
                    {log.message}
                    {log.details && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-file-alt text-muted-foreground text-2xl mb-3"></i>
                <p className="text-muted-foreground">No logs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Logs will appear here as the system operates
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}