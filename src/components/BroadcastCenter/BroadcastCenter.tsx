/**
 * BroadcastCenter Component
 * 
 * Demonstrates Event Service Bridge broadcasting functionality.
 * Shows how to send messages to multiple targets simultaneously
 * with confirmation tracking and delivery status monitoring.
 */

import React, { Component } from 'react';
import { 
  BroadcastCenterProps, 
  BroadcastCenterState, 
  BroadcastTarget,
  BroadcastMessage,
  BroadcastConfirmation,
  EventOptions
} from '../../types';
import { EventServiceWrapper } from '../../services/eventService';
import { formatTimestamp, generateId } from '../../utils';
import './BroadcastCenter.css';

export class BroadcastCenter extends Component<BroadcastCenterProps, BroadcastCenterState> {
  private eventService: EventServiceWrapper;
  private readonly moduleId = 'BroadcastCenter';
  private confirmationTimeout: NodeJS.Timeout | null = null;

  constructor(props: BroadcastCenterProps) {
    super(props);
    
    this.state = {
      isLoading: false,
      error: null,
      availableTargets: [
        { id: 'LeftChat', name: 'Left Chat', status: 'available', lastSeen: new Date().toISOString() },
        { id: 'RightChat', name: 'Right Chat', status: 'available', lastSeen: new Date().toISOString() },
        { id: 'ChatHistory', name: 'Chat History', status: 'available', lastSeen: new Date().toISOString() },
        { id: 'EventMonitor', name: 'Event Monitor', status: 'available', lastSeen: new Date().toISOString() },
        { id: 'MessageQueue', name: 'Message Queue', status: 'available', lastSeen: new Date().toISOString() }
      ],
      selectedTargets: [],
      broadcastMessage: '',
      broadcastHistory: [],
      confirmations: [],
      isConfirmationRequired: true,
      confirmationTimeout: 5000,
      broadcastPriority: 'normal',
      enablePersistence: false,
      stats: {
        totalBroadcasts: 0,
        totalTargets: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0,
        lastBroadcast: null
      }
    };

    this.eventService = new EventServiceWrapper('ServiceExample_Events', this.moduleId);
    if (props.services.event) {
      this.eventService.initialize(props.services.event);
    }
  }

  componentDidMount(): void {
    this.subscribeToConfirmations();
    this.startTargetDiscovery();
  }

