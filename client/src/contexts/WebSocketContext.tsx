import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  level?: string;
  output?: string;
  error?: string;
  timestamp?: string;
  metadata?: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  sendMessage: (message: any) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const messageListeners = new Set<(message: WebSocketMessage) => void>();

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isConnected, connectionStatus, sendMessage } = useWebSocket({
    onMessage: (message) => {
      // Broadcast message to all subscribers
      messageListeners.forEach(callback => callback(message));
    },
  });

  const subscribe = (callback: (message: WebSocketMessage) => void) => {
    messageListeners.add(callback);
    return () => {
      messageListeners.delete(callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, connectionStatus, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
