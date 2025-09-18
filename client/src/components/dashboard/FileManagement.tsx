import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'directory' | 'file';
  lastModified: string;
  permissions: string;
  isHidden: boolean;
}

interface DirectoryListing {
  currentPath: string;
  files: FileInfo[];
  totalSize: number;
  fileCount: number;
  directoryCount: number;
}

export default function FileManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock file data (in production this would come from backend)
  const mockFiles: FileInfo[] = [
    {
      name: "server",
      path: "/server",
      size: 2048576,
      type: "directory",
      lastModified: new Date().toISOString(),
      permissions: "drwxr-xr-x",
      isHidden: false,
    },
    {
      name: "client",
      path: "/client",
      size: 1048576,
      type: "directory", 
      lastModified: new Date().toISOString(),
      permissions: "drwxr-xr-x",
      isHidden: false,
    },
    {
      name: "shared",
      path: "/shared",
      size: 512000,
      type: "directory",
      lastModified: new Date().toISOString(), 
      permissions: "drwxr-xr-x",
      isHidden: false,
    },
    {
      name: "package.json",
      path: "/package.json",
      size: 2048,
      type: "file",
      lastModified: new Date().toISOString(),
      permissions: "-rw-r--r--",
      isHidden: false,
    },
    {
      name: "replit.md",
      path: "/replit.md",
      size: 4096,
      type: "file",
      lastModified: new Date().toISOString(),
      permissions: "-rw-r--r--",
      isHidden: false,
    },
    {
      name: ".env",
      path: "/.env",
      size: 512,
      type: "file",
      lastModified: new Date().toISOString(),
      permissions: "-rw-------",
      isHidden: true,
    },
    {
      name: "logs",
      path: "/logs",
      size: 10240,
      type: "directory",
      lastModified: new Date().toISOString(),
      permissions: "drwxr-xr-x", 
      isHidden: false,
    }
  ];

  const { data: directoryData, isLoading } = useQuery<DirectoryListing>({
    queryKey: ["/api/files", currentPath],
    queryFn: async () => {
      // Mock API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredFiles = mockFiles;
      if (searchQuery) {
        filteredFiles = mockFiles.filter(file => 
          file.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return {
        currentPath,
        files: filteredFiles,
        totalSize: filteredFiles.reduce((acc, file) => acc + file.size, 0),
        fileCount: filteredFiles.filter(f => f.type === 'file').length,
        directoryCount: filteredFiles.filter(f => f.type === 'directory').length,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const deleteFilesMutation = useMutation({
    mutationFn: (files: string[]) => apiRequest("DELETE", "/api/files", { files }),
    onSuccess: () => {
      toast({
        title: "Files Deleted",
        description: `Successfully deleted ${selectedFiles.length} file(s).`,
      });
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createDirectoryMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/files/directory", { 
      path: currentPath,
      name 
    }),
    onSuccess: () => {
      toast({
        title: "Directory Created",
        description: "New directory created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.type === 'directory') {
      return 'fas fa-folder text-blue-500';
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return 'fab fa-js-square text-yellow-500';
      case 'json':
        return 'fas fa-code text-green-500';
      case 'md':
        return 'fab fa-markdown text-blue-600';
      case 'txt':
      case 'log':
        return 'fas fa-file-alt text-gray-500';
      case 'env':
        return 'fas fa-key text-red-500';
      default:
        return 'fas fa-file text-gray-400';
    }
  };

  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const handleCreateDirectory = () => {
    const name = prompt("Enter directory name:");
    if (name) {
      createDirectoryMutation.mutate(name);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const files = directoryData?.files || [];

  return (
    <div className="space-y-6">
      
      {/* File System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-folder text-primary"></i>
              File Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateDirectory}
                disabled={createDirectoryMutation.isPending}
                data-testid="button-create-directory"
              >
                <i className="fas fa-folder-plus mr-1"></i>
                New Directory
              </Button>
              {selectedFiles.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteFilesMutation.mutate(selectedFiles)}
                  disabled={deleteFilesMutation.isPending}
                  data-testid="button-delete-selected"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Delete ({selectedFiles.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary" data-testid="text-total-files">
                {directoryData?.fileCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Files</div>
            </div>
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <div className="text-2xl font-bold text-accent" data-testid="text-total-directories">
                {directoryData?.directoryCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Directories</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-total-size">
                {formatFileSize(directoryData?.totalSize || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground" data-testid="text-selected-count">
                {selectedFiles.length}
              </div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search files and directories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-testid="input-file-search"
            />
          </div>

          {/* Current Path */}
          <div className="mb-4 p-2 bg-muted/50 rounded text-sm font-mono">
            <i className="fas fa-folder-open mr-2 text-primary"></i>
            {currentPath}
          </div>

          {/* Files List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto" data-testid="files-list">
            {files.length > 0 ? (
              files.map((file) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors hover:bg-muted/20 ${
                    selectedFiles.includes(file.path) ? 'bg-primary/10 border-primary' : 'border-border'
                  } ${file.isHidden ? 'opacity-60' : ''}`}
                  data-testid={`file-${file.name}`}
                >
                  
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.path)}
                    onChange={() => toggleFileSelection(file.path)}
                    className="w-4 h-4"
                    data-testid={`checkbox-${file.name}`}
                  />

                  {/* File Icon & Name */}
                  <div className="flex items-center gap-3 flex-1">
                    <i className={getFileIcon(file)}></i>
                    <div className="flex-1">
                      <div className="font-medium">
                        {file.name}
                        {file.isHidden && <Badge variant="outline" className="ml-2 text-xs">Hidden</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.permissions} | {file.type}
                      </div>
                    </div>
                  </div>

                  {/* File Size */}
                  <div className="text-sm text-muted-foreground min-w-[80px] text-right">
                    {file.type === 'file' ? formatFileSize(file.size) : '—'}
                  </div>

                  {/* Last Modified */}
                  <div className="text-sm text-muted-foreground min-w-[140px] text-right">
                    {formatDate(file.lastModified)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {file.type === 'directory' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPath(file.path)}
                        data-testid={`button-open-${file.name}`}
                      >
                        <i className="fas fa-folder-open text-xs"></i>
                      </Button>
                    )}
                    {file.type === 'file' && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-view-${file.name}`}
                      >
                        <i className="fas fa-eye text-xs"></i>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-folder-open text-muted-foreground text-2xl mb-3"></i>
                <p className="text-muted-foreground">No files found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This directory is empty or no files match your search
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}