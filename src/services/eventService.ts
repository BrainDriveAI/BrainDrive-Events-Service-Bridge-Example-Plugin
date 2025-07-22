/**
 * Event Service for ServiceExample_Events plugin
 *
 * This service provides a comprehensive wrapper around BrainDrive's Event Service Bridge,
 * demonstrating best practices for inter-module communication within the BrainDrive platform.
 *
 * Key Features:
 * - Type-safe event messaging
 * - Automatic source identification
 * - Error handling and validation
 * - Support for remote and persistent events
 * - Educational logging for debugging
 *
 * Based on the BrainDriveBasicAIChat reference implementation
 */

/**
 * Interface for event messages that are sent between modules
 *
 * This represents the complete structure of an event message in BrainDrive's
 * Event Service system. Understanding this structure is crucial for proper
 * inter-module communication.
 */
export interface EventMessage<T = any> {
  /** The type of event (e.g., 'simple-message', 'broadcast', 'notification') */
  type: string;
  
  /** Information about the message sender */
  source: {
    /** ID of the plugin that sent the message */
    pluginId: string;
    /** ID of the specific module that sent the message */
    moduleId: string;
    /** Whether this message originated from a remote source */
    isRemote: boolean;
  };
  
  /** Information about the message target */
  target: {
    /** ID of the target plugin (optional for same-plugin communication) */
    pluginId?: string;
    /** ID of the target module */
    moduleId: string;
    /** Whether this message should be sent to a remote target */
    isRemote: boolean;
  };
  
  /** The actual message content - can be any type */
  content: T;
  /** ISO timestamp when the message was created */
  timestamp: string;
  /** Unique identifier for this message */
  id: string;
}

/**
 * Options for configuring event behavior
 *
 * These options control how events are handled by the Event Service Bridge:
 * - remote: Whether the event should be sent to remote instances
 * - persist: Whether the event should be stored for later retrieval
 */
export interface EventOptions {
  /**
   * Send event to remote instances of BrainDrive
   * Use this for cross-instance communication
   */
  remote: boolean;
  
  /**
   * Store event for persistence across sessions
   * Use this for events that should survive page reloads
   */
  persist?: boolean;
}

/**
 * Interface for the EventService bridge provided by BrainDrive
 *
 * This is the core interface that BrainDrive provides to plugins for event communication.
 * Your plugin receives an implementation of this interface through the services prop.
 */
interface EventServiceBridge {
  /**
   * Send a message to a target module
   * @param targetModuleId - The ID of the module to send the message to
   * @param message - The message content to send
   * @param options - Configuration options for the message
   */
  sendMessage: <T>(targetModuleId: string, message: T, options?: { remote: boolean, persist?: boolean }) => void;
  
  /**
   * Subscribe to messages for a specific module
   * @param moduleId - The ID of the module to listen for messages
   * @param callback - Function to call when a message is received
   * @param options - Configuration options for the subscription
   */
  subscribeToMessages: <T>(moduleId: string, callback: (message: T) => void, options?: { remote: boolean, persist?: boolean }) => void;
  
  /**
   * Unsubscribe from messages for a specific module
   * @param moduleId - The ID of the module to stop listening for messages
   * @param callback - The callback function to remove
   * @param options - Configuration options for the unsubscription
   */
  unsubscribeFromMessages: <T>(moduleId: string, callback: (message: T) => void, options?: { remote: boolean, persist?: boolean }) => void;
}

/**
 * Custom error types for Event Service operations
 */
export class EventServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EventServiceError';
  }
}

/**
 * Validation utilities for event messages
 */
export class EventValidator {
  /**
   * Validate that a message has required fields
   */
  static validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      console.warn('[EventService] Invalid message: not an object');
      return false;
    }
    
    if (!message.type || typeof message.type !== 'string') {
      console.warn('[EventService] Invalid message: missing or invalid type');
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate event options
   */
  static validateOptions(options: EventOptions): boolean {
    if (typeof options.remote !== 'boolean') {
      console.warn('[EventService] Invalid options: remote must be boolean');
      return false;
    }
    
    if (options.persist !== undefined && typeof options.persist !== 'boolean') {
      console.warn('[EventService] Invalid options: persist must be boolean');
      return false;
    }
    
    return true;
  }
}

