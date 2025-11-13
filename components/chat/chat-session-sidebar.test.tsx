/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSessionSidebar, type ChatSession } from './chat-session-sidebar';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, string> = {
      newChat: 'New chat',
      empty: 'No chat sessions',
      confirmDelete: 'Are you sure you want to delete this chat session?',
      'messageCount': `${values?.count || 0} messages`,
    };
    return translations[key] || key;
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

describe('ChatSessionSidebar', () => {
  const mockOnSelectSession = jest.fn();
  const mockOnCreateSession = jest.fn();
  const mockOnDeleteSession = jest.fn();
  const mockOnRenameSession = jest.fn();
  const mockOnExportSession = jest.fn();

  const createSession = (overrides?: Partial<ChatSession>): ChatSession => ({
    id: 'session-1',
    name: 'Test Session',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    messageCount: 5,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('renders new chat button', () => {
    render(
      <ChatSessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    expect(screen.getByText('New chat')).toBeInTheDocument();
  });

  it('calls onCreateSession when new chat button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ChatSessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    const newChatButton = screen.getByText('New chat');
    await user.click(newChatButton);

    expect(mockOnCreateSession).toHaveBeenCalled();
  });

  it('shows empty state when no sessions', () => {
    render(
      <ChatSessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    expect(screen.getByText('No chat sessions')).toBeInTheDocument();
  });

  it('renders session list', () => {
    const sessions = [
      createSession({ id: '1', name: 'Session 1', messageCount: 3 }),
      createSession({ id: '2', name: 'Session 2', messageCount: 7 }),
    ];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
    expect(screen.getByText('3 messages')).toBeInTheDocument();
    expect(screen.getByText('7 messages')).toBeInTheDocument();
  });

  it('highlights current session', () => {
    const sessions = [
      createSession({ id: '1', name: 'Session 1' }),
      createSession({ id: '2', name: 'Session 2' }),
    ];

    const { container } = render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId="1"
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    const sessionElements = container.querySelectorAll('.bg-muted');
    expect(sessionElements.length).toBeGreaterThan(0);
  });

  it('calls onSelectSession when session is clicked', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    const sessionName = screen.getByText('Session 1');
    await user.click(sessionName);

    expect(mockOnSelectSession).toHaveBeenCalledWith('1');
  });

  it('shows edit input when edit button is clicked', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Find edit button - it's the second button (first is "New Chat")
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];

    await user.click(editButton);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Session 1');
    });
  });

  it('calls onRenameSession when save button is clicked', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Old Name' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Click edit button (second button after "New Chat")
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];

    await user.click(editButton);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Old Name');
    });

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Name');

    // Find and click save button (it's the first button after the input appears)
    const allButtons = screen.getAllByRole('button');
    const saveButton = allButtons.find(btn => btn.querySelector('svg.lucide-check'));

    if (saveButton) {
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnRenameSession).toHaveBeenCalledWith('1', 'New Name');
      });
    }
  });

  it('saves rename on Enter key', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Old Name' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Click edit button (second button after "New Chat")
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];

    await user.click(editButton);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Old Name');
    });

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Name{Enter}');

    await waitFor(() => {
      expect(mockOnRenameSession).toHaveBeenCalledWith('1', 'New Name');
    });
  });

  it('cancels rename on Escape key', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Old Name' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Click edit button (second button after "New Chat")
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];

    await user.click(editButton);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Old Name');
    });

    const input = screen.getByRole('textbox');
    await user.type(input, '{Escape}');

    await waitFor(() => {
      expect(mockOnRenameSession).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  it('shows confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Find delete button (last icon button with text-destructive class)
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons[buttons.length - 1]; // Last button should be delete
    
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this chat session?');
  });

  it('calls onDeleteSession when deletion is confirmed', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons[buttons.length - 1];
    
    await user.click(deleteButton);

    expect(mockOnDeleteSession).toHaveBeenCalledWith('1');
  });

  it('does not delete when deletion is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons[buttons.length - 1];
    
    await user.click(deleteButton);

    expect(mockOnDeleteSession).not.toHaveBeenCalled();
  });

  it('calls onExportSession when export button is clicked', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Session 1' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Export button is the second-to-last button
    const buttons = screen.getAllByRole('button');
    const exportButton = buttons[buttons.length - 2];
    
    await user.click(exportButton);

    expect(mockOnExportSession).toHaveBeenCalledWith('1');
  });

  it('does not rename with empty name', async () => {
    const user = userEvent.setup();
    const sessions = [createSession({ id: '1', name: 'Old Name' })];

    render(
      <ChatSessionSidebar
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={mockOnSelectSession}
        onCreateSession={mockOnCreateSession}
        onDeleteSession={mockOnDeleteSession}
        onRenameSession={mockOnRenameSession}
        onExportSession={mockOnExportSession}
      />
    );

    // Click edit button (second button after "New Chat")
    const buttons = screen.getAllByRole('button');
    const editButton = buttons[1];

    await user.click(editButton);

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Old Name');
    });

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '{Enter}');

    await waitFor(() => {
      expect(mockOnRenameSession).not.toHaveBeenCalled();
    });
  });
});

