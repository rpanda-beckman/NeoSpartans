# Implementation Guide: Remote Instrument Control

## Overview
This guide explains how to implement remote instrument control functionality that allows users to operate lab instruments directly from the dashboard.

## Current Status: PLACEHOLDER READY
✅ Control API endpoints structured (Gateway)  
✅ Command tracking database schema defined  
✅ WebSocket infrastructure for real-time updates  
✅ Frontend prepared for control interfaces  

## Implementation Steps

### 1. Backend Implementation (Gateway)

#### Command Processing
```javascript
// Add to gateway/server.js
app.post('/api/control/instruments/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command, parameters } = req.body;
    
    // Validate command and parameters
    await validateCommand(id, command, parameters);
    
    // Create command record
    const commandId = await createCommandRecord(id, command, parameters);
    
    // Execute command asynchronously
    executeCommandAsync(commandId, id, command, parameters);
    
    res.json({
      commandId,
      status: 'queued',
      estimatedCompletion: new Date(Date.now() + 5000).toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

async function executeCommandAsync(commandId, instrumentId, command, parameters) {
  try {
    // Update command status
    await updateCommandStatus(commandId, 'executing');
    
    // Send command to instrument
    const result = await sendInstrumentCommand(instrumentId, command, parameters);
    
    // Update command with result
    await updateCommandStatus(commandId, 'completed', result);
    
    // Broadcast update via WebSocket
    io.emit('command-update', {
      commandId,
      status: 'completed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    await updateCommandStatus(commandId, 'failed', null, error.message);
    
    io.emit('command-update', {
      commandId,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### Safety and Validation
```javascript
// Command validation with safety checks
async function validateCommand(instrumentId, command, parameters) {
  const instrument = await getInstrument(instrumentId);
  if (!instrument) {
    throw new Error('Instrument not found');
  }
  
  if (!instrument.capabilities.includes(command)) {
    throw new Error(`Command '${command}' not supported by this instrument`);
  }
  
  // Safety checks
  if (command === 'setTemperature') {
    const temp = parameters.temperature;
    if (temp < 0 || temp > 100) {
      throw new Error('Temperature must be between 0-100°C');
    }
  }
  
  if (command === 'setPressure') {
    const pressure = parameters.pressure;
    if (pressure < 0 || pressure > 10) {
      throw new Error('Pressure must be between 0-10 bar');
    }
  }
  
  // Check if instrument is in safe state for command
  const status = await getInstrumentStatus(instrumentId);
  if (status.error_count > 5) {
    throw new Error('Instrument has too many errors. Manual intervention required.');
  }
}
```

### 2. Frontend Implementation

#### Control Panel Component
```typescript
// Create frontend/src/components/InstrumentControl.tsx
import React, { useState, useEffect } from 'react';

interface ControlPanelProps {
  instrument: Instrument;
}

export const InstrumentControl: React.FC<ControlPanelProps> = ({ instrument }) => {
  const [temperature, setTemperature] = useState(25);
  const [pressure, setPressure] = useState(1);
  const [commandStatus, setCommandStatus] = useState<string>('');

  const sendCommand = async (command: string, parameters: any) => {
    try {
      const response = await fetch(`/api/control/instruments/${instrument.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, parameters })
      });
      
      const result = await response.json();
      setCommandStatus(`Command ${command} queued: ${result.commandId}`);
    } catch (error) {
      setCommandStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="instrument-control">
      <h3>Control Panel: {instrument.model}</h3>
      
      {/* Temperature Control */}
      <div className="control-group">
        <label>Temperature (°C):</label>
        <input
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          min="0"
          max="100"
          step="0.1"
        />
        <button onClick={() => sendCommand('setTemperature', { temperature })}>
          Set Temperature
        </button>
      </div>

      {/* Pressure Control */}
      <div className="control-group">
        <label>Pressure (bar):</label>
        <input
          type="number"
          value={pressure}
          onChange={(e) => setPressure(Number(e.target.value))}
          min="0"
          max="10"
          step="0.01"
        />
        <button onClick={() => sendCommand('setPressure', { pressure })}>
          Set Pressure
        </button>
      </div>

      {/* Operation Controls */}
      <div className="control-group">
        <button 
          className="start-button"
          onClick={() => sendCommand('start', {})}
        >
          Start Operation
        </button>
        <button 
          className="stop-button"
          onClick={() => sendCommand('stop', {})}
        >
          Stop Operation
        </button>
        <button 
          className="pause-button"
          onClick={() => sendCommand('pause', {})}
        >
          Pause Operation
        </button>
      </div>

      {/* Status Display */}
      {commandStatus && (
        <div className="command-status">
          {commandStatus}
        </div>
      )}
    </div>
  );
};
```

### 3. Database Integration

#### Command Tracking
```python
# Add to services/main.py
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ControlCommand(Base):
    __tablename__ = "control_commands"
    
    id = Column(Integer, primary_key=True)
    instrument_id = Column(String(255))
    command = Column(String(255))
    parameters = Column(Text)  # JSON string
    status = Column(String(50), default='pending')
    result = Column(Text)
    error = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

@app.post("/api/control/commands")
async def create_command(command_data: dict):
    command = ControlCommand(
        instrument_id=command_data['instrument_id'],
        command=command_data['command'],
        parameters=json.dumps(command_data['parameters']),
        created_at=datetime.now()
    )
    # Save to database
    return {"command_id": command.id}
```

### 4. Security Implementation

#### Authentication & Authorization
```javascript
// Add authentication middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Add authorization for control commands
function requireControlPermission(req, res, next) {
  if (!req.user.permissions.includes('instrument_control')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

// Apply to control endpoints
app.post('/api/control/instruments/:id/command', 
  requireAuth, 
  requireControlPermission, 
  handleControlCommand
);
```

## Safety Features

### 1. Command Validation
- Parameter range checking
- Instrument capability verification
- Current state validation

### 2. Emergency Stops
```javascript
app.post('/api/control/emergency-stop/:instrumentId', async (req, res) => {
  try {
    await sendInstrumentCommand(req.params.instrumentId, 'emergency_stop', {});
    
    // Cancel all pending commands for this instrument
    await cancelPendingCommands(req.params.instrumentId);
    
    res.json({ status: 'emergency_stop_sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Audit Logging
```javascript
async function logControlAction(userId, instrumentId, command, parameters, result) {
  await insertAuditLog({
    user_id: userId,
    instrument_id: instrumentId,
    action: 'control_command',
    details: { command, parameters, result },
    timestamp: new Date()
  });
}
```

## Testing

1. **Unit Tests**:
   ```javascript
   // Test command validation
   test('should reject invalid temperature', async () => {
     await expect(validateCommand('inst1', 'setTemperature', { temperature: 150 }))
       .rejects.toThrow('Temperature must be between 0-100°C');
   });
   ```

2. **Integration Tests**:
   ```bash
   # Test control endpoint
   curl -X POST http://localhost:8081/api/control/instruments/test/command \
     -H "Content-Type: application/json" \
     -d '{"command": "setTemperature", "parameters": {"temperature": 50}}'
   ```

3. **Safety Tests**:
   - Test emergency stop functionality
   - Verify permission checks
   - Test parameter validation

## Performance & Reliability

- **Command queuing**: Implement Redis-based command queue
- **Retry logic**: Automatic retry for failed commands
- **Timeout handling**: Set appropriate timeouts for commands
- **Rate limiting**: Prevent command flooding

## Next Steps

1. Implement basic command structure
2. Add parameter validation
3. Create control UI components
4. Implement safety checks
5. Add audit logging