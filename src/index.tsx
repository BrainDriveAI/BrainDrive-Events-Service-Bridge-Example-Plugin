/**
 * ServiceExample_Events Plugin Entry Point
 * 
 * This file serves as the main entry point for the ServiceExample_Events plugin.
 * It exports all the individual modules that can be used independently in BrainDrive.
 */

import React from 'react';
import './ServiceExample_Events.css';

// Import all module components
import LeftChat from './components/LeftChat/LeftChat';
import RightChat from './components/RightChat/RightChat';
import ChatHistory from './components/ChatHistory/ChatHistory';
import EventMonitor from './components/EventMonitor/EventMonitor';
import MessageQueue from './components/MessageQueue/MessageQueue';
import BroadcastCenter from './components/BroadcastCenter/BroadcastCenter';

// Import types
import { 
  Services, 
  LeftChatProps, 
  RightChatProps, 
  ChatHistoryProps,
  EventMonitorProps,
  MessageQueueProps,
  BroadcastCenterProps
} from './types';

// Plugin version information
export const version = '1.0.0';
export const pluginName = 'ServiceExample_Events';

/**
 * Plugin Information
 */
export const pluginInfo = {
  name: 'ServiceExample_Events',
  version: '1.0.0',
  description: 'Comprehensive Event Service Bridge demonstration',
  author: 'BrainDrive',
  modules: [
    {
      name: 'LeftChat',
      displayName: 'Left Chat (Local Messaging)',
      description: 'Demonstrates local event messaging patterns',
      category: 'communication'
    },
    {
      name: 'RightChat',
      displayName: 'Right Chat (Remote Messaging)',
      description: 'Demonstrates remote messaging and persistence',
      category: 'communication'
    },
    {
      name: 'ChatHistory',
      displayName: 'Chat History (Persistence Demo)',
      description: 'Demonstrates message persistence and queue replay',
      category: 'display'
    },
    {
      name: 'EventMonitor',
      displayName: 'Event Monitor',
      description: 'Real-time event tracking and debugging',
      category: 'monitoring'
    },
    {
      name: 'MessageQueue',
      displayName: 'Message Queue Visualizer',
      description: 'Message queue management and visualization',
      category: 'monitoring'
    },
    {
      name: 'BroadcastCenter',
      displayName: 'Broadcast Center',
      description: 'Multi-target message broadcasting',
      category: 'communication'
    }
  ]
};

/**
 * Main Plugin Component (for development and testing)
 * This component is not exposed in webpack but can be used for local development
 */
interface ServiceExampleEventsProps {
  services: Services;
  config?: {
    showAllModules?: boolean;
    moduleLayout?: 'grid' | 'stack';
  };
}

const ServiceExampleEvents: React.FC<ServiceExampleEventsProps> = ({ 
  services, 
  config = {} 
}) => {
  const { showAllModules = false, moduleLayout = 'grid' } = config;

  if (!showAllModules) {
    return (
      <div className="service-example-events theme-neutral">
        <div className="module-container">
          <div className="module-header">
            <h2 className="module-title">
              ServiceExample_Events Plugin
              <span className="module-badge">Demo</span>
            </h2>
          </div>
          <div className="module-content">
            <p>
              This plugin demonstrates all Event Service Bridge functionality in BrainDrive.
              Each module can be added independently to showcase different event patterns:
            </p>
            <ul>
              <li><strong>LeftChat</strong> - Local messaging demonstration</li>
              <li><strong>RightChat</strong> - Remote messaging with persistence</li>
              <li><strong>ChatHistory</strong> - Message persistence and queue replay</li>
              <li><strong>EventMonitor</strong> - Real-time event tracking</li>
              <li><strong>MessageQueue</strong> - Queue visualization and management</li>
              <li><strong>BroadcastCenter</strong> - Multi-target broadcasting</li>
            </ul>
            <p>
              Add these modules to your page individually to see the Event Service in action!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Development view showing all modules
  return (
    <div className="service-example-events theme-neutral">
      <div className="module-container">
        <div className="module-header">
          <h2 className="module-title">
            ServiceExample_Events - All Modules
            <span className="module-badge">Dev</span>
          </h2>
        </div>
        <div 
          className="module-content"
          style={{
            display: moduleLayout === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: moduleLayout === 'grid' ? 'repeat(auto-fit, minmax(300px, 1fr))' : undefined,
            flexDirection: moduleLayout === 'stack' ? 'column' : undefined,
            gap: '16px'
          }}
        >
          <div style={{ minHeight: '200px' }}>
            <LeftChat
              services={services}
              moduleId="left-chat-demo"
              title="LeftChat Demo"
              theme="blue"
            />
          </div>
          <div style={{ minHeight: '200px' }}>
            <RightChat
              services={services}
              moduleId="right-chat-demo"
              title="RightChat Demo"
              theme="green"
            />
          </div>
          <div style={{ minHeight: '300px' }}>
            <ChatHistory
              services={services}
              moduleId="chat-history-demo"
              title="ChatHistory Demo"
              maxMessages={50}
            />
          </div>
          <div style={{ minHeight: '250px' }}>
            <EventMonitor
              services={services}
              moduleId="event-monitor-demo"
              title="EventMonitor Demo"
              maxEvents={25}
            />
          </div>
          <div style={{ minHeight: '200px' }}>
            <MessageQueue
              services={services}
              moduleId="message-queue-demo"
              title="MessageQueue Demo"
            />
          </div>
          <div style={{ minHeight: '200px' }}>
            <BroadcastCenter
              services={services}
              moduleId="broadcast-center-demo"
              title="BroadcastCenter Demo"
              defaultTargets={['left-chat-demo', 'right-chat-demo', 'chat-history-demo']}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export individual components for webpack module federation
export { 
  LeftChat, 
  RightChat, 
  ChatHistory, 
  EventMonitor, 
  MessageQueue, 
  BroadcastCenter 
};

// Export types for external use
export type {
  Services,
  LeftChatProps,
  RightChatProps,
  ChatHistoryProps,
  EventMonitorProps,
  MessageQueueProps,
  BroadcastCenterProps
};

// Default export for development
export default ServiceExampleEvents;