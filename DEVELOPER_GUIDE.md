# ServiceExample_Events - Developer Guide

## 📚 Complete Guide to BrainDrive Event Service Bridge

This guide provides comprehensive documentation for developers learning to use BrainDrive's Event Service Bridge. The ServiceExample_Events plugin serves as a working demonstration of all key concepts and patterns.

## 🎯 Learning Objectives

After studying this plugin and guide, you will understand:

1. **Event Service Bridge Architecture** - How BrainDrive's event system works
2. **Service Integration Patterns** - Proper ways to connect to BrainDrive services
3. **Inter-Module Communication** - How modules communicate with each other
4. **Error Handling** - Robust error handling for event operations
5. **Best Practices** - Production-ready patterns and techniques
6. **Common Pitfalls** - What to avoid and how to debug issues

## 🏗️ Architecture Overview

### Event Service Bridge Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Plugin   │    │  Event Service  │    │  Target Module  │
│                 │    │     Bridge      │    │                 │
│ 1. Create       │───▶│ 2. Route        │───▶│ 3. Receive      │
│    Message      │    │    Message      │    │    Message      │
│                 │    │                 │    │                 │
│ 4. Get          │◀───│ 5. Deliver      │◀───│ 6. Process      │
│    Response     │    │    Response     │    │    & Respond    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

1. **Event Service Bridge** - Provided by BrainDrive through `props.services.event`
2. **Plugin Event Service** - Your wrapper around the bridge (see `eventService.ts`)
3. **Message Structure** - Standardized format for all events
4. **Event Options** - Configuration for remote/persistent events

## 🔧 Implementation Guide

### Step 1: Service Integration

```typescript
// In your component constructor (from EventSender.tsx)
constructor(props: EventSenderProps) {
  super(props);
  this.state = {
    message: '',
    targetModule: 'event-receiver',
    eventService: createEventService('ServiceExample_Events', 'event-sender'),
    status: 'Initializing Event Service...',
    isServiceConnected: false,
    isLoading: false,
    messagesSent: 0
  };
}

// In componentDidMount (from EventSender.tsx)
componentDidMount() {
  console.log('[EventSender] 📚 LEARNING: Component mounted, checking for Event Service...');
  this.initializeEventService();
}

// Handle service availability changes (from EventSender.tsx)
componentDidUpdate(prevProps: EventSenderProps) {
  if (prevProps.services?.event !== this.props.services?.event) {
    console.log('[EventSender] 📚 LEARNING: Event Service availability changed, reinitializing...');
    this.initializeEventService();
  }
}

// Initialize Event Service (from EventSender.tsx)
initializeEventService = () => {
  try {
    if (this.props.services?.event) {
      this.state.eventService.setServiceBridge(this.props.services.event);
      this.setState({
        status: '✅ Event Service connected and ready',
        isServiceConnected: true
      });
    } else {
      this.setState({
        status: '⏳ Waiting for Event Service to become available...',
        isServiceConnected: false
      });
    }
  } catch (error) {
    this.setState({
      status: `❌ Event Service initialization failed: ${error.message}`,
      isServiceConnected: false
    });
  }
};
```

### Step 2: Sending Events

```typescript
// Message sending (from EventSender.tsx)
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

  try {
    // Create message with proper structure (matches actual implementation)
    const messageData = {
      type: 'simple-message',
      text: this.state.message.trim(),
      timestamp: new Date().toISOString(),
      from: 'event-sender',
      messageNumber: this.state.messagesSent + 1,
      targetModule: this.state.targetModule
    };

    // Send the message through Event Service
    this.state.eventService.sendMessage(this.state.targetModule, messageData);
    
    // Update state on success
    this.setState({
      message: '',
      status: `✅ Message sent to ${this.state.targetModule}`,
      messagesSent: this.state.messagesSent + 1
    });
  } catch (error) {
    this.setState({
      status: `❌ Failed to send message: ${error.message}`
    });
  }
};
```

### Step 3: Receiving Events

