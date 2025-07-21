/**
 * EventLogger Component
 * 
 * A reusable event logging component used across multiple modules
 * for displaying real-time event information and debugging data.
 * 
 * Features:
 * - Real-time event display
 * - Filterable event types
 * - Expandable event details
 * - Export functionality
 * - Auto-scroll options
 * - Performance metrics
 * - Color-coded event levels
 */

import React from 'react';
import { BaseMessage } from '../../types';
import { formatTimestamp } from '../../utils';
import './EventLogger.css';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  category: string;
  message: string;
  data?: any;
  source?: string;
  duration?: number;
}

export interface EventLoggerProps {
  entries: LogEntry[];
  maxEntries?: number;
  showTimestamp?: boolean;
  showSource?: boolean;
  showCategory?: boolean;
  showLevel?: boolean;
  autoScroll?: boolean;
  filterLevel?: 'debug' | 'info' | 'warn' | 'error' | 'success' | 'all';
  filterCategory?: string;
  onClear?: () => void;
  onExport?: (entries: LogEntry[]) => void;
  className?: string;
  compact?: boolean;
}

export interface EventLoggerState {
  expandedEntries: Set<string>;
  isAutoScrollEnabled: boolean;
  filterText: string;
  selectedLevel: string;
  selectedCategory: string;
}

export class EventLogger extends React.Component<EventLoggerProps, EventLoggerState> {
  private logContainerRef = React.createRef<HTMLDivElement>();
  private shouldAutoScroll = true;

  constructor(props: EventLoggerProps) {
    super(props);
    this.state = {
      expandedEntries: new Set(),
      isAutoScrollEnabled: props.autoScroll ?? true,
      filterText: '',
      selectedLevel: props.filterLevel || 'all',
      selectedCategory: props.filterCategory || 'all'
    };
  }

  componentDidUpdate(prevProps: EventLoggerProps): void {
    if (this.props.entries.length > prevProps.entries.length && this.shouldAutoScroll) {
      this.scrollToBottom();
    }
  }

