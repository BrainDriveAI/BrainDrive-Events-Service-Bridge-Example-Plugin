# ServiceExample_Events Plugin

A comprehensive demonstration of BrainDrive's Event Service Bridge functionality, showcasing all event communication patterns and features through 6 interactive modules.

## 🎯 Overview

The ServiceExample_Events plugin serves as both a functional demonstration and educational resource for developers working with BrainDrive's Event Service Bridge. It provides real-world examples of:

- **Local vs Remote Messaging** - Different event delivery patterns
- **Message Persistence** - Storing and replaying event history
- **Real-time Monitoring** - Live event tracking and debugging
- **Queue Management** - Message processing and visualization
- **Multi-target Broadcasting** - Sending messages to multiple recipients
- **Event Service Integration** - Complete API usage examples

## 📦 Plugin Structure

```
ServiceExample_Events/
├── src/
│   ├── components/           # 6 main modules + shared components
│   │   ├── LeftChat/        # Local messaging demo
│   │   ├── RightChat/       # Remote messaging demo
│   │   ├── ChatHistory/     # Persistence demo
│   │   ├── EventMonitor/    # Real-time tracking
│   │   ├── MessageQueue/    # Queue visualization
│   │   ├── BroadcastCenter/ # Multi-target messaging
│   │   └── shared/          # Reusable components
│   ├── services/            # Event service wrapper
│   ├── types.ts             # Comprehensive type definitions
│   ├── utils.ts             # Utility functions
│   └── index.tsx            # Main entry point
├── docs/                    # Documentation
└── dist/                    # Built plugin files
```

## 🚀 Quick Start

### Installation

1. **Copy Plugin Files**
   ```bash
   cp -r PluginBuild/ServiceExample_Events /path/to/braindrive/plugins/
   ```

2. **Build Plugin** (if needed)
   ```bash
   cd ServiceExample_Events
   npm install
   npm run build
   ```

3. **Add Modules to BrainDrive**
   - Open BrainDrive
   - Navigate to Plugin Manager
   - Add any of the 6 available modules to your page

### Available Modules

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **LeftChat** | Local messaging demo | Real-time chat, local events, blue theme |
| **RightChat** | Remote messaging demo | Persistent chat, remote events, green theme |
| **ChatHistory** | Persistence demo | Message history, replay functionality |
| **EventMonitor** | Real-time tracking | Live event logs, filtering, debugging |
| **MessageQueue** | Queue visualization | Message processing, queue management |
| **BroadcastCenter** | Multi-target messaging | Broadcast to multiple modules |

## 🎨 Module Themes

Each module has a distinct visual theme to help differentiate functionality:

- 🔵 **LeftChat** - Blue theme (local messaging)
- 🟢 **RightChat** - Green theme (remote messaging)
- ⚪ **ChatHistory** - Neutral theme (persistence)
- 🟣 **EventMonitor** - Purple theme (monitoring)
- 🟠 **MessageQueue** - Orange theme (queue management)
- 🟣 **BroadcastCenter** - Violet theme (broadcasting)

## 🔧 Event Service Features Demonstrated

### Core Methods
- `sendMessage(targetId, message, options)` - Send events to specific targets
- `subscribeToMessages(callback)` - Listen for incoming events
- `unsubscribeFromMessages(callback)` - Stop listening for events

### Event Options
- **Local vs Remote** - `{ remote: true/false }`
- **Persistence** - `{ persist: true/false }`
- **Priority** - `{ priority: 'low'|'normal'|'high' }`
- **Broadcasting** - Send to multiple targets simultaneously

### Message Types
- Chat messages (`chat.message`, `chat.typing`)
- Broadcast messages (`broadcast.announcement`)
- Queue messages (`queue.message`, `queue.processed`)
- System messages (`system.event`, `system.error`)
- Connection status (`connection.status`)
- Performance metrics (`performance.metric`)

## 📚 Usage Examples

### Basic Chat Implementation
```typescript
import { ServiceExampleEventService } from './services/eventService';

// Initialize event service
const eventService = new ServiceExampleEventService('MyPlugin', 'chat-module');

// Send a message
eventService.sendMessage('target-module', {
  type: 'chat.message',
  content: 'Hello, World!',
  sender: 'user123'
}, { remote: true, persist: true });

// Listen for messages
eventService.subscribeToMessages((message) => {
  console.log('Received:', message);
});
```

