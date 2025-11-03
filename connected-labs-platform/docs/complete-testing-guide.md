# Complete Testing Guide - All Features

## Overview
This guide covers testing for:
1. **Original Functionality**: Network Scanner + API Testing
2. **Feature C**: Log Collection & Anomaly Detection (Dashboard)

---

## Prerequisites

### Software Requirements
- **Python 3.13+** installed
- **Node.js v24.11.0+** installed
- **PowerShell** terminal

### Verify Installations
```powershell
python --version
node --version
npm --version
```

### Install Dependencies (First Time Only)
```powershell
# Backend dependencies
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\services"
pip install -r requirements.txt

# Gateway dependencies
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\gateway"
npm install

# Frontend dependencies
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\frontend"
npm install
```

---

## Part 1: Start All Services

### Step 1: Start Backend Services
**Terminal 1** (PowerShell):
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\services"
python -m uvicorn main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [PID]
INFO:     Started server process [PID]
INFO:     Application startup complete.
```

**Verify Backend:**
Open browser: http://localhost:8000/docs
- You should see FastAPI Swagger documentation
- APIs visible: `/api/logs/collect`, `/api/logs/seed-mock-data`, `/api/logs`, `/api/anomaly/detect`

---

### Step 2: Start Gateway
**Terminal 2** (PowerShell):
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\gateway"
node server.js
```

**Expected Output:**
```
Gateway server is running on http://localhost:8081
Gateway ready at http://localhost:8081
```

**Verify Gateway:**
Open browser: http://localhost:8081
- You should see: "Gateway is running"

---

### Step 3: Start Frontend
**Terminal 3** (PowerShell):
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\frontend"
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

