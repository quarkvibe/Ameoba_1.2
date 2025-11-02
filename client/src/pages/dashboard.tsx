import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import SystemStatus from "@/components/dashboard/SystemStatus";
import HourlyChart from "@/components/dashboard/HourlyChart";
import QueueStatus from "@/components/dashboard/QueueStatus";
import FloatingActionMenu from "@/components/dashboard/FloatingActionMenu";
import ContentGeneration from "@/components/dashboard/ContentGeneration";
import LogsViewer from "@/components/dashboard/LogsViewer";
import FileManagement from "@/components/dashboard/FileManagement";
import HealthMonitor from "@/components/dashboard/HealthMonitor";
import ContentConfiguration from "@/components/dashboard/ContentConfiguration";
import DataSourceManager from "@/components/dashboard/DataSourceManager";
import OutputConfiguration from "@/components/dashboard/OutputConfiguration";
import ScheduleManager from "@/components/dashboard/ScheduleManager";
import ApiSettings from "@/components/dashboard/ApiSettings";
import Terminal from "@/components/dashboard/Terminal";
// HoroscopeViewer removed - generic content viewer will replace it
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import SystemHealthDashboard from "@/components/dashboard/SystemHealthDashboard";
import LicenseManagement from "@/components/dashboard/LicenseManagement";
import OllamaSetup from "@/components/dashboard/OllamaSetup";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <MetricsGrid />
            
            {/* Terminal Console */}
            <Terminal />
            
            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Activity Feed */}
              <div className="lg:col-span-2">
                <LiveActivityFeed />
              </div>
              {/* System Status */}
              <SystemStatus />
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyChart />
              <QueueStatus />
            </div>
          </div>
        );
      case "health":
        return <SystemHealthDashboard />;
      case "horoscopes":
        // Horoscope viewer removed - will be replaced with generic content viewer
        return <div className="p-8 text-center text-muted-foreground">Horoscope viewer coming soon as generic content viewer...</div>;
      case "generation":
        return <ContentGeneration />;
      case "content-config":
        return <ContentConfiguration />;
      case "data-sources":
        return <DataSourceManager />;
      case "output-config":
        return <OutputConfiguration />;
      case "schedule":
        return <ScheduleManager />;
      case "astronomy":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="fas fa-satellite text-primary"></i>
              Astronomy Data
            </h2>
            <p className="text-muted-foreground">
              Real-time astronomical data and planetary positions for horoscope generation.
            </p>
            {/* Future astronomy data components will go here */}
            <div className="text-center py-12 text-muted-foreground">
              <i className="fas fa-satellite text-4xl mb-4"></i>
              <p>Astronomy data interface coming soon...</p>
            </div>
          </div>
        );
      case "queue":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="fas fa-clock text-primary"></i>
              Queue Monitor
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage the horoscope generation queue and background jobs.
            </p>
            <QueueStatus />
          </div>
        );
      case "logs":
        return <LogsViewer />;
      case "files":
        return <FileManagement />;
      case "health":
        return <HealthMonitor />;
      case "api-settings":
        return <ApiSettings />;
      case "configuration":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="fas fa-cog text-primary"></i>
              System Settings
            </h2>
            <p className="text-muted-foreground">
              Configure system settings and service parameters.
            </p>
            {/* Future system configuration components will go here */}
            <div className="text-center py-12 text-muted-foreground">
              <i className="fas fa-cog text-4xl mb-4"></i>
              <p>System settings interface coming soon...</p>
            </div>
          </div>
        );
      case "license":
        return <LicenseManagement />;
      case "ollama":
        return <OllamaSetup />;
      default:
        return (
          <div className="space-y-6">
            <MetricsGrid />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LiveActivityFeed />
              </div>
              <SystemStatus />
            </div>
          </div>
        );
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // WebSocket connection for real-time updates
  const { subscribe } = useWebSocketContext();
  
  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      switch (message.type) {
        case 'metrics_update':
          // Handle real-time metrics updates
          console.log('Metrics updated:', message.data);
          break;
        case 'new_activity':
          // Show notification for new activity
          toast({
            title: "New Activity",
            description: message.message,
          });
          break;
        default:
          console.log('Unknown WebSocket message:', message);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <i className="fas fa-atom text-primary-foreground"></i>
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen bg-background" data-testid="dashboard-container">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={(view) => {
          setActiveView(view);
          setSidebarOpen(false); // Close sidebar on mobile after selection
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Amoeba AI Content Platform
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Universal AI content generation and dissemination platform
              </p>
            </div>
          </div>

          {/* Dynamic Content Based on Active View */}
          {renderActiveView()}
        </div>
      </main>

      {/* Floating Action Menu */}
      <FloatingActionMenu />
    </div>
  );
}
