/**
 * Shared Components Index
 * 
 * Centralized exports for all shared components used across
 * the ServiceExample_Events plugin modules.
 * 
 * This file provides a clean import interface for:
 * - MessageBubble: Reusable message display component
 * - ChatInput: Consistent message input functionality
 * - EventLogger: Real-time event logging and debugging
 */

// MessageBubble component and types
export { MessageBubble, default as MessageBubbleComponent } from './MessageBubble';
export type { MessageBubbleProps } from './MessageBubble';

// ChatInput component and types
export { ChatInput, default as ChatInputComponent } from './ChatInput';
export type { ChatInputProps, ChatInputState } from './ChatInput';

// EventLogger component and types
export { EventLogger, default as EventLoggerComponent } from './EventLogger';
export type { EventLoggerProps, EventLoggerState, LogEntry } from './EventLogger';

// Re-export all components as a namespace for convenience
export * as SharedComponents from './index';