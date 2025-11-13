/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from './chat-input';
import { useChatStore } from '@/lib/stores';
import { toast } from 'sonner';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'chat.input': {
        placeholder: 'Type a message...',
        'aria.send': 'Send message',
        'aria.optimize': 'Optimize prompt',
        'tooltip.send': 'Send message',
        'tooltip.waiting': 'Waiting for response',
        'tooltip.optimize': 'Optimize prompt with AI',
        'toast.optimized': 'Prompt optimized',
        'toast.optimizeError': 'Failed to optimize prompt',
        'errors.optimizeFailure': 'Optimization failed',
      },
      'chat.input.shortcuts': {
        send: 'send',
        newline: 'newline',
      },
    };
    return translations[namespace || 'chat.input']?.[key] || key;
  },
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useChatStore: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock FileUpload component
jest.mock('./file-upload', () => ({
  FileUpload: ({ attachments, onAttachmentsChange, disabled, showButton, showPreview }: any) => (
    <div data-testid="file-upload">
      {showButton && <button disabled={disabled}>Upload</button>}
      {showPreview && attachments.length > 0 && (
        <div data-testid="file-preview">
          {attachments.map((a: any) => (
            <div key={a.id}>{a.name}</div>
          ))}
        </div>
      )}
    </div>
  ),
}));

describe('ChatInput', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    
    (useChatStore as jest.Mock).mockReturnValue({
      model: 'claude-3-5-sonnet-20241022',
      messages: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders with default placeholder', () => {
    render(<ChatInput onSend={mockOnSend} />);
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<ChatInput onSend={mockOnSend} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');
    
    expect(textarea).toHaveValue('Hello world');
  });

  it('sends message on form submit', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    
    const sendButton = screen.getByLabelText('Send message');
    await user.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined);
    expect(textarea).toHaveValue('');
  });

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message{Enter}');
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined);
  });

  it('adds new line on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');
    
    expect(textarea).toHaveValue('Line 1\nLine 2');
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const sendButton = screen.getByLabelText('Send message');
    await user.click(sendButton);
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  Test message  ');
    
    const sendButton = screen.getByLabelText('Send message');
    await user.click(sendButton);
    
    expect(mockOnSend).toHaveBeenCalledWith('Test message', undefined);
  });

  it('disables input when disabled prop is true', () => {
    render(<ChatInput onSend={mockOnSend} disabled />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('shows loading spinner when disabled', () => {
    render(<ChatInput onSend={mockOnSend} disabled />);
    
    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();
    // Loader2 icon should be present
    expect(sendButton.querySelector('svg')).toBeInTheDocument();
  });

  it('enforces max length', async () => {
    const user = userEvent.setup();
    const maxLength = 100;
    render(<ChatInput onSend={mockOnSend} maxLength={maxLength} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // Type exactly maxLength characters - should be allowed
    await user.click(textarea);
    await user.paste('a'.repeat(maxLength));
    expect(textarea.value.length).toBe(maxLength);

    // Try to add more - should not be allowed
    await user.paste('b'.repeat(50));
    expect(textarea.value.length).toBe(maxLength);
  });

  it('displays character count', () => {
    render(<ChatInput onSend={mockOnSend} maxLength={4000} />);
    
    expect(screen.getByText('0/4000')).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} maxLength={4000} />);

    const textarea = screen.getByRole('textbox');
    // Use paste for performance
    await user.click(textarea);
    await user.paste('Hello');

    // Character count is split into separate text nodes by React
    expect(screen.getByText('5', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/\/\s*4000/)).toBeInTheDocument();
  });

  it('highlights character count when near limit', async () => {
    const user = userEvent.setup();
    const maxLength = 100;
    const { container } = render(<ChatInput onSend={mockOnSend} maxLength={maxLength} />);

    const textarea = screen.getByRole('textbox');
    // Use paste for performance (typing 95 chars is slow)
    await user.click(textarea);
    await user.paste('a'.repeat(95)); // 95% of limit

    // Find the counter div with the text-destructive class
    const counterDiv = container.querySelector('.text-destructive');
    expect(counterDiv).toBeInTheDocument();
    expect(counterDiv).toHaveClass('text-destructive');
  });

  it('renders file upload component', () => {
    render(<ChatInput onSend={mockOnSend} />);

    // Only the button version is rendered when there are no attachments
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('disables send button when only whitespace', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   ');

    // Send button should be disabled because message.trim().length === 0
    const sendButton = screen.getByLabelText('Send message');

    // Check that the button is disabled (has the disabled attribute)
    expect(sendButton).toHaveAttribute('disabled');
  });

  it('shows keyboard shortcuts hint', () => {
    render(<ChatInput onSend={mockOnSend} />);

    expect(screen.getByText(/send/)).toBeInTheDocument();
    expect(screen.getByText(/newline/)).toBeInTheDocument();
  });

  it('renders optimize button', () => {
    render(<ChatInput onSend={mockOnSend} />);
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    expect(optimizeButton).toBeInTheDocument();
  });

  it('disables optimize button when input is empty', () => {
    render(<ChatInput onSend={mockOnSend} />);
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    expect(optimizeButton).toBeDisabled();
  });

  it('enables optimize button when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test');
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    expect(optimizeButton).not.toBeDisabled();
  });

  it('calls optimize API when optimize button is clicked', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { optimized: 'Optimized text' } }),
    });
    global.fetch = mockFetch;

    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Original text');
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    await user.click(optimizeButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/chat/optimize', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });
  });

  it('updates textarea with optimized text', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { optimized: 'Optimized text' } }),
    });
    global.fetch = mockFetch;

    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Original text');
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    await user.click(optimizeButton);
    
    await waitFor(() => {
      expect(textarea).toHaveValue('Optimized text');
    });
  });

  it('shows success toast after optimization', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { optimized: 'Optimized text' } }),
    });
    global.fetch = mockFetch;

    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Original text');
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    await user.click(optimizeButton);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Prompt optimized');
    });
  });

  it('shows error toast when optimization fails', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'API error' }),
    });
    global.fetch = mockFetch;

    render(<ChatInput onSend={mockOnSend} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Original text');

    const optimizeButton = screen.getByLabelText('Optimize prompt');
    await user.click(optimizeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to optimize prompt');
    }, { timeout: 3000 });

    // Wait for optimizing state to be reset
    await waitFor(() => {
      expect(optimizeButton).not.toBeDisabled();
    });
  });

  it('disables optimize button while optimizing', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const mockFetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );
    global.fetch = mockFetch;

    render(<ChatInput onSend={mockOnSend} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Original text');
    
    const optimizeButton = screen.getByLabelText('Optimize prompt');
    await user.click(optimizeButton);
    
    expect(optimizeButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: { optimized: 'Optimized' } }),
    });
  });
});