### Broadcasting to Multiple Targets
```typescript
// Send to multiple modules
const targets = ['left-chat', 'right-chat', 'chat-history'];
targets.forEach(targetId => {
  eventService.sendMessage(targetId, broadcastMessage, {
    remote: true,
    persist: false,
    priority: 'high'
  });
});
```

### Message Persistence and Replay
```typescript
// Enable persistence for message history
eventService.sendMessage('chat-history', message, {
  persist: true,
  remote: true
});

// Messages are automatically stored and can be replayed
```

## 🎯 Learning Objectives

By exploring this plugin, developers will learn:

1. **Event Service Integration** - How to properly initialize and use the Event Service
2. **Message Patterns** - Different ways to structure and send events
3. **Component Communication** - How modules can interact through events
4. **State Management** - Managing component state with event-driven updates
5. **Real-time Features** - Building responsive, live-updating interfaces
6. **Error Handling** - Proper error handling and debugging techniques
7. **Performance Optimization** - Efficient event handling and memory management

## 🔍 Module Details

### LeftChat (Local Messaging)
- **Purpose**: Demonstrates local event messaging
- **Features**: Real-time chat interface, typing indicators, local storage
- **Theme**: Blue (#3B82F6)
- **Use Case**: Simple module-to-module communication

### RightChat (Remote Messaging)
- **Purpose**: Shows remote messaging with persistence
- **Features**: Persistent chat, remote delivery, connection status
- **Theme**: Green (#10B981)
- **Use Case**: Cross-plugin communication with reliability

### ChatHistory (Persistence Demo)
- **Purpose**: Message persistence and replay functionality
- **Features**: Message history, filtering, replay controls
- **Theme**: Neutral (#6B7280)
- **Use Case**: Audit trails, message archiving

### EventMonitor (Real-time Tracking)
- **Purpose**: Live event monitoring and debugging
- **Features**: Real-time event logs, filtering, export functionality
- **Theme**: Purple (#9C27B0)
- **Use Case**: Development debugging, system monitoring

### MessageQueue (Queue Visualization)
- **Purpose**: Message queue processing demonstration
- **Features**: Queue visualization, processing controls, statistics
- **Theme**: Orange (#FF9800)
- **Use Case**: Batch processing, message queuing systems

### BroadcastCenter (Multi-target Messaging)
- **Purpose**: Broadcasting messages to multiple targets
- **Features**: Target selection, delivery tracking, confirmation management
- **Theme**: Violet (#8B5CF6)
- **Use Case**: Notifications, system-wide announcements

## 🛠️ Development

### Building from Source
```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

### Project Structure
- **Components** - React class-based components for BrainDrive compatibility
- **Services** - Event service wrapper and utilities
- **Types** - Comprehensive TypeScript definitions
- **Styles** - CSS modules with theme system
- **Utils** - Helper functions and utilities

### Adding New Features
1. Define types in `src/types.ts`
2. Implement component in `src/components/`
3. Add styling with theme support
4. Update webpack configuration
5. Test event communication patterns

## 📖 Documentation

- [**Architecture Overview**](docs/service_examples/events/ServiceExample_Events_Plan.md) - Detailed technical architecture
- [**API Reference**](docs/api/) - Complete API documentation
- [**Component Guide**](docs/components/) - Individual component documentation
- [**Event Patterns**](docs/patterns/) - Event communication patterns
- [**Styling Guide**](docs/styling/) - Theme system and CSS architecture

## 🤝 Contributing

This plugin serves as a reference implementation. When contributing:

1. Follow the established patterns and conventions
2. Maintain comprehensive TypeScript types
3. Include proper error handling
4. Add appropriate documentation
5. Test all event communication patterns

## 📄 License

This plugin is part of the BrainDrive ecosystem and follows the same licensing terms.

## 🆘 Support

For questions about Event Service usage or this plugin:

1. Check the [documentation](docs/)
2. Review the [source code examples](src/components/)
3. Test with the interactive modules
4. Refer to the BrainDrive Event Service documentation

---

**Version**: 1.0.0  
**Author**: BrainDrive Team  
**Last Updated**: 2025-01-21