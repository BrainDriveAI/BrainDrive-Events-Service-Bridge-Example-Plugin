/**
 * EventSender Component - Demonstrates Event Service Bridge message sending
 *
 * This component showcases how to send events to other modules using BrainDrive's
 * Event Service Bridge. It includes comprehensive error handling, validation,
 * and educational logging to help developers understand event communication patterns.
 *
 * Key Learning Points:
 * - How to initialize the Event Service Bridge
 * - Proper error handling for event operations
 * - Message validation and formatting
 * - Different event types (targeted vs broadcast)
 * - Service availability checking
 * - Component lifecycle management with services
 */

import React from 'react';
import { createEventService, EventServiceError, logEventServiceConcepts } from '../services/eventService';

/**
 * Props interface for the EventSender component
 *
 * The services prop is provided by BrainDrive and contains all available
 * service bridges including the Event Service.
 */
interface EventSenderProps {
  /** Services provided by BrainDrive platform */
  services?: {
    /** Event Service Bridge for inter-module communication */
    event?: any;
  };
}

/**
 * State interface for the EventSender component
 *
 * Manages the component's internal state including message content,
 * target selection, and service connection status.
 */
interface EventSenderState {
  /** The message text to send */
  message: string;
  /** The target module ID to send the message to */
  targetModule: string;
  /** The Event Service instance for this component */
  eventService: any;
  /** Current status message for user feedback */
  status: string;
  /** Whether the Event Service is connected and available */
  isServiceConnected: boolean;
  /** Whether an operation is currently in progress */
  isLoading: boolean;
  /** Statistics for educational purposes */
  messagesSent: number;
}

/**
 * EventSender Component Class
 *
 * Demonstrates proper Event Service Bridge integration patterns including:
 * - Service initialization and connection handling
 * - Error handling and user feedback
 * - Message validation and sending
 * - Educational logging and debugging
 */
class EventSender extends React.Component<EventSenderProps, EventSenderState> {
  constructor(props: EventSenderProps) {
    super(props);
    
    // Initialize state with default values
    this.state = {
      message: '',
      targetModule: 'event-receiver',
      eventService: createEventService('ServiceExample_Events', 'event-sender'),
      status: 'Initializing Event Service...',
      isServiceConnected: false,
      isLoading: false,
      messagesSent: 0
    };
    
    // Educational logging
    console.log('[EventSender] 📚 LEARNING: Component initialized with Event Service');
    console.log('[EventSender] 📚 LEARNING: Waiting for BrainDrive to provide Event Service Bridge...');
  }

