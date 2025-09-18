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
import HoroscopeGeneration from "@/components/dashboard/HoroscopeGeneration";
import LogsViewer from "@/components/dashboard/LogsViewer";
import FileManagement from "@/components/dashboard/FileManagement";
import HealthMonitor from "@/components/dashboard/HealthMonitor";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState("overview");

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Metrics Grid */}
            <MetricsGrid />
            
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
      case "generation":
        return <HoroscopeGeneration />;
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
      case "configuration":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <i className="fas fa-cog text-primary"></i>
              System Configuration
            </h2>
            <p className="text-muted-foreground">
              Configure system settings, API keys, and service parameters.
            </p>
            {/* Future configuration components will go here */}
            <div className="text-center py-12 text-muted-foreground">
              <i className="fas fa-cog text-4xl mb-4"></i>
              <p>Configuration interface coming soon...</p>
            </div>
          </div>
        );
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
  useWebSocket({
    onMessage: (message) => {
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
    },
    onConnect: () => {
      console.log('Connected to real-time updates');
    },
    onDisconnect: () => {
      console.log('Disconnected from real-time updates');
    },
  });

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
      
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        
        {/* Top Bar */}
        <TopBar />

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Amoeba Horoscope Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Intelligent horoscope generation and management system
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