webpack compiled successfully
```

**Browser automatically opens to:** http://localhost:3000

---

## Part 2: Test Original Functionality (Network Scanner + API Testing)

### Test 2.1: Network Scanner Page

**Steps:**
1. Browser should show the **"Connected Labs Network Scanner"** page
2. You should see:
   - Title: "Connected Labs Network Scanner"
   - Subtitle: "Enhanced platform with monitoring capabilities"
   - Navigation: **🔍 Scanner** and **📊 Dashboard** buttons
   - Scanner is the default active page

3. Click **"Scan Network"** button

**Expected Behavior:**
- Button changes to "Scanning..."
- System scans: `localhost` and `10.122.72.40` through `10.122.72.50`
- Instruments found will appear as buttons below

**Possible Results:**
- **If no instruments connected:** "No instruments found."
- **If instruments found:** Shows buttons like "QX600 (10.122.72.45)" or similar

---

### Test 2.2: API Testing (If Instruments Found)

**Steps:**
1. Click on any discovered instrument button
2. You should see:
   - Page title: `[Model] ([IP]) APIs`
   - Grid of 9 API buttons:
     - GetStatus
     - GetStatusXPN
     - GetSystemInfo
     - GetDiagnostics
     - GetReservations
     - GetUserInfo
     - GetRunBlockReason
     - GetInstrumentAvailability
     - GetSchedulerAvailability

3. Click **"GetSystemInfo"** button

**Expected Behavior:**
- Loading message appears briefly
- XML response displayed in formatted view
- Response shows instrument details (SystemModel, SerialNumber, etc.)

4. Try clicking **"GetUserInfo"** button

**Expected Behavior:**
- Should return user information
- Authentication header automatically added

5. Click **"Back"** button
   - Returns to scanner page
   - Discovered instruments still visible

---

### Test 2.3: API Testing Without Physical Instruments

**If no instruments are available on the network:**

**Terminal 4** (PowerShell):
```powershell
# Test gateway proxy directly
curl http://localhost:8081/DataService/GetSystemInfo -H "x-target-url: http://localhost:8080"
```

**Expected:** Connection error (normal - no instrument at localhost:8080)

**To verify gateway routing works:**
```powershell
# Test a public API through gateway
curl http://localhost:8081/api/alerts
```

**Expected:**
```json
{
  "success": true,
  "alerts": [],
  "count": 0
}
```

---

## Part 3: Test Feature C (Log Collection & Anomaly Detection)

### Test 3.1: Access Dashboard

**Steps:**
1. In the browser (http://localhost:3000), click **"📊 Dashboard"** button in navigation
2. Dashboard button should highlight (white background)
3. You should see:
   - **AlertsPanel** section at top (empty initially)
   - **LogsViewer** section below (empty initially)
   - Message: "No alerts to display" and "No logs found"

---

### Test 3.2: Seed Mock Data

**Terminal 4** (PowerShell):
```powershell
curl -X POST http://localhost:8000/api/logs/seed-mock-data
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mock data seeded successfully",
  "logs_generated": 79
}
```

**In Browser (Dashboard page):**
- Wait 10 seconds (auto-refresh) OR click **"🔄 Refresh"** button in LogsViewer
- **LogsViewer** now shows:
  - **79 logs** in the table
  - Statistics: Error count, Warning count, Info count
  - Color-coded rows (red for errors, yellow for warnings)
  - Logs from 4 instruments: thermocycler-001, centrifuge-002, spectrometer-003, incubator-004

---

### Test 3.3: Run Anomaly Detection

**Terminal 4** (PowerShell):
```powershell
curl -X POST http://localhost:8000/api/anomaly/detect
```

**Expected Response:**
```json
{
  "success": true,
  "anomalies_detected": 4,
  "alerts_sent": 4
}
```

**In Browser (Dashboard page) - IMMEDIATELY:**
- **AlertsPanel** shows **4 new alerts** with animations sliding in
- Browser notification may appear for critical alerts (if permissions granted)
- Alert statistics update at top
- Alerts are color-coded:
  - **Critical** (red) - Temperature spike alerts
  - **High** (orange) - Error burst alerts
  - **Medium** (yellow) - Rapid change alerts

---

### Test 3.4: Interact with AlertsPanel

**Test Alert Expansion:**
1. Click on any alert card
2. Alert expands showing:
   - Full description
   - Confidence score
   - Related log IDs
   - Suggested actions (numbered list)
3. Click again to collapse

**Test Alert Filtering:**
1. Click **"Critical"** filter button
   - Only critical severity alerts show
2. Click **"High"** filter button
   - Only high severity alerts show
3. Click **"All"** button
   - All alerts visible again

**Test Alert Details:**
- Verify timestamps show relative time ("5m ago", "10m ago")
- Verify suggested actions are specific to anomaly type
- Check alert icons match severity

---

### Test 3.5: Interact with LogsViewer

**Test Log Table:**
1. Scroll through the log table
2. Verify columns: Time, Level, Instrument, Message, Temp (°C)
3. Color-coded rows visible:
   - Red background for ERROR logs
   - Yellow background for WARNING logs
   - White/blue background for INFO logs

**Test Log Expansion:**
1. Click any log row
2. Row expands showing:
   - Log Details: ID, Timestamp, Instrument, Level
   - Metadata: temperature, pressure, humidity, etc.
3. Click again to collapse

**Test Instrument Filter:**
1. Click "Instrument" dropdown
2. Select **"thermocycler-001"**
3. Table shows only thermocycler logs
4. Counter updates: "Showing X of 79 logs"
5. Select **"All Instruments"** to reset

**Test Level Filter:**
1. Click "Level" dropdown
2. Select **"error"**
3. Table shows only ERROR logs
4. Select **"All Levels"** to reset

**Test Search:**
1. Type **"temperature"** in search box
2. Table filters to logs containing "temperature" in message/instrument/level
3. Counter updates dynamically
4. Click **"✕"** button to clear search

**Test Refresh:**
1. Click **"🔄 Refresh"** button
2. Loading indicator appears briefly
3. Logs reload from backend
4. "Last updated" timestamp updates

**Test Export:**
1. Click **"💾 Export"** button
2. JSON file downloads: `logs_YYYY-MM-DDTHH-MM-SS.json`
3. Open file - should contain all filtered logs in JSON format

---

### Test 3.6: Real-Time Features

**Test Auto-Refresh:**
1. Keep dashboard open
2. Wait 10 seconds
3. "Last updated" timestamp should change
4. Logs auto-refresh (counter may change if new logs added)

**Test WebSocket Alerts:**
**Terminal 4**:
```powershell
# Add a new log
curl -X POST http://localhost:8000/api/logs/collect -H "Content-Type: application/json" -d '{\"instrument_id\": \"test-999\", \"level\": \"error\", \"message\": \"Critical test error\", \"metadata\": {\"temperature\": 105.5}}'

