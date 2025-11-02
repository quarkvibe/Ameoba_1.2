import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

/**
 * Real-time activity monitor for system events
 * Broadcasts events to all connected WebSocket clients
 */
export class ActivityMonitor extends EventEmitter {
  private clients: Set<WebSocket> = new Set();
  
  /**
   * Register a WebSocket client for activity updates
   */
  registerClient(ws: WebSocket): void {
    this.clients.add(ws);
    
    ws.on('close', () => {
      this.clients.delete(ws);
    });
    
    // Send welcome message
    this.sendToClient(ws, {
      type: 'activity',
      level: 'info',
      message: '🟢 Connected to activity monitor',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast activity to all clients
   */
  logActivity(level: 'info' | 'success' | 'warning' | 'error' | 'debug', message: string, metadata?: any): void {
    const activity = {
      type: 'activity',
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    
    // Also log to console
    const icon = this.getLevelIcon(level);
    console.log(`${icon} ${message}`);
    
    // Broadcast to all clients
    this.broadcast(activity);
    
    // Emit event for other services to listen
    this.emit('activity', activity);
  }

  /**
   * Log system events (job execution, content generation, etc.)
   */
  logEvent(event: string, data: any): void {
    this.logActivity('info', `Event: ${event}`, data);
  }

  /**
   * Log errors with stack traces
   */
  logError(error: Error | string, context?: string): void {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    this.logActivity('error', `${context ? `[${context}] ` : ''}${message}`, { stack });
  }

  /**
   * Log job execution
   */
  logJobExecution(jobId: string, jobName: string, status: 'started' | 'completed' | 'failed', duration?: number): void {
    const icon = status === 'started' ? '▶️' : status === 'completed' ? '✅' : '❌';
    const msg = `${icon} Job "${jobName}" ${status}${duration ? ` in ${duration}ms` : ''}`;
    
    this.logActivity(status === 'failed' ? 'error' : status === 'completed' ? 'success' : 'info', msg, { 
      jobId, 
      jobName, 
      status, 
      duration 
    });
  }

  /**
   * Log content generation
   */
  logContentGeneration(templateName: string, status: 'started' | 'completed' | 'failed', tokens?: number): void {
    const msg = `🤖 Content generation for "${templateName}" ${status}${tokens ? ` (${tokens} tokens)` : ''}`;
    this.logActivity(status === 'failed' ? 'error' : 'success', msg);
  }

  /**
   * Log delivery attempts
   */
  logDelivery(channel: string, status: 'started' | 'completed' | 'failed', recipient?: string): void {
    const msg = `📤 Delivery to ${channel}${recipient ? ` (${recipient})` : ''} ${status}`;
    this.logActivity(status === 'failed' ? 'error' : 'success', msg);
  }

  /**
   * Log API calls
   */
  logApiCall(method: string, endpoint: string, statusCode: number, duration: number): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'debug';
    this.logActivity(level, `${method} ${endpoint} → ${statusCode} (${duration}ms)`);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast to all connected clients
   */
  private broadcast(data: any): void {
    const message = JSON.stringify(data);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Get icon for log level
   */
  private getLevelIcon(level: string): string {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'debug': return '🔍';
      default: return 'ℹ️';
    }
  }

  /**
   * Get count of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const activityMonitor = new ActivityMonitor();




