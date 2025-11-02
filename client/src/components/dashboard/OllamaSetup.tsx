import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Download,
  Server,
  Loader2,
  AlertCircle,
  ExternalLink,
  Play,
  RefreshCw,
  Check
} from "lucide-react";

interface OllamaModel {
  name: string;
  size: string;
  description: string;
  recommended?: boolean;
}

interface OllamaStatus {
  isInstalled: boolean;
  isRunning: boolean;
  version?: string;
  models: string[];
  endpoint: string;
}

const RECOMMENDED_MODELS: OllamaModel[] = [
  {
    name: "llama3.2",
    size: "2GB",
    description: "Fast, efficient model for general content generation",
    recommended: true
  },
  {
    name: "mistral",
    size: "4.1GB",
    description: "Balanced performance and quality"
  },
  {
    name: "phi3",
    size: "2.3GB",
    description: "Microsoft's small but powerful model"
  },
  {
    name: "gemma2:2b",
    size: "1.6GB",
    description: "Google's lightweight model"
  }
];

export default function OllamaSetup() {
  const { toast } = useToast();
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [customEndpoint, setCustomEndpoint] = useState("http://localhost:11434");
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/ollama/status", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setCustomEndpoint(data.endpoint || "http://localhost:11434");
      } else {
        setStatus({
          isInstalled: false,
          isRunning: false,
          models: [],
          endpoint: "http://localhost:11434"
        });
      }
    } catch (error) {
      console.error("Error checking Ollama status:", error);
      setStatus({
        isInstalled: false,
        isRunning: false,
        models: [],
        endpoint: "http://localhost:11434"
      });
    } finally {
      setChecking(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch("/api/ollama/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: customEndpoint }),
      });

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Ollama is responding correctly",
        });
        await checkOllamaStatus();
      } else {
        const data = await response.json();
        toast({
          title: "Connection Failed",
          description: data.error || "Cannot connect to Ollama",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const pullModel = async (modelName: string) => {
    setPullingModel(modelName);
    try {
      const response = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ model: modelName }),
      });

      if (response.ok) {
        toast({
          title: "Download Started",
          description: `Pulling ${modelName}. This may take a few minutes.`,
        });
        
        // Poll for completion
        const interval = setInterval(async () => {
          await checkOllamaStatus();
          if (status?.models.includes(modelName)) {
            clearInterval(interval);
            setPullingModel(null);
            toast({
              title: "Download Complete",
              description: `${modelName} is ready to use`,
            });
          }
        }, 3000);
        
        // Clear interval after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
          setPullingModel(null);
        }, 300000);
      } else {
        const data = await response.json();
        toast({
          title: "Download Failed",
          description: data.error || "Failed to pull model",
          variant: "destructive",
        });
        setPullingModel(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start model download",
        variant: "destructive",
      });
      setPullingModel(null);
    }
  };

  const updateEndpoint = async () => {
    try {
      const response = await fetch("/api/ollama/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: customEndpoint }),
      });

      if (response.ok) {
        toast({
          title: "Endpoint Updated",
          description: "Ollama endpoint configuration saved",
        });
        await checkOllamaStatus();
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update endpoint",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update endpoint",
        variant: "destructive",
      });
    }
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ollama Setup</h2>
        <p className="text-muted-foreground mt-2">
          Run AI models locally with zero API costs
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Ollama Status
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkOllamaStatus}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
          <CardDescription>Local AI model runtime status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {status?.isInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">Installation</div>
                <div className="text-xs text-muted-foreground">
                  {status?.isInstalled ? "Detected" : "Not Found"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              {status?.isRunning ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">Service</div>
                <div className="text-xs text-muted-foreground">
                  {status?.isRunning ? "Running" : "Stopped"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Models</div>
                <div className="text-xs text-muted-foreground">
                  {status?.models.length || 0} installed
                </div>
              </div>
            </div>
          </div>

          {status?.version && (
            <div className="text-sm text-muted-foreground">
              Version: {status.version}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      {!status?.isInstalled && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Ollama Not Detected
            </CardTitle>
            <CardDescription>Follow these steps to install Ollama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium">Download Ollama</div>
                  <div className="text-sm text-muted-foreground">
                    Visit the official website to download
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    asChild
                  >
                    <a href="https://ollama.ai/download" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Download Ollama
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium">Install and Start</div>
                  <div className="text-sm text-muted-foreground">
                    Run the installer and Ollama will start automatically
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium">Refresh This Page</div>
                  <div className="text-sm text-muted-foreground">
                    Click the refresh button above to detect Ollama
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Configuration</CardTitle>
          <CardDescription>Configure the Ollama API endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <Button onClick={testConnection} disabled={testingConnection}>
              {testingConnection ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button variant="outline" onClick={updateEndpoint}>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Default: http://localhost:11434 (change if Ollama runs on a different host/port)
          </p>
        </CardContent>
      </Card>

      {/* Model Library */}
      {status?.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Model Library</CardTitle>
            <CardDescription>Download and manage AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECOMMENDED_MODELS.map((model) => {
                const isInstalled = status?.models.includes(model.name);
                const isPulling = pullingModel === model.name;

                return (
                  <div
                    key={model.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{model.name}</h4>
                        {model.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {isInstalled && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Installed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Size: {model.size}
                      </p>
                    </div>
                    <Button
                      onClick={() => pullModel(model.name)}
                      disabled={isInstalled || isPulling}
                      variant={isInstalled ? "outline" : "default"}
                    >
                      {isPulling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : isInstalled ? (
                        "Installed"
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Custom Model</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Pull any model from the Ollama library
              </p>
              <div className="flex gap-2">
                <Input placeholder="e.g., codellama, neural-chat" id="custom-model" />
                <Button
                  onClick={() => {
                    const input = document.getElementById("custom-model") as HTMLInputElement;
                    if (input?.value) {
                      pullModel(input.value);
                      input.value = "";
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Pull
                </Button>
              </div>
              <a
                href="https://ollama.ai/library"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Browse model library
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Why Use Ollama?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Zero API Costs:</strong> No pay-per-token fees</p>
          <p>• <strong>Privacy:</strong> Data never leaves your machine</p>
          <p>• <strong>Offline:</strong> Works without internet connection</p>
          <p>• <strong>Fast:</strong> Local inference with no network latency</p>
          <p>• <strong>Control:</strong> Choose and customize your models</p>
        </CardContent>
      </Card>
    </div>
  );
}



