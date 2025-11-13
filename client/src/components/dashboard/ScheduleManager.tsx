import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScheduledJob {
  id: string;
  name: string;
  description: string;
  templateId: string;
  templateName?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRun?: string;
  lastRun?: string;
  lastStatus?: 'success' | 'error' | 'running';
  lastError?: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CronPreset {
  name: string;
  expression: string;
  description: string;
}

const cronPresets: CronPreset[] = [
  { name: "Every minute", expression: "* * * * *", description: "Runs every minute" },
  { name: "Every hour", expression: "0 * * * *", description: "Runs at the top of every hour" },
  { name: "Daily at midnight", expression: "0 0 * * *", description: "Runs once a day at 12:00 AM" },
  { name: "Daily at 6 AM", expression: "0 6 * * *", description: "Runs once a day at 6:00 AM" },
  { name: "Daily at noon", expression: "0 12 * * *", description: "Runs once a day at 12:00 PM" },
  { name: "Weekly on Monday", expression: "0 0 * * 1", description: "Runs every Monday at midnight" },
  { name: "Monthly on 1st", expression: "0 0 1 * *", description: "Runs on the 1st of every month" },
  { name: "Every 15 minutes", expression: "*/15 * * * *", description: "Runs every 15 minutes" },
  { name: "Every 30 minutes", expression: "*/30 * * * *", description: "Runs every 30 minutes" },
  { name: "Twice daily", expression: "0 0,12 * * *", description: "Runs at midnight and noon" },
];

export default function ScheduleManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ScheduledJob | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  // Get scheduled jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery<ScheduledJob[]>({
    queryKey: ["/api/schedule/jobs"],
    refetchInterval: 30000,
  });

  // Get available templates
  const { data: templates } = useQuery({
    queryKey: ["/api/content/templates"],
  });

  // Job mutations
  const createJobMutation = useMutation({
    mutationFn: (job: Partial<ScheduledJob>) => 
      apiRequest("POST", "/api/schedule/jobs", job),
    onSuccess: () => {
      toast({ title: "Success", description: "Scheduled job created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
      setIsDialogOpen(false);
      setEditingJob(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, ...job }: Partial<ScheduledJob> & { id: string }) => 
      apiRequest("PUT", `/api/schedule/jobs/${id}`, job),
    onSuccess: () => {
      toast({ title: "Success", description: "Scheduled job updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
      setIsDialogOpen(false);
      setEditingJob(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/schedule/jobs/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Scheduled job deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const runJobMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/schedule/jobs/${id}/run`),
    onSuccess: () => {
      toast({ title: "Success", description: "Job triggered successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleJobSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const jobData: Partial<ScheduledJob> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      templateId: formData.get('templateId') as string,
      cronExpression: formData.get('cronExpression') as string,
      timezone: formData.get('timezone') as string || 'UTC',
      isActive: formData.get('isActive') === 'on',
    };

    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, ...jobData });
    } else {
      createJobMutation.mutate(jobData);
    }
  };

  const handlePresetChange = (presetExpression: string) => {
    setSelectedPreset(presetExpression);
    // Update the cron expression input
    const cronInput = document.getElementById('cronExpression') as HTMLInputElement;
    if (cronInput) {
      cronInput.value = presetExpression;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-accent text-accent-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      case 'running':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-times-circle';
      case 'running':
        return 'fas fa-spinner fa-spin';
      default:
        return 'fas fa-clock';
    }
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Overdue';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return `in ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (jobsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-calendar-alt text-primary"></i>
              Schedule Manager
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-job">
                  <i className="fas fa-plus mr-2"></i>
                  Schedule Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingJob ? 'Edit' : 'Create'} Scheduled Job
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJobSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Job Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Daily content Generation"
                        defaultValue={editingJob?.name}
                        required
                        data-testid="input-job-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateId">Content Template</Label>
                      <Select name="templateId" defaultValue={editingJob?.templateId}>
                        <SelectTrigger data-testid="select-template">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates?.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe what this scheduled job does"
                      defaultValue={editingJob?.description}
                      rows={3}
                      data-testid="textarea-job-description"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="preset">Schedule Preset</Label>
                      <Select value={selectedPreset} onValueChange={handlePresetChange}>
                        <SelectTrigger data-testid="select-preset">
                          <SelectValue placeholder="Choose a preset or enter custom" />
                        </SelectTrigger>
                        <SelectContent>
                          {cronPresets.map((preset) => (
                            <SelectItem key={preset.expression} value={preset.expression}>
                              <div>
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-muted-foreground">{preset.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cronExpression">Cron Expression</Label>
                      <Input
                        id="cronExpression"
                        name="cronExpression"
                        placeholder="0 0 * * * (daily at midnight)"
                        defaultValue={editingJob?.cronExpression}
                        required
                        data-testid="input-cron-expression"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: minute hour day month weekday (e.g., "0 6 * * *" for daily at 6 AM)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select name="timezone" defaultValue={editingJob?.timezone || 'UTC'}>
                        <SelectTrigger data-testid="select-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      name="isActive"
                      defaultChecked={editingJob?.isActive ?? true}
                      data-testid="switch-job-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createJobMutation.isPending || updateJobMutation.isPending}
                      data-testid="button-save-job"
                    >
                      {createJobMutation.isPending || updateJobMutation.isPending ? 'Saving...' : 'Save Job'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Jobs Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-jobs">
                {jobs?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent" data-testid="text-active-jobs">
                {jobs?.filter(job => job.isActive).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-successful-runs">
                {jobs?.reduce((sum, job) => sum + job.successCount, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Successful Runs</div>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className="text-2xl font-bold text-destructive" data-testid="text-failed-runs">
                {jobs?.reduce((sum, job) => sum + job.errorCount, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Failed Runs</div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="grid gap-4">
            {jobs?.map((job) => (
              <Card key={job.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{job.name}</h4>
                        <Badge variant={job.isActive ? "default" : "secondary"}>
                          {job.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className={getStatusColor(job.lastStatus)}>
                          <i className={`${getStatusIcon(job.lastStatus)} mr-1`}></i>
                          {job.lastStatus || 'Never run'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{job.description}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Template: {job.templateName || job.templateId}</div>
                        <div>Schedule: <code>{job.cronExpression}</code> ({job.timezone})</div>
                        <div>Next run: {formatNextRun(job.nextRun)}</div>
                        {job.lastRun && (
                          <div>Last run: {new Date(job.lastRun).toLocaleString()}</div>
                        )}
                        {job.lastError && (
                          <div className="text-destructive">Error: {job.lastError}</div>
                        )}
                        <div>
                          Runs: {job.totalRuns} total, {job.successCount} successful, {job.errorCount} failed
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runJobMutation.mutate(job.id)}
                        disabled={runJobMutation.isPending}
                        data-testid={`button-run-${job.id}`}
                      >
                        <i className="fas fa-play text-xs"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingJob(job);
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-edit-${job.id}`}
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteJobMutation.mutate(job.id)}
                        disabled={deleteJobMutation.isPending}
                        data-testid={`button-delete-${job.id}`}
                      >
                        <i className="fas fa-trash text-destructive text-xs"></i>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!jobs || jobs.length === 0) && (
              <div className="text-center py-12">
                <i className="fas fa-calendar-alt text-muted-foreground text-4xl mb-4"></i>
                <p className="text-muted-foreground">No scheduled jobs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create scheduled jobs to automate your content generation
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}