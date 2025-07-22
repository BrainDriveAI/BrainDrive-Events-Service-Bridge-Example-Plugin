# ServiceExample_Events - BrainDrive Event Service Bridge Demo

A working demonstration plugin for BrainDrive's Event Service Bridge functionality. This plugin showcases real-time inter-module communication within the BrainDrive platform through three interactive components that send, receive, and monitor events.

## 📸 Plugin Demo

![Event Service Bridge Demo](/home/hacker/BrainDriveDev/BrainDrive/PluginBuild/ServiceExample_Events/screenshot/EventDemoPage.png)

*The ServiceExample_Events plugin in action, showing real-time event communication between the Event Sender, Event Receiver, and Event Display modules.*

## 🎯 Purpose

This plugin serves as a **working demo** of BrainDrive's Event Service Bridge, demonstrating:
- How modules communicate with each other on a BrainDrive page
- Real-time event passing between different plugin modules
- Event Service Bridge integration patterns
- Best practices for inter-module communication in BrainDrive

## 📦 What's Included

### Three Demo Modules

1. **Event Sender** - Send messages to other modules
2. **Event Receiver** - Receive and display incoming messages  
3. **Event Display** - Monitor all event activity in real-time

### Event Service Bridge Integration
- Complete Event Service wrapper implementation
- Proper service bridge connection handling
- Real-time event subscription and publishing
- Module-to-module communication patterns

## 🚀 Installation & Usage

### Prerequisites
- BrainDrive platform (this plugin runs inside BrainDrive)
- Plugin Manager access in BrainDrive

### Installation
1. Install the plugin through BrainDrive's Plugin Manager
2. The plugin will be available in your module library

### Usage in BrainDrive
1. **Create a new page** in BrainDrive
2. **Add the demo modules** to your page:
   - Drag "Event Sender" module to the page
   - Drag "Event Receiver" module to the page  
   - Drag "Event Display" module to the page
3. **Test the communication**:
   - Type a message in Event Sender
   - Select target module (Event Receiver or Event Display)
   - Click "Send Message" or "Send Broadcast"
   - Watch real-time updates in Event Receiver and Event Display

## 🔧 Demo Features

### Event Sender Module
- **Target Selection**: Choose which module to send messages to
- **Message Composition**: Type custom messages
- **Send Options**: 
  - Send targeted message to specific module
  - Send broadcast message to multiple modules
- **Real-time Feedback**: Status updates and confirmations

### Event Receiver Module  
- **Auto-listening**: Automatically receives events when placed on page
- **Message Display**: Shows incoming messages with timestamps
- **Sender Information**: Displays who sent each message
- **Message History**: Keeps track of received messages
- **Clear Function**: Reset message history

### Event Display Module
- **Event Monitoring**: Logs all event activity on the page
- **Event Categorization**: Color-coded event types
- **Timestamp Tracking**: Shows both sent and received times
- **Connection Status**: Visual indicator of Event Service connection
- **Event Statistics**: Total event count and activity status

## 📡 Event Service Bridge Demo

This plugin demonstrates key Event Service Bridge concepts:

### Service Integration
```typescript
// How the Event Service Bridge is initialized
eventService.setServiceBridge(services.event);
```

### Event Publishing
```typescript
// Send targeted message
eventService.sendMessage('target-module-id', messageData);

// Send broadcast message  
eventService.sendMessage('event-receiver', broadcastData);
eventService.sendMessage('event-display', broadcastData);
```

### Event Subscription
```typescript
// Subscribe to incoming events
eventService.subscribeToMessages(handleMessage);
```

## 🎓 Learning Objectives

After using this demo, developers will understand:
- How BrainDrive's Event Service Bridge works
- Patterns for inter-module communication
- Event subscription and publishing in BrainDrive
- Service bridge integration best practices
- Real-time communication between plugin modules

## 🧪 Testing the Demo

### Basic Test Flow
1. Place all three modules on a BrainDrive page
2. Use Event Sender to send a message to Event Receiver
3. Watch the message appear in Event Receiver
4. Check Event Display to see the event was logged
5. Try broadcast messages to see multiple modules receive events

### Advanced Testing
- Test with multiple Event Receiver modules on the same page
- Send different message types and observe categorization
- Monitor connection status indicators
- Test message history and clearing functionality

## 🔍 Technical Implementation

### Module Federation Architecture
- Class-based React components for BrainDrive compatibility
- Proper webpack configuration for plugin loading
- Service bridge integration following BrainDrive patterns

### Event Data Structure
```typescript
interface EventMessage {
  type: string;           // Event type (e.g., 'simple-message', 'broadcast')
  text: string;           // Message content
  timestamp: string;      // ISO timestamp when sent
  from: string;          // Sender module identifier
}
```

### Component Lifecycle
- Proper service bridge initialization
- Event subscription management
- Cleanup on component unmount

## 🛠️ For Developers

This plugin serves as a **reference implementation** for:
- Event Service Bridge integration
- Inter-module communication patterns
- BrainDrive plugin architecture
- Service bridge connection handling

### Key Files
- `src/services/eventService.ts` - Event Service Bridge wrapper
- `src/components/EventSender.tsx` - Message sending component
- `src/components/EventReceiver.tsx` - Message receiving component  
- `src/components/EventDisplay.tsx` - Event monitoring component

## 📋 Requirements

- **BrainDrive Platform**: This plugin must run inside BrainDrive
- **Event Service**: Requires BrainDrive's Event Service to be available
- **Module Support**: Page must support multiple modules for full demo

## 🆘 Troubleshooting

### Common Issues
- **No events received**: Ensure Event Service is available in BrainDrive
- **Modules not communicating**: Check that modules are on the same page
- **Connection issues**: Verify Event Service Bridge is properly initialized

### Debug Tips
- Check browser console for Event Service logs
- Use Event Display module to monitor all event activity
- Verify module IDs match between sender and receiver

## 📚 Related Documentation

- [BrainDrive Event Service Documentation](https://braindrive.ai/docs/services/events)
- [BrainDrive Plugin Development Guide](https://braindrive.ai/docs/plugins)
- [Service Bridge Integration Patterns](https://braindrive.ai/docs/services/bridge)

---

**Experience BrainDrive's Event Service Bridge in Action! 🌉**

*This is a demonstration plugin designed to run within the BrainDrive platform. It showcases real-time inter-module communication capabilities.*