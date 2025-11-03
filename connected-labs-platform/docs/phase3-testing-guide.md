# Feature C Phase 3 - Testing Guide

## Prerequisites
- Python 3.13+ installed
- Node.js v24.11.0+ installed
- All dependencies installed (requirements.txt and package.json)

## Quick Start

### Step 1: Start Backend Services
Open Terminal 1 and run:
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\services"
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 2: Start Gateway (if not already running)
Open Terminal 2 and run:
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\gateway"
node server.js
```

Expected output:
```
Gateway server is running on http://localhost:8081
Gateway ready at http://localhost:8081
```

### Step 3: Start Frontend
Open Terminal 3 and run:
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\frontend"
npm start
```

Expected output:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Browser should automatically open to http://localhost:3000

### Step 4: Navigate to Dashboard
In the browser:
1. Click the **"📊 Dashboard"** button in the navigation bar
2. You should see:
   - **AlertsPanel** at the top (empty initially)
   - **LogsViewer** below (empty initially)

### Step 5: Seed Mock Data
Open Terminal 4 and run:
```powershell
curl -X POST http://localhost:8000/api/logs/seed-mock-data
```

Expected response:
```json
{
  "success": true,
  "message": "Mock data seeded successfully",
  "logs_generated": 79
}
```

Now refresh the browser (or wait 10 seconds for auto-refresh) - you should see **79 logs** in the LogsViewer.

### Step 6: Run Anomaly Detection
In Terminal 4, run:
```powershell
curl -X POST http://localhost:8000/api/anomaly/detect
```

Expected response:
```json
{
  "success": true,
  "anomalies_detected": 4,
  "alerts_sent": 4
}
```

**Immediately** in the browser dashboard, you should see:
- **4 alerts** appear in the AlertsPanel with animations
- Browser notification (if permissions granted) for critical alerts
- Alert stats showing error/warning/info counts
- Alerts color-coded by severity (red for critical, orange for high)

## What to Verify

### AlertsPanel Component
✅ **Real-time updates**: Alerts appear instantly via WebSocket
✅ **Severity colors**: Critical (red), High (orange), Medium (yellow), Low (blue)
✅ **Expandable cards**: Click any alert to see full details
✅ **Filter buttons**: All, Critical, High, Medium, Low
✅ **Statistics**: Error, Warning, Info counts at top
✅ **Browser notifications**: Critical alerts trigger system notifications
✅ **Suggested actions**: Each alert shows recommended actions

### LogsViewer Component
✅ **Log table display**: Shows timestamp, level, instrument, message, temperature
✅ **Auto-refresh**: Updates every 10 seconds
✅ **Filter by instrument**: Dropdown to filter by instrument_id
✅ **Filter by level**: Dropdown for error/warning/info/debug
✅ **Search functionality**: Text search across message, instrument, level
✅ **Color-coded rows**: Error (red), Warning (yellow), Info (blue)
✅ **Expandable details**: Click any log row to see full metadata
✅ **Export functionality**: Download logs as JSON
✅ **Relative timestamps**: Shows "5m ago", "2h ago", etc.
✅ **Statistics**: Shows error/warning/info counts

### Integration
✅ **Navigation**: Can switch between Scanner and Dashboard pages
✅ **Layout**: AlertsPanel and LogsViewer stacked vertically
✅ **Responsive**: Works on different screen sizes
✅ **Performance**: No lag with 100+ logs

## Testing Scenarios

### Scenario 1: Temperature Spike Detection
```powershell
# Seed data with temperature anomalies
curl -X POST http://localhost:8000/api/logs/seed-mock-data

# Run detection
curl -X POST http://localhost:8000/api/anomaly/detect
```

Expected: See alerts for thermocycler temperature spikes (>75°C)

### Scenario 2: Error Burst Detection
The mock data includes error bursts (15 errors in the centrifuge log).

Expected: See alert for "Error burst detected" with high severity