  /**
   * Component lifecycle: After component mounts
   *
   * This is where we initialize the Event Service Bridge connection.
   * This pattern is common in BrainDrive plugins.
   */
  componentDidMount() {
    console.log('[EventSender] 📚 LEARNING: Component mounted, checking for Event Service...');
    
    // Attempt to initialize the Event Service Bridge
    this.initializeEventService();
    
    // Log educational concepts (optional - can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => logEventServiceConcepts(), 1000);
    }
  }

  /**
   * Component lifecycle: After props update
   *
   * This handles the case where the Event Service becomes available
   * after the component has already mounted.
   */
  componentDidUpdate(prevProps: EventSenderProps) {
    // Check if Event Service availability changed
    if (prevProps.services?.event !== this.props.services?.event) {
      console.log('[EventSender] 📚 LEARNING: Event Service availability changed, reinitializing...');
      this.initializeEventService();
    }
  }

  /**
   * Component lifecycle: Before component unmounts
   *
   * Clean up any subscriptions or resources to prevent memory leaks.
   * This is crucial for proper Event Service usage.
   */
  componentWillUnmount() {
    console.log('[EventSender] 📚 LEARNING: Component unmounting, cleaning up Event Service...');
    
    try {
      // Clean up any subscriptions (EventSender doesn't subscribe, but good practice)
      if (this.state.eventService && this.state.eventService.unsubscribeAll) {
        this.state.eventService.unsubscribeAll();
      }
    } catch (error) {
      console.warn('[EventSender] Error during cleanup:', error);
    }
  }

  /**
   * Initialize the Event Service Bridge connection
   *
   * This method demonstrates the proper pattern for connecting to
   * BrainDrive's Event Service Bridge with error handling.
   */
  initializeEventService = () => {
    try {
      if (this.props.services?.event) {
        // Set the service bridge
        this.state.eventService.setServiceBridge(this.props.services.event);
        
        // Update state to reflect successful connection
        this.setState({
          status: '✅ Event Service connected and ready',
          isServiceConnected: true
        });
        
        console.log('[EventSender] ✅ Event Service Bridge successfully initialized');
        console.log('[EventSender] 📚 LEARNING: You can now send events to other modules!');
        
      } else {
        // Service not available yet
        this.setState({
          status: '⏳ Waiting for Event Service to become available...',
          isServiceConnected: false
        });
        
        console.log('[EventSender] ⏳ Event Service not yet available');
        console.log('[EventSender] 📚 LEARNING: Event Service will be provided by BrainDrive when ready');
      }
    } catch (error) {
      // Handle initialization errors
      console.error('[EventSender] ❌ Failed to initialize Event Service:', error);
      
      this.setState({
        status: `❌ Event Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isServiceConnected: false
      });
    }
  };

  /**
   * Handle sending a targeted message to a specific module
   *
   * This method demonstrates proper message validation, error handling,
   * and user feedback patterns for Event Service operations.
   */
  handleSendMessage = async () => {
    // Validate input
    if (!this.state.message.trim()) {
      this.setState({ status: '⚠️ Please enter a message to send' });
      return;
    }

    // Check service availability
    if (!this.state.isServiceConnected) {
      this.setState({ status: '❌ Event Service not connected' });
      return;
    }

    // Set loading state
    this.setState({ isLoading: true, status: '📤 Sending message...' });

    try {
      // Create message with proper structure
      const messageData = {
        type: 'simple-message',
        text: this.state.message.trim(),
        timestamp: new Date().toISOString(),
        from: 'event-sender',
        // Additional metadata for educational purposes
        messageNumber: this.state.messagesSent + 1,
        targetModule: this.state.targetModule
      };

      console.group('[EventSender] 📚 LEARNING: Sending Targeted Message');
      console.log('Target Module:', this.state.targetModule);
      console.log('Message Data:', messageData);
      console.log('📚 This message will only be received by the target module');
      console.groupEnd();

      // Send the message through Event Service
      this.state.eventService.sendMessage(this.state.targetModule, messageData);
      
      // Update state on success
      this.setState({
        message: '', // Clear input
        status: `✅ Message sent to ${this.state.targetModule}`,
        isLoading: false,
        messagesSent: this.state.messagesSent + 1
      });

      console.log('[EventSender] ✅ Message sent successfully');
      
    } catch (error) {
      // Handle errors gracefully
      console.error('[EventSender] ❌ Failed to send message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error instanceof EventServiceError) {
        errorMessage = `Event Service Error: ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      this.setState({
        status: `❌ ${errorMessage}`,
        isLoading: false
      });
    }
  };

  /**
   * Handle sending a broadcast message to multiple modules
   *
   * This demonstrates how to send the same message to multiple targets,
   * which is useful for notifications or system-wide updates.
   */
  handleSendBroadcast = async () => {
    // Check service availability
    if (!this.state.isServiceConnected) {
      this.setState({ status: '❌ Event Service not connected' });
      return;
    }

    // Set loading state
    this.setState({ isLoading: true, status: '📡 Broadcasting message...' });

    try {
      const broadcastData = {
        type: 'broadcast',
        text: this.state.message.trim() || 'Hello from Event Sender!',
        timestamp: new Date().toISOString(),
        from: 'event-sender',
        // Additional metadata
        messageNumber: this.state.messagesSent + 1,
        isBroadcast: true
      };

      console.group('[EventSender] 📚 LEARNING: Sending Broadcast Message');
      console.log('Broadcast Data:', broadcastData);
      console.log('📚 This message will be sent to multiple modules');
      console.log('📚 Targets: event-receiver, event-display');
      console.groupEnd();

      // Send to multiple targets
      const targets = ['event-receiver', 'event-display'];
      const sendPromises = targets.map(target => {
        try {
          this.state.eventService.sendMessage(target, broadcastData);
          return Promise.resolve(target);
        } catch (error) {
          console.warn(`[EventSender] Failed to send to ${target}:`, error);
          return Promise.reject({ target, error });
        }
      });

      // Wait for all sends to complete (or fail)
      await Promise.allSettled(sendPromises);
      
      // Update state on success
      this.setState({
        message: '', // Clear input
        status: `📡 Broadcast sent to ${targets.length} modules`,
        isLoading: false,
        messagesSent: this.state.messagesSent + 1
      });

      console.log('[EventSender] ✅ Broadcast sent successfully');
      
    } catch (error) {
      // Handle errors gracefully
      console.error('[EventSender] ❌ Failed to send broadcast:', error);
      
      this.setState({
        status: `❌ Broadcast failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      });
    }
  };

  /**
   * Handle Enter key press for quick message sending
   *
   * This provides a better user experience by allowing keyboard shortcuts.
   */
  handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent form submission
      this.handleSendMessage();
    }
  };

  /**
   * Handle message input changes with validation
   *
   * This provides real-time feedback to the user about message validity.
   */
  handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value;
    this.setState({ message });

    // Provide real-time validation feedback
    if (message.length > 500) {
      this.setState({ status: '⚠️ Message is too long (max 500 characters)' });
    } else if (message.trim().length === 0 && this.state.status.includes('too long')) {
      this.setState({ status: this.state.isServiceConnected ? '✅ Event Service connected and ready' : '⏳ Waiting for Event Service...' });
    }
  };

  /**
   * Handle target module selection changes
   *
   * This updates the target for message sending and provides educational feedback.
   */
  handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetModule = e.target.value;
    this.setState({
      targetModule,
      status: `📍 Target set to: ${targetModule}`
    });

    console.log(`[EventSender] 📚 LEARNING: Target changed to ${targetModule}`);
  };

  /**
   * Get service statistics for display
   *
   * This provides educational information about the Event Service usage.
   */
  getServiceStats = () => {
    if (this.state.eventService && this.state.eventService.getServiceStats) {
      return this.state.eventService.getServiceStats();
    }
    return null;
  };

  /**
   * Render the EventSender component
   *
   * This render method demonstrates a comprehensive UI for Event Service
   * interaction with educational elements and proper user feedback.
   */
  render() {
    const {
      message,
      targetModule,
      status,
      isServiceConnected,
      isLoading,
      messagesSent
    } = this.state;

    // Get service statistics for educational display
    const serviceStats = this.getServiceStats();

    return (
      <div style={{
        padding: '16px',
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        minHeight: '300px'
      }}>
        {/* Header with connection status */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0', color: '#333', fontSize: '16px' }}>
            📤 Event Sender
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isServiceConnected ? '#4caf50' : '#f44336'
            }} />
            <span style={{ fontSize: '10px', color: '#666' }}>
              {isServiceConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Status display */}
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: status.includes('❌') ? '#ffebee' :
                          status.includes('✅') ? '#e8f5e8' :
                          status.includes('⏳') ? '#fff3e0' : '#f5f5f5',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#333',
          border: '1px solid ' + (status.includes('❌') ? '#ffcdd2' :
                                 status.includes('✅') ? '#c8e6c9' :
                                 status.includes('⏳') ? '#ffcc02' : '#e0e0e0')
        }}>
          <strong>Status:</strong> {status}
        </div>
        
        {/* Target module selection */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold'
          }}>
            Target Module:
          </label>
          <select
            value={targetModule}
            onChange={this.handleTargetChange}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: isLoading ? '#f5f5f5' : 'white'
            }}
          >
            <option value="event-receiver">Event Receiver</option>
            <option value="event-display">Event Display</option>
          </select>
          <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
            📚 Select which module should receive your message
          </div>
        </div>

        {/* Message input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '12px',
            color: '#666',
            fontWeight: 'bold'
          }}>
            Message:
          </label>
          <input
            type="text"
            value={message}
            onChange={this.handleMessageChange}
            placeholder="Enter your message..."
            disabled={isLoading}
            maxLength={500}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: isLoading ? '#f5f5f5' : 'white'
            }}
            onKeyPress={this.handleKeyPress}
          />
          <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
            📚 Press Enter to send, or use buttons below ({message.length}/500 characters)
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', marginBottom: '12px' }}>
          <button
            onClick={this.handleSendMessage}
            disabled={!message.trim() || !isServiceConnected || isLoading}
            style={{
              padding: '8px 12px',
              backgroundColor: (message.trim() && isServiceConnected && !isLoading) ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: (message.trim() && isServiceConnected && !isLoading) ? 'pointer' : 'not-allowed',
              position: 'relative'
            }}
          >
            {isLoading ? '⏳ Sending...' : '📤 Send Targeted Message'}
          </button>
          
          <button
            onClick={this.handleSendBroadcast}
            disabled={!isServiceConnected || isLoading}
            style={{
              padding: '8px 12px',
              backgroundColor: (isServiceConnected && !isLoading) ? '#28a745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: (isServiceConnected && !isLoading) ? 'pointer' : 'not-allowed'
            }}
          >
            {isLoading ? '⏳ Broadcasting...' : '📡 Send Broadcast Message'}
          </button>
        </div>

        {/* Educational information */}
        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#1976d2',
          borderLeft: '3px solid #2196f3'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            📚 Learning: Event Service Bridge Demo
          </div>
          <div style={{ marginBottom: '2px' }}>
            • <strong>Targeted:</strong> Sends to one specific module
          </div>
          <div style={{ marginBottom: '2px' }}>
            • <strong>Broadcast:</strong> Sends to multiple modules at once
          </div>
          <div>
            • <strong>Messages Sent:</strong> {messagesSent} | <strong>Service:</strong> {isServiceConnected ? 'Ready' : 'Not Ready'}
          </div>
        </div>

        {/* Service statistics (development mode) */}
        {serviceStats && process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '8px',
            padding: '6px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#666'
          }}>
            <strong>🔧 Dev Stats:</strong> Plugin: {serviceStats.pluginId} |
            Module: {serviceStats.moduleId} |
            Sent: {serviceStats.messagesSent} |
            Subscriptions: {serviceStats.activeSubscriptions}
          </div>
        )}
      </div>
    );
  }
}

export default EventSender;