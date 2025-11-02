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
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff, Check, X, TestTube } from "lucide-react";

/**
 * Credentials Manager
 * Unified interface for managing ALL credentials (AI, Email, Phone)
 * 
 * This is THE interface users use - no .env editing needed!
 */

export default function CredentialsManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai");
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Credentials Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage your API keys and service credentials. All values are encrypted at rest.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai">🤖 AI Providers</TabsTrigger>
          <TabsTrigger value="email">📧 Email Services</TabsTrigger>
          <TabsTrigger value="phone">📱 Phone Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="mt-6">
          <AICredentialsTab />
        </TabsContent>
        
        <TabsContent value="email" className="mt-6">
          <EmailCredentialsTab />
        </TabsContent>
        
        <TabsContent value="phone" className="mt-6">
          <PhoneCredentialsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// AI CREDENTIALS TAB
// ============================================================================

function AICredentialsTab() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  
  // Fetch AI credentials
  const { data: credentials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/credentials/ai'],
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/credentials/ai', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/ai'] });
      setShowDialog(false);
      toast({ title: "Success", description: "AI credential added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/credentials/ai/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/ai'] });
      toast({ title: "Success", description: "AI credential deleted" });
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      provider: formData.get('provider'),
      name: formData.get('name'),
      apiKey: formData.get('apiKey'),
      isDefault: formData.get('isDefault') === 'on',
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Provider Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Add your OpenAI, Anthropic, or other AI provider keys
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add AI Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add AI Provider Credential</DialogTitle>
              <DialogDescription>
                Your API key will be encrypted and stored securely
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select name="provider" defaultValue="openai">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="cohere">Cohere</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  name="name"
                  placeholder="e.g., My OpenAI Key"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  name="apiKey"
                  type="password"
                  placeholder="sk-proj-..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your API key from the provider's dashboard
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="isDefault" name="isDefault" />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default credential
                </label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Credential"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Credentials List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No AI credentials configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first AI provider key to start generating content
              </p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((cred: any) => (
            <Card key={cred.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {cred.name}
                      {cred.isDefault && <Badge>Default</Badge>}
                    </CardTitle>
                    <CardDescription>
                      {cred.provider} • Added {new Date(cred.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cred.isActive ? "default" : "secondary"}>
                      {cred.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Credential</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This will affect any templates using this credential.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(cred.id)}
                            className="bg-destructive"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">
                        {showKey[cred.id] ? cred.maskedKey : '••••••••••••••••'}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowKey({ ...showKey, [cred.id]: !showKey[cred.id] })}
                      >
                        {showKey[cred.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {cred.lastUsed && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span>{new Date(cred.lastUsed).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Quick Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Where to Get API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>OpenAI:</strong>{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary hover:underline">
              platform.openai.com/api-keys
            </a>
          </div>
          <div>
            <strong>Anthropic:</strong>{' '}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener" className="text-primary hover:underline">
              console.anthropic.com
            </a>
          </div>
          <div>
            <strong>Ollama:</strong>{' '}
            <span className="text-muted-foreground">Local models (no API key needed!)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// EMAIL CREDENTIALS TAB
// ============================================================================

function EmailCredentialsTab() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  
  const { data: credentials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/credentials/email'],
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/credentials/email', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/email'] });
      setShowDialog(false);
      toast({ title: "Success", description: "Email credential added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/credentials/email/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/email'] });
      toast({ title: "Success", description: "Email credential deleted" });
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      provider: formData.get('provider'),
      name: formData.get('name'),
      apiKey: formData.get('apiKey'),
      fromEmail: formData.get('fromEmail'),
      fromName: formData.get('fromName'),
      isDefault: formData.get('isDefault') === 'on',
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Service Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Add SendGrid, AWS SES, or SMTP credentials for email delivery
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Email Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email Service</DialogTitle>
              <DialogDescription>Configure your email delivery provider</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select name="provider" defaultValue="sendgrid">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="aws_ses">AWS SES</SelectItem>
                    <SelectItem value="smtp">SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Name</Label>
                <Input name="name" placeholder="e.g., My SendGrid Account" required />
              </div>
              
              <div>
                <Label>API Key</Label>
                <Input name="apiKey" type="password" placeholder="SG.xxx or AWS key" required />
              </div>
              
              <div>
                <Label>From Email</Label>
                <Input name="fromEmail" type="email" placeholder="noreply@yourdomain.com" required />
              </div>
              
              <div>
                <Label>From Name (Optional)</Label>
                <Input name="fromName" placeholder="Your Company Name" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="isDefaultEmail" name="isDefault" />
                <label htmlFor="isDefaultEmail" className="text-sm">
                  Set as default
                </label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit">Add Credential</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* List */}
      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No email credentials configured</p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((cred: any) => (
            <Card key={cred.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{cred.name}</CardTitle>
                    <CardDescription>{cred.provider} • {cred.fromEmail}</CardDescription>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(cred.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PHONE CREDENTIALS TAB
// ============================================================================

function PhoneCredentialsTab() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  
  const { data: credentials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/credentials/phone'],
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/credentials/phone', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/phone'] });
      setShowDialog(false);
      toast({ title: "Success", description: "Phone credential added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/credentials/phone/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credentials/phone'] });
      toast({ title: "Success", description: "Phone credential deleted" });
    },
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      provider: formData.get('provider'),
      name: formData.get('name'),
      accountSid: formData.get('accountSid'),
      apiKey: formData.get('authToken'),
      phoneNumber: formData.get('phoneNumber'),
      isDefault: formData.get('isDefault') === 'on',
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Phone Service Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Add Twilio for SMS & Voice delivery
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Phone Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Phone Service</DialogTitle>
              <DialogDescription>Configure Twilio for SMS & Voice</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Select name="provider" defaultValue="twilio">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="aws_sns">AWS SNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Name</Label>
                <Input name="name" placeholder="e.g., My Twilio Account" required />
              </div>
              
              <div>
                <Label>Account SID</Label>
                <Input name="accountSid" placeholder="AC..." required />
              </div>
              
              <div>
                <Label>Auth Token</Label>
                <Input name="authToken" type="password" placeholder="Your Twilio Auth Token" required />
              </div>
              
              <div>
                <Label>Phone Number (E.164 format)</Label>
                <Input name="phoneNumber" placeholder="+14155551234" required />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Twilio phone number for sending SMS/making calls
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="isDefaultPhone" name="isDefault" />
                <label htmlFor="isDefaultPhone" className="text-sm">
                  Set as default
                </label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit">Add Credential</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Credentials List */}
      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No phone credentials configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add Twilio to enable SMS & Voice delivery
              </p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((cred: any) => (
            <Card key={cred.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{cred.name}</CardTitle>
                    <CardDescription>
                      {cred.provider} • {cred.phoneNumber}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(cred.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
      
      {/* Help */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">📘 Twilio Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Sign up at <a href="https://www.twilio.com/try-twilio" target="_blank" className="text-primary underline">twilio.com/try-twilio</a> (free $15 credit)</p>
          <p>2. Get your Account SID and Auth Token from the dashboard</p>
          <p>3. Get a phone number (free trial or $1/month)</p>
          <p>4. Add credentials above</p>
        </CardContent>
      </Card>
    </div>
  );
}