/**
 * Plugin-specific Event Service wrapper
 *
 * This class provides a high-level interface for BrainDrive's Event Service Bridge,
 * automatically handling common patterns and providing educational logging.
 *
 * Key Features:
 * - Automatic source identification for all messages
 * - Comprehensive error handling and validation
 * - Educational logging for debugging and learning
 * - Support for advanced event options (remote, persist)
 * - Service availability checking
 * - Message validation and sanitization
 *
 * Usage Pattern:
 * 1. Create instance with createEventService(pluginId, moduleId)
 * 2. Set service bridge when services become available
 * 3. Use sendMessage() to send events to other modules
 * 4. Use subscribeToMessages() to listen for incoming events
 * 5. Always unsubscribe in component cleanup
 */
class PluginEventService {
  private pluginId: string;
  private moduleId: string;
  private serviceBridge?: EventServiceBridge;
  private isConnected: boolean = false;
  private messageCount: number = 0;
  private subscriptions: Set<Function> = new Set();
  
  constructor(pluginId: string, moduleId: string) {
    this.pluginId = pluginId;
    this.moduleId = moduleId;
    
    // Educational logging
    console.log(`[EventService] Created service instance for ${pluginId}/${moduleId}`);
  }
  
  /**
   * Set the service bridge (called by the plugin system)
   *
   * This method is called by BrainDrive when the Event Service becomes available.
   * It's the critical connection point between your plugin and BrainDrive's event system.
   *
   * @param bridge - The Event Service Bridge implementation from BrainDrive
   */
  setServiceBridge(bridge: EventServiceBridge) {
    if (!bridge) {
      throw new EventServiceError('Service bridge cannot be null', 'INVALID_BRIDGE');
    }
    
    this.serviceBridge = bridge;
    this.isConnected = true;
    
    // Educational logging
    console.log(`[EventService] ✅ Service bridge connected for ${this.pluginId}/${this.moduleId}`);
    console.log(`[EventService] 📚 LEARNING: This connection allows your module to send and receive events`);
  }
  
  /**
   * Check if the Event Service is available and connected
   *
   * Always check this before attempting to send messages or subscribe to events.
   * This is a common pattern in BrainDrive plugin development.
   *
   * @returns true if the service is available, false otherwise
   */
  isServiceAvailable(): boolean {
    const available = this.serviceBridge !== undefined && this.isConnected;
    
    if (!available) {
      console.warn(`[EventService] ⚠️ Service not available for ${this.pluginId}/${this.moduleId}`);
      console.log(`[EventService] 📚 LEARNING: Check service availability before sending events`);
    }
    
    return available;
  }
  
