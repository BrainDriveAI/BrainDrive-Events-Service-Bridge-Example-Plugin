/**
 * MessageQueue Component
 * 
 * Demonstrates Event Service Bridge message queuing functionality.
 * Shows how to queue, process, and manage messages with various
 * queue operations and visualization capabilities.
 */

import React, { Component } from 'react';
import { 
  MessageQueueProps, 
  MessageQueueState, 
  QueuedMessage,
  QueueStats,
  EventOptions,
  AllMessageTypes
} from '../../types';
import { EventServiceWrapper } from '../../services/eventService';
import { formatTimestamp, generateId } from '../../utils';
import './MessageQueue.css';

export class MessageQueue extends Component<MessageQueueProps, MessageQueueState> {
  private eventService: EventServiceWrapper;
  private readonly moduleId = 'MessageQueue';
  private processingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(props: MessageQueueProps) {
    super(props);
    
    this.state = {
      isLoading: false,
      error: null,
      queuedMessages: [],
      processedMessages: [],
      failedMessages: [],
      isProcessing: false,
      isPaused: false,
      processingSpeed: 1000, // ms between messages
      maxQueueSize: 100,
      stats: {
        totalQueued: 0,
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        queueSize: 0,
        processingRate: 0,
        lastProcessed: null
      },
      selectedMessage: null,
      showDetails: false,
      autoProcess: true,
      retryFailedMessages: true
    };

    this.eventService = new EventServiceWrapper('ServiceExample_Events', this.moduleId);
    if (props.services.event) {
      this.eventService.initialize(props.services.event);
    }
  }

  componentDidMount(): void {
    this.subscribeToMessages();
    this.startStatsUpdates();
    if (this.state.autoProcess) {
      this.startProcessing();
    }
  }

  componentWillUnmount(): void {
    this.stopProcessing();
    this.stopStatsUpdates();
    this.eventService.unsubscribeFromMessages(
      this.handleIncomingMessage,
      { remote: true, persist: false }
    );
  }

  /**
   * Subscribe to incoming messages for queuing
   */
  private subscribeToMessages = (): void => {
    const options: EventOptions = {
      remote: true,
      persist: false,
      priority: 'normal'
    };

    this.eventService.subscribeToMessages(
      this.handleIncomingMessage,
      options
    );
  };

  /**
   * Handle incoming messages and add to queue
   */
  private handleIncomingMessage = (message: any): void => {
    // Don't queue our own messages to avoid loops
    if (message.source?.moduleId === this.moduleId) {
      return;
    }

    const queuedMessage: QueuedMessage = {
      id: message.id || generateId('queued'),
      originalMessage: message,
      queuedAt: new Date().toISOString(),
      attempts: 0,
      status: 'queued',
      priority: message.priority || 'normal'
    };

    this.setState(prevState => {
      // Check queue size limit
      if (prevState.queuedMessages.length >= prevState.maxQueueSize) {
        // Remove oldest message if at capacity
        const updatedQueue = [...prevState.queuedMessages.slice(1), queuedMessage];
        return {
          queuedMessages: updatedQueue,
          stats: {
            ...prevState.stats,
            totalQueued: prevState.stats.totalQueued + 1,
            queueSize: updatedQueue.length
          }
        };
      } else {
        const updatedQueue = [...prevState.queuedMessages, queuedMessage];
        return {
          queuedMessages: updatedQueue,
          stats: {
            ...prevState.stats,
            totalQueued: prevState.stats.totalQueued + 1,
            queueSize: updatedQueue.length
          }
        };
      }
    });
  };

  /**
   * Start message processing
   */
  private startProcessing = (): void => {
    if (this.processingInterval) return;

    this.setState({ isProcessing: true });

    this.processingInterval = setInterval(() => {
      if (!this.state.isPaused && this.state.queuedMessages.length > 0) {
        this.processNextMessage();
      }
    }, this.state.processingSpeed);
  };

  /**
   * Stop message processing
   */
  private stopProcessing = (): void => {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.setState({ isProcessing: false });
  };

