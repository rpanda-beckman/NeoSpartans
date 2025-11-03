// Enhanced CORS proxy server that maintains compatibility with existing frontend
// Based on your original proxy.js but with enhanced features and placeholders

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Increase max listeners to avoid EventEmitter memory leak warning
require('events').defaultMaxListeners = 150;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8081;

// Enable CORS for all routes (maintains compatibility)
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'connected-labs-gateway'
  });
});

// LEGACY PROXY MIDDLEWARE - MAINTAINS EXACT COMPATIBILITY WITH EXISTING FRONTEND
// This ensures your current network scanner and API tester continue to work exactly as before
app.use('/', (req, res, next) => {
  const targetUrl = req.headers['x-target-url'];
  if (!targetUrl) {
    return next(); // Pass to next middleware if no target URL
  }

  // Extract authentication headers for forwarding
  const forwardHeaders = {};
  if (req.headers['x-bci-loggedinuserinfo']) {
    forwardHeaders['x-bci-LoggedInUserInfo'] = req.headers['x-bci-loggedinuserinfo'];
  }

  // Use the exact same proxy logic as your original implementation
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq: function(proxyReq, req, res) {
      // Forward authentication headers to target instrument
      Object.keys(forwardHeaders).forEach(key => {
        proxyReq.setHeader(key, forwardHeaders[key]);
      });
    },
    onProxyRes: function(proxyRes, req, res) {
      // Ensure CORS headers are set exactly as in original
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, x-target-url, x-bci-LoggedInUserInfo';
    },
    onError: function(err, req, res) {
      console.error('Proxy error:', err);
      res.status(500).json({ 
        error: 'Proxy error', 
        message: err.message 
      });
    }
  })(req, res, next);
});

// PLACEHOLDER: Enhanced API routes for future features
app.get('/api/instruments/scan', (req, res) => {
  res.json({
    placeholder: 'Enhanced network scanning will be implemented here',
    features: [
      'Parallel scanning with better performance',
      'Instrument capability detection',
      'Auto-discovery with mDNS/Bonjour',
      'Persistent instrument registry'
    ]
  });
});

app.get('/api/monitoring/dashboard', (req, res) => {
  res.json({
    placeholder: 'Real-time monitoring dashboard data will be provided here',
    features: [
      'Live instrument status updates',
      'Performance metrics streaming',
      'Alert notifications',
      'Historical trend data'
    ]
  });
});

app.post('/api/control/instruments/:id/command', (req, res) => {
  const { id } = req.params;
  const { command, parameters } = req.body;
  
  res.json({
    placeholder: 'Remote instrument control will be implemented here',
    instrumentId: id,
    command,
    parameters,
    features: [
      'Temperature adjustments',
      'Operation start/stop controls',
      'Parameter modifications',
      'Safety interlocks'
    ]
  });
});

// In-memory storage for alerts (for demo/MVP - use Redis in production)
const alerts = [];
const MAX_ALERTS = 500; // Keep last 500 alerts

// Alert Management - Receive alerts from AI services and broadcast to clients
app.post('/api/alerts', (req, res) => {
  try {
    const alert = req.body;
    
    // Validate alert has required fields
    if (!alert.id || !alert.instrument_id || !alert.severity) {
      return res.status(400).json({
        error: 'Invalid alert format',
        required: ['id', 'instrument_id', 'severity', 'description']
      });
    }
    
    // Add timestamp if not present
    if (!alert.timestamp) {
      alert.timestamp = new Date().toISOString();
    }
    
    // Store alert (keep only last MAX_ALERTS)
    alerts.unshift(alert);
    if (alerts.length > MAX_ALERTS) {
      alerts.pop();
    }
    
    // Broadcast to all connected clients
    io.emit('anomaly_alert', alert);
    
    // Also broadcast to specific instrument room
    io.to(`instrument-${alert.instrument_id}`).emit('instrument_alert', alert);
    
    console.log(`📢 Alert broadcast: [${alert.severity.toUpperCase()}] ${alert.description}`);
    
    res.json({
      success: true,
      message: 'Alert received and broadcast',
      alert_id: alert.id,
      broadcast_to: 'all_clients'
    });
  } catch (error) {
    console.error('Error processing alert:', error);
    res.status(500).json({
      error: 'Failed to process alert',
      message: error.message
    });
  }
});