  /**
   * Send a message to a target module
   *
   * This is the primary method for inter-module communication in BrainDrive.
   * It demonstrates proper error handling, validation, and logging patterns.
   *
   * @param targetModuleId - The ID of the module to send the message to
   * @param message - The message content (will be validated)
   * @param options - Event options (remote, persist)
   * @throws EventServiceError if service is unavailable or message is invalid
   */
  sendMessage<T>(targetModuleId: string, message: T, options: EventOptions = { remote: false }): void {
    // Step 1: Validate service availability
    if (!this.isServiceAvailable()) {
      throw new EventServiceError(
        'Event Service not available. Ensure setServiceBridge() was called.',
        'SERVICE_UNAVAILABLE'
      );
    }
    
    // Step 2: Validate inputs
    if (!targetModuleId || typeof targetModuleId !== 'string') {
      throw new EventServiceError('Target module ID must be a non-empty string', 'INVALID_TARGET');
    }
    
    if (!EventValidator.validateMessage(message)) {
      throw new EventServiceError('Invalid message format', 'INVALID_MESSAGE');
    }
    
    if (!EventValidator.validateOptions(options)) {
      throw new EventServiceError('Invalid event options', 'INVALID_OPTIONS');
    }
    
    try {
      // Step 3: Enhance message with source information
      const messageWithSource = {
        ...message,
        _source: {
          pluginId: this.pluginId,
          moduleId: this.moduleId
        },
        _metadata: {
          sentAt: new Date().toISOString(),
          messageId: `${this.pluginId}_${this.moduleId}_${++this.messageCount}`,
          options: options
        }
      };
      
      // Step 4: Educational logging
      console.group(`[EventService] 📤 Sending Message #${this.messageCount}`);
      console.log(`From: ${this.pluginId}/${this.moduleId}`);
      console.log(`To: ${targetModuleId}`);
      console.log(`Options:`, options);
      console.log(`Message:`, messageWithSource);
      console.log(`📚 LEARNING: ${options.remote ? 'Remote event will be sent to other BrainDrive instances' : 'Local event stays on this page'}`);
      if (options.persist) {
        console.log(`📚 LEARNING: Persistent event will survive page reloads`);
      }
      console.groupEnd();
      
      // Step 5: Send the message through the service bridge
      this.serviceBridge!.sendMessage(targetModuleId, messageWithSource, options);
      
    } catch (error) {
      console.error(`[EventService] ❌ Failed to send message:`, error);
      throw new EventServiceError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEND_FAILED'
      );
    }
  }
  
  /**
   * Subscribe to messages for this module
   *
   * This method sets up event listening for the current module. It demonstrates
   * proper subscription patterns and error handling in BrainDrive plugins.
   *
   * @param callback - Function to call when a message is received
   * @param options - Event options (remote, persist)
   * @throws EventServiceError if service is unavailable
   */
  subscribeToMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }): void {
    // Step 1: Validate service availability
    if (!this.isServiceAvailable()) {
      throw new EventServiceError(
        'Event Service not available. Ensure setServiceBridge() was called.',
        'SERVICE_UNAVAILABLE'
      );
    }
    
    // Step 2: Validate callback
    if (typeof callback !== 'function') {
      throw new EventServiceError('Callback must be a function', 'INVALID_CALLBACK');
    }
    
    // Step 3: Validate options
    if (!EventValidator.validateOptions(options)) {
      throw new EventServiceError('Invalid event options', 'INVALID_OPTIONS');
    }
    
    try {
      // Step 4: Create enhanced callback with logging (only in development)
      const enhancedCallback = (message: T) => {
        // Educational logging (only in development to avoid production noise)
        if (process.env.NODE_ENV === 'development') {
          console.group(`[EventService] 📥 Message Received`);
          console.log(`Module: ${this.moduleId}`);
          console.log(`Message:`, message);
          console.log(`📚 LEARNING: This message was received through the Event Service Bridge`);
          console.groupEnd();
        }
        
        // Call the original callback
        callback(message);
      };
      
      // Step 5: Track subscription for cleanup
      this.subscriptions.add(callback); // Track original callback, not enhanced
      
      // Step 6: Educational logging
      console.log(`[EventService] 🔔 Subscribing to messages for ${this.moduleId}`);
      console.log(`[EventService] 📚 LEARNING: ${options.remote ? 'Will receive remote events from other instances' : 'Will receive local events from this page'}`);
      if (options.persist) {
        console.log(`[EventService] 📚 LEARNING: Will receive persistent events from previous sessions`);
      }
      
      // Step 7: Subscribe through the service bridge with original callback
      // Note: Using original callback to avoid double-wrapping issues
      this.serviceBridge!.subscribeToMessages(this.moduleId, callback, options);
      
    } catch (error) {
      console.error(`[EventService] ❌ Failed to subscribe to messages:`, error);
      throw new EventServiceError(
        `Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SUBSCRIBE_FAILED'
      );
    }
  }
  
  /**
   * Unsubscribe from messages for this module
   *
   * Always call this method in your component's cleanup (componentWillUnmount)
   * to prevent memory leaks and unexpected behavior.
   *
   * @param callback - The callback function to remove
   * @param options - Event options (must match subscription options)
   */
  unsubscribeFromMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }): void {
    if (!this.isServiceAvailable()) {
      console.warn(`[EventService] Cannot unsubscribe: service not available`);
      return;
    }
    
    try {
      // Remove from tracking
      this.subscriptions.delete(callback);
      
      // Educational logging
      console.log(`[EventService] 🔕 Unsubscribing from messages for ${this.moduleId}`);
      console.log(`[EventService] 📚 LEARNING: Always unsubscribe in component cleanup to prevent memory leaks`);
      
      // Unsubscribe through the service bridge
      this.serviceBridge!.unsubscribeFromMessages(this.moduleId, callback, options);
      
    } catch (error) {
      console.error(`[EventService] ❌ Failed to unsubscribe:`, error);
    }
  }
  
  /**
   * Unsubscribe from all messages (cleanup helper)
   *
   * Call this method when your component is being destroyed to ensure
   * all subscriptions are properly cleaned up.
   */
  unsubscribeAll(): void {
    console.log(`[EventService] 🧹 Cleaning up all subscriptions for ${this.moduleId}`);
    
    this.subscriptions.forEach(callback => {
      try {
        // Use the original callback for unsubscription
        this.serviceBridge?.unsubscribeFromMessages(this.moduleId, callback as any);
      } catch (error) {
        console.warn(`[EventService] Failed to unsubscribe callback:`, error);
      }
    });
    
    this.subscriptions.clear();
    console.log(`[EventService] 📚 LEARNING: All subscriptions cleaned up - no memory leaks!`);
  }
  
  /**
   * Get service statistics for debugging and learning
   *
   * This method provides insights into the service usage, helpful for
   * debugging and understanding event flow patterns.
   */
  getServiceStats() {
    return {
      pluginId: this.pluginId,
      moduleId: this.moduleId,
      isConnected: this.isConnected,
      messagesSent: this.messageCount,
      activeSubscriptions: this.subscriptions.size,
      serviceBridgeAvailable: !!this.serviceBridge
    };
  }
  
  /**
   * Create a new instance for a different module
   *
   * This is useful when you need to send messages from different module contexts
   * within the same plugin.
   *
   * @param moduleId - The ID of the new module
   * @returns A new PluginEventService instance
   */
  forModule(moduleId: string): PluginEventService {
    const service = new PluginEventService(this.pluginId, moduleId);
    
    // Share the service bridge if available
    if (this.serviceBridge) {
      service.setServiceBridge(this.serviceBridge);
    }
    
    console.log(`[EventService] 📚 LEARNING: Created new service instance for module ${moduleId}`);
    return service;
  }
}

/**
 * Factory function to create PluginEventService instances
 *
 * This is the recommended way to create Event Service instances in your components.
 * Each component should create its own instance with a unique module ID.
 *
 * @param pluginId - The ID of your plugin (should match plugin.json)
 * @param moduleId - A unique ID for this module/component
 * @returns A new PluginEventService instance
 *
 * @example
 * ```typescript
 * // In your component
 * const eventService = createEventService('MyPlugin', 'my-component');
 *
 * // In componentDidMount or useEffect
 * if (props.services?.event) {
 *   eventService.setServiceBridge(props.services.event);
 * }
 * ```
 */
export const createEventService = (pluginId: string, moduleId: string): PluginEventService => {
  console.log(`[EventService] 📚 LEARNING: Creating Event Service for ${pluginId}/${moduleId}`);
  console.log(`[EventService] 📚 LEARNING: Remember to call setServiceBridge() when services become available`);
  
  return new PluginEventService(pluginId, moduleId);
};

/**
 * Default Event Service instance for the ServiceExample_Events plugin
 *
 * This is a convenience export for simple use cases. For most components,
 * you should create your own instance using createEventService().
 *
 * @deprecated Use createEventService() instead for better module isolation
 */
export const eventService = new PluginEventService('ServiceExample_Events', 'default');

/**
 * Educational helper function to demonstrate Event Service concepts
 *
 * This function logs important concepts about the Event Service Bridge
 * to help developers understand how it works.
 */
export const logEventServiceConcepts = () => {
  console.group('[EventService] 📚 EDUCATIONAL: Event Service Bridge Concepts');
  
  console.log('🔗 Service Bridge Connection:');
  console.log('  - The Event Service Bridge is provided by BrainDrive through props.services.event');
  console.log('  - Always check if the service is available before using it');
  console.log('  - Call setServiceBridge() to connect your plugin to the event system');
  
  console.log('📤 Sending Events:');
  console.log('  - Use sendMessage() to send events to other modules');
  console.log('  - Specify target module ID and message content');
  console.log('  - Use options.remote: true for cross-instance communication');
  console.log('  - Use options.persist: true for events that survive page reloads');
  
  console.log('📥 Receiving Events:');
  console.log('  - Use subscribeToMessages() to listen for incoming events');
  console.log('  - Always unsubscribe in component cleanup to prevent memory leaks');
  console.log('  - Handle errors gracefully in your message callbacks');
  
  console.log('🔧 Best Practices:');
  console.log('  - Create unique module IDs for each component');
  console.log('  - Validate message content before processing');
  console.log('  - Use try-catch blocks around Event Service operations');
  console.log('  - Log events for debugging and learning');
  
  console.log('⚠️ Common Pitfalls:');
  console.log('  - Forgetting to unsubscribe (causes memory leaks)');
  console.log('  - Not checking service availability (causes errors)');
  console.log('  - Using the same module ID for multiple components (causes conflicts)');
  console.log('  - Not handling service bridge connection failures');
  
  console.groupEnd();
};

// Log concepts when the module is imported (educational)
if (typeof window !== 'undefined' && window.console) {
  // Only log in browser environment
  setTimeout(() => {
    console.log('[EventService] 📚 LEARNING: Event Service module loaded. Call logEventServiceConcepts() to see educational information.');
  }, 100);
}