  /**
   * Process the next message in the queue
   */
  private processNextMessage = (): void => {
    this.setState(prevState => {
      if (prevState.queuedMessages.length === 0) return prevState;

      // Get next message (priority queue - high priority first)
      const sortedQueue = [...prevState.queuedMessages].sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const messageToProcess = sortedQueue[0];
      const remainingQueue = prevState.queuedMessages.filter(m => m.id !== messageToProcess.id);

      const startTime = Date.now();
      
      // Simulate processing
      const success = Math.random() > 0.1; // 90% success rate
      const processingTime = Math.random() * 500 + 100; // 100-600ms

      const processedMessage: QueuedMessage = {
        ...messageToProcess,
        status: success ? 'processed' : 'failed',
        processedAt: new Date().toISOString(),
        processingTime,
        attempts: messageToProcess.attempts + 1,
        error: success ? undefined : 'Simulated processing error'
      };

      // Send processed message via Event Service
      if (success) {
        this.eventService.sendMessage(
          'EventService',
          {
            type: 'QUEUE_PROCESSED',
            id: generateId(),
            timestamp: new Date().toISOString(),
            originalMessage: processedMessage.originalMessage,
            processingTime,
            queuePosition: prevState.queuedMessages.indexOf(messageToProcess)
          },
          { remote: true, persist: false }
        );
      }

      const newProcessedMessages = success ? 
        [processedMessage, ...prevState.processedMessages].slice(0, 50) : // Keep last 50
        prevState.processedMessages;

      const newFailedMessages = !success ? 
        [processedMessage, ...prevState.failedMessages].slice(0, 50) : // Keep last 50
        prevState.failedMessages;

      // Calculate new stats
      const totalProcessingTime = prevState.stats.averageProcessingTime * prevState.stats.totalProcessed + processingTime;
      const newTotalProcessed = success ? prevState.stats.totalProcessed + 1 : prevState.stats.totalProcessed;
      const newTotalFailed = !success ? prevState.stats.totalFailed + 1 : prevState.stats.totalFailed;

      return {
        ...prevState,
        queuedMessages: remainingQueue,
        processedMessages: newProcessedMessages,
        failedMessages: newFailedMessages,
        stats: {
          ...prevState.stats,
          totalProcessed: newTotalProcessed,
          totalFailed: newTotalFailed,
          averageProcessingTime: newTotalProcessed > 0 ? totalProcessingTime / newTotalProcessed : 0,
          queueSize: remainingQueue.length,
          lastProcessed: success ? new Date().toISOString() : prevState.stats.lastProcessed
        }
      };
    });
  };

  /**
   * Start statistics updates
   */
  private startStatsUpdates = (): void => {
    this.statsInterval = setInterval(() => {
      this.updateProcessingRate();
    }, 1000);
  };

  /**
   * Stop statistics updates
   */
  private stopStatsUpdates = (): void => {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  };

  /**
   * Update processing rate calculation
   */
  private updateProcessingRate = (): void => {
    // This would calculate messages processed per second
    // For demo purposes, we'll use a simple calculation
    this.setState(prevState => ({
      stats: {
        ...prevState.stats,
        processingRate: prevState.isProcessing && !prevState.isPaused ? 
          Math.round(1000 / prevState.processingSpeed * 10) / 10 : 0
      }
    }));
  };

  /**
   * Toggle processing state
   */
  private toggleProcessing = (): void => {
    if (this.state.isProcessing) {
      this.stopProcessing();
    } else {
      this.startProcessing();
    }
  };

  /**
   * Toggle pause state
   */
  private togglePause = (): void => {
    this.setState(prevState => ({ isPaused: !prevState.isPaused }));
  };

  /**
   * Clear all queues
   */
  private clearAllQueues = (): void => {
    if (window.confirm('Are you sure you want to clear all queues? This action cannot be undone.')) {
      this.setState({
        queuedMessages: [],
        processedMessages: [],
        failedMessages: [],
        stats: {
          totalQueued: 0,
          totalProcessed: 0,
          totalFailed: 0,
          averageProcessingTime: 0,
          queueSize: 0,
          processingRate: 0,
          lastProcessed: null
        }
      });
    }
  };