  /**
   * Scroll to bottom of log container
   */
  private scrollToBottom = (): void => {
    const container = this.logContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  /**
   * Handle scroll events to detect manual scrolling
   */
  private handleScroll = (): void => {
    const container = this.logContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    
    this.shouldAutoScroll = isAtBottom && this.state.isAutoScrollEnabled;
  };

  /**
   * Toggle auto-scroll functionality
   */
  private toggleAutoScroll = (): void => {
    this.setState(prevState => {
      const newAutoScroll = !prevState.isAutoScrollEnabled;
      this.shouldAutoScroll = newAutoScroll;
      if (newAutoScroll) {
        setTimeout(this.scrollToBottom, 0);
      }
      return { isAutoScrollEnabled: newAutoScroll };
    });
  };

  /**
   * Toggle entry expansion
   */
  private toggleEntryExpansion = (entryId: string): void => {
    this.setState(prevState => {
      const newExpanded = new Set(prevState.expandedEntries);
      if (newExpanded.has(entryId)) {
        newExpanded.delete(entryId);
      } else {
        newExpanded.add(entryId);
      }
      return { expandedEntries: newExpanded };
    });
  };

  /**
   * Handle filter changes
   */
  private handleFilterChange = (type: 'text' | 'level' | 'category', value: string): void => {
    this.setState(prevState => ({
      ...prevState,
      [`filter${type === 'text' ? 'Text' : type === 'level' ? 'Level' : 'Category'}`]: value
    }));
  };

  /**
   * Get filtered entries
   */
  private getFilteredEntries = (): LogEntry[] => {
    const { entries } = this.props;
    const { filterText, selectedLevel, selectedCategory } = this.state;

    return entries.filter(entry => {
      // Text filter
      if (filterText && !entry.message.toLowerCase().includes(filterText.toLowerCase()) &&
          !entry.category.toLowerCase().includes(filterText.toLowerCase()) &&
          !(entry.source && entry.source.toLowerCase().includes(filterText.toLowerCase()))) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && entry.level !== selectedLevel) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  };

  /**
   * Get unique categories from entries
   */
  private getCategories = (): string[] => {
    const categories = new Set(this.props.entries.map(entry => entry.category));
    return Array.from(categories).sort();
  };

  /**
   * Get level icon
   */
  private getLevelIcon = (level: LogEntry['level']): string => {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '📝';
    }
  };

  /**
   * Format data for display
   */
  private formatData = (data: any): string => {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  /**
   * Handle export
   */
  private handleExport = (): void => {
    const { onExport } = this.props;
    if (onExport) {
      const filteredEntries = this.getFilteredEntries();
      onExport(filteredEntries);
    }
  };

  /**
   * Render toolbar
   */
  private renderToolbar = (): React.ReactNode => {
    const { onClear, onExport } = this.props;
    const { isAutoScrollEnabled, filterText, selectedLevel, selectedCategory } = this.state;
    const categories = this.getCategories();
    const filteredCount = this.getFilteredEntries().length;
    const totalCount = this.props.entries.length;

    return (
      <div className="event-logger__toolbar">
        <div className="event-logger__filters">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => this.handleFilterChange('text', e.target.value)}
            className="event-logger__filter-input"
          />
          
          <select
            value={selectedLevel}
            onChange={(e) => this.handleFilterChange('level', e.target.value)}
            className="event-logger__filter-select"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => this.handleFilterChange('category', e.target.value)}
            className="event-logger__filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="event-logger__stats">
          <span className="event-logger__count">
            {filteredCount !== totalCount ? `${filteredCount} / ` : ''}{totalCount} entries
          </span>
        </div>

        <div className="event-logger__actions">
          <button
            type="button"
            onClick={this.toggleAutoScroll}
            className={`event-logger__action-button ${isAutoScrollEnabled ? 'event-logger__action-button--active' : ''}`}
            title="Toggle auto-scroll"
          >
            📜
          </button>
          
          {onExport && (
            <button
              type="button"
              onClick={this.handleExport}
              className="event-logger__action-button"
              title="Export logs"
            >
              💾
            </button>
          )}
          
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="event-logger__action-button event-logger__action-button--danger"
              title="Clear logs"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render log entry
   */
  private renderEntry = (entry: LogEntry): React.ReactNode => {
    const { showTimestamp = true, showSource = true, showCategory = true, showLevel = true, compact = false } = this.props;
    const { expandedEntries } = this.state;
    const isExpanded = expandedEntries.has(entry.id);
    const hasData = entry.data !== null && entry.data !== undefined;

    return (
      <div
        key={entry.id}
        className={`event-logger__entry event-logger__entry--${entry.level} ${compact ? 'event-logger__entry--compact' : ''}`}
      >
        <div className="event-logger__entry-header">
          <div className="event-logger__entry-main">
            {showLevel && (
              <span className="event-logger__entry-level">
                {this.getLevelIcon(entry.level)}
              </span>
            )}
            
            {showTimestamp && (
              <span className="event-logger__entry-timestamp">
                {formatTimestamp(entry.timestamp)}
              </span>
            )}
            
            {showCategory && (
              <span className="event-logger__entry-category">
                [{entry.category}]
              </span>
            )}
            
            {showSource && entry.source && (
              <span className="event-logger__entry-source">
                {entry.source}
              </span>
            )}
            
            <span className="event-logger__entry-message">
              {entry.message}
            </span>
            
            {entry.duration && (
              <span className="event-logger__entry-duration">
                ({entry.duration}ms)
              </span>
            )}
          </div>
          
          {hasData && (
            <button
              type="button"
              onClick={() => this.toggleEntryExpansion(entry.id)}
              className="event-logger__expand-button"
              title={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
        
        {hasData && isExpanded && (
          <div className="event-logger__entry-data">
            <pre className="event-logger__data-content">
              {this.formatData(entry.data)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  render(): React.ReactNode {
    const { className = '', compact = false } = this.props;
    const filteredEntries = this.getFilteredEntries();

    const containerClasses = [
      'event-logger',
      compact ? 'event-logger--compact' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {this.renderToolbar()}
        
        <div
          ref={this.logContainerRef}
          className="event-logger__container"
          onScroll={this.handleScroll}
        >
          {filteredEntries.length === 0 ? (
            <div className="event-logger__empty">
              <span className="event-logger__empty-icon">📝</span>
              <span className="event-logger__empty-text">No log entries to display</span>
            </div>
          ) : (
            filteredEntries.map(this.renderEntry)
          )}
        </div>
      </div>
    );
  }
}

export default EventLogger;