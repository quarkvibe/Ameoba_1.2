import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, CheckCircle, XCircle, Clock, FileText, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * System Testing Component
 * Run tests, view logs, check diagnostics
 * 
 * Following ARCHITECTURE.md:
 * - Visual cilium (UI layer)
 * - Calls testing service via API
 * - Simple, focused, single purpose
 */

export default function SystemTesting() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tests");
  const [testResults, setTestResults] = useState<any>(null);
  const [running, setRunning] = useState(false);
  
  // Fetch test suites
  const { data: suites } = useQuery<any>({
    queryKey: ['/api/testing/suites'],
  });
  
  // Fetch logs
  const { data: logsData } = useQuery<any>({
    queryKey: ['/api/testing/logs'],
  });
  
  // Fetch diagnostics
  const { data: diagnostics } = useQuery<any>({
    queryKey: ['/api/testing/diagnostics'],
  });
  
  // Run all tests mutation
  const runAllTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/testing/run');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(data);
      setRunning(false);
      toast({
        title: data.success ? "All Tests Passed" : "Some Tests Failed",
        description: `${data.passed}/${data.passed + data.failed} tests passed in ${data.duration}ms`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      setRunning(false);
      toast({
        title: "Test Run Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Run specific suite mutation
  const runSuiteMutation = useMutation({
    mutationFn: async (suiteName: string) => {
      const response = await apiRequest('POST', `/api/testing/suite/${suiteName}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Suite Complete",
        description: `${data.passed}/${data.passed + data.failed} tests passed`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/testing/suites'] });
    },
  });
  
  const handleRunAllTests = () => {
    setRunning(true);
    runAllTestsMutation.mutate();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Testing & Diagnostics</h2>
          <p className="text-muted-foreground mt-1">
            Test system components, view logs, and monitor health
          </p>
        </div>
        
        <Button onClick={handleRunAllTests} disabled={running}>
          {running ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">🧪 Tests</TabsTrigger>
          <TabsTrigger value="logs">📋 Logs</TabsTrigger>
          <TabsTrigger value="diagnostics">🔍 Diagnostics</TabsTrigger>
        </TabsList>
        
        {/* Tests Tab */}
        <TabsContent value="tests" className="mt-6 space-y-4">
          {testResults && (
            <Card className={testResults.success ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Last Test Run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{testResults.passed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{testResults.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{testResults.duration}ms</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Test Suites */}
          <div className="grid gap-4">
            {suites?.suites?.map((suite: any) => (
              <Card key={suite.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                      <CardDescription>{suite.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{suite.testCount} tests</Badge>
                      <Button
                        size="sm"
                        onClick={() => runSuiteMutation.mutate(suite.id)}
                        disabled={runSuiteMutation.isPending}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {suite.tests.map((test: any) => (
                      <div key={test.id} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">•</span>
                        <span>{test.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Recent activity and errors</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/testing/logs'] })}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 font-mono text-sm">
                  {logsData?.logs?.map((log: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        log.level === 'error' ? 'bg-red-50 dark:bg-red-950' :
                        log.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950' :
                        log.level === 'success' ? 'bg-green-50 dark:bg-green-950' :
                        'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warning' ? 'text-yellow-600' :
                          log.level === 'success' ? 'text-green-600' :
                          ''
                        }>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="mt-6">
          <div className="grid gap-4">
            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Uptime</div>
                  <div className="font-mono">{Math.floor((diagnostics?.system?.uptime || 0) / 60)} minutes</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Memory</div>
                  <div className="font-mono">
                    {Math.round((diagnostics?.system?.memory?.heapUsed || 0) / 1024 / 1024)}MB / 
                    {Math.round((diagnostics?.system?.memory?.heapTotal || 0) / 1024 / 1024)}MB
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Platform</div>
                  <div className="font-mono">{diagnostics?.system?.platform}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Node Version</div>
                  <div className="font-mono">{diagnostics?.system?.version}</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Services Status */}
            <Card>
              <CardHeader>
                <CardTitle>Services Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'AI Providers', key: 'ai', icon: '🤖' },
                  { name: 'Email Service', key: 'email', icon: '📧' },
                  { name: 'SMS Service', key: 'sms', icon: '📱' },
                  { name: 'Voice Service', key: 'voice', icon: '📞' },
                ].map((service) => (
                  <div key={service.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{service.icon}</span>
                      <span>{service.name}</span>
                    </div>
                    <Badge variant={diagnostics?.services?.[service.key] ? "default" : "secondary"}>
                      {diagnostics?.services?.[service.key] ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* SMS Command Help */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">📱 SMS Testing Commands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <div><strong>test</strong> - Run all system tests</div>
          <div><strong>test sms</strong> - Test SMS service</div>
          <div><strong>test ai</strong> - Test AI service</div>
          <div><strong>logs</strong> - View recent logs</div>
          <div><strong>logs error</strong> - View error logs only</div>
          <div><strong>diagnostics</strong> - Full system diagnostics</div>
        </CardContent>
      </Card>
    </div>
  );
}

