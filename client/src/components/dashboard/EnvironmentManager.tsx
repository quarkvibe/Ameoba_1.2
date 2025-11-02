import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff, RefreshCw, Save, AlertTriangle, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Environment Manager
 * Direct .env file management from the UI
 * 
 * Users can:
 * - View all environment variables
 * - Add/edit/delete variables
 * - See which require restart
 * - Edit .env file directly (advanced mode)
 * - Generate encryption keys
 * - Validate configuration
 */

export default function EnvironmentManager() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'cards' | 'file'>('cards');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  
  // Fetch environment variables
  const { data: envData, isLoading } = useQuery<any>({
    queryKey: ['/api/environment/variables'],
  });
  
  // Fetch .env file content
  const { data: envFileData } = useQuery<any>({
    queryKey: ['/api/environment/file'],
    enabled: viewMode === 'file',
  });
  
  // Fetch validation status
  const { data: validation } = useQuery<any>({
    queryKey: ['/api/environment/validate'],
  });
  
  // Update variable mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiRequest('PUT', `/api/environment/variables/${key}`, { value });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/environment/variables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/environment/validate'] });
      setEditingKey(null);
      toast({
        title: "Updated",
        description: data.requiresRestart 
          ? "Variable updated. Restart server for changes to take effect."
          : "Variable updated successfully",
        variant: data.requiresRestart ? "default" : "default",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  // Delete variable mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await apiRequest('DELETE', `/api/environment/variables/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/environment/variables'] });
      toast({ title: "Success", description: "Variable deleted" });
    },
  });
  
  // Update entire file mutation
  const updateFileMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('PUT', '/api/environment/file', { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/environment/variables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/environment/file'] });
      toast({
        title: "File Updated",
        description: "Restart server for all changes to take effect",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const handleGenerateKey = async (type: 'encryption' | 'session') => {
    const response = await apiRequest('POST', '/api/environment/generate-key', { type });
    const data = await response.json();
    
    // Auto-fill the key in the form
    updateMutation.mutate({
      key: type === 'encryption' ? 'ENCRYPTION_KEY' : 'SESSION_SECRET',
      value: data.key,
    });
  };
  
  // Group variables by category
  const groupedVars = (envData?.variables || []).reduce((acc: any, v: any) => {
    const category = v.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {} as Record<string, any>);
  
  const categoryOrder = ['core', 'ai', 'email', 'phone', 'deployment', 'other'];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Environment Configuration</h2>
          <p className="text-muted-foreground mt-1">
            Manage .env variables directly from the dashboard
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </Button>
          <Button
            variant={viewMode === 'file' ? 'default' : 'outline'}
            onClick={() => setViewMode('file')}
          >
            File Editor
          </Button>
        </div>
      </div>
      
      {/* Validation Status */}
      {validation && !validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Issues:</strong>
            <ul className="mt-2 space-y-1">
              {validation.errors?.map((error: string, i: number) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          {categoryOrder.map(category => {
            const vars = groupedVars[category];
            if (!vars || vars.length === 0) return null;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{category} Configuration</CardTitle>
                  <CardDescription>
                    {category === 'core' && 'Essential system variables'}
                    {category === 'ai' && 'AI provider API keys'}
                    {category === 'email' && 'Email service configuration'}
                    {category === 'phone' && 'SMS & Voice service configuration'}
                    {category === 'deployment' && 'Server deployment settings'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vars.map((v: any) => (
                    <div key={v.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-mono text-sm">{v.key}</Label>
                            {v.required && <Badge variant="destructive" className="h-5">Required</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{v.description}</p>
                        </div>
                        
                          {editingKey === v.key ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {v.masked && v.value && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowValues({ ...showValues, [v.key]: !showValues[v.key] })}
                              >
                                {showValues[v.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setEditingKey(v.key)}>
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingKey === v.key ? (
                        <div className="flex gap-2">
                          <Input
                            type={v.masked && !showValues[v.key] ? 'password' : 'text'}
                            defaultValue={v.value}
                            placeholder={v.example || `Enter ${v.key}`}
                            className="font-mono text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateMutation.mutate({ key: v.key, value: e.currentTarget.value });
                              }
                            }}
                            id={`input-${v.key}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`input-${v.key}`) as HTMLInputElement;
                              updateMutation.mutate({ key: v.key, value: input.value });
                            }}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          {(v.key === 'ENCRYPTION_KEY' || v.key === 'SESSION_SECRET') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateKey(v.key === 'ENCRYPTION_KEY' ? 'encryption' : 'session')}
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Generate
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                            {v.value ? (v.masked && !showValues[v.key] ? '••••••••••••' : v.value) : <span className="text-muted-foreground italic">Not set</span>}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* File Editor View */}
      {viewMode === 'file' && (
        <Card>
          <CardHeader>
            <CardTitle>.env File Editor</CardTitle>
            <CardDescription>
              Advanced: Edit the .env file directly. Sensitive values are masked for security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="font-mono text-sm h-[500px]"
              defaultValue={envFileData?.content || ''}
              id="env-file-content"
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  const textarea = document.getElementById('env-file-content') as HTMLTextAreaElement;
                  updateFileMutation.mutate(textarea.value);
                }}
                disabled={updateFileMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save File
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/environment/file'] });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload
              </Button>
            </div>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Server restart required after saving changes to core variables (DATABASE_URL, ENCRYPTION_KEY, PORT, etc.)
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