```typescript
// Subscribe to messages (from EventReceiver.tsx)
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

// Handle incoming messages (from EventReceiver.tsx)
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

// Clean up subscriptions (from EventReceiver.tsx)
componentWillUnmount() {
  // Cleanup on unmount
  if (this.props.services?.event) {
    this.state.eventService.unsubscribeFromMessages(this.handleMessage);
    console.log('[EventReceiver] Unsubscribed from messages');
  }
}
```

## 📋 Message Structure

### Standard Message Format (from eventService.ts)

```typescript
interface EventMessage<T = any> {
  /** The type of event (e.g., 'simple-message', 'broadcast', 'notification') */
  type: string;
  
  /** Information about the message sender */
  source: {
    /** ID of the plugin that sent the message */
    pluginId: string;
    /** ID of the specific module that sent the message */
    moduleId: string;
    /** Whether this message originated from a remote source */
    isRemote: boolean;
  };
  
  /** Information about the message target */
  target: {
    /** ID of the target plugin (optional for same-plugin communication) */
    pluginId?: string;
    /** ID of the target module */
    moduleId: string;
    /** Whether this message should be sent to a remote target */
    isRemote: boolean;
  };
  
  /** The actual message content - can be any type */
  content: T;
  /** ISO timestamp when the message was created */
  timestamp: string;
  /** Unique identifier for this message */
  id: string;
}
```

### Simplified Message Format (used in components)

```typescript
// The components use a simplified format for ease of use
interface SimpleMessage {
  type: string;           // Message type (e.g., 'simple-message', 'broadcast')
  text: string;           // Message content
  timestamp: string;      // ISO timestamp
  from: string;          // Sender module ID
  
  // Optional fields
  messageNumber?: number; // Sequential message number
  targetModule?: string;  // Intended recipient
  isBroadcast?: boolean; // Whether this is a broadcast message
}
```

### Received Message Format (from EventReceiver.tsx)

```typescript
// Format used by EventReceiver for displaying received messages
interface ReceivedMessage {
  id: string;        // Unique message ID
  type: string;      // Message type
  text: string;      // Message content
  timestamp: string; // ISO timestamp
  from: string;      // Sender module ID
}
```

### Event Options

```typescript
interface EventOptions {
  remote: boolean;    // Send to remote BrainDrive instances
  persist?: boolean;  // Store for persistence across sessions
}

// Examples
const localOnly = { remote: false };
const remoteAndLocal = { remote: true };
const persistent = { remote: false, persist: true };
const remoteAndPersistent = { remote: true, persist: true };
```

### Step 4: Broadcast Messaging

```typescript
// Broadcast messaging (from EventSender.tsx)
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
      status: `✅ Broadcast sent to ${targets.length} modules`,
      messagesSent: this.state.messagesSent + 1,
      isLoading: false
    });

  } catch (error) {
    this.setState({
      status: `❌ Broadcast failed: ${error.message}`,
      isLoading: false
    });
  }
};
```

## 🎨 UI Patterns

### Connection Status Indicator

```typescript
// Visual indicator for service connection
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
```

### Status Messages with Color Coding

```typescript
// Dynamic status styling based on message type
const getStatusStyle = (status: string) => ({
  padding: '8px',
  borderRadius: '4px',
  fontSize: '11px',
  backgroundColor: status.includes('❌') ? '#ffebee' : 
                  status.includes('✅') ? '#e8f5e8' : 
                  status.includes('⏳') ? '#fff3e0' : '#f5f5f5',
  border: '1px solid ' + (status.includes('❌') ? '#ffcdd2' : 
                         status.includes('✅') ? '#c8e6c9' : 
                         status.includes('⏳') ? '#ffcc02' : '#e0e0e0')
});
```

## 🚨 Error Handling

### Custom Error Types (from eventService.ts)

```typescript
/**
 * Custom error types for Event Service operations
 */
export class EventServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EventServiceError';
  }
}
```

### Message Validation (from eventService.ts)