# Run detection again
curl -X POST http://localhost:8000/api/anomaly/detect
```

**In Browser:**
- New alerts appear **INSTANTLY** in AlertsPanel (no refresh needed)
- WebSocket delivers alerts in real-time
- Browser console shows: "Received anomaly_alert" (if DevTools open)

---

### Test 3.7: Navigation Between Pages

**Test Page Switching:**
1. From Dashboard, click **"🔍 Scanner"** button
   - Returns to scanner page
   - Previous scan results still visible (if any)

2. Click **"📊 Dashboard"** button
   - Returns to dashboard
   - Alerts and logs still visible (persisted)

3. Click **"Scan Network"** button on scanner page
   - Rescans network
   - Updates instrument list

4. If instrument found, click it → API page
   - Test an API
   - Click **"Back"** → Scanner page
   - Click **"📊 Dashboard"** → Dashboard still has alerts/logs

---

## Part 4: Advanced Testing Scenarios

### Scenario 4.1: Generate Multiple Anomaly Types

**Terminal 4**:
```powershell
# Clear existing alerts (optional)
curl -X DELETE http://localhost:8081/api/alerts

# Reseed fresh data
curl -X POST http://localhost:8000/api/logs/seed-mock-data

# Detect anomalies
curl -X POST http://localhost:8000/api/anomaly/detect
```

**Verify:**
- Temperature spike anomalies (z-score > 3.0)
- Error burst anomalies (15+ errors in thermocycler)
- Rapid change anomalies (30% change in 5 minutes)

---

### Scenario 4.2: High Volume Log Testing

**Terminal 4**:
```powershell
# Generate multiple batches
for ($i=1; $i -le 5; $i++) {
    curl -X POST http://localhost:8000/api/logs/seed-mock-data
}
```

**In Browser:**
- LogsViewer limits display to 100 logs (configurable)
- Scrolling remains smooth
- Filters work correctly
- Export includes all filtered logs

---

### Scenario 4.3: Stress Test Real-Time Alerts

**Terminal 4**:
```powershell
# Rapid-fire anomaly detection
for ($i=1; $i -le 3; $i++) {
    curl -X POST http://localhost:8000/api/anomaly/detect
    Start-Sleep -Seconds 2
}
```

**In Browser:**
- Alerts appear rapidly
- Animations don't overlap
- No UI freezing
- Alert count updates correctly

---

## Part 5: Verification Checklist

### Backend Services ✅
- [ ] Services running on http://localhost:8000
- [ ] FastAPI docs accessible at http://localhost:8000/docs
- [ ] POST /api/logs/seed-mock-data returns 79 logs
- [ ] POST /api/anomaly/detect returns 4 anomalies
- [ ] GET /api/logs returns log list
- [ ] Database file created: `services/instrument_logs.db`

### Gateway ✅
- [ ] Gateway running on http://localhost:8081
- [ ] POST /api/alerts endpoint receives alerts
- [ ] GET /api/alerts returns alert list
- [ ] WebSocket connection established (check browser DevTools → Network → WS)
- [ ] Gateway logs show: "Client connected to alerts"

### Frontend - Scanner ✅
- [ ] Page loads at http://localhost:3000
- [ ] Navigation menu visible
- [ ] Scan Network button works
- [ ] Instrument discovery works (if instruments available)
- [ ] API testing works (if instruments available)
- [ ] Back button returns to scanner

### Frontend - Dashboard ✅
- [ ] Dashboard page loads via navigation
- [ ] AlertsPanel renders empty state
- [ ] LogsViewer renders empty state
- [ ] After seeding: 79 logs appear
- [ ] After detection: 4 alerts appear instantly
- [ ] Alert expansion works
- [ ] Alert filtering works (All/Critical/High/Medium/Low)
- [ ] Log row expansion works
- [ ] Instrument filter works
- [ ] Level filter works
- [ ] Search works
- [ ] Export downloads JSON
- [ ] Auto-refresh updates every 10 seconds
- [ ] WebSocket delivers real-time alerts

### Integration ✅
- [ ] Can switch between Scanner and Dashboard
- [ ] Page state persists when switching
- [ ] No console errors (except expected TypeScript warnings)
- [ ] No network errors (check DevTools → Network)
- [ ] Responsive design works (resize browser window)

---

## Part 6: Troubleshooting

### Problem: Backend won't start
**Error:** `ModuleNotFoundError: No module named 'fastapi'`
**Solution:**
```powershell
cd services
pip install -r requirements.txt
```

### Problem: Gateway won't start
**Error:** `Cannot find module 'express'`
**Solution:**
```powershell
cd gateway
npm install
```

### Problem: Frontend won't compile
**Error:** `Cannot find module 'socket.io-client'`
**Solution:**
```powershell
cd frontend
npm install
```

### Problem: No logs appear after seeding
**Check:**
1. Services running? Test: `curl http://localhost:8000/api/logs`
2. Response should show `"logs": [...]` array
3. Click Refresh button in LogsViewer
4. Check browser console for errors (F12)

