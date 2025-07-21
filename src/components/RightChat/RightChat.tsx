/**
 * RightChat Component - Remote Messaging Demonstration
 * 
 * This component demonstrates remote event messaging patterns using the Event Service Bridge.
 * It represents the "right" participant in a chat system and showcases:
 * - Remote message sending (remote: true)
 * - Message persistence (persist: true)
 * - Advanced event subscription patterns
 * - Connection status monitoring
 * - Advanced configuration options
 */

import React, { Component } from 'react';
import { RightChatProps, RightChatState, ChatMessage, StateMessage, ConnectionMessage } from '../../types';
import { 
  createChatMessage, 
  createSystemMessage, 
  generateId, 
  validateMessageContent,
  getThemeClassName 
} from '../../utils';
import { ServiceExampleEventService, createEventService } from '../../services/eventService';
import './RightChat.css';

class RightChat extends Component<RightChatProps, RightChatState> {
  private eventService: ServiceExampleEventService;
  private messageCounter = 0;
  private connectionCheckInterval?: NodeJS.Timeout;

  constructor(props: RightChatProps) {
    super(props);

    // Initialize event service
    this.eventService = createEventService('ServiceExample_Events', props.moduleId || 'right-chat');

    this.state = {
      inputText: '',
      isEnabled: props.initialEnabled !== undefined ? props.initialEnabled : false, // RightChat starts disabled
      messagesSent: 0,
      lastMessageTime: undefined,
      persistenceEnabled: props.enablePersistence !== undefined ? props.enablePersistence : true,
      remoteMode: props.remoteMode !== undefined ? props.remoteMode : true,
      connectionStatus: 'disconnected',
      isLoading: false,
      error: '',
      currentTheme: 'light',
      isInitializing: true
    };

    // Bind methods
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMessageReceived = this.handleMessageReceived.bind(this);
    this.togglePersistence = this.togglePersistence.bind(this);
    this.toggleRemoteMode = this.toggleRemoteMode.bind(this);
  }

  async componentDidMount() {
    try {
      await this.initializeServices();
      this.startConnectionMonitoring();
      this.setState({ isInitializing: false });
      this.addDebugInfo('info', 'RightChat initialized successfully');
    } catch (error) {
      console.error('RightChat: Failed to initialize:', error);
      this.setState({ 
        error: 'Failed to initialize RightChat',
        isInitializing: false 
      });
      this.addDebugInfo('error', `Initialization failed: ${error}`);
    }
  }

  componentWillUnmount() {
    this.eventService.cleanup();
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    this.addDebugInfo('info', 'RightChat cleaned up');
  }

  /**
   * Initialize BrainDrive services
   */
  private async initializeServices(): Promise<void> {
    const { services } = this.props;

    // Initialize event service
    if (services.event) {
      this.eventService.initialize(services.event);
      
      // Subscribe to messages from LeftChat to manage alternating state
      // Use remote subscription with persistence
      this.eventService.subscribeWithPersistence(this.handleMessageReceived, this.state.remoteMode);
      
      this.addDebugInfo('info', `Event service initialized with ${this.state.remoteMode ? 'REMOTE' : 'LOCAL'} messaging and persistence: ${this.state.persistenceEnabled}`);
    } else {
      throw new Error('Event service not available');
    }

    // Initialize theme service
    if (services.theme) {
      const currentTheme = services.theme.getCurrentTheme();
      this.setState({ currentTheme });
      
      const themeChangeListener = (theme: string) => {
        this.setState({ currentTheme: theme });
      };
      services.theme.addThemeChangeListener(themeChangeListener);
    }
  }

  /**
   * Start connection monitoring
   */
  private startConnectionMonitoring(): void {
    // Simulate connection status changes for demonstration
    this.setState({ connectionStatus: 'connecting' });
    
    setTimeout(() => {
      this.setState({ connectionStatus: 'connected' });
      this.sendConnectionStatus('connected');
    }, 1500);

    // Periodic connection health check
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check connection health
   */
  private checkConnectionHealth(): void {
    const isHealthy = this.eventService.isAvailable();
    const newStatus = isHealthy ? 'connected' : 'error';
    
    if (newStatus !== this.state.connectionStatus) {
      this.setState({ connectionStatus: newStatus });
      this.sendConnectionStatus(newStatus);
      this.addDebugInfo(newStatus === 'connected' ? 'info' : 'error', `Connection status changed to: ${newStatus}`);
    }
  }

  /**
   * Send connection status message
   */
  private sendConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    const connectionMessage: ConnectionMessage = {
      id: generateId('connection'),
      type: 'connection.status',
      status,
      isRemote: this.state.remoteMode,
      timestamp: new Date().toISOString()
    };

    // Send to monitoring modules
    this.eventService.broadcastMessage(
      ['event-monitor', 'message-queue'],
      connectionMessage,
      { remote: this.state.remoteMode, persist: this.state.persistenceEnabled }
    );
  }

