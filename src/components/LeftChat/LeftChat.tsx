/**
 * LeftChat Component - Local Messaging Demonstration
 * 
 * This component demonstrates local event messaging patterns using the Event Service Bridge.
 * It represents the "left" participant in a chat system and showcases:
 * - Local message sending (remote: false)
 * - Basic event subscription patterns
 * - Alternating state management
 * - Real-time event logging
 */

import React, { Component } from 'react';
import { LeftChatProps, LeftChatState, ChatMessage, StateMessage } from '../../types';
import { 
  createChatMessage, 
  createSystemMessage, 
  generateId, 
  validateMessageContent,
  getThemeClassName 
} from '../../utils';
import { ServiceExampleEventService, createEventService } from '../../services/eventService';
import './LeftChat.css';

class LeftChat extends Component<LeftChatProps, LeftChatState> {
  private eventService: ServiceExampleEventService;
  private messageCounter = 0;

  constructor(props: LeftChatProps) {
    super(props);

    // Initialize event service
    this.eventService = createEventService('ServiceExample_Events', props.moduleId || 'left-chat');

    this.state = {
      inputText: '',
      isEnabled: props.initialEnabled !== undefined ? props.initialEnabled : true, // LeftChat starts enabled
      messagesSent: 0,
      lastMessageTime: undefined,
      debugInfo: [],
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
  }

  async componentDidMount() {
    try {
      await this.initializeServices();
      this.setState({ isInitializing: false });
      this.addDebugInfo('info', 'LeftChat initialized successfully');
    } catch (error) {
      console.error('LeftChat: Failed to initialize:', error);
      this.setState({ 
        error: 'Failed to initialize LeftChat',
        isInitializing: false 
      });
      this.addDebugInfo('error', `Initialization failed: ${error}`);
    }
  }

  componentWillUnmount() {
    this.eventService.cleanup();
    this.addDebugInfo('info', 'LeftChat cleaned up');
  }

  /**
   * Initialize BrainDrive services
   */
  private async initializeServices(): Promise<void> {
    const { services } = this.props;

    // Initialize event service
    if (services.event) {
      this.eventService.initialize(services.event);
      
      // Subscribe to messages from RightChat to manage alternating state
      this.eventService.subscribeToMessages(this.handleMessageReceived, { remote: false });
      
      this.addDebugInfo('info', 'Event service initialized with local messaging');
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
   * Handle received messages (from RightChat)
   */
  private handleMessageReceived(message: any): void {
    // Check if this is a chat message from RightChat
    if (message.type === 'chat.message' && message.sender === 'right') {
      // Re-enable LeftChat when RightChat sends a message
      this.setState({ isEnabled: true });
      this.addDebugInfo('info', `Received message from RightChat, re-enabling LeftChat`);
      
      // Send state change notification
      this.sendStateChangeMessage('right', 'left', 'message_received');
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
    const { inputText, isEnabled } = this.state;
    const { maxMessageLength = 1000 } = this.props;

    if (!isEnabled) {
      this.addDebugInfo('warn', 'Cannot send message: LeftChat is disabled');
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
        'left',
        inputText.trim(),
        true, // isLocal
        false, // isPersisted (LeftChat uses local messaging)
        this.messageCounter
      );

      // Send message using LOCAL messaging (remote: false)
      this.eventService.sendLocalMessage('right-chat', chatMessage);
      this.eventService.sendLocalMessage('chat-history', chatMessage);

      // Update state
      this.setState({
        inputText: '',
        isEnabled: false, // Disable after sending
        messagesSent: this.state.messagesSent + 1,
        lastMessageTime: new Date().toISOString(),
        error: ''
      });

      // Send state change notification
      this.sendStateChangeMessage('left', 'right', 'message_sent');

      this.addDebugInfo('info', `Sent LOCAL message #${this.messageCounter}: "${inputText.trim()}"`);

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
      isEnabled: activeModule === 'left' ? this.state.isEnabled : !this.state.isEnabled,
      timestamp: new Date().toISOString()
    };

    // Broadcast state change to all modules
    this.eventService.broadcastMessage(
      ['right-chat', 'chat-history', 'event-monitor'],
      stateMessage,
      { remote: false }
    );
  }

  /**
   * Add debug information
   */
  private addDebugInfo(level: 'info' | 'warn' | 'error' | 'debug', content: string): void {
    const debugMessage = createSystemMessage(level, content, 'event');
    
    this.setState(prevState => ({
      debugInfo: [...prevState.debugInfo.slice(-9), debugMessage] // Keep last 10 entries
    }));

    // Also send to EventMonitor if available
    this.eventService.sendLocalMessage('event-monitor', debugMessage);
  }

  /**
   * Render debug information
   */
  private renderDebugInfo(): JSX.Element | null {
    const { showDebugInfo } = this.props;
    const { debugInfo } = this.state;

    if (!showDebugInfo || debugInfo.length === 0) return null;

    return (
      <div className="debug-panel">
        <h4 className="debug-title">Debug Log</h4>
        <div className="debug-log">
          {debugInfo.map((entry, index) => (
            <div key={entry.id} className={`debug-entry debug-${entry.level}`}>
              <span className="debug-timestamp">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="debug-content">{entry.content}</span>
            </div>
          ))}
        </div>
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
        <p>Initializing LeftChat...</p>
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
    const { title = "Left Chat", theme = "blue" } = this.props;
    const { inputText, isEnabled, messagesSent, lastMessageTime } = this.state;

    return (
      <div className={`left-chat-content ${getThemeClassName(theme)}`}>
        <div className="module-header">
          <h3 className="module-title">
            {title}
            <span className="module-badge">LOCAL</span>
          </h3>
          <div className="status-indicator-group">
            <div className={`status-indicator ${isEnabled ? 'status-enabled' : 'status-disabled'}`}>
              <div className="status-dot"></div>
              {isEnabled ? 'Ready' : 'Waiting'}
            </div>
          </div>
        </div>

        <div className="module-content">
          {/* Statistics */}
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Messages Sent:</span>
              <span className="stat-value">{messagesSent}</span>
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
              <label className="input-label">Message (Local Messaging)</label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="input-field"
                  value={inputText}
                  onChange={this.handleInputChange}
                  onKeyPress={this.handleKeyPress}
                  placeholder={isEnabled ? "Type your message..." : "Waiting for RightChat..."}
                  disabled={!isEnabled}
                  maxLength={this.props.maxMessageLength || 1000}
                />
                <button
                  className="btn btn-primary"
                  onClick={this.handleSendMessage}
                  disabled={!isEnabled || !inputText.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Feature Description */}
          <div className="feature-description">
            <h4>Local Messaging Features:</h4>
            <ul>
              <li>Uses <code>sendMessage(target, message, {`{remote: false}`})</code></li>
              <li>Demonstrates alternating chat behavior</li>
              <li>Real-time state management via events</li>
              <li>Local event subscription patterns</li>
            </ul>
          </div>

          {/* Debug Information */}
          {this.renderDebugInfo()}
        </div>
      </div>
    );
  }

  render(): JSX.Element {
    const { currentTheme, isInitializing, error } = this.state;
    const { theme = "blue" } = this.props;

    return (
      <div className={`service-example-events left-chat ${getThemeClassName(theme)} ${currentTheme === 'dark' ? 'dark-theme' : ''}`}>
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

export default LeftChat;