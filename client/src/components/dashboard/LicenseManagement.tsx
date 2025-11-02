import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Key, 
  Monitor, 
  Calendar,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";

interface LicenseStatus {
  isActive: boolean;
  licenseKey?: string;
  deviceId?: string;
  activatedAt?: string;
  expiresAt?: string | null;
  status: 'active' | 'inactive' | 'expired' | 'invalid';
}

export default function LicenseManagement() {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/license/status", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      } else {
        setLicenseStatus({
          isActive: false,
          status: 'inactive'
        });
      }
    } catch (error) {
      console.error("Error checking license:", error);
      toast({
        title: "Error",
        description: "Failed to check license status",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const activateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a license key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "License activated successfully",
        });
        setLicenseKey("");
        await checkLicenseStatus();
      } else {
        toast({
          title: "Activation Failed",
          description: data.error || "Invalid license key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate license",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivateLicense = async () => {
    if (!confirm("Are you sure you want to deactivate this license? You can reactivate it on another device.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/license/deactivate", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "License deactivated successfully",
        });
        await checkLicenseStatus();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to deactivate license",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate license",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expired':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'invalid':
      case 'inactive':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <XCircle className="w-5 h-5" />;
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
        <h2 className="text-3xl font-bold tracking-tight">License Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your Amoeba platform license and device activation
        </p>
      </div>

      {/* License Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                License Status
              </CardTitle>
              <CardDescription>Current activation status for this device</CardDescription>
            </div>
            {licenseStatus && (
              <Badge 
                variant="outline" 
                className={`${getStatusColor(licenseStatus.status)} flex items-center gap-2`}
              >
                {getStatusIcon(licenseStatus.status)}
                {licenseStatus.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {licenseStatus?.isActive ? (
            <div className="space-y-4">
              {/* Active License Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">License Key</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                      {licenseStatus.licenseKey?.substring(0, 8)}...{licenseStatus.licenseKey?.substring(licenseStatus.licenseKey.length - 8)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => licenseStatus.licenseKey && copyToClipboard(licenseStatus.licenseKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Device ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                      {licenseStatus.deviceId?.substring(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => licenseStatus.deviceId && copyToClipboard(licenseStatus.deviceId)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Activated On
                  </div>
                  <div className="text-sm">
                    {licenseStatus.activatedAt ? new Date(licenseStatus.activatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    License Type
                  </div>
                  <div className="text-sm">
                    {licenseStatus.expiresAt ? 'Subscription' : 'Lifetime'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={deactivateLicense}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Deactivate License
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Deactivate this license to use it on another device
                </p>
              </div>
            </div>
          ) : (
            /* Activation Form */
            <div className="space-y-4">
              <div className="bg-muted/50 border-l-4 border-primary p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">No Active License</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your license key to activate Amoeba on this device. 
                      Get your license at <a href="https://ameoba.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ameoba.org</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="licenseKey" className="text-sm font-medium">
                  License Key
                </label>
                <div className="flex gap-2">
                  <Input
                    id="licenseKey"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && activateLicense()}
                    disabled={loading}
                    className="font-mono"
                  />
                  <Button
                    onClick={activateLicense}
                    disabled={loading || !licenseKey.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the license key you received after purchase
                </p>
              </div>

              <div className="pt-4 border-t">
                <a
                  href="https://ameoba.org/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Don't have a license? Get one for $3.50
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifetime License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• One-time payment of $3.50</p>
            <p>• Use on one device at a time</p>
            <p>• Transfer between devices anytime</p>
            <p>• All future updates included</p>
            <p>• No recurring fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Lost your license key? Check your email</p>
            <p>• Need to transfer? Deactivate and reactivate</p>
            <p>• Questions? Email support@ameoba.org</p>
            <p>• View docs at docs.ameoba.org</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




