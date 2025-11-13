/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage } from './chat-message';
import type { ChatMessage as ChatMessageType, FileAttachment, ToolCall, ToolResult } from '@/lib/types';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, string> = {
      user: 'You',
      assistant: 'Assistant',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      previewButton: 'Preview',
      previewPdf: 'Preview PDF',
      attachmentIcon: 'Attachment',
      imagePreviewAlt: 'Image preview',
      pdfPreviewTitle: 'PDF preview',
      'attachmentsCount': `${values?.count || 0} attachments`,
      'previewTooltip': `Preview ${values?.name || 'file'}`,
      'downloadTooltip': `Download ${values?.name || 'file'}`,
      'toolCall.title': `Tool: ${values?.name || 'unknown'}`,
      'toolCall.status.requested': 'Requested',
      'toolCall.status.success': 'Success',
      'toolCall.status.error': 'Error',
      'toolCall.parameters': 'Parameters',
      'toolCall.response': 'Response',
      'toolCall.unknownError': 'Unknown error',
      'toolResult.title': `Result: ${values?.name || 'unknown'}`,
      'toolResult.error': `Error: ${values?.message || ''}`,
    };
    return translations[key] || key;
  },
}));

// Mock CodeBlock component
jest.mock('./code-block', () => ({
  CodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <pre data-testid="code-block" data-language={language}>
      <code>{code}</code>
    </pre>
  ),
}));

// Mock ImagePreviewDialog
jest.mock('./image-preview-dialog', () => ({
  ImagePreviewDialog: ({ open, src, onOpenChange }: any) =>
    open ? <div data-testid="image-preview-dialog">{src}</div> : null,
}));

// Mock PdfPreviewDialog
jest.mock('./pdf-preview-dialog', () => ({
  PdfPreviewDialog: ({ open, src, onOpenChange }: any) =>
    open ? <div data-testid="pdf-preview-dialog">{src}</div> : null,
}));

// Mock file-upload utils
jest.mock('@/lib/utils/file-upload', () => ({
  formatFileSize: (size: number) => `${size} bytes`,
  isImageFile: (type: string) => type.startsWith('image/'),
  getFileIcon: (type: string) => 'File',
  downloadAttachment: jest.fn(),
}));

