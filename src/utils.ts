/**
 * Utility Functions for ServiceExample_Events Plugin
 * 
 * This file contains utility functions for event handling, message formatting,
 * ID generation, and other common operations used throughout the plugin.
 */

import { AllMessageTypes, ChatMessage, SystemMessage, EventMonitorMessage } from './types';

// ============================================================================
// ID GENERATION UTILITIES
// ============================================================================

/**
 * Generate a unique ID for messages, events, and other entities
 */
export const generateId = (prefix: string = 'msg'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate a unique broadcast ID
 */
export const generateBroadcastId = (): string => {
  return generateId('broadcast');
};

/**
 * Generate a unique event ID for monitoring
 */
export const generateEventId = (): string => {
  return generateId('event');
};

// ============================================================================
// TIME AND DATE UTILITIES
// ============================================================================

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string, includeTime: boolean = true): string => {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get relative time string (e.g., "2 minutes ago")
 */
export const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// ============================================================================
// MESSAGE UTILITIES
// ============================================================================

/**
 * Create a chat message
 */
export const createChatMessage = (
  sender: 'left' | 'right',
  content: string,
  isLocal: boolean = true,
  isPersisted: boolean = false,
  messageNumber?: number
): ChatMessage => {
  return {
    id: generateId('chat'),
    type: 'chat.message',
    sender,
    content,
    isLocal,
    isPersisted,
    messageNumber,
    timestamp: getCurrentTimestamp(),
    source: {
      pluginId: 'ServiceExample_Events',
      moduleId: sender === 'left' ? 'left-chat' : 'right-chat'
    }
  };
};

/**
 * Create a system message
 */
export const createSystemMessage = (
  level: 'info' | 'warn' | 'error' | 'debug',
  content: string,
  category: 'event' | 'performance' | 'error' | 'debug' = 'event',
  metadata?: Record<string, any>
): SystemMessage => {
  return {
    id: generateId('system'),
    type: 'system.event',
    level,
    content,
    category,
    metadata,
    timestamp: getCurrentTimestamp()
  };
};

/**
 * Create an event monitor message
 */
export const createEventMonitorMessage = (
  eventType: string,
  sourceModule: string,
  payload: any,
  targetModule?: string,
  processingTime?: number,
  success: boolean = true,
  error?: string
): EventMonitorMessage => {
  return {
    id: generateId('monitor'),
    type: eventType,
    timestamp: getCurrentTimestamp(),
    target: targetModule || 'unknown',
    payload: payload || {},
    latency: processingTime || 0,
    priority: 'normal',
    status: success ? 'received' : 'error',
    source: {
      pluginId: 'ServiceExample_Events',
      moduleId: sourceModule
    }
  };
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate message content
 */
export const validateMessageContent = (content: string, maxLength: number = 1000): {
  isValid: boolean;
  error?: string;
} => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message content cannot be empty' };
  }
  
  if (content.length > maxLength) {
    return { isValid: false, error: `Message content exceeds maximum length of ${maxLength} characters` };
  }
  
  return { isValid: true };
};

/**
 * Validate module ID format
 */
export const validateModuleId = (moduleId: string): boolean => {
  const moduleIdPattern = /^[a-z][a-z0-9-]*[a-z0-9]$/;
  return moduleIdPattern.test(moduleId);
};

/**
 * Validate event options
 */
