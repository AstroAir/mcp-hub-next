'use client';

/**
 * DebugPanel Component
 * Real-time MCP protocol message viewer and debugging tools
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CodeBlock } from '@/components/chat/code-block';
import {
  Bug,
  Download,
  Trash2,
  Activity,
  AlertCircle,
  Info,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getDebugLogs,
  clearDebugLogs,
  exportDebugLogs,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  getServerPerformanceStats,
  type LogEntry,
  type LogLevel,
  type LogCategory,
  type PerformanceMetric,
} from '@/lib/services/debug-logger';

export function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = useCallback(() => {
    setLogs(getDebugLogs());
  }, []);

  const loadMetrics = useCallback(() => {
    setMetrics(getPerformanceMetrics());
  }, []);

  useEffect(() => {
    // Initial load using microtask to avoid synchronous setState
    Promise.resolve().then(() => {
      loadLogs();
      loadMetrics();
    });

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
        loadMetrics();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadLogs, loadMetrics]);

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all debug logs?')) {
      clearDebugLogs();
      loadLogs();
      toast.success('Debug logs cleared');
    }
  };

  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all performance metrics?')) {
      clearPerformanceMetrics();
      loadMetrics();
      toast.success('Performance metrics cleared');
    }
  };

  const handleExportLogs = () => {
    exportDebugLogs();
    toast.success('Debug logs exported');
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.serverName?.toLowerCase().includes(query) ||
        JSON.stringify(log.data).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadgeVariant = (level: LogLevel): 'default' | 'destructive' | 'secondary' => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getUniqueServers = () => {
    const servers = new Set<string>();
    metrics.forEach((m) => servers.add(m.serverId));
    return Array.from(servers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Developer Debug Panel
          </CardTitle>
          <CardDescription>
            Real-time MCP protocol messages, performance metrics, and error logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Debug Logs</TabsTrigger>
              <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            </TabsList>

            {/* Debug Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className="pl-9"
                  />
                </div>
                <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | 'all')}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as LogCategory | 'all')}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="mcp">MCP</SelectItem>
                    <SelectItem value="connection">Connection</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExportLogs}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearLogs}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {filteredLogs.length} of {logs.length} logs
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </Button>
              </div>

              <ScrollArea className="h-[600px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No logs to display</p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 border rounded-lg space-y-2 hover:bg-accent"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {getLevelIcon(log.level)}
                            <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                              {log.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                            {log.serverName && (
                              <Badge variant="secondary" className="text-xs">
                                {log.serverName}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.data !== undefined && log.data !== null && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View data
                            </summary>
                            <div className="mt-2">
                              <CodeBlock
                                code={JSON.stringify(log.data, null, 2)}
                                language="json"
                                showLineNumbers={false}
                              />
                            </div>
                          </details>
                        )}
                        {log.error && (
                          <div className="text-xs text-destructive space-y-1">
                            <p className="font-medium">{log.error.name}: {log.error.message}</p>
                            {log.error.stack && (
                              <details>
                                <summary className="cursor-pointer">Stack trace</summary>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {log.error.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Performance Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {metrics.length} operations tracked
                </span>
                <Button variant="outline" size="sm" onClick={handleClearMetrics}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Metrics
                </Button>
              </div>

              {/* Server Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getUniqueServers().map((serverId) => {
                  const stats = getServerPerformanceStats(serverId);
                  const serverMetrics = metrics.find((m) => m.serverId === serverId);
                  return (
                    <Card key={serverId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{serverMetrics?.serverName || 'Unknown'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Duration:</span>
                          <span className="font-medium">{stats.avgDuration.toFixed(2)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operations:</span>
                          <span className="font-medium">{stats.totalOperations}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Operations */}
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {metrics.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No performance metrics yet</p>
                    </div>
                  ) : (
                    metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {metric.serverName}
                            </Badge>
                            <span className="text-sm font-medium">{metric.operation}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(metric.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-mono">{metric.duration.toFixed(2)}ms</span>
                          <Badge variant={metric.success ? 'secondary' : 'destructive'}>
                            {metric.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