  /**
   * Retry failed messages
   */
  private retryFailedMessages = (): void => {
    this.setState(prevState => {
      const retriedMessages = prevState.failedMessages.map(msg => ({
        ...msg,
        status: 'queued' as const,
        error: undefined,
        processedAt: undefined,
        processingTime: undefined
      }));

      return {
        queuedMessages: [...prevState.queuedMessages, ...retriedMessages],
        failedMessages: [],
        stats: {
          ...prevState.stats,
          queueSize: prevState.queuedMessages.length + retriedMessages.length,
          totalFailed: 0
        }
      };
    });
  };

  /**
   * Add test message to queue
   */
  private addTestMessage = (): void => {
    const testMessage = {
      id: generateId('test'),
      type: 'TEST_MESSAGE',
      timestamp: new Date().toISOString(),
      content: `Test message ${Date.now()}`,
      source: {
        pluginId: 'ServiceExample_Events',
        moduleId: this.moduleId
      }
    };

    this.handleIncomingMessage(testMessage);
  };

  /**
   * Change processing speed
   */
  private changeProcessingSpeed = (speed: number): void => {
    this.setState({ processingSpeed: speed });
    
    // Restart processing with new speed
    if (this.state.isProcessing) {
      this.stopProcessing();
      setTimeout(() => this.startProcessing(), 100);
    }
  };

  /**
   * Select message for detailed view
   */
  private selectMessage = (message: QueuedMessage): void => {
    this.setState({
      selectedMessage: message,
      showDetails: true
    });
  };

