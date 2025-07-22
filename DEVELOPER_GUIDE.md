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
// In your component constructor
constructor(props: YourProps) {
  super(props);
  this.state = {
    eventService: createEventService('YourPlugin', 'your-module-id')
  };
}

// In componentDidMount
componentDidMount() {
  if (this.props.services?.event) {
    this.state.eventService.setServiceBridge(this.props.services.event);
  }
}

// Handle service availability changes
componentDidUpdate(prevProps: YourProps) {
  if (prevProps.services?.event !== this.props.services?.event) {
    if (this.props.services?.event) {
      this.state.eventService.setServiceBridge(this.props.services.event);
    }
  }
}
```

### Step 2: Sending Events

```typescript
// Basic message sending
const messageData = {
  type: 'your-message-type',
  text: 'Your message content',
  timestamp: new Date().toISOString(),
  from: 'your-module-id'
};

try {
  this.state.eventService.sendMessage('target-module-id', messageData);
  console.log('Message sent successfully');
} catch (error) {
  console.error('Failed to send message:', error);
}
```

### Step 3: Receiving Events

```typescript
// Subscribe to messages
componentDidMount() {
  if (this.props.services?.event) {
    this.state.eventService.setServiceBridge(this.props.services.event);
    this.state.eventService.subscribeToMessages(this.handleMessage);
  }
}

// Handle incoming messages
handleMessage = (message: any) => {
  console.log('Received message:', message);
  // Process the message
  this.setState({ 
    messages: [...this.state.messages, message] 
  });
};

// Clean up subscriptions
componentWillUnmount() {
  this.state.eventService.unsubscribeAll();
}
```

## 📋 Message Structure

### Standard Message Format

```typescript
interface EventMessage {
  // Required fields
  type: string;           // Message type (e.g., 'simple-message', 'broadcast')
  text: string;           // Message content
  timestamp: string;      // ISO timestamp
  from: string;          // Sender module ID
  
  // Optional fields
  messageNumber?: number; // Sequential message number
  targetModule?: string;  // Intended recipient
  isBroadcast?: boolean; // Whether this is a broadcast message
  
  // Metadata (added automatically by Event Service)
  _source?: {
    pluginId: string;
    moduleId: string;
  };
  _metadata?: {
    sentAt: string;
    messageId: string;
    options: EventOptions;
  };
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

### Common Error Types

```typescript
// Service not available
if (!this.state.eventService.isServiceAvailable()) {
  throw new EventServiceError(
    'Event Service not available. Ensure setServiceBridge() was called.',
    'SERVICE_UNAVAILABLE'
  );
}

// Invalid message format
if (!EventValidator.validateMessage(message)) {
  throw new EventServiceError('Invalid message format', 'INVALID_MESSAGE');
}

// Network/communication errors
try {
  this.state.eventService.sendMessage(targetId, message);
} catch (error) {
  if (error instanceof EventServiceError) {
    console.error('Event Service Error:', error.code, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Recovery Patterns

```typescript
// Retry mechanism for failed sends
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