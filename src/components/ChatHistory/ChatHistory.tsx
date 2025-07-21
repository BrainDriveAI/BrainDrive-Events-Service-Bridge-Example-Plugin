/**
 * ChatHistory Component
 * 
 * Demonstrates Event Service Bridge persistence functionality.
 * Shows how to store, retrieve, and manage persistent message history
 * using the Event Service with persistence options enabled.
 */

import React, { Component } from 'react';
import { 
  ChatHistoryProps, 
  ChatHistoryState, 
  PersistedMessage,
  EventOptions,
  MessageFilter,
  HistoryStats
} from '../../types';
import { EventServiceWrapper } from '../../services/eventService';
import { formatTimestamp, generateId, validateMessage } from '../../utils';
import './ChatHistory.css';

export class ChatHistory extends Component<ChatHistoryProps, ChatHistoryState> {
  private eventService: EventServiceWrapper;
  private readonly moduleId = 'ChatHistory';

  constructor(props: ChatHistoryProps) {
    super(props);
    
    this.state = {
      messages: [],
      filteredMessages: [],
      isLoading: false,
      error: null,
      filter: {
        dateRange: { start: '', end: '' },
        messageType: 'all',
        source: 'all',
        searchText: ''
      },
      stats: {
        totalMessages: 0,
        messagesByType: {},
        messagesBySource: {},
        dateRange: { earliest: '', latest: '' }
      },
      selectedMessage: null,
      showDetails: false
    };

    this.eventService = new EventServiceWrapper('ServiceExample_Events', this.moduleId);
    if (props.services.event) {
      this.eventService.initialize(props.services.event);
    }
  }

  componentDidMount(): void {
    this.loadPersistedMessages();
    this.subscribeToNewMessages();
  }

  componentWillUnmount(): void {
    this.eventService.unsubscribeFromMessages(
      this.handleNewMessage,
      { remote: true, persist: true }
    );
  }

