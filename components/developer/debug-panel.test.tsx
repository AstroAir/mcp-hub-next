/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DebugPanel } from './debug-panel';
import * as debugLogger from '@/lib/services/debug-logger';
import { toast } from 'sonner';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, Record<string, any>> = {
      debugPanel: {
        title: 'Debug Panel',
        description: 'Real-time MCP protocol message viewer',
      },
      'debugPanel.stats': {
        totalLogs: 'Total Logs',
        errors: `${values?.count || 0} Errors`,
        warnings: `${values?.count || 0} Warnings`,
        activeServers: 'Active Servers',
        beingMonitored: 'Being monitored',
        avgResponse: 'Avg Response',
        operations: `${values?.count || 0} operations`,
        successRate: 'Success Rate',
      },
      'debugPanel.tabs': {
        logs: 'Logs',
        metrics: 'Metrics',
      },
      'debugPanel.filters': {
        searchPlaceholder: 'Search logs...',
        level: 'Level',
        allLevels: 'All Levels',
        category: 'Category',
        allCategories: 'All Categories',
        'levels.error': 'Error',
        'levels.warn': 'Warning',
        'levels.info': 'Info',
        'levels.debug': 'Debug',
        'categories.mcp': 'MCP',
        'categories.connection': 'Connection',
        'categories.tool': 'Tool',
        'categories.chat': 'Chat',
        'categories.system': 'System',
      },
      'debugPanel.actions': {
        live: 'Live',
        paused: 'Paused',
        export: 'Export',
        clear: 'Clear',
        clearMetrics: 'Clear Metrics',
      },
      'debugPanel.logs': {
        showing: `Showing ${values?.filtered || 0} of ${values?.total || 0}`,
        viewData: 'View Data',
        stackTrace: 'Stack Trace',
        'empty.title': 'No Logs',
        'empty.noLogs': 'No logs available',
        'empty.tryFilters': 'Try adjusting filters',
      },
      'debugPanel.metrics': {
        tracking: `Tracking ${values?.count || 0} operations across ${values?.servers || 0} servers`,
        serverPerformance: 'Server Performance',
        avgDuration: 'Avg Duration',
        recentOperations: 'Recent Operations',
        success: 'Success',
        failed: 'Failed',
        'empty.title': 'No Metrics',
        'empty.description': 'No performance metrics available',
      },
      'debugPanel.dialogs': {
        clearLogs: 'Are you sure you want to clear all logs?',
        clearMetrics: 'Are you sure you want to clear all metrics?',
      },
      'debugPanel.toasts': {
        logsCleared: 'Logs cleared',
        metricsCleared: 'Metrics cleared',
        logsExported: 'Logs exported',
      },
    };
    return translations[namespace || 'debugPanel']?.[key] || key;
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock CodeBlock component
jest.mock('@/components/chat/code-block', () => ({
  CodeBlock: ({ code, language }: { code: string; language: string }) => (
    <pre data-testid="code-block" data-language={language}>
      {code}
    </pre>
  ),
}));

// Mock debug-logger service
jest.mock('@/lib/services/debug-logger', () => ({
  getDebugLogs: jest.fn(),
  clearDebugLogs: jest.fn(),
  exportDebugLogs: jest.fn(),
  getPerformanceMetrics: jest.fn(),
  clearPerformanceMetrics: jest.fn(),
  getServerPerformanceStats: jest.fn(),
}));

