import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import './AlertsPanel.css';

interface Alert {
  id: string;
  instrument_id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  suggested_actions?: string[];
  anomaly_type?: string;
  metrics?: Record<string, any>;
}

interface AlertsPanelProps {
  maxAlerts?: number;
  showFilters?: boolean;
}

export default function AlertsPanel({ maxAlerts = 50, showFilters = true }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isConnected, setIsConnected] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    // Connect to gateway WebSocket
    const gatewayUrl = process.env.REACT_APP_GATEWAY_URL || 'http://localhost:8081';
    const newSocket = io(gatewayUrl);

    newSocket.on('connect', () => {
      console.log('Connected to gateway for alerts');
      setIsConnected(true);
      
      // Subscribe to alerts
      newSocket.emit('subscribe-alerts');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from gateway');
      setIsConnected(false);
    });

    // Listen for alert history (initial load)
    newSocket.on('alerts-history', (data: { alerts: Alert[]; count: number }) => {
      console.log(`Received ${data.count} historical alerts`);
      setAlerts(data.alerts);
    });

    // Listen for new alerts
    newSocket.on('anomaly_alert', (alert: Alert) => {
      console.log('New alert received:', alert);
      setAlerts(prev => [alert, ...prev].slice(0, maxAlerts));
      
      // Show browser notification for critical alerts
      if (alert.severity === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Critical Alert', {
            body: alert.description,
            icon: '/favicon.ico'
          });
        }
      }
    });

    setSocket(newSocket);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Fetch initial alerts from REST API as backup
    fetch(`${gatewayUrl}/api/alerts?limit=${maxAlerts}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.alerts) {
          setAlerts(data.alerts);
        }
      })
      .catch(err => console.error('Failed to fetch initial alerts:', err));

    return () => {
      newSocket.close();
    };
  }, [maxAlerts]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📊';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  const filteredAlerts = severityFilter === 'all'
    ? alerts
    : alerts.filter(alert => alert.severity === severityFilter);

  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlertId(expandedAlertId === alertId ? null : alertId);
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <div className="header-title">
          <h2>🔔 System Alerts</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Live' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div className="alerts-summary">
          <div className="summary-item critical">
            <span className="count">{criticalCount}</span>
            <span className="label">Critical</span>
          </div>
          <div className="summary-item high">
            <span className="count">{highCount}</span>
            <span className="label">High</span>
          </div>
          <div className="summary-item total">
            <span className="count">{alerts.length}</span>
            <span className="label">Total</span>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="alerts-filters">
          <button
            className={`filter-btn ${severityFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSeverityFilter('all')}
          >
            All ({alerts.length})
          </button>
          <button
            className={`filter-btn critical ${severityFilter === 'critical' ? 'active' : ''}`}
            onClick={() => setSeverityFilter('critical')}
          >
            Critical ({criticalCount})
          </button>
          <button
            className={`filter-btn high ${severityFilter === 'high' ? 'active' : ''}`}
            onClick={() => setSeverityFilter('high')}
          >
            High ({highCount})
          </button>
          <button
            className={`filter-btn medium ${severityFilter === 'medium' ? 'active' : ''}`}
            onClick={() => setSeverityFilter('medium')}
          >
            Medium ({alerts.filter(a => a.severity === 'medium').length})
          </button>
          <button
            className={`filter-btn low ${severityFilter === 'low' ? 'active' : ''}`}
            onClick={() => setSeverityFilter('low')}
          >
            Low ({alerts.filter(a => a.severity === 'low').length})
          </button>
        </div>
      )}

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <span className="no-alerts-icon">✅</span>
            <p>No {severityFilter !== 'all' ? severityFilter : ''} alerts</p>
            <small>System is operating normally</small>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`alert-card ${alert.severity} ${expandedAlertId === alert.id ? 'expanded' : ''}`}
              style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              onClick={() => toggleAlertExpansion(alert.id)}
            >
              <div className="alert-main">
                <div className="alert-icon">
                  {getSeverityIcon(alert.severity)}
                </div>
                
                <div className="alert-content">
                  <div className="alert-header-row">
                    <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="alert-instrument">{alert.instrument_id}</span>
                    <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  
                  <p className="alert-description">{alert.description}</p>
                  
                  {alert.confidence !== undefined && (
                    <div className="alert-confidence">
                      <span className="confidence-label">Confidence:</span>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${alert.confidence * 100}%`,
                            backgroundColor: getSeverityColor(alert.severity)
                          }}
                        ></div>
                      </div>
                      <span className="confidence-value">{Math.round(alert.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {expandedAlertId === alert.id && (
                <div className="alert-details">
                  {alert.suggested_actions && alert.suggested_actions.length > 0 && (
                    <div className="suggested-actions">
                      <h4>Suggested Actions:</h4>
                      <ul>
                        {alert.suggested_actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {alert.metrics && Object.keys(alert.metrics).length > 0 && (
                    <div className="alert-metrics">
                      <h4>Metrics:</h4>
                      <div className="metrics-grid">
                        {Object.entries(alert.metrics).map(([key, value]) => (
                          <div key={key} className="metric-item">
                            <span className="metric-key">{key}:</span>
                            <span className="metric-value">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {alert.anomaly_type && (
                    <div className="alert-type">
                      <strong>Type:</strong> {alert.anomaly_type}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