```typescript
/**
 * Validation utilities for event messages
 */
export class EventValidator {
  /**
   * Validate that a message has required fields
   */
  static validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      console.warn('[EventService] Invalid message: not an object');
      return false;
    }
    
    if (!message.type || typeof message.type !== 'string') {
      console.warn('[EventService] Invalid message: missing or invalid type');
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate event options
   */
  static validateOptions(options: EventOptions): boolean {
    if (typeof options.remote !== 'boolean') {
      console.warn('[EventService] Invalid options: remote must be boolean');
      return false;
    }
    
    if (options.persist !== undefined && typeof options.persist !== 'boolean') {
      console.warn('[EventService] Invalid options: persist must be boolean');
      return false;
    }
    
    return true;
  }
}
```

### Error Handling Patterns (from components)

```typescript
// Service availability check (from EventSender.tsx)
if (!this.state.isServiceConnected) {
  this.setState({ status: '❌ Event Service not connected' });
  return;
}

// Input validation (from EventSender.tsx)
if (!this.state.message.trim()) {
  this.setState({ status: '⚠️ Please enter a message to send' });
  return;
}

// Try-catch for message sending (from EventSender.tsx)
try {
  this.state.eventService.sendMessage(this.state.targetModule, messageData);
  this.setState({
    status: `✅ Message sent to ${this.state.targetModule}`,
    messagesSent: this.state.messagesSent + 1
  });
} catch (error) {
  let errorMessage = 'Unknown error occurred';
  if (error instanceof Error) {
    errorMessage = `Error: ${error.message}`;
  }
  
  this.setState({
    status: `❌ ${errorMessage}`,
    isLoading: false
  });
}
```

### Error Recovery Patterns

```typescript
// Retry mechanism for failed sends (example pattern)
const sendWithRetry = async (targetId: string, message: any, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      this.state.eventService.sendMessage(targetId, message);
      return; // Success
    } catch (error) {
      console.warn(`Send attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## 🔍 Debugging and Monitoring

### Educational Logging

The plugin includes comprehensive logging for learning purposes:

```typescript
// Enable educational logging
console.group('[EventService] 📚 LEARNING: Sending Message');
console.log('From:', this.pluginId + '/' + this.moduleId);
console.log('To:', targetModuleId);
console.log('Message:', messageData);
console.log('📚 This demonstrates targeted event communication');
console.groupEnd();
```

### Service Statistics

```typescript
// Get service usage statistics
const stats = this.state.eventService.getServiceStats();
console.log('Service Stats:', {
  pluginId: stats.pluginId,
  moduleId: stats.moduleId,
  messagesSent: stats.messagesSent,
  activeSubscriptions: stats.activeSubscriptions,
  isConnected: stats.isConnected
});
```

## 🎯 Best Practices

### 1. Service Lifecycle Management

```typescript
// ✅ Good: Check service availability
if (this.state.eventService.isServiceAvailable()) {
  this.state.eventService.sendMessage(targetId, message);
}

// ❌ Bad: Assume service is always available
this.state.eventService.sendMessage(targetId, message); // May throw error
```

### 2. Memory Management

```typescript
// ✅ Good: Clean up subscriptions
componentWillUnmount() {
  this.state.eventService.unsubscribeAll();
}

// ❌ Bad: Leave subscriptions active
// (causes memory leaks and unexpected behavior)
```

### 3. Message Validation

```typescript
// ✅ Good: Validate before sending
if (EventValidator.validateMessage(message)) {
  this.state.eventService.sendMessage(targetId, message);
} else {
  console.error('Invalid message format');
}

// ❌ Bad: Send without validation
this.state.eventService.sendMessage(targetId, message); // May fail
```

### 4. Error Handling