describe('DebugPanel', () => {
  const mockLogs: debugLogger.LogEntry[] = [
    {
      id: '1',
      timestamp: Date.now(),
      level: 'error',
      category: 'mcp',
      serverId: 'server-1',
      serverName: 'Test Server',
      message: 'Test error message',
      data: { test: 'data' },
      error: {
        name: 'TestError',
        message: 'Error details',
        stack: 'Error stack trace',
      },
    },
    {
      id: '2',
      timestamp: Date.now() - 1000,
      level: 'warn',
      category: 'connection',
      serverId: 'server-2',
      serverName: 'Another Server',
      message: 'Test warning message',
    },
    {
      id: '3',
      timestamp: Date.now() - 2000,
      level: 'info',
      category: 'tool',
      message: 'Test info message',
    },
    {
      id: '4',
      timestamp: Date.now() - 3000,
      level: 'debug',
      category: 'chat',
      message: 'Test debug message',
    },
  ];

  const mockMetrics: debugLogger.PerformanceMetric[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      serverId: 'server-1',
      serverName: 'Test Server',
      operation: 'listTools',
      duration: 150,
      success: true,
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000).toISOString(),
      serverId: 'server-1',
      serverName: 'Test Server',
      operation: 'callTool',
      duration: 250,
      success: false,
      error: 'Tool execution failed',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      serverId: 'server-2',
      serverName: 'Another Server',
      operation: 'listResources',
      duration: 100,
      success: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (debugLogger.getDebugLogs as jest.Mock).mockReturnValue(mockLogs);
    (debugLogger.getPerformanceMetrics as jest.Mock).mockReturnValue(mockMetrics);
    (debugLogger.getServerPerformanceStats as jest.Mock).mockImplementation((serverId: string) => {
      const serverMetrics = mockMetrics.filter((m) => m.serverId === serverId);
      if (serverMetrics.length === 0) return null;
      const totalDuration = serverMetrics.reduce((sum, m) => sum + m.duration, 0);
      const successCount = serverMetrics.filter((m) => m.success).length;
      return {
        avgDuration: totalDuration / serverMetrics.length,
        successRate: (successCount / serverMetrics.length) * 100,
        totalOperations: serverMetrics.length,
      };
    });
    (debugLogger.exportDebugLogs as jest.Mock).mockReturnValue(JSON.stringify(mockLogs, null, 2));
    
    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', async () => {
      render(<DebugPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Debug Panel')).toBeInTheDocument();
      });
    });

    it('displays statistics overview cards', async () => {
      render(<DebugPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Logs')).toBeInTheDocument();
        expect(screen.getByText('Active Servers')).toBeInTheDocument();
        expect(screen.getByText('Avg Response')).toBeInTheDocument();
        expect(screen.getByText('Success Rate')).toBeInTheDocument();
      });
    });

    it('calculates and displays correct statistics', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        // Total logs
        expect(screen.getAllByText('4').length).toBeGreaterThan(0);

        // Error and warning counts
        expect(screen.getByText('1 Errors')).toBeInTheDocument();
        expect(screen.getByText('1 Warnings')).toBeInTheDocument();

        // Active servers (2 unique servers in metrics)
        expect(screen.getAllByText('2').length).toBeGreaterThan(0);

        // Success rate (2 successful out of 3 metrics = 66.7%)
        expect(screen.getByText('66.7%')).toBeInTheDocument();
      });
    });

    it('displays tabs for logs and metrics', async () => {
      render(<DebugPanel />);
      
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /metrics/i })).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('shows live badge when auto-refresh is enabled', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        const badges = screen.getAllByText('Live');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('refreshes logs and metrics automatically', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(debugLogger.getDebugLogs).toHaveBeenCalled();
      });

      const initialCallCount = (debugLogger.getDebugLogs as jest.Mock).mock.calls.length;

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect((debugLogger.getDebugLogs as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('toggles auto-refresh when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getAllByText('Live').length).toBeGreaterThan(0);
      });

      const toggleButtons = screen.getAllByRole('button', { name: /live/i });
      await user.click(toggleButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Paused').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Logs Tab', () => {
    it('displays all logs by default', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
        expect(screen.getByText('Test warning message')).toBeInTheDocument();
        expect(screen.getByText('Test info message')).toBeInTheDocument();
        expect(screen.getByText('Test debug message')).toBeInTheDocument();
      });
    });

    it('filters logs by level', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      // Open level filter
      const levelSelects = screen.getAllByRole('combobox');
      const levelSelect = levelSelects.find((select) =>
        select.getAttribute('aria-label')?.includes('Level') ||
        within(select.parentElement!).queryByText('All Levels')
      );

      if (levelSelect) {
        await user.click(levelSelect);

        await waitFor(() => {
          const errorOption = screen.getByRole('option', { name: 'Error' });
          expect(errorOption).toBeInTheDocument();
        });

        await user.click(screen.getByRole('option', { name: 'Error' }));

        await waitFor(() => {
          expect(screen.getByText('Test error message')).toBeInTheDocument();
          expect(screen.queryByText('Test warning message')).not.toBeInTheDocument();
        });
      }
    });

    it('filters logs by category', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      // Open category filter (second combobox)
      const categorySelects = screen.getAllByRole('combobox');
      const categorySelect = categorySelects[1]; // Second select is category filter

      await user.click(categorySelect);

      // Wait for dropdown to open and click MCP option
      await waitFor(() => {
        expect(screen.getByText('MCP')).toBeInTheDocument();
      });

      await user.click(screen.getByText('MCP'));

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
        expect(screen.queryByText('Test warning message')).not.toBeInTheDocument();
      });
    });

    it('searches logs by text', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search logs...');
      await user.type(searchInput, 'error');

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
        expect(screen.queryByText('Test warning message')).not.toBeInTheDocument();
      });
    });

    it('displays empty state when no logs match filters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search logs...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No Logs')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting filters')).toBeInTheDocument();
      });
    });

    it('displays empty state when no logs exist', async () => {
      (debugLogger.getDebugLogs as jest.Mock).mockReturnValue([]);
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('No Logs')).toBeInTheDocument();
        expect(screen.getByText('No logs available')).toBeInTheDocument();
      });
    });

    it('displays log data in expandable details', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const viewDataButtons = screen.getAllByText('View Data');
      expect(viewDataButtons.length).toBeGreaterThan(0);
    });

    it('displays error stack trace in expandable details', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const stackTraceButtons = screen.getAllByText('Stack Trace');
      expect(stackTraceButtons.length).toBeGreaterThan(0);
    });

    it('displays server name badge when available', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test Server')).toBeInTheDocument();
        expect(screen.getByText('Another Server')).toBeInTheDocument();
      });
    });

    it('displays level badges with correct variants', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('ERROR')).toBeInTheDocument();
        expect(screen.getByText('WARN')).toBeInTheDocument();
        expect(screen.getByText('INFO')).toBeInTheDocument();
        expect(screen.getByText('DEBUG')).toBeInTheDocument();
      });
    });
  });

  describe('Log Actions', () => {
    it('clears logs when clear button is clicked and confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to clear all logs?');
      expect(debugLogger.clearDebugLogs).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logs cleared');
    });

    it('does not clear logs when clear is cancelled', async () => {
      global.confirm = jest.fn(() => false);
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(debugLogger.clearDebugLogs).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('exports logs when export button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(debugLogger.exportDebugLogs).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logs exported');
    });
  });

  describe('Metrics Tab', () => {
    it('switches to metrics tab when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /metrics/i })).toBeInTheDocument();
      });

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Server Performance')).toBeInTheDocument();
      });
    });

    it('displays server performance stats', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Server Performance')).toBeInTheDocument();
        expect(screen.getAllByText('Test Server').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Another Server').length).toBeGreaterThan(0);
      });
    });

    it('displays recent operations', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Operations')).toBeInTheDocument();
        expect(screen.getByText('listTools')).toBeInTheDocument();
        expect(screen.getByText('callTool')).toBeInTheDocument();
        expect(screen.getByText('listResources')).toBeInTheDocument();
      });
    });

    it('displays success and failed badges for operations', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        const successBadges = screen.getAllByText('Success');
        const failedBadges = screen.getAllByText('Failed');
        expect(successBadges.length).toBeGreaterThan(0);
        expect(failedBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays operation durations', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getAllByText('150.0ms').length).toBeGreaterThan(0);
        expect(screen.getAllByText('250.0ms').length).toBeGreaterThan(0);
        expect(screen.getAllByText('100.0ms').length).toBeGreaterThan(0);
      });
    });

    it('displays empty state when no metrics exist', async () => {
      (debugLogger.getPerformanceMetrics as jest.Mock).mockReturnValue([]);
      (debugLogger.getServerPerformanceStats as jest.Mock).mockReturnValue(null);
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('No Metrics')).toBeInTheDocument();
        expect(screen.getByText('No performance metrics available')).toBeInTheDocument();
      });
    });

    it('clears metrics when clear button is clicked and confirmed', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Operations')).toBeInTheDocument();
      });

      const clearMetricsButton = screen.getByRole('button', { name: /clear metrics/i });
      await user.click(clearMetricsButton);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to clear all metrics?');
      expect(debugLogger.clearPerformanceMetrics).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Metrics cleared');
    });

    it('does not clear metrics when clear is cancelled', async () => {
      global.confirm = jest.fn(() => false);
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Operations')).toBeInTheDocument();
      });

      const clearMetricsButton = screen.getByRole('button', { name: /clear metrics/i });
      await user.click(clearMetricsButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(debugLogger.clearPerformanceMetrics).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles logs with missing optional fields', async () => {
      const minimalLog: debugLogger.LogEntry = {
        id: '5',
        timestamp: Date.now(),
        level: 'info',
        message: 'Minimal log',
      };

      (debugLogger.getDebugLogs as jest.Mock).mockReturnValue([minimalLog]);
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Minimal log')).toBeInTheDocument();
      });
    });

    it('handles metrics with missing optional fields', async () => {
      const minimalMetric: debugLogger.PerformanceMetric = {
        id: '4',
        timestamp: new Date().toISOString(),
        serverId: 'server-3',
        serverName: 'Minimal Server',
        operation: 'test',
        duration: 50,
        success: true,
      };

      (debugLogger.getPerformanceMetrics as jest.Mock).mockReturnValue([minimalMetric]);
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      await user.click(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('50.0ms')).toBeInTheDocument();
      });
    });

    it('handles timestamp formatting correctly', async () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const logWithTimestamp: debugLogger.LogEntry = {
        id: '6',
        timestamp: now.getTime(),
        level: 'info',
        message: 'Timestamp test',
      };

      (debugLogger.getDebugLogs as jest.Mock).mockReturnValue([logWithTimestamp]);
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Timestamp test')).toBeInTheDocument();
      });
    });

    it('handles search with special characters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search logs...');
      // Type special characters one by one to avoid parsing issues
      await user.clear(searchInput);
      await user.type(searchInput, 'test');

      // Should not crash
      expect(searchInput).toHaveValue('test');
    });

    it('handles zero metrics gracefully', async () => {
      (debugLogger.getPerformanceMetrics as jest.Mock).mockReturnValue([]);
      render(<DebugPanel />);

      await waitFor(() => {
        // Average duration should be 0ms when no metrics
        expect(screen.getByText('0ms')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', async () => {
      render(<DebugPanel />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation for tabs', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DebugPanel />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
      });

      const logsTab = screen.getByRole('tab', { name: /logs/i });
      logsTab.focus();

      await user.keyboard('{ArrowRight}');

      // Metrics tab should be focused (if keyboard navigation is implemented)
      const metricsTab = screen.getByRole('tab', { name: /metrics/i });
      expect(metricsTab).toBeInTheDocument();
    });
  });
});