  render(): JSX.Element {
    const { 
      queuedMessages, 
      processedMessages, 
      failedMessages,
      isProcessing, 
      isPaused,
      processingSpeed,
      maxQueueSize,
      stats, 
      selectedMessage, 
      showDetails,
      autoProcess,
      retryFailedMessages: autoRetry,
      error
    } = this.state;

    return (
      <div className="message-queue module-container">
        <div className="module-header">
          <div className="module-title">
            <span className="module-badge">Queue</span>
            <h3>Message Queue</h3>
          </div>
          <div className="module-actions">
            <button 
              className={`btn btn-sm ${isProcessing ? 'btn-warning' : 'btn-success'}`}
              onClick={this.toggleProcessing}
            >
              {isProcessing ? 'Stop' : 'Start'} Processing
            </button>
            <button 
              className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-secondary'}`}
              onClick={this.togglePause}
              disabled={!isProcessing}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={this.addTestMessage}
            >
              Add Test Message
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={this.clearAllQueues}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="message-queue-content">
          {/* Feature Description */}
          <div className="feature-description">
            <h4>Message Queue Processing Demo</h4>
            <ul>
              <li>Demonstrates message queuing with priority handling</li>
              <li>Shows queue processing, retry logic, and failure handling</li>
              <li>Real-time statistics and processing rate monitoring</li>
              <li>Configurable processing speed and queue size limits</li>
            </ul>
          </div>

          {/* Statistics Dashboard */}
          <div className="stats-dashboard">
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Queue Size</span>
                <span className="stat-value">{stats.queueSize}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Processed</span>
                <span className="stat-value">{stats.totalProcessed}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Failed</span>
                <span className="stat-value">{stats.totalFailed}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg Time</span>
                <span className="stat-value">{stats.averageProcessingTime.toFixed(0)}ms</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Rate</span>
                <span className="stat-value">{stats.processingRate}/sec</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${isProcessing ? (isPaused ? 'paused' : 'processing') : 'stopped'}`}>
                  {isProcessing ? (isPaused ? 'Paused' : 'Processing') : 'Stopped'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-section">
            <h4>Queue Controls</h4>
            <div className="controls-grid">
              <div className="control-item">
                <label>Processing Speed:</label>
                <select 
                  value={processingSpeed}
                  onChange={(e) => this.changeProcessingSpeed(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={100}>Very Fast (100ms)</option>
                  <option value={500}>Fast (500ms)</option>
                  <option value={1000}>Normal (1s)</option>
                  <option value={2000}>Slow (2s)</option>
                  <option value={5000}>Very Slow (5s)</option>
                </select>
              </div>
              <div className="control-item">
                <label>Max Queue Size:</label>
                <input
                  type="number"
                  value={maxQueueSize}
                  onChange={(e) => this.setState({ maxQueueSize: Number(e.target.value) })}
                  min="10"
                  max="1000"
                  className="input-field"
                />
              </div>
              <div className="control-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoProcess}
                    onChange={(e) => this.setState({ autoProcess: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Auto Process</span>
                </label>
              </div>
              <div className="control-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoRetry}
                    onChange={(e) => this.setState({ retryFailedMessages: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Auto Retry Failed</span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Queue Tabs */}
          <div className="queue-tabs">
            <div className="tab-headers">
              <button className="tab-header active">
                Queued ({queuedMessages.length})
              </button>
              <button className="tab-header">
                Processed ({processedMessages.length})
              </button>
              <button className="tab-header">
                Failed ({failedMessages.length})
                {failedMessages.length > 0 && (
                  <button 
                    className="retry-btn"
                    onClick={this.retryFailedMessages}
                    title="Retry all failed messages"
                  >
                    ↻
                  </button>
                )}
              </button>
            </div>

            <div className="tab-content">
              {/* Queued Messages */}
              <div className="message-list">
                {queuedMessages.length === 0 ? (
                  <div className="empty-message">
                    No messages in queue. Add a test message or wait for incoming messages.
                  </div>
                ) : (
                  queuedMessages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`message-item priority-${message.priority}`}
                      onClick={() => this.selectMessage(message)}
                    >
                      <div className="message-header">
                        <span className="message-position">#{index + 1}</span>
                        <span className={`message-priority priority-${message.priority}`}>
                          {message.priority.toUpperCase()}
                        </span>
                        <span className="message-type">
                          {message.originalMessage.type}
                        </span>
                        <span className="message-time">
                          {formatTimestamp(message.queuedAt)}
                        </span>
                        <span className="message-attempts">
                          Attempts: {message.attempts}
                        </span>
                      </div>
                      <div className="message-preview">
                        {JSON.stringify(message.originalMessage).substring(0, 100)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message Details Modal */}
        {showDetails && selectedMessage && (
          <div className="modal-overlay" onClick={() => this.setState({ showDetails: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Message Details - {selectedMessage.status}</h4>
                <button 
                  className="modal-close"
                  onClick={() => this.setState({ showDetails: false })}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="message-details">
                  <div className="detail-section">
                    <h5>Queue Information</h5>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">{selectedMessage.id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">{selectedMessage.status}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Priority:</span>
                        <span className="detail-value">{selectedMessage.priority}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Queued At:</span>
                        <span className="detail-value">{selectedMessage.queuedAt}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Attempts:</span>
                        <span className="detail-value">{selectedMessage.attempts}</span>
                      </div>
                      {selectedMessage.processedAt && (
                        <div className="detail-item">
                          <span className="detail-label">Processed At:</span>
                          <span className="detail-value">{selectedMessage.processedAt}</span>
                        </div>
                      )}
                      {selectedMessage.processingTime && (
                        <div className="detail-item">
                          <span className="detail-label">Processing Time:</span>
                          <span className="detail-value">{selectedMessage.processingTime}ms</span>
                        </div>
                      )}
                      {selectedMessage.error && (
                        <div className="detail-item">
                          <span className="detail-label">Error:</span>
                          <span className="detail-value error">{selectedMessage.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="detail-section">
                    <h5>Original Message</h5>
                    <pre className="message-content">
                      {JSON.stringify(selectedMessage.originalMessage, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MessageQueue;