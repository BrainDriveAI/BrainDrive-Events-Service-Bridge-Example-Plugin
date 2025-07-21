/**
 * EventMonitor Component
 * 
 * Demonstrates Event Service Bridge real-time monitoring functionality.
 * Shows how to track, filter, and analyze event messages in real-time
 * using the Event Service monitoring capabilities.
 */

import React, { Component } from 'react';
import { 
  EventMonitorProps, 
  EventMonitorState, 
  EventMonitorMessage,
  EventFilter,
  EventStats,
  EventOptions
} from '../../types';
import { EventServiceWrapper } from '../../services/eventService';
import { formatTimestamp, generateId } from '../../utils';
import './EventMonitor.css';

export class EventMonitor extends Component<EventMonitorProps, EventMonitorState> {
  private eventService: EventServiceWrapper;
  private readonly moduleId = 'EventMonitor';
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(props: EventMonitorProps) {
    super(props);
    
    this.state = {
      isLoading: false,
      error: null,
      events: [],
      filteredEvents: [],
      isMonitoring: false,
      filter: {
        type: [],
        source: [],
        target: [],
        timeRange: {
          start: new Date(Date.now() - 3600000), // Last hour
          end: new Date()
        },
        priority: []
      },
      stats: {
        totalEvents: 0,
        eventsByType: {},
        eventsBySource: {},
        eventsByTarget: {},
        averageLatency: 0,
        errorRate: 0,
        eventsPerSecond: 0,
        lastUpdate: new Date().toISOString()
      },
      selectedEvent: null,
      showDetails: false,
      autoScroll: true,
      maxEvents: 1000
    };

    this.eventService = new EventServiceWrapper('ServiceExample_Events', this.moduleId);
    if (props.services.event) {
      this.eventService.initialize(props.services.event);
    }
  }

  componentDidMount(): void {
    this.startMonitoring();
  }

