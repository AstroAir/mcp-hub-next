/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MCPServerSelector } from './mcp-server-selector';
import { useServerStore, useConnectionStore, useChatStore } from '@/lib/stores';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      placeholder: 'Select server',
      autoOption: 'Auto (All Servers)',
    };
    return translations[key] || key;
  },
}));

// Mock stores
jest.mock('@/lib/stores', () => ({
  useServerStore: jest.fn(),
  useConnectionStore: jest.fn(),
  useChatStore: jest.fn(),
}));

describe('MCPServerSelector', () => {
  const mockSetActiveServer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {},
    });
    
    (useChatStore as jest.Mock).mockReturnValue({
      activeServerId: null,
      setActiveServer: mockSetActiveServer,
    });
  });

  it('renders with computer icon', () => {
    render(<MCPServerSelector />);
    
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('shows auto option by default', () => {
    render(<MCPServerSelector />);
    
    // The select trigger should show the placeholder or auto option
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('displays connected servers in dropdown', async () => {
    const user = userEvent.setup();
    
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [
        { id: 'server1', name: 'Test Server 1', transportType: 'stdio' },
        { id: 'server2', name: 'Test Server 2', transportType: 'stdio' },
        { id: 'server3', name: 'Disconnected Server', transportType: 'stdio' },
      ],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {
        server1: { status: 'connected' },
        server2: { status: 'connected' },
        server3: { status: 'disconnected' },
      },
    });
    
    render(<MCPServerSelector />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Should show auto option and connected servers
    // Text appears twice: once in trigger, once in dropdown
    expect(screen.getAllByText('Auto (All Servers)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Test Server 1')).toBeInTheDocument();
    expect(screen.getByText('Test Server 2')).toBeInTheDocument();
    // Disconnected server should not be shown
    expect(screen.queryByText('Disconnected Server')).not.toBeInTheDocument();
  });

  it('filters out disconnected servers', () => {
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [
        { id: 'server1', name: 'Connected', transportType: 'stdio' },
        { id: 'server2', name: 'Disconnected', transportType: 'stdio' },
      ],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {
        server1: { status: 'connected' },
        server2: { status: 'disconnected' },
      },
    });
    
    render(<MCPServerSelector />);
    
    // Only connected server should be available
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('calls setActiveServer when selecting a server', async () => {
    const user = userEvent.setup();
    
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [
        { id: 'server1', name: 'Test Server', transportType: 'stdio' },
      ],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {
        server1: { status: 'connected' },
      },
    });
    
    render(<MCPServerSelector />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const serverOption = screen.getByText('Test Server');
    await user.click(serverOption);
    
    expect(mockSetActiveServer).toHaveBeenCalledWith('server1');
  });

  it('calls setActiveServer with null when selecting auto', async () => {
    const user = userEvent.setup();
    
    (useChatStore as jest.Mock).mockReturnValue({
      activeServerId: 'server1',
      setActiveServer: mockSetActiveServer,
    });
    
    render(<MCPServerSelector />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const autoOption = screen.getByText('Auto (All Servers)');
    await user.click(autoOption);
    
    expect(mockSetActiveServer).toHaveBeenCalledWith(null);
  });

  it('shows selected server when activeServerId is set', () => {
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [
        { id: 'server1', name: 'Selected Server', transportType: 'stdio' },
      ],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {
        server1: { status: 'connected' },
      },
    });
    
    (useChatStore as jest.Mock).mockReturnValue({
      activeServerId: 'server1',
      setActiveServer: mockSetActiveServer,
    });
    
    render(<MCPServerSelector />);
    
    // The trigger should show the selected server name
    expect(screen.getByText('Selected Server')).toBeInTheDocument();
  });

  it('handles empty server list', () => {
    render(<MCPServerSelector />);
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('handles no connected servers', async () => {
    const user = userEvent.setup();
    
    (useServerStore as jest.Mock).mockReturnValue({
      servers: [
        { id: 'server1', name: 'Disconnected', transportType: 'stdio' },
      ],
    });
    
    (useConnectionStore as jest.Mock).mockReturnValue({
      connections: {
        server1: { status: 'disconnected' },
      },
    });
    
    render(<MCPServerSelector />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Should only show auto option
    // Text appears twice: once in trigger, once in dropdown
    expect(screen.getAllByText('Auto (All Servers)').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
  });
});

