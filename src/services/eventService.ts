/**
 * Event Service for ServiceExample_Events plugin
 * Based on the BrainDriveBasicAIChat reference implementation
 */

/**
 * Interface for event messages that are sent between modules
 */
export interface EventMessage<T = any> {
  type: string;
  source: {
    pluginId: string;
    moduleId: string;
    isRemote: boolean;
  };
  target: {
    pluginId?: string;
    moduleId: string;
    isRemote: boolean;
  };
  content: T;
  timestamp: string;
  id: string;
}

/**
 * Options for sending and subscribing to messages
 */
export interface EventOptions {
  remote: boolean;
  persist?: boolean;
}

/**
 * Interface for the EventService bridge that plugins can use
 */
interface EventServiceBridge {
  sendMessage: <T>(targetModuleId: string, message: T, options?: { remote: boolean, persist?: boolean }) => void;
  subscribeToMessages: <T>(moduleId: string, callback: (message: T) => void, options?: { remote: boolean, persist?: boolean }) => void;
  unsubscribeFromMessages: <T>(moduleId: string, callback: (message: T) => void, options?: { remote: boolean, persist?: boolean }) => void;
}

/**
 * Plugin-specific Event Service wrapper
 * Automatically sets source plugin and module IDs for messages
 */
class PluginEventService {
  private pluginId: string;
  private moduleId: string;
  private serviceBridge?: EventServiceBridge;
  
  constructor(pluginId: string, moduleId: string) {
    this.pluginId = pluginId;
    this.moduleId = moduleId;
  }
  
  /**
   * Set the service bridge (called by the plugin system)
   */
  setServiceBridge(bridge: EventServiceBridge) {
    this.serviceBridge = bridge;
  }
  
  /**
   * Send a message to a target module
   */
  sendMessage<T>(targetModuleId: string, message: T, options: EventOptions = { remote: false }) {
    if (!this.serviceBridge) {
      console.error('[EventService] Service bridge not set');
      return;
    }
    
    // Add source information to the message
    const messageWithSource = {
      ...message,
      _source: {
        pluginId: this.pluginId,
        moduleId: this.moduleId
      }
    };
    
    console.log(`[EventService] Sending message from ${this.pluginId}/${this.moduleId} to ${targetModuleId}:`, messageWithSource);
    
    // Use the service bridge to send the message
    this.serviceBridge.sendMessage(targetModuleId, messageWithSource, options);
  }
  
  /**
   * Subscribe to messages for this module
   */
  subscribeToMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }) {
    if (!this.serviceBridge) {
      console.error('[EventService] Service bridge not set');
      return;
    }
    
    console.log(`[EventService] Subscribing to messages for ${this.moduleId}`);
    
    // Use the service bridge to subscribe to messages for this module
    this.serviceBridge.subscribeToMessages(this.moduleId, callback, options);
  }
  
  /**
   * Unsubscribe from messages for this module
   */
  unsubscribeFromMessages<T>(callback: (message: T) => void, options: EventOptions = { remote: false }) {
    if (!this.serviceBridge) {
      console.error('[EventService] Service bridge not set');
      return;
    }
    
    console.log(`[EventService] Unsubscribing from messages for ${this.moduleId}`);
    
    // Use the service bridge to unsubscribe from messages for this module
    this.serviceBridge.unsubscribeFromMessages(this.moduleId, callback, options);
  }
  
  /**
   * Create a new instance for a different module
   */
  forModule(moduleId: string): PluginEventService {
    const service = new PluginEventService(this.pluginId, moduleId);
    if (this.serviceBridge) {
      service.setServiceBridge(this.serviceBridge);
    }
    return service;
  }
}

// Export factory function to create PluginEventService instances
export const createEventService = (pluginId: string, moduleId: string) => {
  return new PluginEventService(pluginId, moduleId);
};

// Export default instance for the plugin
export const eventService = new PluginEventService('ServiceExample_Events', 'default');