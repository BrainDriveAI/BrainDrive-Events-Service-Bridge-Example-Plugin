/**
 * ChatInput Component
 * 
 * A reusable chat input component used across multiple modules
 * for consistent message input functionality.
 * 
 * Features:
 * - Multi-line text input with auto-resize
 * - Send button with keyboard shortcuts
 * - Character/word counting
 * - Input validation
 * - Placeholder customization
 * - Disabled state handling
 * - Accessibility support
 */

import React from 'react';
import './ChatInput.css';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  showWordCount?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  sendOnEnter?: boolean;
  sendButtonText?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface ChatInputState {
  isFocused: boolean;
  rows: number;
}

export class ChatInput extends React.Component<ChatInputProps, ChatInputState> {
  private textareaRef = React.createRef<HTMLTextAreaElement>();
  private inputRef = React.createRef<HTMLInputElement>();

  constructor(props: ChatInputProps) {
    super(props);
    this.state = {
      isFocused: false,
      rows: 1
    };
  }

  componentDidMount(): void {
    if (this.props.autoFocus) {
      this.focusInput();
    }
  }

  componentDidUpdate(prevProps: ChatInputProps): void {
    if (this.props.multiline && prevProps.value !== this.props.value) {
      this.adjustTextareaHeight();
    }
  }

  /**
   * Focus the input element
   */
  private focusInput = (): void => {
    if (this.props.multiline && this.textareaRef.current) {
      this.textareaRef.current.focus();
    } else if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  };

  /**
   * Adjust textarea height based on content
   */
  private adjustTextareaHeight = (): void => {
    const textarea = this.textareaRef.current;
    if (!textarea) return;

    // Reset height to calculate new height
    textarea.style.height = 'auto';
    
    // Calculate new height based on scroll height
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px
    textarea.style.height = `${newHeight}px`;
    
    // Update rows for styling
    const lineHeight = 20; // Approximate line height
    const newRows = Math.max(1, Math.min(6, Math.ceil(newHeight / lineHeight)));
    
    if (newRows !== this.state.rows) {
      this.setState({ rows: newRows });
    }
  };

  /**
   * Handle input change
   */
  private handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { onChange, maxLength } = this.props;
    let value = event.target.value;
    
    // Enforce max length if specified
    if (maxLength && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    
    onChange(value);
  };

  /**
   * Handle key down events
   */
  private handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { onKeyDown, sendOnEnter = true, onSend, value, multiline } = this.props;
    
    // Call custom key down handler if provided
    if (onKeyDown) {
      onKeyDown(event);
    }
    
    // Handle send on Enter (but not Shift+Enter for multiline)
    if (sendOnEnter && event.key === 'Enter') {
      if (multiline && event.shiftKey) {
        // Allow new line in multiline mode with Shift+Enter
        return;
      }
      
      event.preventDefault();
      this.handleSend();
    }
  };

  /**
   * Handle send button click
   */
  private handleSend = (): void => {
    const { onSend, value, disabled } = this.props;
    
    if (disabled || !value.trim()) {
      return;
    }
    
    onSend(value.trim());
  };

  /**
   * Handle focus events
   */
  private handleFocus = (): void => {
    const { onFocus } = this.props;
    this.setState({ isFocused: true });
    if (onFocus) {
      onFocus();
    }
  };

  /**
   * Handle blur events
   */
  private handleBlur = (): void => {
    const { onBlur } = this.props;
    this.setState({ isFocused: false });
    if (onBlur) {
      onBlur();
    }
  };

  /**
   * Get character count
   */
  private getCharCount = (): number => {
    return this.props.value.length;
  };

  /**
   * Get word count
   */
  private getWordCount = (): number => {
    const { value } = this.props;
    if (!value.trim()) return 0;
    return value.trim().split(/\s+/).length;
  };

  /**
   * Check if send button should be disabled
   */
  private isSendDisabled = (): boolean => {
    const { disabled, value } = this.props;
    return disabled || !value.trim();
  };

  /**
   * Render character/word count
   */
  private renderCount = (): React.ReactNode => {
    const { showCharCount, showWordCount, maxLength } = this.props;
    
    if (!showCharCount && !showWordCount) {
      return null;
    }
    
    const charCount = this.getCharCount();
    const wordCount = this.getWordCount();
    
    return (
      <div className="chat-input__count">
        {showCharCount && (
          <span className={`chat-input__char-count ${maxLength && charCount > maxLength * 0.9 ? 'chat-input__count--warning' : ''}`}>
            {charCount}{maxLength ? `/${maxLength}` : ''} chars
          </span>
        )}
        {showWordCount && (
          <span className="chat-input__word-count">
            {wordCount} words
          </span>
        )}
      </div>
    );
  };

  /**
   * Render input field
   */
  private renderInput = (): React.ReactNode => {
    const {
      value,
      placeholder = 'Type a message...',
      disabled,
      multiline,
      maxLength
    } = this.props;
    
    const commonProps = {
      value,
      onChange: this.handleChange,
      onKeyDown: this.handleKeyDown,
      onFocus: this.handleFocus,
      onBlur: this.handleBlur,
      placeholder,
      disabled,
      maxLength,
      className: 'chat-input__field'
    };
    
    if (multiline) {
      return (
        <textarea
          {...commonProps}
          ref={this.textareaRef}
          rows={this.state.rows}
          className={`${commonProps.className} chat-input__textarea`}
        />
      );
    }
    
    return (
      <input
        {...commonProps}
        ref={this.inputRef}
        type="text"
        className={`${commonProps.className} chat-input__input`}
      />
    );
  };

  render(): React.ReactNode {
    const {
      disabled,
      sendButtonText = 'Send',
      className = ''
    } = this.props;
    
    const { isFocused } = this.state;
    
    const containerClasses = [
      'chat-input',
      isFocused ? 'chat-input--focused' : '',
      disabled ? 'chat-input--disabled' : '',
      className
    ].filter(Boolean).join(' ');
    
    return (
      <div className={containerClasses}>
        <div className="chat-input__container">
          <div className="chat-input__field-container">
            {this.renderInput()}
          </div>
          
          <button
            type="button"
            className="chat-input__send-button"
            onClick={this.handleSend}
            disabled={this.isSendDisabled()}
            title={`${sendButtonText} (Enter)`}
          >
            <span className="chat-input__send-icon">📤</span>
            <span className="chat-input__send-text">{sendButtonText}</span>
          </button>
        </div>
        
        {this.renderCount()}
      </div>
    );
  }
}

export default ChatInput;