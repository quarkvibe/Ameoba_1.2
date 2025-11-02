import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Smartphone, Send, Shield, Terminal as TerminalIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

/**
 * SMS Commands
 * Configure and test SMS-based platform control
 * 
 * Users can:
 * - Authorize phone numbers for SMS commands
 * - Test SMS commands
 * - View command history
 * - See available commands
 */

export default function SMSCommands() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testCommand, setTestCommand] = useState('status');
  const [testResult, setTestResult] = useState<any>(null);
  
  // Fetch SMS command settings
  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ['/api/sms-commands/settings'],
  });
  
  // Authorize phone mutation
  const authorizeMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest('POST', '/api/sms-commands/authorize', { phoneNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-commands/settings'] });
      setShowAddDialog(false);
      toast({ title: "Authorized", description: "Phone number can now send commands" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  // Unauthorize phone mutation
  const unauthorizeMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      await apiRequest('DELETE', `/api/sms-commands/authorize/${encodeURIComponent(phoneNumber)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sms-commands/settings'] });
      toast({ title: "Removed", description: "Phone number unauthorized" });
    },
  });
  
  // Test command mutation
  const testMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest('POST', '/api/sms-commands/test', { command });
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast({ title: "Test Complete", description: "Command executed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Test Failed", description: error.message, variant: "destructive" });
    },
  });
  
  const handleAddPhone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('phoneNumber') as string;
    authorizeMutation.mutate(phoneNumber);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            SMS Command Interface
          </h2>
          <p className="text-muted-foreground mt-1">
            Control Amoeba from your phone via text message
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Test Command
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test SMS Command</DialogTitle>
                <DialogDescription>
                  Try a command to see what response you'd get
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Command</Label>
                  <Input
                    value={testCommand}
                    onChange={(e) => setTestCommand(e.target.value)}
                    placeholder="status, generate, queue, etc."
                  />
                </div>
                
                <Button
                  onClick={() => testMutation.mutate(testCommand)}
                  disabled={testMutation.isPending}
                  className="w-full"
                >
                  {testMutation.isPending ? 'Executing...' : 'Execute Command'}
                </Button>
                
                {testResult && (
                  <div className="space-y-2">
                    <Label>Response (what you'd receive via SMS):</Label>
                    <Textarea
                      value={testResult.response}
                      readOnly
                      className="h-[200px] font-mono text-sm"
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Authorize Phone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Authorize Phone Number</DialogTitle>
                <DialogDescription>
                  Add a phone number that can send commands to Amoeba
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleAddPhone} className="space-y-4">
                <div>
                  <Label>Phone Number (E.164 format)</Label>
                  <Input
                    name="phoneNumber"
                    placeholder="+14155551234"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use format: +1 (country code) followed by number
                  </p>
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Only authorize your own phone numbers. Commands will execute with full access to your account.
                  </AlertDescription>
                </Alert>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={authorizeMutation.isPending}>
                    {authorizeMutation.isPending ? 'Authorizing...' : 'Authorize'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Webhook URL */}
      {settings?.webhookUrl && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">📘 Twilio Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Configure Twilio Webhook:</strong>
              <p className="mt-1">In your Twilio console, set the SMS webhook URL to:</p>
              <code className="block bg-background px-3 py-2 rounded mt-2 text-xs">
                {settings.webhookUrl}
              </code>
            </div>
            <div>
              <strong>2. Authorize Your Phone:</strong>
              <p className="mt-1">Click "Authorize Phone" above and add your mobile number</p>
            </div>
            <div>
              <strong>3. Text Your Twilio Number:</strong>
              <p className="mt-1">Send "status" or "help" to test!</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Authorized Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>Authorized Phone Numbers</CardTitle>
          <CardDescription>
            These numbers can send commands to Amoeba
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : settings?.authorizedNumbers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No authorized phone numbers yet</p>
              <p className="text-sm mt-1">Add your phone to enable SMS commands</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settings?.authorizedNumbers?.map((phone: string) => (
                <div key={phone} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-mono text-sm">{phone}</div>
                      <div className="text-xs text-muted-foreground">Authorized</div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Authorization</AlertDialogTitle>
                        <AlertDialogDescription>
                          This phone number will no longer be able to send commands to Amoeba.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => unauthorizeMutation.mutate(phone)}
                          className="bg-destructive"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Available Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Available Commands</CardTitle>
          <CardDescription>
            Commands you can send via SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* CLI Commands */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TerminalIcon className="h-4 w-4" />
                CLI Commands
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <CommandExample cmd="status" desc="System health" />
                <CommandExample cmd="templates" desc="List templates" />
                <CommandExample cmd="jobs" desc="Scheduled jobs" />
                <CommandExample cmd="queue" desc="Review queue" />
                <CommandExample cmd="generate <name>" desc="Generate content" />
                <CommandExample cmd="logs" desc="Recent logs" />
                <CommandExample cmd="memory" desc="Memory usage" />
                <CommandExample cmd="help" desc="Command list" />
              </div>
            </div>
            
            {/* Shortcuts */}
            <div>
              <h4 className="font-semibold mb-2">⚡ Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <CommandExample cmd="approve all" desc="Approve pending reviews" />
                <CommandExample cmd="pause all" desc="Pause all jobs" />
                <CommandExample cmd="resume all" desc="Resume all jobs" />
              </div>
            </div>
            
            {/* Natural Language */}
            <div>
              <h4 className="font-semibold mb-2">💬 Natural Language</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• "What's the system health?"</p>
                <p>• "How many items are in the review queue?"</p>
                <p>• "Generate content for daily newsletter"</p>
                <p>• "Show me the last 5 generated items"</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security:</strong> Only authorized phone numbers can send commands. All commands execute with your full account permissions. Keep your authorized numbers private.
        </AlertDescription>
      </Alert>
      
      {/* Example Conversation */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-sm">Example SMS Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm font-mono">
          <div className="flex gap-2">
            <Badge variant="outline">You</Badge>
            <span>status</span>
          </div>
          <div className="flex gap-2">
            <Badge>Amoeba</Badge>
            <span>✅ All systems healthy. 3 jobs running, 15 items generated today.</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">You</Badge>
            <span>generate daily-news</span>
          </div>
          <div className="flex gap-2">
            <Badge>Amoeba</Badge>
            <span>🤖 Generating... Done! Quality: 87/100. Delivered via email.</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">You</Badge>
            <span>What's in the review queue?</span>
          </div>
          <div className="flex gap-2">
            <Badge>Amoeba</Badge>
            <span>📋 2 items pending. Reply "approve all" to approve.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Command example display component
 */
function CommandExample({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="p-2 border rounded">
      <code className="text-xs font-mono">{cmd}</code>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}

