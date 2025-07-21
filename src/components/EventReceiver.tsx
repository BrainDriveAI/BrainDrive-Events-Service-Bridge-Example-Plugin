import React from 'react';
import { createEventService } from '../services/eventService';

interface EventReceiverProps {
  services?: {
    event?: any;
  };
}

interface ReceivedMessage {
  id: string;
  type: string;
  text: string;
  timestamp: string;
  from: string;
}

interface EventReceiverState {
  messages: ReceivedMessage[];
  eventService: any;
}

class EventReceiver extends React.Component<EventReceiverProps, EventReceiverState> {
  constructor(props: EventReceiverProps) {
    super(props);
    this.state = {
      messages: [],
      eventService: createEventService('ServiceExample_Events', 'event-receiver')
    };
  }

  componentDidMount() {
    // Set up the event service bridge when services are available
    if (this.props.services?.event) {
      this.state.eventService.setServiceBridge(this.props.services.event);
      console.log('[EventReceiver] Event service bridge initialized');
      
      // Subscribe to messages for this module
      this.state.eventService.subscribeToMessages(this.handleMessage);
      console.log('[EventReceiver] Subscribed to messages');
    }
  }

  componentDidUpdate(prevProps: EventReceiverProps) {
    if (prevProps.services?.event !== this.props.services?.event) {
      if (this.props.services?.event) {
        this.state.eventService.setServiceBridge(this.props.services.event);
        console.log('[EventReceiver] Event service bridge initialized');
        
        // Subscribe to messages for this module
        this.state.eventService.subscribeToMessages(this.handleMessage);
        console.log('[EventReceiver] Subscribed to messages');
      }
    }
  }

  componentWillUnmount() {
    // Cleanup on unmount
    if (this.props.services?.event) {
      this.state.eventService.unsubscribeFromMessages(this.handleMessage);
      console.log('[EventReceiver] Unsubscribed from messages');
    }
  }

  // Handle incoming messages
  handleMessage = (message: any) => {
    console.log('[EventReceiver] Received message:', message);
    
    const receivedMessage: ReceivedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type || 'unknown',
      text: message.text || 'No message content',
      timestamp: message.timestamp || new Date().toISOString(),
      from: message.from || 'unknown'
    };

    this.setState(prevState => ({
      messages: [...prevState.messages, receivedMessage]
    }));
  };

  clearMessages = () => {
    this.setState({ messages: [] });
  };

  formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  render() {
    const { messages } = this.state;

    return (
      <div style={{ 
        padding: '16px', 
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0', color: '#333', fontSize: '16px' }}>
            📥 Event Receiver
          </h3>
          <button
            onClick={this.clearMessages}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>

        <div style={{
          height: '150px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          padding: '8px'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              fontSize: '12px',
              textAlign: 'center',
              paddingTop: '40px'
            }}>
              No messages received yet...
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '8px',
                  padding: '6px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  borderLeft: '3px solid #2196f3'
                }}
              >
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                  <strong>From:</strong> {msg.from} | <strong>Type:</strong> {msg.type} | <strong>Time:</strong> {this.formatTime(msg.timestamp)}
                </div>
                <div style={{ fontSize: '12px', color: '#333' }}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#666'
        }}>
          <span>📊 <strong>Status:</strong> Listening for events | <strong>Messages:</strong> {messages.length}</span>
        </div>
      </div>
    );
  }
}

export default EventReceiver;