  /**
   * Load all persisted messages from the Event Service
   */
  private loadPersistedMessages = async (): Promise<void> => {
    this.setState({ isLoading: true, error: null });

    try {
      // Request persisted messages from the Event Service
      const options: EventOptions = {
        remote: true,
        persist: true,
        priority: 'normal'
      };

      // Send request for historical data
      this.eventService.sendMessage(
        'EventService',
        {
          type: 'HISTORY_REQUEST',
          id: generateId(),
          timestamp: new Date().toISOString(),
          moduleId: this.moduleId,
          filters: this.state.filter
        },
        options
      );

    } catch (error) {
      this.setState({ 
        error: `Failed to load message history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false 
      });
    }
  };

  /**
   * Subscribe to new messages for real-time updates
   */
  private subscribeToNewMessages = (): void => {
    const options: EventOptions = {
      remote: true,
      persist: true,
      priority: 'normal'
    };

    this.eventService.subscribeToMessages(
      this.handleNewMessage,
      options
    );

    this.eventService.subscribeToMessages(
      this.handleHistoryResponse,
      options
    );
  };

  /**
   * Handle new incoming messages
   */
  private handleNewMessage = (message: PersistedMessage): void => {
    if (!validateMessage(message)) {
      console.warn('Invalid message received:', message);
      return;
    }

    this.setState(prevState => {
      const updatedMessages = [...prevState.messages, message];
      const stats = this.calculateStats(updatedMessages);
      const filteredMessages = this.applyFilters(updatedMessages, prevState.filter);

      return {
        messages: updatedMessages,
        filteredMessages,
        stats
      };
    });
  };

  /**
   * Handle history response from Event Service
   */
  private handleHistoryResponse = (response: any): void => {
    if (response.type === 'HISTORY_RESPONSE') {
      const messages: PersistedMessage[] = response.messages || [];
      const stats = this.calculateStats(messages);
      const filteredMessages = this.applyFilters(messages, this.state.filter);

      this.setState({
        messages,
        filteredMessages,
        stats,
        isLoading: false,
        error: null
      });
    }
  };

  /**
   * Calculate statistics for message history
   */
  private calculateStats = (messages: PersistedMessage[]): HistoryStats => {
    const stats: HistoryStats = {
      totalMessages: messages.length,
      messagesByType: {},
      messagesBySource: {},
      dateRange: { earliest: '', latest: '' }
    };

    if (messages.length === 0) {
      return stats;
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    stats.dateRange.earliest = sortedMessages[0].timestamp;
    stats.dateRange.latest = sortedMessages[sortedMessages.length - 1].timestamp;

    // Count by type and source
    messages.forEach(message => {
      // Count by type
      stats.messagesByType[message.type] = (stats.messagesByType[message.type] || 0) + 1;

      // Count by source
      const source = message.source?.moduleId || 'unknown';
      stats.messagesBySource[source] = (stats.messagesBySource[source] || 0) + 1;
    });

    return stats;
  };

  /**
   * Apply filters to message list
   */
  private applyFilters = (messages: PersistedMessage[], filter: MessageFilter): PersistedMessage[] => {
    return messages.filter(message => {
      // Date range filter
      if (filter.dateRange.start && new Date(message.timestamp) < new Date(filter.dateRange.start)) {
        return false;
      }
      if (filter.dateRange.end && new Date(message.timestamp) > new Date(filter.dateRange.end)) {
        return false;
      }

      // Message type filter
      if (filter.messageType !== 'all' && message.type !== filter.messageType) {
        return false;
      }

      // Source filter
      if (filter.source !== 'all' && message.source?.moduleId !== filter.source) {
        return false;
      }

      // Search text filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const messageContent = JSON.stringify(message).toLowerCase();
        if (!messageContent.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  };

  /**
   * Handle filter changes
   */
  private handleFilterChange = (newFilter: Partial<MessageFilter>): void => {
    const updatedFilter = { ...this.state.filter, ...newFilter };
    const filteredMessages = this.applyFilters(this.state.messages, updatedFilter);

    this.setState({
      filter: updatedFilter,
      filteredMessages
    });
  };

  /**
   * Clear all message history
   */
  private clearHistory = (): void => {
    if (window.confirm('Are you sure you want to clear all message history? This action cannot be undone.')) {
      const options: EventOptions = {
        remote: true,
        persist: true,
        priority: 'high'
      };

      this.eventService.sendMessage(
        'EventService',
        {
          type: 'CLEAR_HISTORY',
          id: generateId(),
          timestamp: new Date().toISOString(),
          moduleId: this.moduleId
        },
        options
      );

      this.setState({
        messages: [],
        filteredMessages: [],
        stats: {
          totalMessages: 0,
          messagesByType: {},
          messagesBySource: {},
          dateRange: { earliest: '', latest: '' }
        }
      });
    }
  };

  /**
   * Export message history
   */
  private exportHistory = (): void => {
    const dataStr = JSON.stringify(this.state.messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Select message for detailed view
   */
  private selectMessage = (message: PersistedMessage): void => {
    this.setState({
      selectedMessage: message,
      showDetails: true
    });
  };

  render(): JSX.Element {
    const { 
      filteredMessages, 
      isLoading, 
      error, 
      filter, 
      stats, 
      selectedMessage, 
      showDetails 
    } = this.state;

    return (
      <div className="chat-history module-container">
        <div className="module-header">
          <div className="module-title">
            <span className="module-badge">History</span>
            <h3>Chat History</h3>
          </div>
          <div className="module-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={this.loadPersistedMessages}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={this.exportHistory}
              disabled={filteredMessages.length === 0}
            >
              Export
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={this.clearHistory}
              disabled={stats.totalMessages === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="chat-history-content">
          {/* Feature Description */}
          <div className="feature-description">
            <h4>Message Persistence Demo</h4>
            <ul>
              <li>Demonstrates <code>persist: true</code> option in Event Service</li>
              <li>Shows historical message retrieval and filtering</li>
              <li>Real-time updates with persistent storage</li>
              <li>Message statistics and export functionality</li>
            </ul>
          </div>

          {/* Statistics */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Messages</span>
                <span className="stat-value">{stats.totalMessages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Message Types</span>
                <span className="stat-value">{Object.keys(stats.messagesByType).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sources</span>
                <span className="stat-value">{Object.keys(stats.messagesBySource).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Date Range</span>
                <span className="stat-value">
                  {stats.dateRange.earliest ? 
                    `${Math.ceil((new Date().getTime() - new Date(stats.dateRange.earliest).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <h4>Filters</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Message Type:</label>
                <select 
                  value={filter.messageType} 
                  onChange={(e) => this.handleFilterChange({ messageType: e.target.value })}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  {Object.keys(stats.messagesByType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Source:</label>
                <select 
                  value={filter.source} 
                  onChange={(e) => this.handleFilterChange({ source: e.target.value })}
                  className="input-field"
                >
                  <option value="all">All Sources</option>
                  {Object.keys(stats.messagesBySource).map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Search:</label>
                <input
                  type="text"
                  value={filter.searchText}
                  onChange={(e) => this.handleFilterChange({ searchText: e.target.value })}
                  placeholder="Search messages..."
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Message List */}
          <div className="message-list">
            {isLoading ? (
              <div className="loading-message">Loading message history...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="empty-message">
                {stats.totalMessages === 0 ? 'No messages in history' : 'No messages match current filters'}
              </div>
            ) : (
              filteredMessages.map(message => (
                <div 
                  key={message.id} 
                  className="message-item"
                  onClick={() => this.selectMessage(message)}
                >
                  <div className="message-header">
                    <span className="message-type">{message.type}</span>
                    <span className="message-source">
                      {message.source?.moduleId || 'Unknown'}
                    </span>
                    <span className="message-time">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-preview">
                    {JSON.stringify(message).substring(0, 100)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Details Modal */}
        {showDetails && selectedMessage && (
          <div className="modal-overlay" onClick={() => this.setState({ showDetails: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Message Details</h4>
                <button 
                  className="modal-close"
                  onClick={() => this.setState({ showDetails: false })}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <pre>{JSON.stringify(selectedMessage, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ChatHistory;