  componentWillUnmount(): void {
    this.eventService.unsubscribeFromMessages(
      this.handleConfirmation,
      { remote: true, persist: false }
    );
    
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
    }
  }

  /**
   * Subscribe to broadcast confirmations
   */
  private subscribeToConfirmations = (): void => {
    const options: EventOptions = {
      remote: true,
      persist: false,
      priority: 'high'
    };

    this.eventService.subscribeToMessages(
      this.handleConfirmation,
      options
    );
  };

  /**
   * Handle incoming broadcast confirmations
   */
  private handleConfirmation = (message: any): void => {
    if (message.type === 'BROADCAST_CONFIRMATION') {
      const confirmation: BroadcastConfirmation = {
        id: generateId('confirmation'),
        type: 'broadcast.confirmation',
        broadcastId: message.broadcastId,
        moduleId: message.moduleId,
        status: message.status || 'confirmed',
        timestamp: message.timestamp || new Date().toISOString(),
        deliveryTime: message.deliveryTime || 0,
        error: message.error
      };

      this.setState(prevState => {
        const updatedConfirmations = [...prevState.confirmations, confirmation];
        
        // Update stats
        const newStats = { ...prevState.stats };
        if (confirmation.status === 'confirmed') {
          newStats.successfulDeliveries++;
        } else {
          newStats.failedDeliveries++;
        }
        
        // Update average delivery time
        const totalDeliveries = newStats.successfulDeliveries + newStats.failedDeliveries;
        if (totalDeliveries > 0 && confirmation.deliveryTime !== undefined) {
          newStats.averageDeliveryTime =
            (newStats.averageDeliveryTime * (totalDeliveries - 1) + confirmation.deliveryTime) / totalDeliveries;
        }

        return {
          confirmations: updatedConfirmations.slice(-50), // Keep last 50
          stats: newStats
        };
      });
    }
  };

  /**
   * Start target discovery (simulate finding available targets)
   */
  private startTargetDiscovery = (): void => {
    // Send discovery message to find available targets
    this.eventService.sendMessage(
      'EventService',
      {
        type: 'TARGET_DISCOVERY',
        id: generateId(),
        timestamp: new Date().toISOString(),
        requesterId: this.moduleId
      },
      { remote: true, persist: false }
    );
  };

  /**
   * Toggle target selection
   */
  private toggleTarget = (targetId: string): void => {
    this.setState(prevState => {
      const isSelected = prevState.selectedTargets.includes(targetId);
      const updatedTargets = isSelected
        ? prevState.selectedTargets.filter(id => id !== targetId)
        : [...prevState.selectedTargets, targetId];

      return { selectedTargets: updatedTargets };
    });
  };

  /**
   * Select all targets
   */
  private selectAllTargets = (): void => {
    const availableTargetIds = this.state.availableTargets
      .filter(target => target.status === 'available')
      .map(target => target.id);
    
    this.setState({ selectedTargets: availableTargetIds });
  };

  /**
   * Clear all target selections
   */
  private clearAllTargets = (): void => {
    this.setState({ selectedTargets: [] });
  };

  /**
   * Send broadcast message
   */
  private sendBroadcast = (): void => {
    const { selectedTargets, broadcastMessage, broadcastPriority, enablePersistence, isConfirmationRequired } = this.state;

    if (selectedTargets.length === 0) {
      this.setState({ error: 'Please select at least one target' });
      return;
    }

    if (!broadcastMessage.trim()) {
      this.setState({ error: 'Please enter a message to broadcast' });
      return;
    }

    this.setState({ error: null, isLoading: true });

    const broadcastId = generateId('broadcast');
    const timestamp = new Date().toISOString();

    const broadcast: BroadcastMessage = {
      id: broadcastId,
      type: 'broadcast.announcement',
      content: broadcastMessage,
      targets: selectedTargets,
      priority: broadcastPriority,
      broadcastId: broadcastId,
      confirmationRequired: isConfirmationRequired,
      timestamp,
      source: {
        pluginId: 'ServiceExample_Events',
        moduleId: this.moduleId
      }
    };

    // Send to each target
    selectedTargets.forEach(targetId => {
      const options: EventOptions = {
        remote: true,
        persist: enablePersistence,
        priority: broadcastPriority
      };

      this.eventService.sendMessage(targetId, broadcast, options);
    });

    // Add to broadcast history
    this.setState(prevState => {
      const updatedHistory = [broadcast, ...prevState.broadcastHistory].slice(0, 50); // Keep last 50
      const updatedStats = {
        ...prevState.stats,
        totalBroadcasts: prevState.stats.totalBroadcasts + 1,
        totalTargets: prevState.stats.totalTargets + selectedTargets.length,
        lastBroadcast: timestamp
      };

      return {
        broadcastHistory: updatedHistory,
        stats: updatedStats,
        broadcastMessage: '', // Clear message after sending
        isLoading: false
      };
    });

    // Set timeout for confirmations if required
    if (isConfirmationRequired) {
      this.confirmationTimeout = setTimeout(() => {
        this.handleConfirmationTimeout(broadcastId);
      }, this.state.confirmationTimeout);
    }
  };

  /**
   * Handle confirmation timeout
   */
  private handleConfirmationTimeout = (broadcastId: string): void => {
    const { selectedTargets, confirmations } = this.state;
    const confirmedTargets = confirmations
      .filter(conf => conf.broadcastId === broadcastId)
      .map(conf => conf.moduleId);

    const unconfirmedTargets = selectedTargets.filter(target => !confirmedTargets.includes(target));

    // Create timeout confirmations for unconfirmed targets
    unconfirmedTargets.forEach(targetId => {
      const timeoutConfirmation: BroadcastConfirmation = {
        id: generateId('timeout'),
        type: 'broadcast.confirmation',
        broadcastId,
        moduleId: targetId,
        status: 'timeout',
        timestamp: new Date().toISOString(),
        deliveryTime: this.state.confirmationTimeout,
        error: 'Confirmation timeout'
      };

      this.setState(prevState => ({
        confirmations: [...prevState.confirmations, timeoutConfirmation],
        stats: {
          ...prevState.stats,
          failedDeliveries: prevState.stats.failedDeliveries + 1
        }
      }));
    });
  };

  /**
   * Send test broadcast
   */
  private sendTestBroadcast = (): void => {
    this.setState({
      broadcastMessage: `Test broadcast message sent at ${new Date().toLocaleTimeString()}`,
      selectedTargets: this.state.availableTargets.map(target => target.id)
    }, () => {
      setTimeout(() => this.sendBroadcast(), 100);
    });
  };

  /**
   * Clear broadcast history
   */
  private clearHistory = (): void => {
    if (window.confirm('Are you sure you want to clear the broadcast history?')) {
      this.setState({
        broadcastHistory: [],
        confirmations: [],
        stats: {
          totalBroadcasts: 0,
          totalTargets: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          averageDeliveryTime: 0,
          lastBroadcast: null
        }
      });
    }
  };

  /**
   * Get confirmation status for a broadcast
   */
  private getConfirmationStatus = (broadcastId: string, targetId: string): 'pending' | 'confirmed' | 'failed' | 'timeout' => {
    const confirmation = this.state.confirmations.find(
      conf => conf.broadcastId === broadcastId && conf.moduleId === targetId
    );
    
    if (!confirmation) return 'pending';
    return confirmation.status === 'confirmed' ? 'confirmed' : 
           confirmation.status === 'timeout' ? 'timeout' : 'failed';
  };

  render(): JSX.Element {
    const { 
      availableTargets,
      selectedTargets, 
      broadcastMessage,
      broadcastHistory,
      confirmations,
      isConfirmationRequired,
      confirmationTimeout,
      broadcastPriority,
      enablePersistence,
      stats,
      isLoading,
      error
    } = this.state;

    return (
      <div className="broadcast-center module-container">
        <div className="module-header">
          <div className="module-title">
            <span className="module-badge">Broadcast</span>
            <h3>Broadcast Center</h3>
          </div>
          <div className="module-actions">
            <button 
              className="btn btn-primary btn-sm"
              onClick={this.sendTestBroadcast}
              disabled={isLoading}
            >
              Send Test Broadcast
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={this.clearHistory}
              disabled={broadcastHistory.length === 0}
            >
              Clear History
            </button>
          </div>
        </div>

        <div className="broadcast-center-content">
          {/* Feature Description */}
          <div className="feature-description">
            <h4>Multi-target Broadcasting Demo</h4>
            <ul>
              <li>Demonstrates broadcasting messages to multiple targets simultaneously</li>
              <li>Shows delivery confirmation tracking and timeout handling</li>
              <li>Supports priority levels and persistence options</li>
              <li>Real-time statistics and delivery status monitoring</li>
            </ul>
          </div>

          {/* Statistics Dashboard */}
          <div className="stats-dashboard">
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Total Broadcasts</span>
                <span className="stat-value">{stats.totalBroadcasts}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Targets</span>
                <span className="stat-value">{stats.totalTargets}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Successful</span>
                <span className="stat-value">{stats.successfulDeliveries}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Failed</span>
                <span className="stat-value">{stats.failedDeliveries}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg Delivery</span>
                <span className="stat-value">{stats.averageDeliveryTime.toFixed(0)}ms</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">
                  {stats.totalTargets > 0 ? 
                    Math.round((stats.successfulDeliveries / stats.totalTargets) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Target Selection */}
          <div className="target-selection">
            <div className="section-header">
              <h4>Select Targets ({selectedTargets.length}/{availableTargets.length})</h4>
              <div className="target-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={this.selectAllTargets}
                >
                  Select All
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={this.clearAllTargets}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="target-grid">
              {availableTargets.map(target => (
                <div 
                  key={target.id}
                  className={`target-item ${selectedTargets.includes(target.id) ? 'selected' : ''} ${target.status}`}
                  onClick={() => this.toggleTarget(target.id)}
                >
                  <div className="target-header">
                    <span className="target-name">{target.name}</span>
                    <span className={`target-status status-${target.status}`}>
                      {target.status}
                    </span>
                  </div>
                  <div className="target-info">
                    <span className="target-id">ID: {target.id}</span>
                    <span className="target-last-seen">
                      Last seen: {formatTimestamp(target.lastSeen)}
                    </span>
                  </div>
                  {selectedTargets.includes(target.id) && (
                    <div className="target-selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast Configuration */}
          <div className="broadcast-config">
            <h4>Broadcast Configuration</h4>
            <div className="config-grid">
              <div className="config-item">
                <label>Priority:</label>
                <select 
                  value={broadcastPriority}
                  onChange={(e) => this.setState({ broadcastPriority: e.target.value as any })}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="config-item">
                <label>Confirmation Timeout:</label>
                <select 
                  value={confirmationTimeout}
                  onChange={(e) => this.setState({ confirmationTimeout: Number(e.target.value) })}
                  className="input-field"
                >
                  <option value={1000}>1 second</option>
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={10000}>10 seconds</option>
                </select>
              </div>
              <div className="config-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isConfirmationRequired}
                    onChange={(e) => this.setState({ isConfirmationRequired: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Require Confirmation</span>
                </label>
              </div>
              <div className="config-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enablePersistence}
                    onChange={(e) => this.setState({ enablePersistence: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Enable Persistence</span>
                </label>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="message-input">
            <h4>Broadcast Message</h4>
            <div className="input-with-button">
              <textarea
                value={broadcastMessage}
                onChange={(e) => this.setState({ broadcastMessage: e.target.value })}
                placeholder="Enter your broadcast message..."
                className="input-field message-textarea"
                rows={3}
                disabled={isLoading}
              />
              <button 
                className="btn btn-primary"
                onClick={this.sendBroadcast}
                disabled={isLoading || selectedTargets.length === 0 || !broadcastMessage.trim()}
              >
                {isLoading ? 'Broadcasting...' : 'Send Broadcast'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Broadcast History */}
          <div className="broadcast-history">
            <h4>Broadcast History ({broadcastHistory.length})</h4>
            <div className="history-list">
              {broadcastHistory.length === 0 ? (
                <div className="empty-message">
                  No broadcasts sent yet. Send a test broadcast to get started.
                </div>
              ) : (
                broadcastHistory.map(broadcast => (
                  <div key={broadcast.id} className="history-item">
                    <div className="history-header">
                      <span className="history-time">
                        {formatTimestamp(broadcast.timestamp)}
                      </span>
                      <span className={`history-priority priority-${broadcast.priority}`}>
                        {broadcast.priority.toUpperCase()}
                      </span>
                      <span className="history-targets">
                        {broadcast.targets.length} targets
                      </span>
                    </div>
                    <div className="history-content">
                      {broadcast.content}
                    </div>
                    <div className="history-confirmations">
                      {broadcast.targets.map(targetId => {
                        const status = this.getConfirmationStatus(broadcast.id, targetId);
                        return (
                          <span 
                            key={targetId}
                            className={`confirmation-status status-${status}`}
                            title={`${targetId}: ${status}`}
                          >
                            {targetId.charAt(0)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BroadcastCenter;