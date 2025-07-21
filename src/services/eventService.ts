/**
 * Event Service Wrapper for ServiceExample_Events Plugin
 * 
 * This service wraps the BrainDrive Event Service and provides comprehensive
 * demonstration of all available event service methods and features.
 */

import { 
  EventService, 
  EventOptions, 
  AllMessageTypes,
  ChatMessage,
  StateMessage,
  BroadcastMessage,
  SystemMessage,
  EventMonitorMessage
} from '../types';
import { 
  generateId, 
  getCurrentTimestamp, 
  createSystemMessage,
  createEventMonitorMessage,
  logError 
} from '../utils';

/**
 * Enhanced Event Service wrapper that demonstrates all Event Service capabilities
 */
export class ServiceExampleEventService {
  private eventService?: EventService;
  private pluginId: string;
  private moduleId: string;
  private messageQueue: AllMessageTypes[] = [];
  private subscribers: Map<string, Set<(message: any) => void>> = new Map();
  private eventLog: EventMonitorMessage[] = [];
  private performanceMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    totalLatency: 0,
    errorCount: 0,
    startTime: Date.now()
  };

  constructor(pluginId: string, moduleId: string) {
    this.pluginId = pluginId;
    this.moduleId = moduleId;
  }

  /**
   * Initialize the event service with the BrainDrive service bridge
   */
  initialize(eventService: EventService): void {
    this.eventService = eventService;
    this.logEvent('service.initialized', 'Event service initialized', { pluginId: this.pluginId, moduleId: this.moduleId });
  }

  /**
   * Check if the event service is available
   */
  isAvailable(): boolean {
    return !!this.eventService;
  }

  // ============================================================================
  // CORE EVENT SERVICE METHODS (All 3 methods demonstrated)
  // ============================================================================

  /**
   * Send a message to a target module (demonstrates sendMessage method)
   * 
   * @param targetModuleId - The ID of the target module
   * @param message - The message to send
   * @param options - Event options (remote, persist, etc.)
   */
  sendMessage<T>(targetModuleId: string, message: T, options: EventOptions = { remote: false }): void {
    if (!this.eventService) {
      this.logError('Event service not available', 'sendMessage');
      return;
    }

    const startTime = performance.now();
    
    try {
      // Add source information to the message
      const enhancedMessage = {
        ...message,
        _source: {
          pluginId: this.pluginId,
          moduleId: this.moduleId
        },
        _metadata: {
          sentAt: getCurrentTimestamp(),
          options: options,
          messageId: generateId('msg')
        }
      };

      // Call the actual BrainDrive event service
      this.eventService.sendMessage(targetModuleId, enhancedMessage, options);

      // Update performance metrics
      const latency = performance.now() - startTime;
      this.performanceMetrics.messagesSent++;
      this.performanceMetrics.totalLatency += latency;

      // Log the event for monitoring
      this.logEvent('message.sent', `Message sent to ${targetModuleId}`, {
        targetModuleId,
        messageType: typeof message === 'object' && message !== null && 'type' in message ? (message as any).type : 'unknown',
        options,
        latency
      });

      // Add to queue if persistence is enabled
      if (options.persist) {
        this.addToQueue(enhancedMessage as unknown as AllMessageTypes);
      }

    } catch (error) {
      this.performanceMetrics.errorCount++;
      this.logError(`Failed to send message to ${targetModuleId}`, 'sendMessage', error);
    }
  }

  /**
   * Subscribe to messages for this module (demonstrates subscribeToMessages method)
   * 
   * @param callback - Function to call when a message is received
   * @param options - Event options (remote, persist, etc.)
   */
  subscribeToMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }): void {
    if (!this.eventService) {
      this.logError('Event service not available', 'subscribeToMessages');
      return;
    }

    try {
      // Create a wrapper callback that adds monitoring and metrics
      const wrappedCallback = (message: T) => {
        const startTime = performance.now();
        
        try {
          // Update performance metrics
          this.performanceMetrics.messagesReceived++;

          // Log the event for monitoring
          this.logEvent('message.received', `Message received by ${this.moduleId}`, {
            messageType: typeof message === 'object' && message !== null && 'type' in message ? (message as any).type : 'unknown',
            options
          });

          // Call the original callback
          callback(message);

          // Track processing time
          const processingTime = performance.now() - startTime;
          this.logEvent('message.processed', `Message processed by ${this.moduleId}`, {
            processingTime
          });

        } catch (error) {
          this.performanceMetrics.errorCount++;
          this.logError(`Error processing received message`, 'subscribeToMessages', error);
        }
      };

      // Store the callback for cleanup
      if (!this.subscribers.has(this.moduleId)) {
        this.subscribers.set(this.moduleId, new Set());
      }
      this.subscribers.get(this.moduleId)!.add(wrappedCallback);

      // Call the actual BrainDrive event service
      this.eventService.subscribeToMessages(this.moduleId, wrappedCallback, options);

      this.logEvent('subscription.created', `Subscribed to messages for ${this.moduleId}`, { options });

      // If persistence is enabled, replay queued messages
      if (options.persist && this.messageQueue.length > 0) {
        this.replayQueuedMessages(wrappedCallback);
      }

    } catch (error) {
      this.performanceMetrics.errorCount++;
      this.logError(`Failed to subscribe to messages for ${this.moduleId}`, 'subscribeToMessages', error);
    }
  }

  /**
   * Unsubscribe from messages for this module (demonstrates unsubscribeFromMessages method)
   * 
   * @param callback - The callback function to remove
   * @param options - Event options (remote, persist, etc.)
   */
  unsubscribeFromMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }): void {
    if (!this.eventService) {
      this.logError('Event service not available', 'unsubscribeFromMessages');
      return;
    }

    try {
      // Call the actual BrainDrive event service
      this.eventService.unsubscribeFromMessages(this.moduleId, callback, options);

      // Remove from our tracking
      const moduleSubscribers = this.subscribers.get(this.moduleId);
      if (moduleSubscribers) {
        moduleSubscribers.delete(callback);
        if (moduleSubscribers.size === 0) {
          this.subscribers.delete(this.moduleId);
        }
      }

      this.logEvent('subscription.removed', `Unsubscribed from messages for ${this.moduleId}`, { options });

    } catch (error) {
      this.performanceMetrics.errorCount++;
      this.logError(`Failed to unsubscribe from messages for ${this.moduleId}`, 'unsubscribeFromMessages', error);
    }
  }

  // ============================================================================
  // ADVANCED EVENT SERVICE FEATURES
  // ============================================================================

  /**
   * Send a message with local options (demonstrates local messaging)
   */
  sendLocalMessage<T>(targetModuleId: string, message: T, persist: boolean = false): void {
    this.sendMessage(targetModuleId, message, { remote: false, persist });
  }

  /**
   * Send a message with remote options (demonstrates remote messaging)
   */
  sendRemoteMessage<T>(targetModuleId: string, message: T, persist: boolean = true): void {
    this.sendMessage(targetModuleId, message, { remote: true, persist });
  }

  /**
   * Broadcast a message to multiple targets (demonstrates broadcasting)
   */
  broadcastMessage<T>(targetModuleIds: string[], message: T, options: EventOptions = { remote: false }): void {
    const broadcastId = generateId('broadcast');
    
    targetModuleIds.forEach(targetId => {
      const broadcastMessage = {
        ...message,
        _broadcast: {
          id: broadcastId,
          targets: targetModuleIds,
          currentTarget: targetId
        }
      };
      
      this.sendMessage(targetId, broadcastMessage, options);
    });

    this.logEvent('broadcast.sent', `Broadcast sent to ${targetModuleIds.length} targets`, {
      broadcastId,
      targets: targetModuleIds,
      options
    });
  }

  /**
   * Subscribe with persistence enabled (demonstrates persistence)
   */
  subscribeWithPersistence<T>(callback: (message: T) => void, remote: boolean = false): void {
    this.subscribeToMessages(callback, { remote, persist: true });
  }

  // ============================================================================
  // MESSAGE QUEUE MANAGEMENT (demonstrates queuing and persistence)
  // ============================================================================

  /**
   * Add a message to the persistence queue
   */
  private addToQueue(message: AllMessageTypes): void {
    this.messageQueue.push(message);
    
    // Limit queue size to prevent memory issues
    const maxQueueSize = 1000;
    if (this.messageQueue.length > maxQueueSize) {
      this.messageQueue = this.messageQueue.slice(-maxQueueSize);
    }

    this.logEvent('queue.added', `Message added to queue`, {
      queueSize: this.messageQueue.length,
      messageType: message.type
    });
  }

  /**
   * Replay queued messages to a new subscriber
   */
  private replayQueuedMessages<T>(callback: (message: T) => void): void {
    const replayCount = this.messageQueue.length;
    
    this.messageQueue.forEach(message => {
      try {
        callback(message as T);
      } catch (error) {
        this.logError('Error replaying queued message', 'replayQueuedMessages', error);
      }
    });

    this.logEvent('queue.replayed', `Replayed ${replayCount} queued messages`, {
      replayCount
    });
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { size: number; messages: AllMessageTypes[] } {
    return {
      size: this.messageQueue.length,
      messages: [...this.messageQueue]
    };
  }

  /**
   * Clear the message queue
   */
  clearQueue(): void {
    const clearedCount = this.messageQueue.length;
    this.messageQueue = [];
    
    this.logEvent('queue.cleared', `Cleared ${clearedCount} messages from queue`, {
      clearedCount
    });
  }

  // ============================================================================
  // PERFORMANCE MONITORING AND METRICS
  // ============================================================================

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    messagesSent: number;
    messagesReceived: number;
    averageLatency: number;
    errorCount: number;
    uptime: number;
    errorRate: number;
  } {
    const uptime = Date.now() - this.performanceMetrics.startTime;
    const averageLatency = this.performanceMetrics.messagesSent > 0 
      ? this.performanceMetrics.totalLatency / this.performanceMetrics.messagesSent 
      : 0;
    const totalMessages = this.performanceMetrics.messagesSent + this.performanceMetrics.messagesReceived;
    const errorRate = totalMessages > 0 ? this.performanceMetrics.errorCount / totalMessages : 0;

    return {
      messagesSent: this.performanceMetrics.messagesSent,
      messagesReceived: this.performanceMetrics.messagesReceived,
      averageLatency,
      errorCount: this.performanceMetrics.errorCount,
      uptime,
      errorRate
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      messagesSent: 0,
      messagesReceived: 0,
      totalLatency: 0,
      errorCount: 0,
      startTime: Date.now()
    };

    this.logEvent('metrics.reset', 'Performance metrics reset');
  }

  // ============================================================================
  // EVENT MONITORING AND LOGGING
  // ============================================================================

  /**
   * Log an event for monitoring
   */
  private logEvent(eventType: string, content: string, metadata?: Record<string, any>): void {
    const event = createEventMonitorMessage(
      eventType,
      this.moduleId,
      { content, metadata },
      undefined,
      undefined,
      true
    );

    this.eventLog.push(event);

    // Limit event log size
    const maxLogSize = 500;
    if (this.eventLog.length > maxLogSize) {
      this.eventLog = this.eventLog.slice(-maxLogSize);
    }

    // Also log to console for debugging
    console.log(`[${this.pluginId}/${this.moduleId}] ${eventType}: ${content}`, metadata);
  }

  /**
   * Log an error
   */
  private logError(message: string, context: string, error?: unknown): void {
    this.performanceMetrics.errorCount++;
    
    const errorEvent = createEventMonitorMessage(
      'error',
      this.moduleId,
      { message, context, error },
      undefined,
      undefined,
      false,
      error instanceof Error ? error.message : String(error)
    );

    this.eventLog.push(errorEvent);
    logError(error, `${this.pluginId}/${this.moduleId}/${context}`, { message });
  }

  /**
   * Get event log
   */
  getEventLog(): EventMonitorMessage[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    const clearedCount = this.eventLog.length;
    this.eventLog = [];
    
    console.log(`[${this.pluginId}/${this.moduleId}] Cleared ${clearedCount} events from log`);
  }

  // ============================================================================
  // CLEANUP AND LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Clean up all subscriptions and resources
   */
  cleanup(): void {
    try {
      // Unsubscribe from all active subscriptions
      this.subscribers.forEach((callbacks, moduleId) => {
        callbacks.forEach(callback => {
          if (this.eventService) {
            this.eventService.unsubscribeFromMessages(moduleId, callback);
          }
        });
      });

      // Clear all tracking data
      this.subscribers.clear();
      this.messageQueue = [];
      this.eventLog = [];

      this.logEvent('service.cleanup', 'Event service cleaned up');

    } catch (error) {
      this.logError('Error during cleanup', 'cleanup', error);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable(),
      pluginId: this.pluginId,
      moduleId: this.moduleId,
      activeSubscriptions: Array.from(this.subscribers.values()).reduce((total, set) => total + set.size, 0),
      queueSize: this.messageQueue.length,
      eventLogSize: this.eventLog.length,
      metrics: this.getPerformanceMetrics()
    };
  }
}

/**
 * Factory function to create a new ServiceExampleEventService instance
 */
export const createEventService = (pluginId: string, moduleId: string): ServiceExampleEventService => {
  return new ServiceExampleEventService(pluginId, moduleId);
};

/**
 * Default event service instance for the plugin
 */
export const defaultEventService = createEventService('ServiceExample_Events', 'default');
// Export alias for compatibility with ChatHistory component
export { ServiceExampleEventService as EventServiceWrapper };
