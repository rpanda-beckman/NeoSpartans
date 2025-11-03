# Implementation Guide: Real-Time Monitoring Dashboard

## Overview
This guide explains how to implement the real-time monitoring dashboard feature that provides centralized instrument monitoring.

## Current Status: PLACEHOLDER READY
✅ WebSocket infrastructure in place (Gateway)  
✅ Frontend components ready for enhancement  
✅ Database schema defined  
✅ API endpoints structured  

## Implementation Steps

### 1. Backend Implementation (Gateway)

#### WebSocket Enhancement
```javascript
// In gateway/server.js - enhance existing WebSocket handlers

// Real-time instrument status broadcasting
function broadcastInstrumentStatus(instrumentId, status) {
  io.to(`instrument-${instrumentId}`).emit('instrument-status-update', {
    instrumentId,
    status,
    timestamp: new Date().toISOString()
  });
}

// Periodic status polling
setInterval(async () => {
  for (const instrument of discoveredInstruments) {
    try {
      const status = await pollInstrumentStatus(instrument.ip);
      broadcastInstrumentStatus(instrument.id, status);
    } catch (error) {
      console.error(`Failed to poll ${instrument.id}:`, error);
    }
  }
}, 5000); // Poll every 5 seconds
```

#### API Endpoints
```javascript
// Add to gateway/server.js
app.get('/api/monitoring/dashboard', async (req, res) => {
  try {
    const instruments = await getInstrumentStatuses();
    const alerts = await getActiveAlerts();
    const systemHealth = calculateSystemHealth(instruments);
    
    res.json({
      instruments,
      alerts,
      systemHealth,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Frontend Implementation

#### Dashboard Component
```typescript
// Create frontend/src/components/RealTimeDashboard.tsx
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface DashboardData {
  instruments: Instrument[];
  alerts: Alert[];
  systemHealth: number;
}

export const RealTimeDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:8081');
    setSocket(newSocket);

    // Subscribe to dashboard updates
    newSocket.emit('subscribe-dashboard');
    
    newSocket.on('dashboard-update', (updateData) => {
      setData(updateData);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Implementation continues...
};
```

### 3. Database Integration

#### Add to services/main.py
```python
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
engine = create_engine(os.getenv('DATABASE_URL'))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@app.get("/api/monitoring/instruments")
async def get_instrument_statuses():
    with SessionLocal() as db:
        result = db.execute(text('''
            SELECT i.*, pm.temperature, pm.pressure, pm.is_running
            FROM instruments i
            LEFT JOIN performance_metrics pm ON i.id = pm.instrument_id
            WHERE pm.timestamp = (
                SELECT MAX(timestamp) 
                FROM performance_metrics pm2 
                WHERE pm2.instrument_id = i.id
            )
        '''))
        return [dict(row) for row in result]
```

## Testing

1. **Start all services**:
   ```bash
   # Terminal 1: Gateway
   cd gateway && npm start
   
   # Terminal 2: Frontend  
   cd frontend && npm start
   
   # Terminal 3: AI Services
   cd services && uvicorn main:app --reload
   ```

2. **Test WebSocket connection**:
   - Open browser dev tools
   - Check WebSocket connection in Network tab
   - Verify real-time updates

3. **Test API endpoints**:
   ```bash
   curl http://localhost:8081/api/monitoring/dashboard
   ```

## Performance Considerations

- **WebSocket scaling**: Consider using Redis adapter for multiple instances
- **Database optimization**: Use connection pooling and indexes
- **Frontend optimization**: Implement virtual scrolling for large datasets
- **Rate limiting**: Limit update frequency to prevent overwhelming clients

## Security

- **Authentication**: Add JWT token validation for WebSocket connections
- **Authorization**: Implement role-based access for monitoring data
- **Data validation**: Sanitize all inputs and outputs
- **Rate limiting**: Prevent abuse of real-time endpoints

## Next Steps

1. Implement basic polling mechanism
2. Add WebSocket authentication
3. Create dashboard UI components
4. Add error handling and reconnection logic
5. Implement data caching for performance