```typescript
// ✅ Good: Comprehensive error handling
try {
  this.state.eventService.sendMessage(targetId, message);
  this.setState({ status: 'Message sent successfully' });
} catch (error) {
  const errorMessage = error instanceof EventServiceError 
    ? `Event Service Error: ${error.message}`
    : `Unexpected error: ${error.message}`;
  this.setState({ status: errorMessage });
  console.error('Send failed:', error);
}

// ❌ Bad: No error handling
this.state.eventService.sendMessage(targetId, message);
this.setState({ status: 'Message sent' }); // May not be true
```

## 🐛 Common Pitfalls

### 1. Forgetting to Unsubscribe

```typescript
// ❌ Problem: Memory leaks
componentDidMount() {
  this.state.eventService.subscribeToMessages(this.handleMessage);
}
// Missing componentWillUnmount cleanup

// ✅ Solution: Always clean up
componentWillUnmount() {
  this.state.eventService.unsubscribeAll();
}
```

### 2. Using Same Module ID

```typescript
// ❌ Problem: Module ID conflicts
const service1 = createEventService('MyPlugin', 'module'); // Same ID
const service2 = createEventService('MyPlugin', 'module'); // Same ID

// ✅ Solution: Unique module IDs
const service1 = createEventService('MyPlugin', 'sender-module');
const service2 = createEventService('MyPlugin', 'receiver-module');
```

### 3. Not Checking Service Availability

```typescript
// ❌ Problem: Service may not be ready
this.state.eventService.sendMessage(targetId, message); // May throw

// ✅ Solution: Check availability first
if (this.state.eventService.isServiceAvailable()) {
  this.state.eventService.sendMessage(targetId, message);
} else {
  console.warn('Event Service not available');
}
```

## 🧪 Testing Strategies

### 1. Component Testing

```typescript
// Test service initialization
it('should initialize Event Service on mount', () => {
  const mockServices = { event: mockEventBridge };
  const component = mount(<EventSender services={mockServices} />);
  expect(component.state('isServiceConnected')).toBe(true);
});

// Test message sending
it('should send message when service is available', () => {
  const component = mount(<EventSender services={mockServices} />);
  component.setState({ message: 'test message' });
  component.find('button').first().simulate('click');
  expect(mockEventBridge.sendMessage).toHaveBeenCalled();
});
```

### 2. Integration Testing

```typescript
// Test cross-module communication
it('should receive messages from other modules', async () => {
  const sender = mount(<EventSender services={mockServices} />);
  const receiver = mount(<EventReceiver services={mockServices} />);
  
  // Send message from sender
  sender.setState({ message: 'test', targetModule: 'receiver' });
  sender.find('button').first().simulate('click');
  
  // Verify receiver gets the message
  await waitFor(() => {
    expect(receiver.state('messages')).toHaveLength(1);
  });
});
```

## 📚 Additional Resources

### Code Examples

- **EventSender.tsx** - Complete sender implementation with error handling
- **EventReceiver.tsx** - Message receiving and display patterns
- **EventDisplay.tsx** - Event monitoring and logging
- **eventService.ts** - Service wrapper with educational features

### Educational Features

- Comprehensive console logging for learning
- Visual status indicators and feedback
- Service statistics and debugging information
- Error handling demonstrations
- Best practice examples

### Development Tools

- Service availability checking
- Message validation utilities
- Error handling classes
- Educational logging functions
- Statistics and monitoring

## 🎓 Next Steps

1. **Study the Code** - Examine each component to understand patterns
2. **Experiment** - Modify the demo to test different scenarios
3. **Build Your Own** - Create your own Event Service integration
4. **Test Thoroughly** - Use the patterns shown for robust error handling
5. **Monitor and Debug** - Use the logging and statistics features

## 💡 Tips for Success

- Always check service availability before operations
- Use unique module IDs for each component
- Implement comprehensive error handling
- Clean up subscriptions in component unmount
- Use educational logging during development
- Test with both connected and disconnected states
- Validate messages before sending
- Handle both local and remote event scenarios

---

**Happy Event Service Development! 🚀**

*This guide is part of the ServiceExample_Events plugin - a comprehensive demonstration of BrainDrive's Event Service Bridge functionality.*