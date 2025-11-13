/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './chat-interface';
import type { ChatMessage } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'messageCount': `${values?.count || 0} messages`,
      'actions.clearChat': 'Clear chat',
      'actions.stopGeneration': 'Stop generation',
      'clearDialog.title': 'Clear chat history?',
      'clearDialog.description': 'This will delete all messages in this conversation.',
      'clearDialog.warning': 'This action cannot be undone.',
      'clearDialog.confirm': 'Clear chat',
      'emptyState.title': 'Start a conversation',
      'emptyState.description': 'Send a message to begin chatting with AI',
      'emptyState.tips.0': 'Ask questions',
      'emptyState.tips.1': 'Get help with tasks',
      'emptyState.tips.2': 'Explore ideas',
      'status.streaming': 'Streaming...',
      'status.thinking': 'Thinking...',
    };
    return translations[key] || key;
  },
}));

// Mock ChatMessage component
jest.mock('./chat-message', () => ({
  ChatMessage: ({ message }: { message: ChatMessage }) => (
    <div data-testid={`message-${message.id}`}>
      <span>{message.role}</span>: <span>{message.content}</span>
    </div>
  ),
}));

// Mock ChatInput component
jest.mock('./chat-input', () => ({
  ChatInput: ({ onSend, disabled }: { onSend: (msg: string) => void; disabled?: boolean }) => (
    <div data-testid="chat-input">
      <input
        data-testid="input-field"
        disabled={disabled}
        onChange={(e) => {}}
      />
      <button
        data-testid="send-button"
        onClick={() => onSend('test message')}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  ),
}));

describe('ChatInterface', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnClearMessages = jest.fn();
  const mockOnStopStreaming = jest.fn();

  const createMockMessage = (id: string, role: 'user' | 'assistant', content: string): ChatMessage => ({
    id,
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no messages', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText('Send a message to begin chatting with AI')).toBeInTheDocument();
  });

  it('displays empty state tips', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Ask questions')).toBeInTheDocument();
    expect(screen.getByText('Get help with tasks')).toBeInTheDocument();
    expect(screen.getByText('Explore ideas')).toBeInTheDocument();
  });

  it('renders messages when provided', () => {
    const messages = [
      createMockMessage('1', 'user', 'Hello'),
      createMockMessage('2', 'assistant', 'Hi there!'),
    ];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows message count in header when messages exist', () => {
    const messages = [
      createMockMessage('1', 'user', 'Hello'),
      createMockMessage('2', 'assistant', 'Hi'),
      createMockMessage('3', 'user', 'How are you?'),
    ];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        onClearMessages={mockOnClearMessages}
      />
    );

    expect(screen.getByText('3 messages')).toBeInTheDocument();
  });

  it('shows clear chat button when messages exist and onClearMessages is provided', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        onClearMessages={mockOnClearMessages}
      />
    );

    expect(screen.getByText('Clear chat')).toBeInTheDocument();
  });

  it('does not show clear button when onClearMessages is not provided', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.queryByText('Clear chat')).not.toBeInTheDocument();
  });

  it('opens confirmation dialog when clear button is clicked', async () => {
    const user = userEvent.setup();
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        onClearMessages={mockOnClearMessages}
      />
    );

    const clearButton = screen.getByText('Clear chat');
    await user.click(clearButton);

    expect(screen.getByText('Clear chat history?')).toBeInTheDocument();
    expect(screen.getByText(/This will delete all messages/)).toBeInTheDocument();
  });

  it('calls onClearMessages when confirmed', async () => {
    const user = userEvent.setup();
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        onClearMessages={mockOnClearMessages}
      />
    );

    const clearButton = screen.getByText('Clear chat');
    await user.click(clearButton);

    // Find and click the confirm button in the dialog
    const confirmButtons = screen.getAllByText('Clear chat');
    const confirmButton = confirmButtons[confirmButtons.length - 1]; // Last one is in dialog
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnClearMessages).toHaveBeenCalled();
    });
  });

  it('shows loading state when isLoading is true', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    expect(screen.getByText(/Thinking/)).toBeInTheDocument();
  });

  it('shows streaming content when provided', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        streamedContent="This is streaming content..."
      />
    );

    expect(screen.getByText(/This is streaming content.../)).toBeInTheDocument();
    expect(screen.getByText('Streaming...')).toBeInTheDocument();
  });

  it('shows stop button when streaming', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        streamedContent="Streaming..."
        onStopStreaming={mockOnStopStreaming}
      />
    );

    expect(screen.getByText('Stop generation')).toBeInTheDocument();
  });

  it('calls onStopStreaming when stop button is clicked', async () => {
    const user = userEvent.setup();
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        streamedContent="Streaming..."
        onStopStreaming={mockOnStopStreaming}
      />
    );

    const stopButton = screen.getByText('Stop generation');
    await user.click(stopButton);

    expect(mockOnStopStreaming).toHaveBeenCalled();
  });

  it('does not show loading state when streaming content is present', () => {
    const messages = [createMockMessage('1', 'user', 'Hello')];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
        streamedContent="Streaming response here"
      />
    );

    // Should not show "Thinking..." when streaming
    expect(screen.queryByText(/Thinking/)).not.toBeInTheDocument();
    // Should show the streamed content
    expect(screen.getByText('Streaming response here')).toBeInTheDocument();
  });

  it('renders chat input', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('disables input when loading', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    const input = screen.getByTestId('input-field');
    expect(input).toBeDisabled();
  });

  it('enables input when not loading', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
        isLoading={false}
      />
    );

    const input = screen.getByTestId('input-field');
    expect(input).not.toBeDisabled();
  });

  it('renders multiple messages in order', () => {
    const messages = [
      createMockMessage('1', 'user', 'First message'),
      createMockMessage('2', 'assistant', 'Second message'),
      createMockMessage('3', 'user', 'Third message'),
    ];

    render(
      <ChatInterface
        messages={messages}
        onSendMessage={mockOnSendMessage}
      />
    );

    const messageElements = screen.getAllByTestId(/^message-/);
    expect(messageElements).toHaveLength(3);
    expect(messageElements[0]).toHaveAttribute('data-testid', 'message-1');
    expect(messageElements[1]).toHaveAttribute('data-testid', 'message-2');
    expect(messageElements[2]).toHaveAttribute('data-testid', 'message-3');
  });

  it('does not show header when no messages', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
        onClearMessages={mockOnClearMessages}
      />
    );

    expect(screen.queryByText(/messages/)).not.toBeInTheDocument();
  });

  it('handles empty messages array gracefully', () => {
    const { container } = render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
  });
});

