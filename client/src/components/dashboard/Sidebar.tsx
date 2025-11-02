import { useState } from "react";

const navigation = [
  { id: 'overview', name: 'Overview', icon: 'fas fa-chart-line' },
  { id: 'generation', name: 'AI Content Generation', icon: 'fas fa-robot' },
  { id: 'content-config', name: 'Content Templates', icon: 'fas fa-file-text' },
  { id: 'data-sources', name: 'Data Sources', icon: 'fas fa-database' },
  { id: 'output-config', name: 'Output Channels', icon: 'fas fa-share-alt' },
  { id: 'reviews', name: 'Review Queue', icon: 'fas fa-tasks' },
  { id: 'schedule', name: 'Schedule Manager', icon: 'fas fa-calendar-alt' },
  { id: 'queue', name: 'Queue Monitor', icon: 'fas fa-clock' },
  { id: 'logs', name: 'System Logs', icon: 'fas fa-file-alt' },
  { id: 'credentials', name: 'Credentials', icon: 'fas fa-key' },
  { id: 'agent-config', name: 'AI Agent Config', icon: 'fas fa-brain' },
  { id: 'sms-commands', name: 'SMS Commands', icon: 'fas fa-mobile-alt' },
  { id: 'testing', name: 'Testing & Logs', icon: 'fas fa-vial' },
  { id: 'deployment', name: 'Deployment', icon: 'fas fa-server' },
  { id: 'database', name: 'Database', icon: 'fas fa-database' },
  { id: 'code-modification', name: 'AI Code Mod', icon: 'fas fa-dna' },
  { id: 'configuration', name: 'Environment', icon: 'fas fa-cog' },
  { id: 'license', name: 'License', icon: 'fas fa-id-card' },
  { id: 'ollama', name: 'Ollama Setup', icon: 'fas fa-server' },
  { id: 'api-settings', name: 'API Keys', icon: 'fas fa-code' },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeView, onViewChange, isOpen = false, onClose }: SidebarProps) {
  const handleNavigation = (itemId: string) => {
    onViewChange(itemId);
    console.log('Navigating to:', itemId);
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        
        {/* Logo Section */}
        <div className="flex items-center justify-between gap-3 p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-atom text-primary-foreground text-sm"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Amoeba</h1>
              <p className="text-xs text-muted-foreground">AI Content Platform</p>
            </div>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid="button-close-sidebar"
            >
              <i className="fas fa-times text-muted-foreground"></i>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                activeView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <i className={`${item.icon} w-4`}></i>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Status Section */}
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">System Health</span>
              <span className="text-accent" data-testid="text-system-health">Optimal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">All services online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
