'use client';

/**
 * DebugPanel Component
 * Real-time MCP protocol message viewer and debugging tools
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
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

  const formatTimestamp = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'number' ? timestamp : Date.parse(timestamp));
    return date.toLocaleTimeString();
  };

  const getUniqueServers = useCallback(() => {
    const servers = new Set<string>();
    metrics.forEach((m) => servers.add(m.serverId));
    return Array.from(servers);
  }, [metrics]);

  // Calculate statistics
  const stats = useMemo(() => {
    const errorCount = logs.filter((log) => log.level === 'error').length;
    const warnCount = logs.filter((log) => log.level === 'warn').length;
    const successfulOps = metrics.filter((m) => m.success).length;
    const failedOps = metrics.filter((m) => !m.success).length;
    const avgDuration = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
      : 0;
    const successRate = metrics.length > 0
      ? (successfulOps / metrics.length) * 100
      : 0;

    return {
      totalLogs: logs.length,
      errorCount,
      warnCount,
      totalMetrics: metrics.length,
      successfulOps,
      failedOps,
      avgDuration,
      successRate,
      activeServers: getUniqueServers().length,
    };
  }, [logs, metrics, getUniqueServers]);

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              Total Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="destructive" className="text-xs">
                {stats.errorCount} errors
              </Badge>
              <Badge variant="default" className="text-xs bg-yellow-500">
                {stats.warnCount} warnings
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Active Servers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Being monitored
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalMetrics} operations
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                {stats.successfulOps}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" />
                {stats.failedOps}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Debug Panel */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Console
              </CardTitle>
              <CardDescription className="mt-1.5">
                Real-time MCP protocol messages, performance metrics, and error logs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={autoRefresh ? 'default' : 'secondary'}
                className={`${autoRefresh ? 'animate-pulse' : ''}`}
              >
                <Activity className="h-3 w-3 mr-1" />
                {autoRefresh ? 'Live' : 'Paused'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs" className="gap-2">
                <Bug className="h-4 w-4" />
                Debug Logs
              </TabsTrigger>
              <TabsTrigger value="metrics" className="gap-2">
                <Activity className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Debug Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              {/* Filters and Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search logs..."
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
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
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Showing {filteredLogs.length} of {logs.length} logs
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className="gap-2"
                    >
                      <Activity className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                      {autoRefresh ? 'Live' : 'Paused'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportLogs} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearLogs} className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Logs List */}
              <ScrollArea className="h-[500px] rounded-lg border bg-muted/30">
                <div className="p-3 space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Bug className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No logs to display</p>
                      <p className="text-sm mt-1">
                        {logs.length === 0
                          ? 'Logs will appear here as your application runs'
                          : 'Try adjusting your filters'}
                      </p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 border rounded-lg space-y-2 bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            {getLevelIcon(log.level)}
                            <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                            {log.serverName && (
                              <Badge variant="secondary" className="text-xs">
                                {log.serverName}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{log.message}</p>
                        {log.data !== undefined && log.data !== null && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                              View data →
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
                          <div className="text-xs text-destructive space-y-1 p-2 bg-destructive/10 rounded border border-destructive/20">
                            <p className="font-medium">{log.error.name}: {log.error.message}</p>
                            {log.error.stack && (
                              <details>
                                <summary className="cursor-pointer font-medium">Stack trace →</summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
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
                  Tracking {metrics.length} operations across {getUniqueServers().length} servers
                </span>
                <Button variant="outline" size="sm" onClick={handleClearMetrics} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear Metrics
                </Button>
              </div>

              <Separator />

              {/* Server Performance Stats */}
              {getUniqueServers().length > 0 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Server Performance Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getUniqueServers().map((serverId) => {
                        const stats = getServerPerformanceStats(serverId);
                        const serverMetrics = metrics.find((m) => m.serverId === serverId);
                        const totalOps = stats?.totalOperations ?? 0;
                        const avgDuration = stats?.avgDuration ?? 0;
                        const successRate = stats?.successRate ?? 0;
                        return (
                          <Card key={serverId} className="transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span className="truncate">{serverMetrics?.serverName || 'Unknown'}</span>
                                <Badge variant="outline" className="text-xs ml-2">
                                  {totalOps}
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span className="text-xs text-muted-foreground">Avg Duration</span>
                                <span className="text-sm font-semibold font-mono">{avgDuration.toFixed(1)}ms</span>
                              </div>
                              <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span className="text-xs text-muted-foreground">Success Rate</span>
                                <span className="text-sm font-semibold">{successRate.toFixed(1)}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Recent Operations */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Operations
                </h3>
                <ScrollArea className="h-[400px] rounded-lg border bg-muted/30">
                  <div className="p-3 space-y-2">
                    {metrics.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No performance metrics yet</p>
                        <p className="text-sm mt-1">Metrics will appear as servers perform operations</p>
                      </div>
                    ) : (
                      metrics.map((metric) => (
                        <div
                          key={metric.id}
                          className="p-3 border rounded-lg flex items-center justify-between bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {metric.serverName}
                              </Badge>
                              <span className="text-sm font-medium truncate">{metric.operation}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(metric.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className="text-sm font-mono font-semibold">{metric.duration.toFixed(1)}ms</span>
                            <Badge variant={metric.success ? 'default' : 'destructive'} className="min-w-[70px] justify-center">
                              {metric.success ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Success
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </span>
                              )}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