export const validateEventOptions = (options: any): {
  isValid: boolean;
  error?: string;
} => {
  if (!options || typeof options !== 'object') {
    return { isValid: false, error: 'Event options must be an object' };
  }
  
  if (options.remote !== undefined && typeof options.remote !== 'boolean') {
    return { isValid: false, error: 'remote option must be a boolean' };
  }
  
  if (options.persist !== undefined && typeof options.persist !== 'boolean') {
    return { isValid: false, error: 'persist option must be a boolean' };
  }
  
  if (options.priority !== undefined && !['low', 'normal', 'high'].includes(options.priority)) {
    return { isValid: false, error: 'priority must be one of: low, normal, high' };
  }
  
  return { isValid: true };
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format message for display
 */
export const formatMessageForDisplay = (message: ChatMessage, showTimestamp: boolean = true): string => {
  const senderPrefix = message.sender === 'left' ? 'L:' : 'R:';
  const timestamp = showTimestamp ? ` (${formatTimestamp(message.timestamp)})` : '';
  return `${senderPrefix} ${message.content}${timestamp}`;
};

/**
 * Format event for monitoring display
 */
export const formatEventForMonitor = (event: EventMonitorMessage): string => {
  const status = event.status === 'error' ? '❌' : '✅';
  const target = event.target ? ` → ${event.target}` : '';
  const time = event.latency ? ` (${event.latency}ms)` : '';
  const source = event.source?.moduleId || 'unknown';
  return `${status} ${event.type} from ${source}${target}${time}`;
};

// ============================================================================
// ARRAY AND OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Remove duplicates from array based on a key
 */
export const removeDuplicates = <T>(array: T[], keyFn: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Sort messages by timestamp
 */
export const sortMessagesByTimestamp = <T extends { timestamp: string }>(messages: T[], ascending: boolean = true): T[] => {
  return [...messages].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return ascending ? timeA - timeB : timeB - timeA;
  });
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = async <T>(
  func: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; executionTime: number }> => {
  const startTime = performance.now();
  const result = await func();
  const executionTime = performance.now() - startTime;
  
  if (label) {
    console.log(`${label} executed in ${executionTime.toFixed(2)}ms`);
  }
  
  return { result, executionTime };
};

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Save data to localStorage with error handling
 */
export const saveToLocalStorage = (key: string, data: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

/**
 * Load data from localStorage with error handling
 */
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
    return false;
  }
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Create a safe error message from any error type
 */
export const createSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Log error with context
 */
export const logError = (error: unknown, context: string, metadata?: Record<string, any>): void => {
  const errorMessage = createSafeErrorMessage(error);
  console.error(`[${context}] ${errorMessage}`, metadata);
};
/**
 * Validate message structure
 */
export function validateMessage(message: any): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }
  
  // Check required fields
  if (!message.id || typeof message.id !== 'string') {
    return false;
  }
  
  if (!message.type || typeof message.type !== 'string') {
    return false;
  }
  
  if (!message.timestamp || typeof message.timestamp !== 'string') {
    return false;
  }
  
  // Validate timestamp format
  const timestamp = new Date(message.timestamp);
  if (isNaN(timestamp.getTime())) {
    return false;
  }
  
  return true;
}


// ============================================================================
// MODULE THEME UTILITIES
// ============================================================================

/**
 * Get CSS class name for module theme
 */
export const getThemeClassName = (theme: string): string => {
  const themeMap: Record<string, string> = {
    blue: 'theme-blue',
    green: 'theme-green',
    neutral: 'theme-neutral',
    purple: 'theme-purple',
    orange: 'theme-orange',
    yellow: 'theme-yellow'
  };
  return themeMap[theme] || 'theme-neutral';
};

/**
 * Get theme colors for a module
 */
export const getThemeColors = (theme: string): { primary: string; background: string; text: string } => {
  const colorMap: Record<string, { primary: string; background: string; text: string }> = {
    blue: { primary: '#2196F3', background: '#E3F2FD', text: '#1565C0' },
    green: { primary: '#4CAF50', background: '#E8F5E8', text: '#2E7D32' },
    neutral: { primary: '#757575', background: '#F5F5F5', text: '#424242' },
    purple: { primary: '#9C27B0', background: '#F3E5F5', text: '#7B1FA2' },
    orange: { primary: '#FF9800', background: '#FFF3E0', text: '#F57C00' },
    yellow: { primary: '#FFC107', background: '#FFFDE7', text: '#F9A825' }
  };
  return colorMap[theme] || colorMap.neutral;
};

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

// All utilities are exported individually above using 'export const'
// This provides proper TypeScript support and tree-shaking capabilities