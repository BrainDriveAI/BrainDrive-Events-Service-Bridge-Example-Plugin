/**
 * MessageBubble Component
 * 
 * A reusable message bubble component used across multiple modules
 * to display chat messages with consistent styling and functionality.
 * 
 * Features:
 * - Flexible message display with sender/receiver styling
 * - Timestamp formatting
 * - Message status indicators
 * - Event metadata display
 * - Responsive design
 * - Accessibility support
 */

import React from 'react';
import { BaseMessage } from '../../types';
import { formatTimestamp } from '../../utils';
import './MessageBubble.css';

export interface MessageBubbleProps {
  message: BaseMessage;
  variant?: 'sent' | 'received' | 'system' | 'broadcast';
  showTimestamp?: boolean;
  showMetadata?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: (message: BaseMessage) => void;
}

export class MessageBubble extends React.Component<MessageBubbleProps> {
  /**
   * Get message status indicator
   */
  private getStatusIndicator = (): string => {
    const { message } = this.props;
    
    // Check for different message types and their status
    if ('status' in message) {
      switch (message.status) {
        case 'sent': return '📤';
        case 'delivered': return '✅';
        case 'read': return '👁️';
        case 'failed': return '❌';
        case 'pending': return '⏳';
        case 'processed': return '✅';
        case 'queued': return '📋';
        case 'broadcasting': return '📡';
        case 'confirmed': return '✅';
        case 'timeout': return '⏰';
        case 'error': return '⚠️';
        default: return '';
      }
    }
    
    return '';
  };

  /**
   * Get message type icon
   */
  private getTypeIcon = (): string => {
    const { message } = this.props;
    
    switch (message.type) {
      case 'chat.message': return '💬';
      case 'chat.typing': return '✏️';
      case 'broadcast.message': return '📡';
      case 'broadcast.confirmation': return '✅';
      case 'queue.message': return '📋';
      case 'queue.processed': return '⚡';
      case 'system.event': return '🔧';
      case 'system.error': return '⚠️';
      case 'system.info': return 'ℹ️';
      case 'connection.status': return '🔗';
      case 'performance.metric': return '📊';
      default: return '📝';
    }
  };

  /**
   * Get message content for display
   */
  private getMessageContent = (): string => {
    const { message } = this.props;
    
    if ('content' in message && typeof message.content === 'string') {
      return message.content;
    }
    
    if ('text' in message && typeof message.text === 'string') {
      return message.text;
    }
    
    // For system messages or complex content
    if (message.type.startsWith('system.')) {
      return `${message.type}: ${JSON.stringify(message, null, 2)}`;
    }
    
    // Fallback to stringified message
    return JSON.stringify(message, null, 2);
  };

  /**
   * Get sender information
   */
  private getSenderInfo = (): string => {
    const { message } = this.props;
    
    if ('sender' in message && typeof message.sender === 'string') {
      return message.sender;
    }
    
    if ('moduleId' in message && typeof message.moduleId === 'string') {
      return message.moduleId;
    }
    
    if ('from' in message && typeof message.from === 'string') {
      return message.from;
    }
    
    return 'Unknown';
  };

  /**
   * Handle message click
   */
  private handleClick = (): void => {
    const { onClick, message } = this.props;
    if (onClick) {
      onClick(message);
    }
  };

  /**
   * Render metadata section
   */
  private renderMetadata = (): React.ReactNode => {
    const { message, showMetadata } = this.props;
    
    if (!showMetadata) return null;
    
    const metadata: Array<{ key: string; value: any }> = [];
    
    // Add relevant metadata based on message type
    if ('priority' in message) {
      metadata.push({ key: 'Priority', value: message.priority });
    }
    
    if ('isRemote' in message) {
      metadata.push({ key: 'Remote', value: message.isRemote ? 'Yes' : 'No' });
    }
    
    if ('persist' in message) {
      metadata.push({ key: 'Persist', value: message.persist ? 'Yes' : 'No' });
    }
    
    if ('retryCount' in message) {
      metadata.push({ key: 'Retries', value: message.retryCount });
    }
    
    if ('processingTime' in message) {
      metadata.push({ key: 'Processing', value: `${message.processingTime}ms` });
    }
    
    if (metadata.length === 0) return null;
    
    return (
      <div className="message-bubble__metadata">
        {metadata.map(({ key, value }) => (
          <span key={key} className="message-bubble__metadata-item">
            <strong>{key}:</strong> {String(value)}
          </span>
        ))}
      </div>
    );
  };

  /**
   * Render status section
   */
  private renderStatus = (): React.ReactNode => {
    const { showStatus } = this.props;
    
    if (!showStatus) return null;
    
    const statusIndicator = this.getStatusIndicator();
    if (!statusIndicator) return null;
    
    return (
      <div className="message-bubble__status">
        <span className="message-bubble__status-indicator">
          {statusIndicator}
        </span>
      </div>
    );
  };

  render(): React.ReactNode {
    const {
      message,
      variant = 'received',
      showTimestamp = true,
      compact = false,
      className = '',
      onClick
    } = this.props;

    const bubbleClasses = [
      'message-bubble',
      `message-bubble--${variant}`,
      compact ? 'message-bubble--compact' : '',
      onClick ? 'message-bubble--clickable' : '',
      className
    ].filter(Boolean).join(' ');

    const content = this.getMessageContent();
    const sender = this.getSenderInfo();
    const typeIcon = this.getTypeIcon();

    return (
      <div 
        className={bubbleClasses}
        onClick={onClick ? this.handleClick : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleClick();
          }
        } : undefined}
      >
        <div className="message-bubble__header">
          <div className="message-bubble__sender">
            <span className="message-bubble__type-icon">{typeIcon}</span>
            <span className="message-bubble__sender-name">{sender}</span>
          </div>
          
          {showTimestamp && (
            <div className="message-bubble__timestamp">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>

        <div className="message-bubble__content">
          {content}
        </div>

        {this.renderMetadata()}
        {this.renderStatus()}
      </div>
    );
  }
}

export default MessageBubble;