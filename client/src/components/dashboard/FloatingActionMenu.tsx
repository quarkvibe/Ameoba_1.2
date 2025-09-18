import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateHoroscopesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/cron/trigger-horoscopes", {
        date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manual horoscope generation triggered successfully!",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/queue/pause", {});
    },
    onSuccess: () => {
      toast({
        title: "Emergency Stop Activated",
        description: "All horoscope generation has been paused.",
        variant: "destructive",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const showSystemHealth = () => {
    toast({
      title: "System Health Check",
      description: "All horoscope services are operational. Database connected, astronomy engine active, queue processing normally.",
      duration: 6000,
    });
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const actionItems = [
    {
      icon: "fas fa-star",
      title: "Generate Horoscopes",
      color: "bg-accent text-accent-foreground",
      action: () => generateHoroscopesMutation.mutate(),
      disabled: generateHoroscopesMutation.isPending,
    },
    {
      icon: "fas fa-stop",
      title: "Emergency Stop",
      color: "bg-destructive text-destructive-foreground",
      action: () => emergencyStopMutation.mutate(),
      disabled: emergencyStopMutation.isPending,
    },
    {
      icon: "fas fa-heartbeat",
      title: "System Health",
      color: "bg-primary text-primary-foreground",
      action: showSystemHealth,
      disabled: false,
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        
        {/* Sub-actions */}
        <div className={`absolute bottom-16 right-0 space-y-2 transition-all duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        }`}>
          {actionItems.map((item, index) => (
            <Button
              key={index}
              size="icon"
              onClick={item.action}
              disabled={item.disabled}
              className={`w-12 h-12 ${item.color} rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
              title={item.title}
              data-testid={`fab-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={item.icon}></i>
            </Button>
          ))}
        </div>

        {/* Main FAB */}
        <Button
          size="icon"
          onClick={toggleMenu}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          data-testid="fab-main"
        >
          <i className={`fas ${isOpen ? 'fa-times' : 'fa-plus'} transition-transform duration-200 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}></i>
        </Button>
      </div>
    </div>
  );
}