// Get recent alerts with optional filters
app.get('/api/alerts', (req, res) => {
  try {
    const { instrument_id, severity, limit = 50 } = req.query;
    
    let filteredAlerts = [...alerts];
    
    // Filter by instrument_id
    if (instrument_id) {
      filteredAlerts = filteredAlerts.filter(
        alert => alert.instrument_id === instrument_id
      );
    }
    
    // Filter by severity
    if (severity) {
      filteredAlerts = filteredAlerts.filter(
        alert => alert.severity === severity
      );
    }
    
    // Limit results
    const limitNum = parseInt(limit);
    filteredAlerts = filteredAlerts.slice(0, limitNum);
    
    res.json({
      success: true,
      count: filteredAlerts.length,
      total_alerts: alerts.length,
      alerts: filteredAlerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// Get alert statistics
app.get('/api/alerts/stats', (req, res) => {
  try {
    const stats = {
      total: alerts.length,
      by_severity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      by_instrument: {},
      recent_count_1h: 0,
      recent_count_24h: 0
    };
    
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    alerts.forEach(alert => {
      // Count by severity
      if (stats.by_severity.hasOwnProperty(alert.severity)) {
        stats.by_severity[alert.severity]++;
      }
      
      // Count by instrument
      if (!stats.by_instrument[alert.instrument_id]) {
        stats.by_instrument[alert.instrument_id] = 0;
      }
      stats.by_instrument[alert.instrument_id]++;
      
      // Count recent alerts
      const alertTime = new Date(alert.timestamp);
      if (alertTime > oneHourAgo) {
        stats.recent_count_1h++;
      }
      if (alertTime > oneDayAgo) {
        stats.recent_count_24h++;
      }
    });
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating alert stats:', error);
    res.status(500).json({
      error: 'Failed to calculate stats',
      message: error.message
    });
  }
});

// Clear alerts (for testing/admin)
app.delete('/api/alerts', (req, res) => {
  const count = alerts.length;
  alerts.length = 0;
  
  res.json({
    success: true,
    message: `Cleared ${count} alerts`,
    timestamp: new Date().toISOString()
  });
});

// WebSocket setup for real-time features
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // PLACEHOLDER: Real-time instrument monitoring
  socket.on('subscribe-instrument', (instrumentId) => {
    console.log(`Client ${socket.id} subscribed to instrument ${instrumentId}`);
    socket.join(`instrument-${instrumentId}`);
    
    // TODO: Start real-time status streaming for this instrument
    socket.emit('subscription-confirmed', {
      instrumentId,
      message: 'Real-time status streaming will be implemented here'
    });
  });

  // PLACEHOLDER: Real-time dashboard updates
  socket.on('subscribe-dashboard', () => {
    console.log(`Client ${socket.id} subscribed to dashboard updates`);
    socket.join('dashboard-updates');
    
    // TODO: Start dashboard data streaming
    socket.emit('dashboard-subscription-confirmed', {
      message: 'Real-time dashboard updates will be implemented here'
    });
  });

  // Subscribe to alerts
  socket.on('subscribe-alerts', () => {
    console.log(`Client ${socket.id} subscribed to alerts`);
    socket.join('alerts');
    
    // Send recent alerts to new subscriber
    const recentAlerts = alerts.slice(0, 10);
    socket.emit('alerts-history', {
      alerts: recentAlerts,
      count: recentAlerts.length
    });
    
    socket.emit('alerts-subscription-confirmed', {
      message: 'Subscribed to real-time alerts',
      recent_alerts_count: recentAlerts.length
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Connected Labs Gateway running on http://localhost:${PORT}/`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('');
  console.log('✅ Legacy proxy compatibility maintained - existing frontend will work');
  console.log('✅ Alert broadcasting enabled - POST /api/alerts to send alerts');
  console.log('✅ WebSocket ready - clients can subscribe to real-time alerts');
  console.log('🚧 Enhanced features ready for implementation');
});

module.exports = server;