  /**
   * Handle received messages (from LeftChat)
   */
  private handleMessageReceived(message: any): void {
    // Check if this is a chat message from LeftChat
    if (message.type === 'chat.message' && message.sender === 'left') {
      // Re-enable RightChat when LeftChat sends a message
      this.setState({ isEnabled: true });
      this.addDebugInfo('info', `Received message from LeftChat, re-enabling RightChat`);
      
      // Send state change notification
      this.sendStateChangeMessage('left', 'right', 'message_received');
    }
  }

  /**
   * Handle input text changes
   */
  private handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ inputText: event.target.value });
  }

  /**
   * Handle Enter key press
   */
  private handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }

  /**
   * Handle sending a message
   */
  private handleSendMessage(): void {
    const { inputText, isEnabled, remoteMode, persistenceEnabled } = this.state;
    const { maxMessageLength = 1000 } = this.props;

    if (!isEnabled) {
      this.addDebugInfo('warn', 'Cannot send message: RightChat is disabled');
      return;
    }

    if (this.state.connectionStatus !== 'connected') {
      this.setState({ error: 'Cannot send message: Not connected' });
      this.addDebugInfo('error', 'Cannot send message: Connection not available');
      return;
    }

    // Validate message content
    const validation = validateMessageContent(inputText, maxMessageLength);
    if (!validation.isValid) {
      this.setState({ error: validation.error || 'Invalid message' });
      this.addDebugInfo('error', `Message validation failed: ${validation.error}`);
      return;
    }

    try {
      this.messageCounter++;
      
      // Create chat message
      const chatMessage = createChatMessage(
        'right',
        inputText.trim(),
        !remoteMode, // isLocal (opposite of remoteMode)
        persistenceEnabled, // isPersisted
        this.messageCounter
      );

      // Send message using REMOTE messaging with persistence
      if (remoteMode) {
        this.eventService.sendRemoteMessage('left-chat', chatMessage, persistenceEnabled);
        this.eventService.sendRemoteMessage('chat-history', chatMessage, persistenceEnabled);
      } else {
        this.eventService.sendLocalMessage('left-chat', chatMessage, persistenceEnabled);
        this.eventService.sendLocalMessage('chat-history', chatMessage, persistenceEnabled);
      }

      // Update state
      this.setState({
        inputText: '',
        isEnabled: false, // Disable after sending
        messagesSent: this.state.messagesSent + 1,
        lastMessageTime: new Date().toISOString(),
        error: ''
      });

      // Send state change notification
      this.sendStateChangeMessage('right', 'left', 'message_sent');

      this.addDebugInfo('info', `Sent ${remoteMode ? 'REMOTE' : 'LOCAL'} message #${this.messageCounter} ${persistenceEnabled ? 'with PERSISTENCE' : 'without persistence'}: "${inputText.trim()}"`);

    } catch (error) {
      this.setState({ error: 'Failed to send message' });
      this.addDebugInfo('error', `Failed to send message: ${error}`);
    }
  }

  /**
   * Send state change notification
   */
  private sendStateChangeMessage(
    activeModule: 'left' | 'right',
    previousModule: 'left' | 'right',
    reason: 'message_sent' | 'message_received'
  ): void {
    const stateMessage: StateMessage = {
      id: generateId('state'),
      type: 'chat.state.change',
      activeModule,
      previousModule,
      reason,
      isEnabled: activeModule === 'right' ? this.state.isEnabled : !this.state.isEnabled,
      timestamp: new Date().toISOString()
    };

    // Broadcast state change to all modules
    this.eventService.broadcastMessage(
      ['left-chat', 'chat-history', 'event-monitor'],
      stateMessage,
      { remote: this.state.remoteMode, persist: this.state.persistenceEnabled }
    );
  }

  /**
   * Toggle persistence setting
   */
  private togglePersistence(): void {
    const newPersistence = !this.state.persistenceEnabled;
    this.setState({ persistenceEnabled: newPersistence });
    this.addDebugInfo('info', `Persistence ${newPersistence ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle remote mode setting
   */
  private toggleRemoteMode(): void {
    const newRemoteMode = !this.state.remoteMode;
    this.setState({ remoteMode: newRemoteMode });
    this.addDebugInfo('info', `Remote mode ${newRemoteMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Add debug information
   */
  private addDebugInfo(level: 'info' | 'warn' | 'error' | 'debug', content: string): void {
    const debugMessage = createSystemMessage(level, content, 'event');
    
    // Also send to EventMonitor if available
    this.eventService.sendLocalMessage('event-monitor', debugMessage);
  }

  /**
   * Render advanced options panel
   */
  private renderAdvancedOptions(): JSX.Element | null {
    const { showAdvancedOptions } = this.props;
    const { persistenceEnabled, remoteMode } = this.state;

    if (!showAdvancedOptions) return null;

    return (
      <div className="advanced-options">
        <h4 className="options-title">Advanced Options</h4>
        <div className="options-grid">
          <div className="option-item">
            <label className="option-label">
              <input
                type="checkbox"
                checked={persistenceEnabled}
                onChange={this.togglePersistence}
                className="option-checkbox"
              />
              <span className="option-text">Enable Persistence</span>
            </label>
            <p className="option-description">
              Messages are queued and replayed to new subscribers
            </p>
          </div>
          <div className="option-item">
            <label className="option-label">
              <input
                type="checkbox"
                checked={remoteMode}
                onChange={this.toggleRemoteMode}
                className="option-checkbox"
              />
              <span className="option-text">Remote Messaging</span>
            </label>
            <p className="option-description">
              Use remote event service instead of local
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render connection status
   */
  private renderConnectionStatus(): JSX.Element {
    const { connectionStatus } = this.state;
    
    const statusConfig = {
      connected: { icon: '🟢', text: 'Connected', class: 'status-connected' },
      connecting: { icon: '🟡', text: 'Connecting...', class: 'status-connecting' },
      reconnecting: { icon: '🟡', text: 'Reconnecting...', class: 'status-connecting' },
      disconnected: { icon: '🔴', text: 'Disconnected', class: 'status-disconnected' },
      error: { icon: '❌', text: 'Connection Error', class: 'status-error' }
    };

    const config = statusConfig[connectionStatus];

    return (
      <div className={`connection-status ${config.class}`}>
        <span className="connection-icon">{config.icon}</span>
        <span className="connection-text">{config.text}</span>
      </div>
    );
  }

  /**
   * Render loading state
   */
  private renderLoading(): JSX.Element {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing RightChat...</p>
      </div>
    );
  }

  /**
   * Render error state
   */
  private renderError(): JSX.Element {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{this.state.error}</div>
        <button 
          className="btn btn-secondary btn-small"
          onClick={() => this.setState({ error: '' })}
        >
          Clear Error
        </button>
      </div>
    );
  }

  /**
   * Render main content
   */
  private renderContent(): JSX.Element {
    const { title = "Right Chat", theme = "green" } = this.props;
    const { inputText, isEnabled, messagesSent, lastMessageTime, persistenceEnabled, remoteMode } = this.state;

    return (
      <div className={`right-chat-content ${getThemeClassName(theme)}`}>
        <div className="module-header">
          <h3 className="module-title">
            {title}
            <span className="module-badge">REMOTE</span>
          </h3>
          <div className="status-indicator-group">
            <div className={`status-indicator ${isEnabled ? 'status-enabled' : 'status-disabled'}`}>
              <div className="status-dot"></div>
              {isEnabled ? 'Ready' : 'Waiting'}
            </div>
            {this.renderConnectionStatus()}
          </div>
        </div>

        <div className="module-content">
          {/* Statistics */}
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Messages Sent:</span>
              <span className="stat-value">{messagesSent}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mode:</span>
              <span className="stat-value">{remoteMode ? 'Remote' : 'Local'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Persistence:</span>
              <span className="stat-value">{persistenceEnabled ? 'On' : 'Off'}</span>
            </div>
            {lastMessageTime && (
              <div className="stat-item">
                <span className="stat-label">Last Message:</span>
                <span className="stat-value">
                  {new Date(lastMessageTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="input-section">
            <div className="input-group">
              <label className="input-label">
                Message ({remoteMode ? 'Remote' : 'Local'} Messaging{persistenceEnabled ? ' + Persistence' : ''})
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="input-field"
                  value={inputText}
                  onChange={this.handleInputChange}
                  onKeyPress={this.handleKeyPress}
                  placeholder={isEnabled ? "Type your message..." : "Waiting for LeftChat..."}
                  disabled={!isEnabled || this.state.connectionStatus !== 'connected'}
                  maxLength={this.props.maxMessageLength || 1000}
                />
                <button
                  className="btn btn-primary"
                  onClick={this.handleSendMessage}
                  disabled={!isEnabled || !inputText.trim() || this.state.connectionStatus !== 'connected'}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          {this.renderAdvancedOptions()}

          {/* Feature Description */}
          <div className="feature-description">
            <h4>Remote Messaging Features:</h4>
            <ul>
              <li>Uses <code>sendMessage(target, message, {`{remote: true, persist: true}`})</code></li>
              <li>Demonstrates message persistence and queue replay</li>
              <li>Connection status monitoring and error handling</li>
              <li>Advanced configuration options</li>
              <li>Remote event subscription patterns</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  render(): JSX.Element {
    const { currentTheme, isInitializing, error } = this.state;
    const { theme = "green" } = this.props;

    return (
      <div className={`service-example-events right-chat ${getThemeClassName(theme)} ${currentTheme === 'dark' ? 'dark-theme' : ''}`}>
        <div className="module-container">
          {isInitializing ? (
            this.renderLoading()
          ) : error ? (
            this.renderError()
          ) : (
            this.renderContent()
          )}
        </div>
      </div>
    );
  }
}

export default RightChat;