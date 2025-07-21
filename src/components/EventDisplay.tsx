import React from 'react';
import { createEventService } from '../services/eventService';

interface EventDisplayProps {
  services?: {
    event?: any;
  };
}

interface EventLog {
  id: string;
  type: string;
  text: string;
  timestamp: string;
  from: string;
  received: string;
}

interface EventDisplayState {
  eventLog: EventLog[];
  isListening: boolean;
  eventService: any;
}

class EventDisplay extends React.Component<EventDisplayProps, EventDisplayState> {
  constructor(props: EventDisplayProps) {
    super(props);
    this.state = {
      eventLog: [],
      isListening: false,
      eventService: createEventService('ServiceExample_Events', 'event-display')
    };
  }

  componentDidMount() {
    // Set up the event service bridge when services are available
    if (this.props.services?.event) {
      this.state.eventService.setServiceBridge(this.props.services.event);
      console.log('[EventDisplay] Event service bridge initialized');
      
      // Subscribe to messages for this module
      this.state.eventService.subscribeToMessages(this.handleMessage);
      this.setState({ isListening: true });
      console.log('[EventDisplay] Subscribed to messages');
    }
  }

  componentDidUpdate(prevProps: EventDisplayProps) {
    if (prevProps.services?.event !== this.props.services?.event) {
      if (this.props.services?.event) {
        this.state.eventService.setServiceBridge(this.props.services.event);
        console.log('[EventDisplay] Event service bridge initialized');
        
        // Subscribe to messages for this module
        this.state.eventService.subscribeToMessages(this.handleMessage);
        this.setState({ isListening: true });
        console.log('[EventDisplay] Subscribed to messages');
      }
    }
  }

  componentWillUnmount() {
    // Cleanup on unmount
    if (this.props.services?.event) {
      this.state.eventService.unsubscribeFromMessages(this.handleMessage);
      this.setState({ isListening: false });
      console.log('[EventDisplay] Unsubscribed from messages');
    }
  }

  // Handle incoming messages
  handleMessage = (message: any) => {
    console.log('[EventDisplay] Received message:', message);
    
    const logEntry: EventLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type || 'unknown',
      text: message.text || 'No message content',
      timestamp: message.timestamp || new Date().toISOString(),
      from: message.from || 'unknown',
      received: new Date().toISOString()
    };

    this.setState(prevState => ({
      eventLog: [logEntry, ...prevState.eventLog].slice(0, 50) // Keep only last 50 events
    }));
  };

  clearLog = () => {
    this.setState({ eventLog: [] });
  };

  formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  getTypeColor = (type: string) => {
    switch (type) {
      case 'simple-message': return '#2196f3';
      case 'broadcast': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  render() {
    const { eventLog, isListening } = this.state;

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
            📊 Event Display
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isListening ? '#4caf50' : '#f44336'
            }} />
            <span style={{ fontSize: '10px', color: '#666' }}>
              {isListening ? 'Listening' : 'Offline'}
            </span>
            <button
              onClick={this.clearLog}
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
              Clear Log
            </button>
          </div>
        </div>

        <div style={{
          height: '200px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          padding: '8px'
        }}>
          {eventLog.length === 0 ? (
            <div style={{ 
              color: '#999', 
              fontStyle: 'italic', 
              fontSize: '12px',
              textAlign: 'center',
              paddingTop: '60px'
            }}>
              Event log is empty. Send some messages to see them here!
            </div>
          ) : (
            eventLog.map((log) => (
              <div
                key={log.id}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${this.getTypeColor(log.type)}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    <span style={{ 
                      backgroundColor: this.getTypeColor(log.type),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      marginRight: '6px'
                    }}>
                      {log.type}
                    </span>
                    from <strong>{log.from}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {this.formatTime(log.received)}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px' }}>
                  {log.text}
                </div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  Original timestamp: {this.formatTime(log.timestamp)}
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
          <span>📈 <strong>Total Events:</strong> {eventLog.length} |
          <strong> Status:</strong> {isListening ? 'Active' : 'Inactive'} |
          <strong> Max Log Size:</strong> 50 events</span>
        </div>
      </div>
    );
  }
}

export default EventDisplay;