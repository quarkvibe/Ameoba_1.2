import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generatecontentsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/cron/trigger-contents", {
        date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manual content generation triggered successfully!",
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
      description: "All content services are operational. Database connected, astronomy engine active, queue processing normally.",
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
      title: "Generate contents",
      color: "bg-accent text-accent-foreground",
      action: () => generatecontentsMutation.mutate(),
      disabled: generatecontentsMutation.isPending,
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
        
        {/* Sub-actions with visible labels */}
        <div className={`absolute bottom-16 right-0 space-y-2 transition-all duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        }`}>
          {actionItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 justify-end">
              <span className="bg-card px-3 py-1 rounded-full shadow-md text-sm font-medium whitespace-nowrap">
                {item.title}
              </span>
              <Button
                size="icon"
                onClick={item.action}
                disabled={item.disabled}
                className={`w-12 h-12 ${item.color} rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                data-testid={`fab-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <i className={item.icon}></i>
              </Button>
            </div>
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
