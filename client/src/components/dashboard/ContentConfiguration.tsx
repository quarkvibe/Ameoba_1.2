import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ContentTemplate, DataSource } from "@shared/schema";

export default function ContentConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDataSourceDialogOpen, setIsDataSourceDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(null);

  // Get content templates
  const { data: templates, isLoading: templatesLoading } = useQuery<ContentTemplate[]>({
    queryKey: ["/api/templates"],
    refetchInterval: 30000,
  });

  // Get data sources
  const { data: dataSources, isLoading: dataSourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/datasources"],
    refetchInterval: 30000,
  });

  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: (template: Partial<ContentTemplate>) => 
      apiRequest("POST", "/api/templates", template),
    onSuccess: () => {
      toast({ title: "Success", description: "Content template created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...template }: Partial<ContentTemplate> & { id: string }) => 
      apiRequest("PUT", `/api/templates/${id}`, template),
    onSuccess: () => {
      toast({ title: "Success", description: "Content template updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Content template deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Data source mutations
  const createDataSourceMutation = useMutation({
    mutationFn: (dataSource: Partial<DataSource>) => 
      apiRequest("POST", "/api/datasources", dataSource),
    onSuccess: () => {
      toast({ title: "Success", description: "Data source created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/datasources"] });
      setIsDataSourceDialogOpen(false);
      setEditingDataSource(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleTemplateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const templateData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string || 'general',
      aiPrompt: formData.get('aiPrompt') as string,
      outputFormat: formData.get('outputFormat') as string || 'text',
      isActive: formData.get('isActive') === 'on',
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, ...templateData });
    } else {
      createTemplateMutation.mutate(templateData);
    }
  };

  const handleDataSourceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const dataSourceData = {
      name: formData.get('name') as string,
      type: formData.get('type') as DataSource['type'],
      endpoint: formData.get('endpoint') as string,
      parsingRules: formData.get('parsingRules') as string,
      isActive: formData.get('isActive') === 'on',
    };

    createDataSourceMutation.mutate(dataSourceData);
  };

  const triggerGeneration = (templateId: string) => {
    apiRequest("POST", "/api/content/generate", { templateId })
      .then(() => {
        toast({ title: "Success", description: "Content generation triggered successfully." });
      })
      .catch((error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      });
  };

  if (templatesLoading || dataSourcesLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-cogs text-primary"></i>
            Content Generation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates">Content Templates</TabsTrigger>
              <TabsTrigger value="datasources">Data Sources</TabsTrigger>
              <TabsTrigger value="parsing">Parsing Rules</TabsTrigger>
              <TabsTrigger value="dissemination">Output & Distribution</TabsTrigger>
            </TabsList>

            {/* Content Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Content Templates</h3>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-template">
                      <i className="fas fa-plus mr-2"></i>
                      Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Edit' : 'Create'} Content Template
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTemplateSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Template Name</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="e.g., Daily content"
                            defaultValue={editingTemplate?.name}
                            required
                            data-testid="input-template-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="outputFormat">Output Format</Label>
                          <Select name="outputFormat" defaultValue={editingTemplate?.outputFormat || 'json'}>
                            <SelectTrigger data-testid="select-output-format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="text">Plain Text</SelectItem>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="markdown">Markdown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Describe what this template generates"
                          defaultValue={editingTemplate?.description}
                          data-testid="input-template-description"
                        />
                      </div>

                      <div>
                        <Label htmlFor="aiPrompt">AI Generation Prompt</Label>
                        <Textarea
                          id="aiPrompt"
                          name="aiPrompt"
                          placeholder="Enter the AI prompt for content generation. Use {{data}} for dynamic data insertion."
                          rows={6}
                          defaultValue={editingTemplate?.aiPrompt}
                          required
                          data-testid="textarea-ai-prompt"
                        />
                      </div>

                      <div>
                        <Label htmlFor="schedule">Cron Schedule</Label>
                        <Input
                          id="schedule"
                          name="schedule"
                          placeholder="0 0 * * * (daily at midnight)"
                          defaultValue={editingTemplate?.schedule}
                          data-testid="input-schedule"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          name="isActive"
                          defaultChecked={editingTemplate?.isActive ?? true}
                          data-testid="switch-template-active"
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                          data-testid="button-save-template"
                        >
                          {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {templates?.map((template) => (
                  <Card key={template.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{template.name}</h4>
                            <Badge variant={template.isActive ? "default" : "secondary"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{template.outputFormat}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                          <div className="text-xs text-muted-foreground">
                            Schedule: <code>{template.schedule}</code>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Channels: {template.disseminationChannels.join(', ')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerGeneration(template.id)}
                            data-testid={`button-generate-${template.id}`}
                          >
                            <i className="fas fa-play mr-1"></i>
                            Generate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsTemplateDialogOpen(true);
                            }}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                            data-testid={`button-delete-${template.id}`}
                          >
                            <i className="fas fa-trash text-destructive"></i>
                          </Button>
                        </div>
                      </div>
                      
                      {/* AI Prompt Preview */}
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-medium text-muted-foreground">AI Prompt:</Label>
                        <p className="text-sm font-mono mt-1 line-clamp-3">{template.aiPrompt}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!templates || templates.length === 0) && (
                  <div className="text-center py-12">
                    <i className="fas fa-file-alt text-muted-foreground text-3xl mb-4"></i>
                    <p className="text-muted-foreground">No content templates found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create your first template to start generating AI content
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Data Sources Tab */}
            <TabsContent value="datasources" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Data Sources</h3>
                <Dialog open={isDataSourceDialogOpen} onOpenChange={setIsDataSourceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-datasource">
                      <i className="fas fa-plus mr-2"></i>
                      Add Data Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Data Source</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDataSourceSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="ds-name">Data Source Name</Label>
                        <Input
                          id="ds-name"
                          name="name"
                          placeholder="e.g., Swiss Ephemeris API"
                          required
                          data-testid="input-datasource-name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="ds-type">Type</Label>
                        <Select name="type" defaultValue="api">
                          <SelectTrigger data-testid="select-datasource-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api">External API</SelectItem>
                            <SelectItem value="database">Database Query</SelectItem>
                            <SelectItem value="file">File Source</SelectItem>
                            <SelectItem value="astronomy">Astronomy Engine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="ds-endpoint">Endpoint/Source</Label>
                        <Input
                          id="ds-endpoint"
                          name="endpoint"
                          placeholder="https://api.example.com/data"
                          data-testid="input-datasource-endpoint"
                        />
                      </div>

                      <div>
                        <Label htmlFor="ds-parsing">Parsing Rules (JSON Path or Script)</Label>
                        <Textarea
                          id="ds-parsing"
                          name="parsingRules"
                          placeholder="$.data.planets or custom parsing script"
                          rows={3}
                          data-testid="textarea-parsing-rules"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ds-active"
                          name="isActive"
                          defaultChecked={true}
                          data-testid="switch-datasource-active"
                        />
                        <Label htmlFor="ds-active">Active</Label>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDataSourceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createDataSourceMutation.isPending}
                          data-testid="button-save-datasource"
                        >
                          {createDataSourceMutation.isPending ? 'Saving...' : 'Save Data Source'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {dataSources?.map((source) => (
                  <Card key={source.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{source.name}</h4>
                            <Badge variant={source.isActive ? "default" : "secondary"}>
                              {source.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{source.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{source.endpoint}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-edit"></i>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!dataSources || dataSources.length === 0) && (
                  <div className="text-center py-12">
                    <i className="fas fa-database text-muted-foreground text-3xl mb-4"></i>
                    <p className="text-muted-foreground">No data sources configured</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add data sources to feed your AI content generation
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Parsing Rules Tab */}
            <TabsContent value="parsing" className="space-y-4">
              <h3 className="text-lg font-semibold">Parsing Rules Configuration</h3>
              <div className="text-center py-12">
                <i className="fas fa-code text-muted-foreground text-3xl mb-4"></i>
                <p className="text-muted-foreground">Advanced parsing configuration</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure how external data is processed and formatted for AI prompts
                </p>
              </div>
            </TabsContent>

            {/* Output & Distribution Tab */}
            <TabsContent value="dissemination" className="space-y-4">
              <h3 className="text-lg font-semibold">Output & Distribution Configuration</h3>
              <div className="text-center py-12">
                <i className="fas fa-share-alt text-muted-foreground text-3xl mb-4"></i>
                <p className="text-muted-foreground">Distribution channel configuration</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure how generated content is formatted and distributed
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}