// Mock clipboard API
const mockWriteText = jest.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('ChatMessage', () => {
  const createMessage = (overrides?: Partial<ChatMessageType>): ChatMessageType => ({
    id: 'msg-1',
    role: 'user',
    content: 'Test message',
    timestamp: new Date('2024-01-01T12:00:00Z').toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
  });

  it('renders user message', () => {
    const message = createMessage({ role: 'user', content: 'Hello' });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders assistant message', () => {
    const message = createMessage({ role: 'assistant', content: 'Hi there!' });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('displays timestamp', () => {
    const message = createMessage();
    const { container } = render(<ChatMessage message={message} />);

    // Timestamp should be rendered (format varies by locale/time)
    const timestampElements = container.querySelectorAll('.text-xs.text-muted-foreground');
    expect(timestampElements.length).toBeGreaterThan(0);
  });

  it('shows copy button', () => {
    const message = createMessage();
    const { container } = render(<ChatMessage message={message} />);

    // Copy button is rendered (it's a button with a Copy icon)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Check for the presence of the copy icon (lucide-copy class)
    const copyIcon = container.querySelector('.lucide-copy');
    expect(copyIcon).toBeInTheDocument();
  });

  it('has copy button that can be clicked', async () => {
    const user = userEvent.setup();
    const message = createMessage({ content: 'Copy this text' });
    const { container } = render(<ChatMessage message={message} />);

    // Find the copy button by its icon
    const copyIcon = container.querySelector('.lucide-copy');
    expect(copyIcon).toBeInTheDocument();

    const copyButton = copyIcon?.closest('button');
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).not.toBeDisabled();
  });

  it('shows copied state after copying', async () => {
    const user = userEvent.setup();
    const message = createMessage();
    const { container } = render(<ChatMessage message={message} />);

    // Find the copy button by its icon
    const copyIcon = container.querySelector('.lucide-copy');
    const copyButton = copyIcon?.closest('button');

    if (copyButton) {
      await user.click(copyButton);

      await waitFor(() => {
        // After clicking, the icon should change to a check icon
        const checkIcon = container.querySelector('.lucide-check');
        expect(checkIcon).toBeInTheDocument();
      });
    }
  });

  it('parses and renders code blocks', () => {
    const message = createMessage({
      content: '```javascript\nconst x = 1;\n```',
    });
    render(<ChatMessage message={message} />);

    const codeBlock = screen.getByTestId('code-block');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveAttribute('data-language', 'javascript');
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders text and code blocks together', () => {
    const message = createMessage({
      content: 'Here is some code:\n```python\nprint("hello")\n```\nThat was the code.',
    });
    render(<ChatMessage message={message} />);

    expect(screen.getByText(/Here is some code:/)).toBeInTheDocument();
    expect(screen.getByText(/That was the code./)).toBeInTheDocument();
    expect(screen.getByTestId('code-block')).toBeInTheDocument();
  });

  it('renders file attachments', () => {
    const attachments: FileAttachment[] = [
      {
        id: 'file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
    ];
    const message = createMessage({ attachments });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('1 attachments')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('1024 bytes')).toBeInTheDocument();
  });

  it('renders multiple attachments', () => {
    const attachments: FileAttachment[] = [
      {
        id: 'file-1',
        name: 'file1.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'file-2',
        name: 'file2.txt',
        size: 512,
        type: 'text/plain',
        uploadedAt: new Date().toISOString(),
      },
    ];
    const message = createMessage({ attachments });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('2 attachments')).toBeInTheDocument();
    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
    expect(screen.getByText('file2.txt')).toBeInTheDocument();
  });

  it('shows image preview for image attachments', async () => {
    const user = userEvent.setup();
    const attachments: FileAttachment[] = [
      {
        id: 'img-1',
        name: 'image.png',
        size: 2048,
        type: 'image/png',
        url: 'data:image/png;base64,abc123',
        uploadedAt: new Date().toISOString(),
      },
    ];
    const message = createMessage({ attachments });
    render(<ChatMessage message={message} />);

    const image = screen.getByAltText('image.png');
    expect(image).toBeInTheDocument();
    
    await user.click(image);
    
    await waitFor(() => {
      expect(screen.getByTestId('image-preview-dialog')).toBeInTheDocument();
    });
  });

  it('shows PDF preview button for PDF attachments', () => {
    const attachments: FileAttachment[] = [
      {
        id: 'pdf-1',
        name: 'document.pdf',
        size: 5120,
        type: 'application/pdf',
        url: 'data:application/pdf;base64,xyz789',
        uploadedAt: new Date().toISOString(),
      },
    ];
    const message = createMessage({ attachments });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('opens PDF preview dialog when preview button is clicked', async () => {
    const user = userEvent.setup();
    const attachments: FileAttachment[] = [
      {
        id: 'pdf-1',
        name: 'document.pdf',
        size: 5120,
        type: 'application/pdf',
        url: 'data:application/pdf;base64,xyz789',
        uploadedAt: new Date().toISOString(),
      },
    ];
    const message = createMessage({ attachments });
    render(<ChatMessage message={message} />);

    const previewButton = screen.getByText('Preview');
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-preview-dialog')).toBeInTheDocument();
    });
  });

  it('renders tool calls', () => {
    const toolCalls: ToolCall[] = [
      {
        id: 'tool-1',
        name: 'search',
        input: { query: 'test' },
      },
    ];
    const message = createMessage({ role: 'assistant', toolCalls });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('Tool: search')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('renders tool results with success status', () => {
    const toolCalls: ToolCall[] = [
      {
        id: 'tool-1',
        name: 'search',
        input: { query: 'test' },
      },
    ];
    const toolResults: ToolResult[] = [
      {
        toolCallId: 'tool-1',
        toolName: 'search',
        result: { data: 'result' },
        isError: false,
      },
    ];
    const message = createMessage({ role: 'assistant', toolCalls, toolResults });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders tool results with error status', () => {
    const toolCalls: ToolCall[] = [
      {
        id: 'tool-1',
        name: 'search',
        input: { query: 'test' },
      },
    ];
    const toolResults: ToolResult[] = [
      {
        toolCallId: 'tool-1',
        toolName: 'search',
        result: null,
        error: 'Search failed',
        isError: true,
      },
    ];
    const message = createMessage({ role: 'assistant', toolCalls, toolResults });
    render(<ChatMessage message={message} />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('handles messages with no content', () => {
    const message = createMessage({ content: '' });
    const { container } = render(<ChatMessage message={message} />);

    expect(container).toBeInTheDocument();
  });

  it('preserves whitespace in message content', () => {
    const message = createMessage({ content: 'Line 1\n\nLine 2' });
    render(<ChatMessage message={message} />);

    const content = screen.getByText(/Line 1/);
    expect(content).toHaveClass('whitespace-pre-wrap');
  });

  it('applies different styling for user vs assistant messages', () => {
    const userMessage = createMessage({ role: 'user' });
    const { container: userContainer } = render(<ChatMessage message={userMessage} />);

    const assistantMessage = createMessage({ role: 'assistant' });
    const { container: assistantContainer } = render(<ChatMessage message={assistantMessage} />);

    // Both should render but with different backgrounds
    expect(userContainer.querySelector('.bg-muted\\/50')).toBeInTheDocument();
    expect(assistantContainer.querySelector('.bg-background')).toBeInTheDocument();
  });
});

