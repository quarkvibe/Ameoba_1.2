import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useAuth } from "@/hooks/useAuth";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'warning' | 'debug' | 'success' | 'command' | 'output';
  message: string;
  metadata?: any;
}

export default function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isConnected, sendMessage, subscribe } = useWebSocketContext();
  const { user } = useAuth();

  // Initialize connection and subscribe to activity
  useEffect(() => {
    if (isConnected && !isInitialized) {
      // Subscribe to activity feed
      sendMessage({ type: 'subscribe' });
      
      // Send auth if user is available
      if (user) {
        const userId = typeof user === 'object' && 'id' in user ? user.id : undefined;
        if (userId) {
          sendMessage({ type: 'auth', userId });
        }
      }
      
      setIsInitialized(true);
    }
  }, [isConnected, user, isInitialized, sendMessage]);

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      // Handle different message types
      if (message.type === 'activity') {
        // Real-time activity from server
        const newLog: LogEntry = {
          timestamp: message.timestamp || new Date().toISOString(),
          level: (message.level as LogEntry['level']) || 'info',
          message: message.message || '',
          metadata: message.metadata,
        };
        setLogs((prev) => [...prev.slice(-199), newLog]); // Keep last 200 logs
      } 
      else if (message.type === 'command_output') {
        const outputLog: LogEntry = {
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'output',
          message: message.output || '',
        };
        setLogs((prev) => [...prev.slice(-199), outputLog]);
        setIsExecuting(false);
      } 
      else if (message.type === 'command_error') {
        const errorLog: LogEntry = {
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'error',
          message: message.error || 'Command execution failed',
        };
        setLogs((prev) => [...prev.slice(-199), errorLog]);
        setIsExecuting(false);
      }
      else if (message.type === 'clear_screen') {
        setLogs([]);
        setIsExecuting(false);
      }
      else if (message.type === 'subscribed') {
        // Connection established
        const welcomeLog: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'success',
          message: message.message || 'Connected to server',
        };
        setLogs((prev) => [...prev, welcomeLog]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAutoScroll(isAtBottom);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const executeCommand = () => {
    if (!command.trim() || !isConnected || isExecuting) return;

    const cmdLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'command',
      message: `$ ${command}`,
    };
    setLogs((prev) => [...prev.slice(-99), cmdLog]);
    
    setCommandHistory((prev) => [command, ...prev.slice(0, 49)]);
    setHistoryIndex(-1);
    setIsExecuting(true);

    sendMessage({
      type: 'command',
      command: command.trim(),
    });

    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
      case 'warning':
        return 'text-yellow-400';
      case 'debug':
        return 'text-gray-500';
      case 'command':
        return 'text-cyan-400 font-bold';
      case 'success':
        return 'text-green-400';
      case 'output':
        return 'text-gray-200';
      default:
        return 'text-blue-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'debug':
        return '🔍';
      case 'command':
        return '$';
      case 'output':
        return '';
      default:
        return '•';
    }
  };

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <span className="text-green-400">$</span>
            <span className="text-gray-300">server.log</span>
            {isConnected && (
              <span className="ml-2 flex items-center gap-1 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                live
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className="h-7 text-xs text-gray-400 hover:text-gray-200"
            >
              <i className={`fas fa-${isAutoScroll ? 'lock' : 'lock-open'} mr-1`}></i>
              {isAutoScroll ? 'Auto-scroll' : 'Scroll locked'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-7 text-xs text-gray-400 hover:text-gray-200"
            >
              <i className="fas fa-trash mr-1"></i>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="h-[400px] overflow-y-auto bg-black p-4 font-mono text-sm"
          data-testid="terminal-logs"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <i className="fas fa-terminal text-2xl mb-2"></i>
              <p>Waiting for server logs...</p>
              <p className="text-xs mt-1">Logs will appear here in real-time</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex gap-2 mb-1 hover:bg-gray-900/30 px-2 py-0.5 rounded group">
                <span className="text-gray-600 text-xs shrink-0 w-20">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className={`${getLevelColor(log.level)} shrink-0 w-6`}>
                  {getLevelIcon(log.level)}
                </span>
                <span className={`${getLevelColor(log.level)} flex-1 whitespace-pre-wrap break-words`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        
        {/* Command Input */}
        <div className="bg-gray-900 border-t border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono">$</span>
            <Input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || isExecuting}
              placeholder={isExecuting ? "Executing..." : "Type 'help' for available commands"}
              className="flex-1 bg-black border-gray-700 text-gray-100 font-mono text-sm focus:border-green-400 focus:ring-green-400"
              data-testid="terminal-input"
            />
            <Button
              size="sm"
              onClick={executeCommand}
              disabled={!isConnected || !command.trim() || isExecuting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isExecuting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-arrow-right"></i>
              )}
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">
            💡 Type 'help' for all commands | Live activity monitoring enabled
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
