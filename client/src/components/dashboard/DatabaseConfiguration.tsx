import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Database, Circle, CheckCircle, AlertTriangle, XCircle, RefreshCw, Save, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Database Configuration Widget
 * 
 * Following ARCHITECTURE.md cellular design:
 * - Visual cilium for database management
 * - Traffic light system (🟢🟡🔴) for connection status
 * - Simple prompts for configuration
 * - Default: Client-side (SQLite)
 * - Advanced: Server-side (PostgreSQL, MySQL, etc.)
 */

interface DatabaseStatus {
  type: string;
  connected: boolean;
  health: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  connectionString?: string;
  location?: 'client-side' | 'server-side';
  tables?: number;
  size?: string;
  latency?: number;
}

export default function DatabaseConfiguration() {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Fetch current database status
  const { data: dbStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/environment/variables'],
    select: (data: any) => {
      const dbType = data?.variables?.find((v: any) => v.key === 'DATABASE_TYPE');
      const dbUrl = data?.variables?.find((v: any) => v.key === 'DATABASE_URL');
      
      return {
        type: dbType?.value || 'postgres',
        url: dbUrl?.value || '',
        configured: !!dbUrl?.value,
      };
    },
  });
  
  // Fetch health check
  const { data: health } = useQuery({
    queryKey: ['/api/testing/health'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (config: { type: string; url: string }) => {
      const response = await apiRequest('POST', '/api/database/test-connection', config);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
  });
  
  // Update database config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (config: { type: string; url?: string }) => {
      // Update DATABASE_TYPE and DATABASE_URL
      const updates: any = {};
      updates.DATABASE_TYPE = config.type;
      if (config.url) updates.DATABASE_URL = config.url;
      
      const response = await apiRequest('POST', '/api/environment/variables/bulk', { updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/environment/variables'] });
      toast({
        title: "Database Configuration Updated",
        description: "Server restart required for changes to take effect",
      });
    },
  });
  
  // Get connection status (traffic light)
  const getConnectionStatus = (): 'connected' | 'connecting' | 'error' => {
    if (isLoading) return 'connecting';
    if (!health || !dbStatus?.configured) return 'error';
    return 'connected';
  };
  
  const connectionStatus = getConnectionStatus();
  
  // Traffic light color
  const getTrafficLight = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'text-green-500', icon: CheckCircle, label: '🟢 Connected', variant: 'default' as const };
      case 'connecting':
        return { color: 'text-yellow-500', icon: Circle, label: '🟡 Loading...', variant: 'secondary' as const };
      case 'error':
        return { color: 'text-red-500', icon: XCircle, label: '🔴 Not Connected', variant: 'destructive' as const };
    }
  };
  
  const trafficLight = getTrafficLight();
  const TrafficIcon = trafficLight.icon;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Configuration
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your database connection and storage settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={trafficLight.variant} className="px-4 py-2">
            <TrafficIcon className={`h-4 w-4 mr-2 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
            {trafficLight.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Connection Status Card */}
      <Card className={
        connectionStatus === 'connected' ? 'border-green-500' :
        connectionStatus === 'error' ? 'border-red-500' :
        'border-yellow-500'
      }>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connection Status</CardTitle>
            <div className="flex items-center gap-2">
              <TrafficIcon className={`h-6 w-6 ${trafficLight.color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Database Type</div>
              <div className="font-mono font-bold capitalize">{dbStatus?.type || 'postgres'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Location</div>
              <div className="font-medium">
                {dbStatus?.type === 'sqlite' || dbStatus?.type === 'memory' ? (
                  <span className="flex items-center gap-1">
                    📱 Client-Side
                    <Badge variant="outline" className="ml-2">Serverless</Badge>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    🌐 Server-Side
                    <Badge variant="outline" className="ml-2">Cloud</Badge>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {dbStatus?.url && dbStatus.type !== 'sqlite' && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Connection String</div>
              <code className="text-xs bg-muted px-3 py-2 rounded block">
                {dbStatus.url.substring(0, 50)}...
              </code>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Database not configured or not accessible. Configure below to get started.
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Database connection healthy and operational
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Setup Options */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Client-Side (Default) */}
        <Card className={dbStatus?.type === 'sqlite' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📱 Client-Side Storage
              {(dbStatus?.type === 'sqlite' || !dbStatus?.type) && (
                <Badge>Current</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Serverless, zero configuration (SQLite)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Zero setup required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Perfect for development</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span>File-based (./amoeba.db)</span>
              </div>
            </div>
            
            <Button
              className="w-full"
              variant={dbStatus?.type === 'sqlite' ? 'outline' : 'default'}
              onClick={() => updateConfigMutation.mutate({ type: 'sqlite' })}
              disabled={dbStatus?.type === 'sqlite'}
            >
              {dbStatus?.type === 'sqlite' ? '✓ Active' : 'Switch to Client-Side'}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Best for: Development, testing, single-user deployments
            </p>
          </CardContent>
        </Card>
        
        {/* Server-Side (Advanced) */}
        <Card className={dbStatus?.type === 'postgres' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🌐 Server-Side Database
              {dbStatus?.type === 'postgres' && (
                <Badge>Current</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Scalable cloud database (PostgreSQL)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Scalable & reliable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Multi-user support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Free tier available (Neon.tech)</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Requires configuration</span>
              </div>
            </div>
            
            <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
              <DialogTrigger asChild>
                <Button className="w-full" variant={dbStatus?.type === 'postgres' ? 'outline' : 'default'}>
                  {dbStatus?.type === 'postgres' ? '⚙️ Reconfigure' : 'Setup Server-Side DB'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configure Server-Side Database</DialogTitle>
                  <DialogDescription>
                    Connect to PostgreSQL, MySQL, or other cloud database
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateConfigMutation.mutate({
                    type: formData.get('dbType') as string,
                    url: formData.get('dbUrl') as string,
                  });
                  setShowAdvanced(false);
                }} className="space-y-4">
                  <div>
                    <Label>Database Type</Label>
                    <Select name="dbType" defaultValue={dbStatus?.type || 'postgres'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgres">PostgreSQL (Recommended)</SelectItem>
                        <SelectItem value="mysql">MySQL (Coming Soon)</SelectItem>
                        <SelectItem value="mongodb">MongoDB (Coming Soon)</SelectItem>
                        <SelectItem value="sqlite">SQLite (Client-Side)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Connection String</Label>
                    <Input
                      name="dbUrl"
                      type="password"
                      placeholder="postgresql://user:pass@host:5432/dbname"
                      defaultValue={dbStatus?.url || ''}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Get free PostgreSQL from{' '}
                      <a href="https://neon.tech" target="_blank" className="text-primary underline">
                        Neon.tech
                      </a>
                      {' '}or{' '}
                      <a href="https://supabase.com" target="_blank" className="text-primary underline">
                        Supabase
                      </a>
                    </p>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>After saving:</strong> Server will restart to apply changes. This takes ~30 seconds.
                    </AlertDescription>
                  </Alert>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAdvanced(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateConfigMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateConfigMutation.isPending ? 'Saving...' : 'Save & Restart'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <p className="text-xs text-muted-foreground">
              Best for: Production, multi-user, team deployments
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Traffic Light System - Detailed Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Health</CardTitle>
          <CardDescription>Real-time database connection monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Traffic Light Indicator */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-shrink-0">
                {connectionStatus === 'connected' && (
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                )}
                {connectionStatus === 'connecting' && (
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Circle className="h-10 w-10 text-white animate-spin" />
                    </div>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="text-lg font-bold mb-1">
                  {connectionStatus === 'connected' && '✅ Database Connected'}
                  {connectionStatus === 'connecting' && '⏳ Connecting to Database...'}
                  {connectionStatus === 'error' && '❌ Database Not Configured'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' && `Using ${dbStatus?.type || 'postgres'} database`}
                  {connectionStatus === 'connecting' && 'Checking connection status...'}
                  {connectionStatus === 'error' && 'Configure database above to get started'}
                </div>
                {connectionStatus === 'connected' && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {dbStatus?.type === 'sqlite' && '📱 Client-side storage (serverless)'}
                    {dbStatus?.type === 'postgres' && '🌐 Server-side PostgreSQL (cloud)'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            {connectionStatus === 'error' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Quick Start:</strong> Use client-side storage (SQLite) for instant setup with zero configuration.
                  Click "Switch to Client-Side" above.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Database Information */}
      {connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground">Type</div>
                <div className="font-mono font-bold capitalize">{dbStatus?.type || 'postgres'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
            </div>
            
            {dbStatus?.type === 'sqlite' && (
              <div className="p-3 bg-muted rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <strong>SQLite (Serverless)</strong>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• File location: ./amoeba.db</li>
                  <li>• No external DB server required</li>
                  <li>• Perfect for single-user deployments</li>
                  <li>• Zero monthly costs</li>
                </ul>
              </div>
            )}
            
            {dbStatus?.type === 'postgres' && dbStatus.configured && (
              <div className="p-3 bg-muted rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  <strong>PostgreSQL (Cloud)</strong>
                </div>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Scalable for multiple users</li>
                  <li>• Reliable cloud infrastructure</li>
                  <li>• Automatic backups (provider-dependent)</li>
                  <li>• Free tier available (Neon.tech, Supabase)</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Help Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">💡 Which Database Should I Use?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>📱 Client-Side (SQLite):</strong>
            <p className="text-muted-foreground mt-1">
              Perfect if you're just starting, developing, or running single-user. Zero setup, works immediately.
            </p>
          </div>
          <div>
            <strong>🌐 Server-Side (PostgreSQL):</strong>
            <p className="text-muted-foreground mt-1">
              Recommended for production, multiple users, or team deployments. Free tier available at Neon.tech.
            </p>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            <strong>Can I switch later?</strong> Yes! Amoeba supports database migration tools. Start with SQLite, upgrade to PostgreSQL when needed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