### Scenario 3: Real-time Log Monitoring
1. Open dashboard
2. Keep it open while running:
```powershell
# Generate new logs
curl -X POST "http://localhost:8000/api/logs/collect" -H "Content-Type: application/json" -d "{\"instrument_id\": \"test-123\", \"level\": \"error\", \"message\": \"Test error message\", \"metadata\": {\"temperature\": 99.5}}"
```
3. Wait 10 seconds or click Refresh

Expected: New log appears in the table

### Scenario 4: Alert Filtering
1. Run anomaly detection to generate multiple alerts
2. In AlertsPanel, click filter buttons (All, Critical, High, etc.)

Expected: Alerts filter by severity level

### Scenario 5: Log Search
1. In LogsViewer search box, type "temperature"
2. Observe filtered results

Expected: Only logs with "temperature" in message/instrument/level show

## API Endpoints Reference

### Services (Port 8000)
```
POST /api/logs/collect - Store new log entry
POST /api/logs/seed-mock-data - Generate 79 mock logs
GET /api/logs?limit=100&instrument_id=X&level=error - Query logs
POST /api/anomaly/detect - Run anomaly detection and send alerts
```

### Gateway (Port 8081)
```
POST /api/alerts - Receive alert from services
GET /api/alerts?severity=critical&limit=50 - Query alerts
GET /api/alerts/stats - Get alert statistics
DELETE /api/alerts - Clear all alerts
WebSocket: io.on('subscribe-alerts') - Real-time alert streaming
```

## Troubleshooting

### "Cannot connect to backend"
- Check services running on http://localhost:8000
- Test with: `curl http://localhost:8000/docs`

### "Alerts not appearing"
- Check gateway running on http://localhost:8081
- Check browser console for WebSocket errors
- Verify gateway logs show "Client connected to alerts"

### "Logs not refreshing"
- Check auto-refresh is enabled (default: 10s interval)
- Manually click Refresh button
- Check services are returning data: `curl http://localhost:8000/api/logs`

### TypeScript errors in editor
- These are known declaration issues
- Frontend still compiles and runs correctly
- Run `npm start` to verify

### "No logs found"
- Seed data first: `curl -X POST http://localhost:8000/api/logs/seed-mock-data`
- Check response confirms 79 logs generated

## Next Steps

After Phase 3 testing is complete:
1. **Feature A**: Real-Time Monitoring Dashboard (mock telemetry, status table)
2. **Feature B**: Remote Instrument Control (command queue, safety validation)
3. **Feature D**: Smart Diagnosis Assistant (rule-based diagnosis panel)

## File Structure Created

```
connected-labs-platform/
├── services/
│   ├── mock_data_generator.py     # ✅ Phase 1
│   ├── database.py                 # ✅ Phase 1
│   ├── anomaly_detector.py         # ✅ Phase 1
│   └── main.py                     # ✅ Phase 1 (updated)
├── gateway/
│   └── server.js                   # ✅ Phase 2 (updated)
└── frontend/src/components/
    ├── AlertsPanel.tsx             # ✅ Phase 2
    ├── AlertsPanel.css             # ✅ Phase 2
    ├── LogsViewer.tsx              # ✅ Phase 3
    ├── LogsViewer.css              # ✅ Phase 3
    └── App.tsx                     # ✅ Phase 3 (integrated)
```

## Success Criteria

✅ All three services running without errors
✅ Dashboard page loads successfully
✅ Mock data generates 79 logs
✅ Anomaly detection finds 4 anomalies
✅ Alerts appear in AlertsPanel in real-time
✅ Logs display in LogsViewer with filters working
✅ WebSocket connection established (check browser DevTools)
✅ No TypeScript runtime errors (compile warnings OK)

---

**Phase 3 Complete!** 🎉

Feature C (Log Collection & Anomaly Detection) is now fully implemented with:
- Mock data generation
- Database persistence
- Anomaly detection algorithms (z-score, error burst, rapid change)
- Real-time alert broadcasting via WebSocket
- Interactive dashboard with AlertsPanel and LogsViewer
- Filters, search, and export functionality
