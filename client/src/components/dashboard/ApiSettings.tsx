import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Eye, EyeOff, Plus, Trash2, Key, Calendar, Activity } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
}

interface CreateApiKeyResponse {
  message: string;
  apiKey: {
    id: string;
    name: string;
    permissions: string[];
    key: string;
  };
}

const AVAILABLE_PERMISSIONS = [
  { id: 'read:content', label: 'Read Content', description: 'Access generated content data' },
  { id: 'read:bulk', label: 'Bulk Export', description: 'Export content data in bulk' },
  { id: 'read:analytics', label: 'Analytics', description: 'View integration analytics' },
];

export default function ApiSettings() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read:content']);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  // Fetch API keys
  const { data: apiKeys = [], isLoading, refetch } = useQuery<ApiKey[]>({
    queryKey: ['/api/api-keys'],
  });

  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (data: CreateApiKeyRequest) => {
      const response = await apiRequest('POST', '/api/api-keys', data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.apiKey.key);
      setShowGeneratedKey(true);
      setShowNewKeyDialog(false);
      setNewKeyName("");
      setSelectedPermissions(['read:content']);
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error generating API key:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest('DELETE', `/api/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked.",
      });
    },
    onError: (error: any) => {
      console.error('Error revoking API key:', error);
      toast({
        title: "Revocation Failed",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your API key.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPermissions.length === 0) {
      toast({
        title: "Permissions Required",
        description: "Please select at least one permission.",
        variant: "destructive",
      });
      return;
    }

    generateKeyMutation.mutate({
      name: newKeyName.trim(),
      permissions: selectedPermissions,
    });
  };

  const handleRevokeKey = (keyId: string) => {
    revokeKeyMutation.mutate(keyId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  return (
    <div className="space-y-6" data-testid="api-settings-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            API Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage API keys for accessing Amoeba services programmatically
          </p>
        </div>

        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-key">
              <Plus className="h-4 w-4 mr-2" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-generate-key">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access Amoeba services. Choose the appropriate permissions for your use case.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  data-testid="input-key-name"
                  placeholder="e.g., Mobile App Key, Website Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the permissions this API key should have
                </p>
                <div className="space-y-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={permission.id}
                        data-testid={`checkbox-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowNewKeyDialog(false)}
                data-testid="button-cancel-generate"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateKey}
                disabled={generateKeyMutation.isPending}
                data-testid="button-confirm-generate"
              >
                {generateKeyMutation.isPending ? "Generating..." : "Generate Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generated Key Display Dialog */}
      <Dialog open={showGeneratedKey} onOpenChange={setShowGeneratedKey}>
        <DialogContent data-testid="dialog-generated-key">
          <DialogHeader>
            <DialogTitle>API Key Generated Successfully</DialogTitle>
            <DialogDescription>
              Your new API key has been generated. Copy it now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all" data-testid="text-generated-key">
                  {generatedKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatedKey && copyToClipboard(generatedKey)}
                  data-testid="button-copy-generated-key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Usage:</strong> Include this key in the Authorization header:</p>
              <code className="block bg-muted p-2 rounded text-xs">
                Authorization: Bearer {generatedKey}
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowGeneratedKey(false)} data-testid="button-close-generated-key">
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No API keys found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first API key to start accessing Amoeba services
              </p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey: ApiKey) => (
            <Card key={apiKey.id} data-testid={`card-api-key-${apiKey.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-key-name-${apiKey.id}`}>
                      {apiKey.name}
                    </CardTitle>
                    <CardDescription>
                      Created {formatDate(apiKey.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={apiKey.isActive ? "default" : "secondary"}
                      data-testid={`badge-status-${apiKey.id}`}
                    >
                      {apiKey.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          data-testid={`button-revoke-${apiKey.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke "{apiKey.name}"? This action cannot be undone and will immediately disable access for this key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevokeKey(apiKey.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Revoke Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Permissions */}
                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(apiKey.permissions as string[]).map((permission) => (
                        <Badge key={permission} variant="outline" data-testid={`badge-permission-${permission}`}>
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Used:</span>
                      <span data-testid={`text-last-used-${apiKey.id}`}>
                        {formatRelativeTime(apiKey.lastUsed)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expires:</span>
                      <span data-testid={`text-expires-${apiKey.id}`}>
                        {apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            How to use your API keys to access Amoeba services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header of your requests:
            </p>
            <code className="block bg-muted p-3 rounded text-xs">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Available Endpoints</h4>
            <div className="space-y-3 text-sm">
              <div>
                <code className="text-primary">GET /api/content</code>
                <p className="text-muted-foreground mt-1">List all generated content</p>
              </div>
              <div>
                <code className="text-primary">GET /api/content/{"{id}"}</code>
                <p className="text-muted-foreground mt-1">Get specific generated content by ID</p>
              </div>
              <div>
                <code className="text-primary">POST /api/content/generate</code>
                <p className="text-muted-foreground mt-1">Generate new content from template</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}