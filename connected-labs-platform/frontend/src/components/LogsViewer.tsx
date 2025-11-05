import { useEffect, useState } from 'react';
import './LogsViewer.css';

interface LogEntry {
  id: string;
  instrument_id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: {
    temperature?: number;
    pressure?: number;
    humidity?: number;
    [key: string]: any;
  };
}

interface LogsViewerProps {
  maxLogs?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function LogsViewer({ 
  maxLogs = 100, 
  autoRefresh = true,
  refreshInterval = 10000 
}: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const servicesUrl = process.env.REACT_APP_SERVICES_URL || 'http://localhost:8000';

  // Fetch logs from services
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: maxLogs.toString()
      });

      if (instrumentFilter !== 'all') {
        params.append('instrument_id', instrumentFilter);
      }

      if (levelFilter !== 'all') {
        params.append('level', levelFilter);
      }

      const response = await fetch(`${servicesUrl}/api/logs?${params}`);
      const data = await response.json();

      if (data.success && data.logs) {
        setLogs(data.logs);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [instrumentFilter, levelFilter, maxLogs]);

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.instrument_id.toLowerCase().includes(query) ||
        log.level.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery]);

  // Get unique instruments
  const uniqueInstruments = Array.from(new Set(logs.map((log: LogEntry) => log.instrument_id)));

  // Get log level counts
  const levelCounts = {
    info: logs.filter((l: LogEntry) => l.level === 'info').length,
    warning: logs.filter((l: LogEntry) => l.level === 'warning').length,
    error: logs.filter((l: LogEntry) => l.level === 'error').length,
    debug: logs.filter((l: LogEntry) => l.level === 'debug').length
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getLevelIcon = (level: string): string => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔧';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleRowClick = (log: LogEntry) => {
    setSelectedLog(selectedLog?.id === log.id ? null : log);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="logs-viewer">
      <div className="logs-header">
        <div className="header-title">
          <h1>📋 Instrument Logs</h1>
          <div className="last-update">
            Last updated: {formatRelativeTime(lastUpdate.toISOString())}
          </div>
        </div>

        <div className="logs-stats">
          <div className="stat-item error">
            <span className="stat-icon">❌</span>
            <span className="stat-count">{levelCounts.error}</span>
            <span className="stat-label">Errors</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-icon">⚠️</span>
            <span className="stat-count">{levelCounts.warning}</span>
            <span className="stat-label">Warnings</span>
          </div>
          <div className="stat-item info">
            <span className="stat-icon">ℹ️</span>
            <span className="stat-count">{levelCounts.info}</span>
            <span className="stat-label">Info</span>
          </div>
        </div>
      </div>

      <div className="logs-controls">
        <div className="control-group">
          <label>Instrument:</label>
          <select 
            value={instrumentFilter} 
            onChange={(e) => setInstrumentFilter(e.target.value)}
            className="control-select"
          >
            <option value="all">All Instruments</option>
            {uniqueInstruments.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Level:</label>
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
            className="control-select"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div className="control-group search-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="clear-search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="control-actions">
          <button 
            onClick={fetchLogs} 
            disabled={isLoading}
            className="refresh-btn"
            title="Refresh logs"
          >
            {isLoading ? '⏳' : '🔄'} Refresh
          </button>
          <button 
            onClick={exportLogs}
            className="export-btn"
            title="Export logs as JSON"
          >
            💾 Export
          </button>
        </div>
      </div>

      <div className="logs-count">
        Showing {filteredLogs.length} of {logs.length} logs
      </div>

      <div className="logs-table-container">
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            <span className="no-logs-icon">📭</span>
            <p>No logs found</p>
            {searchQuery && <small>Try adjusting your search or filters</small>}
          </div>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Instrument</th>
                <th>Message</th>
                <th>Temp (°C)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <>
                  <tr 
                    key={log.id}
                    className={`log-row ${log.level} ${selectedLog?.id === log.id ? 'selected' : ''}`}
                    onClick={() => handleRowClick(log)}
                  >
                    <td className="log-time">
                      <div className="time-full">{formatTimestamp(log.timestamp)}</div>
                      <div className="time-relative">{formatRelativeTime(log.timestamp)}</div>
                    </td>
                    <td className="log-level">
                      <span 
                        className="level-badge"
                        style={{ 
                          backgroundColor: getLevelColor(log.level),
                          color: 'white'
                        }}
                      >
                        {getLevelIcon(log.level)} {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="log-instrument">
                      <code>{log.instrument_id}</code>
                    </td>
                    <td className="log-message">{log.message}</td>
                    <td className="log-temp">
                      {log.metadata?.temperature !== undefined 
                        ? log.metadata.temperature.toFixed(2)
                        : '-'
                      }
                    </td>
                  </tr>
                  {selectedLog?.id === log.id && (
                    <tr className="log-details-row">
                      <td colSpan={5}>
                        <div className="log-details">
                          <div className="details-section">
                            <h4>Log Details</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">ID:</span>
                                <span className="detail-value"><code>{log.id}</code></span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Timestamp:</span>
                                <span className="detail-value">{new Date(log.timestamp).toISOString()}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Instrument:</span>
                                <span className="detail-value"><code>{log.instrument_id}</code></span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Level:</span>
                                <span className="detail-value">{log.level}</span>
                              </div>
                            </div>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="details-section">
                              <h4>Metadata</h4>
                              <div className="metadata-grid">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="metadata-item">
                                    <span className="metadata-key">{key}:</span>
                                    <span className="metadata-value">
                                      {typeof value === 'object' 
                                        ? JSON.stringify(value)
                                        : typeof value === 'number'
                                        ? value.toFixed(2)
                                        : String(value)
                                      }
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
