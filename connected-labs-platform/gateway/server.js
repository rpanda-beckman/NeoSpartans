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

  // Use the exact same proxy logic as your original implementation
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyRes: function(proxyRes, req, res) {
      // Ensure CORS headers are set exactly as in original
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, x-target-url';
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

// PLACEHOLDER: WebSocket setup for real-time features
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
  console.log('🚧 Enhanced features ready for implementation');
});

module.exports = server;