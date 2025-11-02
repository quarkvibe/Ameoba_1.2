import AgentChat from "./AgentChat";
import ThemeToggle from "./ThemeToggle";
import SystemStatusIndicator from "./SystemStatusIndicator";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between p-4 gap-2">
        
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
            data-testid="button-mobile-menu"
          >
            <i className="fas fa-bars"></i>
          </Button>
        )}
        
        {/* Agent Chat */}
        <div className="flex-1 max-w-2xl hidden sm:block">
          <AgentChat />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* System Status Indicator - Traffic Light System */}
          <SystemStatusIndicator />
          
          {/* Theme Toggle - Always visible */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
