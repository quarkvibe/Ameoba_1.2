import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Wand2, Shield, AlertTriangle, CheckCircle, Code, FileCode, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Code Modification Component
 * 
 * Allows users to modify Amoeba via natural language
 * AI generates code changes, user approves, system applies
 * 
 * SAFETY: AI cannot modify the code that allows modification
 * 
 * Protected files (AI CANNOT touch):
 * - aiCodeModificationService.ts (this system itself!)
 * - Security/auth files
 * - Encryption services
 * - Core database
 * - Package config
 * 
 * This prevents recursive self-modification & security bypasses
 */

export default function CodeModification() {
  const { toast } = useToast();
  const [intent, setIntent] = useState('');
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  
  // Generate changes mutation
  const generateMutation = useMutation({
    mutationFn: async (intent: string) => {
      const response = await apiRequest('POST', '/api/code-modification/generate', {
        intent,
        approvalRequired: true, // Always require approval in UI
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresApproval) {
        setPendingChanges(data);
        setShowApprovalDialog(true);
      } else {
        toast({
          title: "Changes Applied",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Approve changes mutation
  const approveMutation = useMutation({
    mutationFn: async (changes: any[]) => {
      const response = await apiRequest('POST', '/api/code-modification/apply', { changes });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Applied ${data.appliedCount} change(s). Server restart may be needed.`,
      });
      setPendingChanges(null);
      setShowApprovalDialog(false);
      setIntent('');
    },
  });
  
  const handleGenerate = () => {
    if (!intent.trim()) {
      toast({
        title: "Error",
        description: "Please describe what you want to modify",
        variant: "destructive",
      });
      return;
    }
    
    generateMutation.mutate(intent);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wand2 className="h-6 w-6" />
          AI Code Modification
        </h2>
        <p className="text-muted-foreground mt-1">
          Modify Amoeba's code using natural language (Phase 3: Self-Modifying AI)
        </p>
      </div>
      
      {/* Safety Notice */}
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Safety Boundary:</strong> AI can modify services, routes, and UI components, but <strong>CANNOT</strong> modify:
          <ul className="mt-2 ml-4 space-y-1 text-xs">
            <li>• This code modification system itself</li>
            <li>• Authentication & security systems</li>
            <li>• Encryption services</li>
            <li>• Core database code</li>
          </ul>
          <p className="mt-2 text-xs">This prevents recursive self-modification and security bypasses.</p>
        </AlertDescription>
      </Alert>
      
      {/* Request Card */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Modification</CardTitle>
          <CardDescription>
            Tell the AI what you want to add or change in natural language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Add Discord webhook support for content delivery"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !intent.trim()}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? 'Generating Changes...' : 'Generate Code Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIntent('')}
            >
              Clear
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Example requests:</strong></p>
            <p>• "Add Discord webhook support for content delivery"</p>
            <p>• "Create a service to generate Instagram captions"</p>
            <p>• "Add PDF export for generated content"</p>
            <p>• "Create a dashboard widget for cost tracking"</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Approval Dialog */}
      {pendingChanges && (
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Review AI-Generated Changes</DialogTitle>
              <DialogDescription>
                Review the changes before applying. You can approve or reject.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {pendingChanges.changes?.map((change: any, i: number) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          <code className="text-sm font-mono">{change.file}</code>
                        </div>
                        <Badge>
                          {change.action === 'create' && '➕ Create'}
                          {change.action === 'modify' && '✏️ Modify'}
                          {change.action === 'delete' && '🗑️ Delete'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{change.reason}</div>
                    </CardHeader>
                    <CardContent>
                      {change.diff && (
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                          {change.diff}
                        </pre>
                      )}
                      {change.newContent && !change.diff && (
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                          {change.newContent.substring(0, 500)}
                          {change.newContent.length > 500 && '\n... (truncated)'}
                        </pre>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalDialog(false);
                  setPendingChanges(null);
                }}
              >
                Reject Changes
              </Button>
              <Button
                onClick={() => approveMutation.mutate(pendingChanges.changes)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? 'Applying...' : 'Approve & Apply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Safety Boundaries Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Safety Boundaries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong className="text-green-600">✅ AI Can Modify:</strong>
            <ul className="mt-1 ml-4 space-y-1 text-xs text-muted-foreground">
              <li>• Services (add new features, integrations)</li>
              <li>• Routes (add new API endpoints)</li>
              <li>• UI Components (add new dashboard views)</li>
              <li>• Documentation (update guides)</li>
            </ul>
          </div>
          
          <div>
            <strong className="text-red-600">❌ AI Cannot Modify:</strong>
            <ul className="mt-1 ml-4 space-y-1 text-xs text-muted-foreground">
              <li>• This code modification system itself</li>
              <li>• Authentication & security</li>
              <li>• Encryption services</li>
              <li>• Core database code</li>
              <li>• Environment files</li>
            </ul>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <strong>Why?</strong>
            <p className="text-xs text-muted-foreground mt-1">
              This prevents the AI from modifying its own modification capabilities, which could lead to:
              - Security bypasses
              - Loss of user control
              - Recursive self-modification
              - System instability
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🔮 Feature Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span>Code Generation</span>
            <Badge variant="secondary">Phase 3 - In Development</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Safety Boundaries</span>
            <Badge>✅ Implemented</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Approval Workflow</span>
            <Badge>✅ Implemented</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Rollback System</span>
            <Badge>✅ Implemented</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            This feature will be fully enabled in a future update. The safety system is already in place!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

