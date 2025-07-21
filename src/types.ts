/**
 * Comprehensive Type Definitions for ServiceExample_Events Plugin
 * 
 * This file contains all type definitions for demonstrating the Event Service Bridge
 * functionality in BrainDrive. It covers all message types, service interfaces,
 * and component props for the complete event service demonstration.
 */

// ============================================================================
// PLUGIN TEMPLATE TYPES (Legacy compatibility)
// ============================================================================

export interface PluginData {
  id: string;
  name: string;
  version: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PluginTemplateProps {
  pluginData?: PluginData;
  onUpdate?: (data: any) => void;
  className?: string;
}

export interface PluginTemplateState {
  isLoaded: boolean;
  error?: string;
  data?: any;
}

export interface ApiService {
  get: (endpoint: string) => Promise<any>;
  post: (endpoint: string, data: any) => Promise<any>;
  put: (endpoint: string, data: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base message interface that all event messages extend
 */
export interface BaseMessage {
  id: string;
  type: string;
  timestamp: string;
  source?: {
    pluginId: string;
    moduleId: string;
  };
}

/**
 * Event options for all event service methods
 */
export interface EventOptions {
  remote: boolean;        // Target remote modules
  persist?: boolean;      // Enable message persistence
  priority?: 'low' | 'normal' | 'high';  // Message priority
  timeout?: number;       // Message timeout (ms)
  retries?: number;       // Retry attempts for failed messages
}

/**
 * Event service interface (matches BrainDrive's EventService)
 */
export interface EventService {
  sendMessage<T>(targetModuleId: string, message: T, options?: EventOptions): void;
  subscribeToMessages<T>(moduleId: string, callback: (message: T) => void, options?: EventOptions): void;
  unsubscribeFromMessages<T>(moduleId: string, callback: (message: T) => void, options?: EventOptions): void;
}

/**
 * Services interface for BrainDrive plugin props
 */
export interface Services {
  event?: EventService;
  api?: {
    get: (url: string) => Promise<any>;
    post: (url: string, data?: any) => Promise<any>;
    put: (url: string, data?: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
  };
  theme?: {
    getCurrentTheme: () => string;
    addThemeChangeListener: (listener: (theme: string) => void) => void;
    removeThemeChangeListener: (listener: (theme: string) => void) => void;
  };
  settings?: {
    getSetting: (key: string) => Promise<any>;
    setSetting: (key: string, value: any) => Promise<void>;
  };
  pageContext?: {
    getCurrentPageContext: () => PageContext;
    onPageContextChange: (handler: (context: PageContext) => void) => () => void;
  };
}

/**
 * Page context interface
 */
export interface PageContext {
  pageId?: string;
  pageName?: string;
  pageRoute?: string;
  isStudioPage?: boolean;
}

// ============================================================================
// MESSAGE TYPE DEFINITIONS
// ============================================================================

/**
 * Chat messages (basic functionality)
 */
export interface ChatMessage extends BaseMessage {
  type: 'chat.message';
  sender: 'left' | 'right';
  content: string;
  isLocal: boolean;
  isPersisted: boolean;
  messageNumber?: number;  // For tracking alternating sequence
}

/**
 * State management messages
 */
export interface StateMessage extends BaseMessage {
  type: 'chat.state.change';
  activeModule: 'left' | 'right';
  previousModule: 'left' | 'right';
  reason: 'message_sent' | 'message_received' | 'manual_toggle' | 'initialization';
  isEnabled: boolean;
}

/**
 * Broadcast messages
 */
export interface BroadcastMessage extends BaseMessage {
  type: 'broadcast.announcement';
  content: string;
  targets: string[];
  priority: 'low' | 'normal' | 'high';
  broadcastId: string;
  confirmationRequired?: boolean;
}

/**
 * Broadcast confirmation messages
 */
export interface BroadcastConfirmation extends BaseMessage {
  type: 'broadcast.confirmation';
  broadcastId: string;
  moduleId: string;
  status: 'received' | 'processed' | 'confirmed' | 'timeout' | 'error';
  deliveryTime?: number;
  error?: string;
}

/**
 * System messages (monitoring, debugging)
 */
export interface SystemMessage extends BaseMessage {
  type: 'system.event' | 'system.error' | 'system.debug' | 'system.info';
  level: 'info' | 'warn' | 'error' | 'debug';
  content: string;
  metadata?: Record<string, any>;
  category?: 'event' | 'performance' | 'error' | 'debug';
}

/**
 * Queue management messages
 */
export interface QueueMessage extends BaseMessage {
  type: 'queue.status' | 'queue.clear' | 'queue.replay' | 'queue.pause' | 'queue.resume';
  queueSize: number;
  action?: 'pause' | 'resume' | 'clear' | 'replay';
  queueId?: string;
  affectedMessages?: number;
}

/**
 * Connection status messages
 */
export interface ConnectionMessage extends BaseMessage {
  type: 'connection.status';
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  isRemote: boolean;
  latency?: number;
  error?: string;
  connectionId?: string;
}

/**
 * Performance monitoring messages
 */
export interface PerformanceMessage extends BaseMessage {
  type: 'performance.metrics';
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  errorCount: number;
  uptime: number;
  memoryUsage?: number;
}

/**
 * Event monitoring messages
 */
export interface EventMonitorMessage extends BaseMessage {
  type: string;
  target: string;
  payload: any;
  latency: number;
  priority: 'low' | 'normal' | 'high';
  status: 'received' | 'sent' | 'error' | 'pending';
}

// ============================================================================
// UNION TYPES FOR ALL MESSAGES
// ============================================================================

/**
 * Union type for all possible message types
 */
export type AllMessageTypes = 
  | ChatMessage 
  | StateMessage 
  | BroadcastMessage 
  | BroadcastConfirmation
  | SystemMessage 
  | QueueMessage 
  | ConnectionMessage 
  | PerformanceMessage
  | EventMonitorMessage;

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Base props for all plugin components
 */
export interface BaseComponentProps {
  title?: string;
  description?: string;
  pluginId?: string;
  moduleId?: string;
  instanceId?: string;
  services: Services;
  config?: Record<string, any>;
}

/**
 * LeftChat component props
 */
export interface LeftChatProps extends BaseComponentProps {
  placeholder?: string;
  buttonText?: string;
  theme?: string;
  initialEnabled?: boolean;
  showDebugInfo?: boolean;
  maxMessageLength?: number;
}

/**
 * RightChat component props
 */
export interface RightChatProps extends BaseComponentProps {
  placeholder?: string;
  buttonText?: string;
  theme?: string;
  initialEnabled?: boolean;
  enablePersistence?: boolean;
  remoteMode?: boolean;
  showAdvancedOptions?: boolean;
  maxMessageLength?: number;
}

/**
 * ChatHistory component props
 */
export interface ChatHistoryProps extends BaseComponentProps {
  maxMessages?: number;
  showTimestamps?: boolean;
  autoScroll?: boolean;
  showMessageNumbers?: boolean;
  enableExport?: boolean;
  persistenceEnabled?: boolean;
}

/**
 * EventMonitor component props
 */
export interface EventMonitorProps extends BaseComponentProps {
  maxEvents?: number;
  showDebugInfo?: boolean;
  filterEvents?: string[];
  refreshInterval?: number;
  showPerformanceMetrics?: boolean;
  enableEventSearch?: boolean;
}

/**
 * MessageQueue component props
 */
export interface MessageQueueProps extends BaseComponentProps {
  showQueueStats?: boolean;
  queueLimit?: number;
  enableQueueControls?: boolean;
  showQueueHistory?: boolean;
  autoRefresh?: boolean;
}

/**
 * BroadcastCenter component props
 */
export interface BroadcastCenterProps extends BaseComponentProps {
  defaultTargets?: string[];
  confirmBroadcasts?: boolean;
  showTargetStatus?: boolean;
  enableScheduling?: boolean;
  maxTargets?: number;
}

// ============================================================================
// COMPONENT STATE INTERFACES
// ============================================================================

/**
 * Base state interface for all components
 */
export interface BaseComponentState {
  isLoading: boolean;
  error: string;
  currentTheme: string;
  isInitializing: boolean;
}

/**
 * LeftChat component state
 */
export interface LeftChatState extends BaseComponentState {
  inputText: string;
  isEnabled: boolean;
  messagesSent: number;
  lastMessageTime?: string;
  debugInfo: SystemMessage[];
}

/**
 * RightChat component state
 */
export interface RightChatState extends BaseComponentState {
  inputText: string;
  isEnabled: boolean;
  messagesSent: number;
  lastMessageTime?: string;
  persistenceEnabled: boolean;
  remoteMode: boolean;
  connectionStatus: ConnectionStatus;
}

/**
 * ChatHistory component state
 */
export interface ChatHistoryState {
  isLoading: boolean;
  error: string | null;
  messages: PersistedMessage[];
  filteredMessages: PersistedMessage[];
  filter: MessageFilter;
  stats: HistoryStats;
  selectedMessage: PersistedMessage | null;
  showDetails: boolean;
}

/**
 * EventMonitor component state
 */
export interface EventMonitorState {
  isLoading: boolean;
  error: string | null;
  events: EventMonitorMessage[];
  filteredEvents: EventMonitorMessage[];
  isMonitoring: boolean;
  filter: EventFilter;
  stats: EventStats;
  selectedEvent: EventMonitorMessage | null;
  showDetails: boolean;
  autoScroll: boolean;
  maxEvents: number;
}

/**
 * MessageQueue component state
 */
// MessageQueueState is defined separately below

/**
 * BroadcastCenter component state
 */
// BroadcastCenterState is defined separately below

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (message: T) => void;

/**
 * Module theme types
 */
export type ModuleTheme = 'blue' | 'green' | 'neutral' | 'purple' | 'orange' | 'yellow';

/**
 * Connection status types
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'connecting' | 'error';

/**
 * Message priority types
 */
export type MessagePriority = 'low' | 'normal' | 'high';

/**
 * Event monitoring filter types
 */
export type EventFilter = {
  type?: string[];
  source?: string[];
  target?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  priority?: MessagePriority[];
};

/**
 * Queue operation types
 */
export type QueueOperation = 'pause' | 'resume' | 'clear' | 'replay' | 'export';

/**
 * Broadcast target status
 */
export type TargetStatus = {
  moduleId: string;
  status: 'pending' | 'sent' | 'confirmed' | 'error';
  timestamp: string;
  error?: string;
};

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  eventService: {
    defaultRemote: boolean;
    defaultPersistence: boolean;
    queueLimit: number;
    retryAttempts: number;
    timeout: number;
  };
  ui: {
    theme: ModuleTheme;
    showDebugInfo: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  modules: {
    leftChat: Partial<LeftChatProps>;
    rightChat: Partial<RightChatProps>;
    chatHistory: Partial<ChatHistoryProps>;
    eventMonitor: Partial<EventMonitorProps>;
    messageQueue: Partial<MessageQueueProps>;
    broadcastCenter: Partial<BroadcastCenterProps>;
  };
}

/**
 * Event service statistics
 */
export interface EventServiceStats {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  averageLatency: number;
  errorRate: number;
  uptime: number;
  activeConnections: number;
  queueSize: number;
  lastActivity: string;
}

// ============================================================================
// CHAT HISTORY TYPES
// ============================================================================

export interface PersistedMessage extends BaseMessage {
  content: any;
  persistedAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface MessageFilter {
  dateRange: {
    start: string;
    end: string;
  };
  messageType: string;
  source: string;
  searchText: string;
}

export interface HistoryStats {
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesBySource: Record<string, number>;
  dateRange: {
    earliest: string;
    latest: string;
  };
}

export interface ChatHistoryProps extends BaseComponentProps {
  // Additional props specific to ChatHistory
}

export interface ChatHistoryState {
  isLoading: boolean;
  error: string | null;
  messages: PersistedMessage[];
  filteredMessages: PersistedMessage[];
  filter: MessageFilter;
  stats: HistoryStats;
  selectedMessage: PersistedMessage | null;
  showDetails: boolean;
}

// ============================================================================
// EVENT MONITOR TYPES
// ============================================================================

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  eventsByTarget: Record<string, number>;
  averageLatency: number;
  errorRate: number;
  eventsPerSecond: number;
  lastUpdate: string;
}

export interface EventMonitorProps extends BaseComponentProps {
  // Additional props specific to EventMonitor
}

// ============================================================================
// MESSAGE QUEUE TYPES
// ============================================================================

export interface QueuedMessage {
  id: string;
  originalMessage: AllMessageTypes;
  queuedAt: string;
  processedAt?: string;
  attempts: number;
  status: 'queued' | 'processing' | 'processed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  processingTime?: number;
  error?: string;
}

export interface QueueStats {
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  queueSize: number;
  processingRate: number;
  lastProcessed: string | null;
}

export interface MessageQueueProps extends BaseComponentProps {
  // Additional props specific to MessageQueue
}

export interface MessageQueueState {
  isLoading: boolean;
  error: string | null;
  queuedMessages: QueuedMessage[];
  processedMessages: QueuedMessage[];
  failedMessages: QueuedMessage[];
  isProcessing: boolean;
  isPaused: boolean;
  processingSpeed: number;
  maxQueueSize: number;
  stats: QueueStats;
  selectedMessage: QueuedMessage | null;
  showDetails: boolean;
  autoProcess: boolean;
  retryFailedMessages: boolean;
}

// ============================================================================
// BROADCAST CENTER TYPES
// ============================================================================

export interface BroadcastTarget {
  id: string;
  name: string;
  status: 'available' | 'unavailable' | 'busy';
  lastSeen: string;
}

export interface BroadcastStats {
  totalBroadcasts: number;
  totalTargets: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  lastBroadcast: string | null;
}

export interface BroadcastCenterProps extends BaseComponentProps {
  // Additional props specific to BroadcastCenter
}

export interface BroadcastCenterState {
  isLoading: boolean;
  error: string | null;
  availableTargets: BroadcastTarget[];
  selectedTargets: string[];
  broadcastMessage: string;
  broadcastHistory: BroadcastMessage[];
  confirmations: BroadcastConfirmation[];
  isConfirmationRequired: boolean;
  confirmationTimeout: number;
  broadcastPriority: 'low' | 'normal' | 'high';
  enablePersistence: boolean;
  stats: BroadcastStats;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types are exported individually above using 'export interface' and 'export type'
// This provides proper TypeScript type checking and IntelliSense support