### Problem: Alerts don't appear in real-time
**Check:**
1. Gateway running? Test: `curl http://localhost:8081/api/alerts`
2. Browser DevTools → Network → WS tab
3. Should see WebSocket connection to `ws://localhost:8081`
4. Status should be "101 Switching Protocols" (connected)
5. Check gateway terminal for: "Client connected to alerts"

### Problem: "Cannot connect to backend"
**Solution:**
1. Verify all three services running (services, gateway, frontend)
2. Check ports not in use by other applications
3. Restart services in order: backend → gateway → frontend

### Problem: TypeScript errors in editor
**Note:** These are known declaration issues in development
- Frontend still compiles successfully
- Run `npm start` to verify
- Errors don't affect runtime functionality

---

## Part 7: Data Reference

### Mock Data Instruments
```
thermocycler-001    - Generates temp data, 5 anomalies
centrifuge-002      - Generates speed data, 15 error burst
spectrometer-003    - Generates wavelength data, 2 anomalies
incubator-004       - Generates CO2 data, 1 anomaly
```

### Anomaly Detection Algorithms
1. **Z-Score Detection** (threshold: 3.0)
   - Detects temperature > 75°C in thermocycler
   - Severity: Critical

2. **Error Burst Detection** (5+ errors in 10 minutes)
   - Detects 15 errors in centrifuge logs
   - Severity: High

3. **Rapid Change Detection** (30% change in 5 minutes)
   - Detects rapid temperature fluctuations
   - Severity: Medium

### API Endpoints Summary

**Services (Port 8000):**
```
POST   /api/logs/collect          - Store new log
POST   /api/logs/seed-mock-data   - Generate 79 mock logs
GET    /api/logs                  - Query logs (filters: limit, instrument_id, level, start_time, end_time)
POST   /api/anomaly/detect        - Run detection, send alerts to gateway
```

**Gateway (Port 8081):**
```
POST   /api/alerts                - Receive alert from services
GET    /api/alerts                - Query alerts (filters: severity, limit, instrument_id)
GET    /api/alerts/stats          - Get statistics
DELETE /api/alerts                - Clear all alerts
WS     socket.io                  - Real-time alert streaming
GET    /DataService/*             - Proxy to instruments (original functionality)
```

---

## Part 8: Next Steps

### After Successful Testing:
1. **Document any issues found** - Create GitHub issues
2. **Performance benchmarks** - Note loading times, lag
3. **Browser compatibility** - Test in Chrome, Firefox, Edge
4. **Mobile testing** - Resize browser to mobile dimensions

### Future Features to Implement:
- **Feature A**: Real-Time Monitoring Dashboard (telemetry graphs)
- **Feature B**: Remote Instrument Control (command queue)
- **Feature D**: Smart Diagnosis Assistant (AI-powered suggestions)

---

## Quick Command Reference

```powershell
# Start all services (separate terminals)
cd services && python -m uvicorn main:app --reload --port 8000
cd gateway && node server.js
cd frontend && npm start

# Seed data and detect anomalies (Terminal 4)
curl -X POST http://localhost:8000/api/logs/seed-mock-data
curl -X POST http://localhost:8000/api/anomaly/detect

# Query data
curl http://localhost:8000/api/logs
curl http://localhost:8081/api/alerts
curl http://localhost:8081/api/alerts/stats

# Clear alerts
curl -X DELETE http://localhost:8081/api/alerts

# Add custom log
curl -X POST http://localhost:8000/api/logs/collect -H "Content-Type: application/json" -d '{\"instrument_id\": \"test-123\", \"level\": \"error\", \"message\": \"Test message\", \"metadata\": {\"temperature\": 99.5}}'
```

---

## Success Criteria Summary

✅ **All services running without errors**
✅ **Scanner page: Network scan + API testing works**
✅ **Dashboard page: Loads successfully**
✅ **Mock data: Generates 79 logs**
✅ **Anomaly detection: Finds 4 anomalies**
✅ **AlertsPanel: Shows alerts in real-time**
✅ **LogsViewer: Displays logs with working filters**
✅ **Navigation: Can switch between pages**
✅ **WebSocket: Real-time updates working**
✅ **Export: Downloads JSON files**
✅ **No critical errors in browser console**

---

**Happy Testing! 🎉**

If you encounter any issues not covered in this guide, check:
1. Terminal outputs for error messages
2. Browser DevTools console (F12)
3. Network tab for failed requests
4. `docs/implementation-roadmap.md` for architecture details
