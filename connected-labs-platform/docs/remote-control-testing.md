# Feature B: Remote Instrument Control - Testing Guide

## Overview
This guide helps you test the newly implemented Remote Instrument Control feature.

## Prerequisites
1. Gateway running on http://localhost:8081
2. Frontend running on http://localhost:3000

## Testing Steps

### 1. Test Backend API Endpoints

#### Test Command Submission (via PowerShell)
```powershell
# Set temperature command
$body = @{
    command = "set_temperature"
    parameters = @{
        value = 37
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/command" -Method POST -Body $body -ContentType "application/json"

# Set pressure command
$body = @{
    command = "set_pressure"
    parameters = @{
        value = 150
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/command" -Method POST -Body $body -ContentType "application/json"

# Start instrument
$body = @{
    command = "start"
    parameters = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/command" -Method POST -Body $body -ContentType "application/json"

# Stop instrument
$body = @{
    command = "stop"
    parameters = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/command" -Method POST -Body $body -ContentType "application/json"
```

#### Test Parameter Validation (should fail)
```powershell
# Temperature out of range (should fail)
$body = @{
    command = "set_temperature"
    parameters = @{
        value = 500
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/command" -Method POST -Body $body -ContentType "application/json"
```

#### Get Command Status
```powershell
# Replace with actual command ID from previous responses
Invoke-RestMethod -Uri "http://localhost:8081/api/control/commands/cmd_1234567890_abc123" -Method GET
```

#### Get All Commands for Instrument
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/control/instruments/test-instrument/commands" -Method GET
```

### 2. Test Frontend UI

#### Access Control Panel
1. Open http://localhost:3000 in your browser
2. Click "Scan Network" button
3. When instruments are found, click the 🎛️ button next to an instrument
4. Or select an instrument and click the "🎛️ Control" button in the top navigation

#### Test Temperature Control
1. Enter a temperature value (between -80 and 300)
2. Click "🌡️ Set Temperature"
3. Watch for the command to appear in the command history
4. Observe the status change from ⏳ pending → ⚙️ executing → ✅ completed

#### Test Pressure Control
1. Enter a pressure value (between 0 and 1000)
2. Click "💨 Set Pressure"
3. Watch command history for updates

#### Test Operation Control
1. Click "▶️ Start" button
2. Verify status shows "🟢 Running"
3. Watch command history
4. Click "⏹️ Stop" button
5. Verify status shows "🔴 Stopped"

#### Test Real-time Updates
1. Open browser console (F12)
2. Watch for WebSocket messages:
   - `Connected to gateway socket`
   - `Subscribed to commands`
   - `Command update` messages
3. Commands should update in real-time without refreshing

### 3. Expected Results

#### Backend
✅ Commands are queued and return immediately with commandId
✅ Commands execute asynchronously (1-3 seconds)
✅ WebSocket events are emitted during execution
✅ ~10% of commands randomly fail (for testing)
✅ Parameter validation works correctly

#### Frontend
✅ Control panel loads successfully
✅ All controls are responsive
✅ Real-time command updates appear
✅ Status messages show success/error/info
✅ Command history displays up to 10 recent commands
✅ Commands show correct status icons
✅ Connection status indicator works

### 4. Monitoring Gateway Logs

Watch the gateway terminal for these messages:
- `⚙️ Executing command...`
- `✅ Command completed successfully`
- `❌ Command failed...`
- Client connection/disconnection messages

### 5. Known Behaviors

- Commands execute asynchronously (1-3 second delay)
- 10% random failure rate (simulated for demo)
- Commands are stored in memory (not persisted)
- No real instrument connection (mock execution)

## Troubleshooting

### Frontend doesn't connect
- Check gateway is running on port 8081
- Check browser console for errors
- Verify CORS settings

### Commands don't update in real-time
- Check WebSocket connection in browser console
- Verify socket.io is connected
- Check gateway terminal for socket events

### Parameter validation fails
- Temperature range: -80°C to 300°C
- Pressure range: 0 to 1000 kPa
- Check command names: set_temperature, set_pressure, start, stop

## Next Steps (Iteration 1)

After MVP testing is successful, implement:
- [ ] WebSocket auth token validation
- [ ] Parameter range checks with safety limits
- [ ] Emergency stop endpoint
- [ ] requireAuth middleware
- [ ] Better error messages and logging
