import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentResponse {
  message: string;
  actions?: Array<{
    type: string;
    parameters: any;
    description: string;
    command?: string;
  }>;
  suggestions?: string[];
  commandExecuted?: boolean;
  commandResult?: string;
}

interface ChatMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  commandResult?: string;
}

export default function AgentChat() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      setIsTyping(true);
      
      // Add user message to history
      setChatHistory(prev => [...prev, {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      }]);
      
      const response = await apiRequest("POST", "/api/agent/chat", {
        message: userMessage,
      });
      return await response.json() as AgentResponse;
    },
    onSuccess: (response) => {
      setIsTyping(false);
      setMessage("");
      
      // Add agent response to history
      setChatHistory(prev => [...prev, {
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
        commandResult: response.commandExecuted ? response.commandResult : undefined,
      }]);
      
      // Show agent response
      toast({
        title: response.commandExecuted ? "🤖 Command Executed" : "🤖 Agent Response",
        description: response.message,
        duration: 8000,
      });

      // Show command result if executed
      if (response.commandExecuted && response.commandResult) {
        setTimeout(() => {
          toast({
            title: "📊 Command Output",
            description: response.commandResult?.substring(0, 200) + (response.commandResult && response.commandResult.length > 200 ? '...' : ''),
            duration: 10000,
          });
        }, 500);
      }

      // Show suggestions if any
      if (response.suggestions && response.suggestions.length > 0) {
        setTimeout(() => {
          toast({
            title: "💡 Suggestions",
            description: response.suggestions!.join(" • "),
            duration: 10000,
          });
        }, 1500);
      }
    },
    onError: (error) => {
      setIsTyping(false);
      
      if (isUnauthorizedError(error)) {
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

      toast({
        title: "Agent Error",
        description: error.message || "Failed to communicate with agent",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      {/* Chat History */}
      {showHistory && chatHistory.length > 0 && (
        <Card className="mb-3 p-3 max-h-[300px] overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Conversation History</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(false)}
              className="h-6 px-2"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`text-xs p-2 rounded ${
                  msg.role === 'user' 
                    ? 'bg-blue-500/10 text-blue-400 ml-8' 
                    : msg.role === 'agent'
                    ? 'bg-green-500/10 text-green-400 mr-8'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <div className="font-medium mb-1">
                    {msg.role === 'user' ? '👤 You' : '🤖 Agent'}
                    <span className="ml-2 opacity-60">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div>{msg.content}</div>
                  {msg.commandResult && (
                    <pre className="mt-2 p-2 bg-black/20 rounded text-[10px] overflow-x-auto">
                      {msg.commandResult.substring(0, 300)}
                      {msg.commandResult.length > 300 && '...'}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isTyping ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <span className="text-sm font-medium text-accent">
              {isTyping ? 'Agent Thinking...' : 'AI Agent'}
            </span>
          </div>
          <Input
            type="text"
            placeholder="Natural language command: 'Show system status' or 'Generate content from my template'..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={chatMutation.isPending}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="input-agent-chat"
          />
          {chatHistory.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Toggle conversation history"
            >
              <i className="fas fa-history"></i>
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={!message.trim() || chatMutation.isPending}
            className="p-1 text-muted-foreground hover:text-foreground"
            data-testid="button-send-message"
          >
            {chatMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </div>
      </form>

      {/* Quick Command Suggestions */}
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 z-50">
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-2">🤖 Natural Language Commands:</p>
          <div className="space-y-1">
            {[
              "Show me system status",
              "What templates do I have?",
              "Run my daily newsletter job",
              "Check the queue status",
              "What's in the database?",
              "Show me recent content",
              "List all scheduled jobs",
              "Check system memory",
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                className="block w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                data-testid={`suggestion-${index}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
