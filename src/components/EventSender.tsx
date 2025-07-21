import React from 'react';
import { createEventService } from '../services/eventService';

interface EventSenderProps {
  services?: {
    event?: any;
  };
}

interface EventSenderState {
  message: string;
  targetModule: string;
  eventService: any;
}

class EventSender extends React.Component<EventSenderProps, EventSenderState> {
  constructor(props: EventSenderProps) {
    super(props);
    this.state = {
      message: '',
      targetModule: 'event-receiver',
      eventService: createEventService('ServiceExample_Events', 'event-sender')
    };
  }

  componentDidMount() {
    // Set up the event service bridge when services are available
    if (this.props.services?.event) {
      this.state.eventService.setServiceBridge(this.props.services.event);
      console.log('[EventSender] Event service bridge initialized');
    }
  }

  componentDidUpdate(prevProps: EventSenderProps) {
    if (prevProps.services?.event !== this.props.services?.event) {
      if (this.props.services?.event) {
        this.state.eventService.setServiceBridge(this.props.services.event);
        console.log('[EventSender] Event service bridge initialized');
      }
    }
  }

  handleSendMessage = () => {
    if (!this.state.message.trim()) return;

    const messageData = {
      type: 'simple-message',
      text: this.state.message,
      timestamp: new Date().toISOString(),
      from: 'event-sender'
    };

    this.state.eventService.sendMessage(this.state.targetModule, messageData);
    
    // Clear the input
    this.setState({ message: '' });
  };

  handleSendBroadcast = () => {
    const broadcastData = {
      type: 'broadcast',
      text: 'Hello from Event Sender!',
      timestamp: new Date().toISOString(),
      from: 'event-sender'
    };

    // Send to both receiver and display
    this.state.eventService.sendMessage('event-receiver', broadcastData);
    this.state.eventService.sendMessage('event-display', broadcastData);
  };

  handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.handleSendMessage();
    }
  };

  render() {
    const { message, targetModule } = this.state;

    return (
      <div style={{ 
        padding: '16px', 
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>
          📤 Event Sender
        </h3>
        
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
            onChange={(e) => this.setState({ targetModule: e.target.value })}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="event-receiver">Event Receiver</option>
            <option value="event-display">Event Display</option>
          </select>
        </div>

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
            onChange={(e) => this.setState({ message: e.target.value })}
            placeholder="Enter your message..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            onKeyPress={this.handleKeyPress}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={this.handleSendMessage}
            disabled={!message.trim()}
            style={{
              padding: '8px 12px',
              backgroundColor: message.trim() ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: message.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Send Message
          </button>
          
          <button
            onClick={this.handleSendBroadcast}
            style={{
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Send Broadcast
          </button>
        </div>

        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#666'
        }}>
          <span>💡 <strong>Tip:</strong> Type a message and click "Send Message" to send to the selected module,
          or click "Send Broadcast" to send a message to multiple modules.</span>
        </div>
      </div>
    );
  }
}

export default EventSender;