  componentWillUnmount(): void {
    this.stopMonitoring();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /**
   * Start monitoring events
   */
  private startMonitoring = (): void => {
    if (this.state.isMonitoring) return;

    this.setState({ isMonitoring: true, error: null });

    // Subscribe to all event types for monitoring
    const options: EventOptions = {
      remote: true,
      persist: false,
      priority: 'high'
    };

    this.eventService.subscribeToMessages(
      this.handleEventMessage,
      options
    );

    // Start periodic stats updates
    this.updateInterval = setInterval(this.updateStats, 1000);

    // Send monitoring start event
    this.eventService.sendMessage(
      'EventService',
      {
        type: 'MONITOR_START',
        id: generateId(),
        timestamp: new Date().toISOString(),
        moduleId: this.moduleId,
        filter: this.state.filter
      },
      options
    );
  };

  /**
   * Stop monitoring events
   */
  private stopMonitoring = (): void => {
    if (!this.state.isMonitoring) return;

    this.setState({ isMonitoring: false });

    this.eventService.unsubscribeFromMessages(
      this.handleEventMessage,
      { remote: true, persist: false }
    );

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Send monitoring stop event
    this.eventService.sendMessage(
      'EventService',
      {
        type: 'MONITOR_STOP',
        id: generateId(),
        timestamp: new Date().toISOString(),
        moduleId: this.moduleId
      },
      { remote: true, persist: false }
    );
  };

  /**
   * Handle incoming event messages
   */
  private handleEventMessage = (message: any): void => {
    const eventMessage: EventMonitorMessage = {
      id: message.id || generateId(),
      type: message.type || 'UNKNOWN',
      timestamp: message.timestamp || new Date().toISOString(),
      source: message.source || { pluginId: 'unknown', moduleId: 'unknown' },
      target: message.target || 'unknown',
      payload: message,
      latency: message.latency || 0,
      priority: message.priority || 'normal',
      status: 'received'
    };

    this.setState(prevState => {
      const updatedEvents = [eventMessage, ...prevState.events].slice(0, prevState.maxEvents);
      const filteredEvents = this.applyFilters(updatedEvents, prevState.filter);

      return {
        events: updatedEvents,
        filteredEvents
      };
    });
  };

  /**
   * Apply filters to event list
   */
  private applyFilters = (events: EventMonitorMessage[], filter: EventFilter): EventMonitorMessage[] => {
    return events.filter(event => {
      // Type filter
      if (filter.type && filter.type.length > 0 && !filter.type.includes(event.type)) {
        return false;
      }

      // Source filter
      if (filter.source && filter.source.length > 0) {
        const sourceId = event.source?.moduleId || 'unknown';
        if (!filter.source.includes(sourceId)) {
          return false;
        }
      }

      // Target filter
      if (filter.target && filter.target.length > 0 && !filter.target.includes(event.target)) {
        return false;
      }

      // Time range filter
      if (filter.timeRange) {
        const eventTime = new Date(event.timestamp);
        if (filter.timeRange.start && eventTime < filter.timeRange.start) {
          return false;
        }
        if (filter.timeRange.end && eventTime > filter.timeRange.end) {
          return false;
        }
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(event.priority)) {
        return false;
      }

      return true;
    });
  };

  /**
   * Update statistics
   */
  private updateStats = (): void => {
    const { events } = this.state;
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Calculate events per second
    const recentEvents = events.filter(event => 
      new Date(event.timestamp).getTime() > oneSecondAgo
    );

    // Calculate statistics
    const stats: EventStats = {
      totalEvents: events.length,
      eventsByType: {},
      eventsBySource: {},
      eventsByTarget: {},
      averageLatency: 0,
      errorRate: 0,
      eventsPerSecond: recentEvents.length,
      lastUpdate: new Date().toISOString()
    };

    // Count by type, source, and target
    let totalLatency = 0;
    let errorCount = 0;

    events.forEach(event => {
      // Count by type
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;

      // Count by source
      const sourceId = event.source?.moduleId || 'unknown';
      stats.eventsBySource[sourceId] = (stats.eventsBySource[sourceId] || 0) + 1;

      // Count by target
      stats.eventsByTarget[event.target] = (stats.eventsByTarget[event.target] || 0) + 1;

      // Calculate latency
      totalLatency += event.latency;

      // Count errors
      if (event.status === 'error') {
        errorCount++;
      }
    });

    // Calculate averages
    if (events.length > 0) {
      stats.averageLatency = totalLatency / events.length;
      stats.errorRate = (errorCount / events.length) * 100;
    }

    this.setState({ stats });
  };

  /**
   * Handle filter changes
   */
  private handleFilterChange = (newFilter: Partial<EventFilter>): void => {
    const updatedFilter = { ...this.state.filter, ...newFilter };
    const filteredEvents = this.applyFilters(this.state.events, updatedFilter);

    this.setState({
      filter: updatedFilter,
      filteredEvents
    });
  };

  /**
   * Clear all events
   */
  private clearEvents = (): void => {
    if (window.confirm('Are you sure you want to clear all monitored events?')) {
      this.setState({
        events: [],
        filteredEvents: [],
        stats: {
          totalEvents: 0,
          eventsByType: {},
          eventsBySource: {},
          eventsByTarget: {},
          averageLatency: 0,
          errorRate: 0,
          eventsPerSecond: 0,
          lastUpdate: new Date().toISOString()
        }
      });
    }
  };

  /**
   * Export events data
   */
  private exportEvents = (): void => {
    const dataStr = JSON.stringify(this.state.events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-monitor-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Select event for detailed view
   */
  private selectEvent = (event: EventMonitorMessage): void => {
    this.setState({
      selectedEvent: event,
      showDetails: true
    });
  };

  /**
   * Toggle monitoring state
   */
  private toggleMonitoring = (): void => {
    if (this.state.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  };

  render(): JSX.Element {
    const { 
      filteredEvents, 
      isMonitoring, 
      isLoading, 
      error, 
      filter, 
      stats, 
      selectedEvent, 
      showDetails,
      autoScroll
    } = this.state;

    return (
      <div className="event-monitor module-container">
        <div className="module-header">
          <div className="module-title">
            <span className="module-badge">Monitor</span>
            <h3>Event Monitor</h3>
          </div>
          <div className="module-actions">
            <button 
              className={`btn btn-sm ${isMonitoring ? 'btn-danger' : 'btn-success'}`}
              onClick={this.toggleMonitoring}
              disabled={isLoading}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={this.exportEvents}
              disabled={filteredEvents.length === 0}
            >
              Export
            </button>
            <button 
              className="btn btn-warning btn-sm"
              onClick={this.clearEvents}
              disabled={stats.totalEvents === 0}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="event-monitor-content">
          {/* Feature Description */}
          <div className="feature-description">
            <h4>Real-time Event Monitoring</h4>
            <ul>
              <li>Demonstrates real-time event tracking and analysis</li>
              <li>Shows event filtering, statistics, and performance metrics</li>
              <li>Monitors all Event Service communication patterns</li>
              <li>Provides detailed event inspection and export capabilities</li>
            </ul>
          </div>

          {/* Statistics Dashboard */}
          <div className="stats-dashboard">
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">Total Events</span>
                <span className="stat-value">{stats.totalEvents}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Events/sec</span>
                <span className="stat-value">{stats.eventsPerSecond}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Avg Latency</span>
                <span className="stat-value">{stats.averageLatency.toFixed(1)}ms</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Error Rate</span>
                <span className="stat-value">{stats.errorRate.toFixed(1)}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${isMonitoring ? 'monitoring' : 'stopped'}`}>
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <h4>Event Filters</h4>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Event Types:</label>
                <select 
                  multiple
                  value={filter.type || []}
                  onChange={(e) => {
                    const selectedTypes = Array.from(e.target.selectedOptions, option => option.value);
                    this.handleFilterChange({ type: selectedTypes });
                  }}
                  className="input-field"
                  size={3}
                >
                  {Object.keys(stats.eventsByType).map(type => (
                    <option key={type} value={type}>
                      {type} ({stats.eventsByType[type]})
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Sources:</label>
                <select 
                  multiple
                  value={filter.source || []}
                  onChange={(e) => {
                    const selectedSources = Array.from(e.target.selectedOptions, option => option.value);
                    this.handleFilterChange({ source: selectedSources });
                  }}
                  className="input-field"
                  size={3}
                >
                  {Object.keys(stats.eventsBySource).map(source => (
                    <option key={source} value={source}>
                      {source} ({stats.eventsBySource[source]})
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Auto Scroll:</label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => this.setState({ autoScroll: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Auto-scroll to new events</span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Event List */}
          <div className="event-list">
            <div className="event-list-header">
              <h4>Live Events ({filteredEvents.length})</h4>
              <div className="monitoring-indicator">
                <span className={`indicator-dot ${isMonitoring ? 'active' : 'inactive'}`}></span>
                <span className="indicator-text">
                  {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
                </span>
              </div>
            </div>
            
            <div className="event-items">
              {filteredEvents.length === 0 ? (
                <div className="empty-message">
                  {isMonitoring ? 'No events captured yet...' : 'Start monitoring to see events'}
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="event-item"
                    onClick={() => this.selectEvent(event)}
                  >
                    <div className="event-header">
                      <span className={`event-type priority-${event.priority}`}>
                        {event.type}
                      </span>
                      <span className="event-source">
                        {event.source?.moduleId || 'unknown'}
                      </span>
                      <span className="event-target">→ {event.target}</span>
                      <span className="event-time">
                        {formatTimestamp(event.timestamp)}
                      </span>
                      {event.latency > 0 && (
                        <span className="event-latency">{event.latency}ms</span>
                      )}
                    </div>
                    <div className="event-preview">
                      {JSON.stringify(event.payload).substring(0, 150)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        {showDetails && selectedEvent && (
          <div className="modal-overlay" onClick={() => this.setState({ showDetails: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Event Details - {selectedEvent.type}</h4>
                <button 
                  className="modal-close"
                  onClick={() => this.setState({ showDetails: false })}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="event-details">
                  <div className="detail-section">
                    <h5>Event Information</h5>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">{selectedEvent.id}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{selectedEvent.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Timestamp:</span>
                        <span className="detail-value">{selectedEvent.timestamp}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Source:</span>
                        <span className="detail-value">
                          {selectedEvent.source?.pluginId}/{selectedEvent.source?.moduleId}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Target:</span>
                        <span className="detail-value">{selectedEvent.target}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Priority:</span>
                        <span className="detail-value">{selectedEvent.priority}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Latency:</span>
                        <span className="detail-value">{selectedEvent.latency}ms</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">{selectedEvent.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h5>Payload</h5>
                    <pre className="payload-content">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default EventMonitor;