# Smart Diagnosis Assistant - Testing Guide

## Feature D Implementation Complete! 🎉

This guide explains how to test the newly implemented Smart Diagnosis Assistant feature.

---

## What Was Implemented

### Backend (services/)
1. **`diagnosis_engine.py`** (544 lines)
   - 8 comprehensive diagnosis rules covering:
     - Temperature spikes/drops
     - Error bursts
     - Calibration drift
     - Communication failures
     - Mechanical failures
     - Power issues
     - Sample errors
   - Symptom matching algorithm
   - Log pattern analysis
   - Confidence scoring (0-1 scale)
   - Urgency determination (low/medium/high/critical)

2. **`main.py`** - Updated diagnosis endpoint
   - POST `/api/diagnosis/analyze`
   - Accepts: instrument_id, symptoms[], error_codes[]
   - Analyzes recent logs (last 50 entries)
   - Returns: probable causes, recommended actions, confidence, urgency

### Frontend (frontend/src/components/)
1. **`DiagnosisPanel.tsx`** (430+ lines)
   - Instrument selector
   - 15 common symptom chips (clickable)
   - Custom symptom input
   - Error codes input
   - Real-time diagnosis results
   - Probability bars for causes
   - Recommended actions checklist
   - Log analysis summary

2. **`DiagnosisPanel.css`** (550+ lines)
   - Modern gradient design
   - Color-coded urgency badges
   - Animated probability bars
   - Responsive grid layout
   - Hover effects and transitions

3. **`App.tsx`** - Integrated into dashboard
   - Added DiagnosisPanel as third section
   - Appears below AlertsPanel and LogsViewer

---

## How to Test

### Step 1: Start All Services

**Terminal 1 - Backend:**
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\services"
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Gateway:**
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\gateway"
node server.js
```

**Terminal 3 - Frontend:**
```powershell
cd "C:\Users\rpanda\Videos\Hekathoron\NeoSpartans\connected-labs-platform\frontend"
npm start
```

---

### Step 2: Test Backend API Directly

**Test with curl (Terminal 4):**

**Example 1: Temperature Spike Diagnosis**
```powershell
curl -X POST http://localhost:8000/api/diagnosis/analyze -H "Content-Type: application/json" -d "{\"instrument_id\":\"thermocycler-01\",\"symptoms\":[\"high temperature\",\"temperature spike\"],\"error_codes\":[\"E001\",\"TEMP_HIGH\"]}"
```

**Expected Response:**
```json
{
  "success": true,
  "diagnosis": {
    "id": "diag_abc12345",
    "instrument_id": "thermocycler-01",
    "timestamp": "2025-11-03T...",
    "probable_causes": [
      {
        "cause": "Cooling system malfunction",
        "probability": 0.85,
        "description": "HVAC or internal fan failure..."
      },
      {
        "cause": "Ambient temperature too high",
        "probability": 0.70,
        "description": "Room temperature exceeds specifications"
      }
    ],
    "recommended_actions": [
      "Check cooling fan operation and clean dust filters",
      "Verify HVAC system is running...",
      ...
    ],
    "confidence": 0.85,
    "urgency": "high",
    "matched_rules": ["rule_temp_spike"],
    "log_summary": {
      "total_logs_analyzed": 50,
      "error_frequency": 0.15,
      "warning_frequency": 0.25,
      "patterns_found": 3,
      "recent_errors": [...]
    }
  }
}
```

**Example 2: Communication Failure**
```powershell
curl -X POST http://localhost:8000/api/diagnosis/analyze -H "Content-Type: application/json" -d "{\"instrument_id\":\"centrifuge-01\",\"symptoms\":[\"not responding\",\"connection lost\"],\"error_codes\":[\"TIMEOUT\"]}"
```

**Example 3: Error Burst**
```powershell
curl -X POST http://localhost:8000/api/diagnosis/analyze -H "Content-Type: application/json" -d "{\"instrument_id\":\"spectrometer-01\",\"symptoms\":[\"repeated errors\",\"frequent failures\"],\"error_codes\":[\"E003\"]}"
```

---

### Step 3: Test Frontend UI

1. **Open Browser:** http://localhost:3000
2. **Navigate to Dashboard:** Click **📊 Dashboard** button
3. **Scroll to Bottom:** You'll see three sections:
   - AlertsPanel (top)
   - LogsViewer (middle)
   - **DiagnosisPanel (bottom)** ← NEW!

---

### Step 4: Use Diagnosis Panel

**Test Scenario 1: Temperature Problem**

1. **Select Instrument:** Choose "Thermocycler 01"
2. **Select Symptoms:** Click these chips:
   - "High temperature"
   - "Temperature spike"
3. **Add Error Code:** Type `E001, TEMP_HIGH`
4. **Click "🔍 Analyze Problem"**

**Expected Result:**
- Loading indicator appears
- After 1-2 seconds, results display:
  - **Urgency Badge:** RED "🚨 HIGH"
  - **Confidence:** "85% Confidence"
  - **Log Analysis Summary:**
    - Logs Analyzed: 50-200
    - Error Rate: varies
    - Patterns Found: 1-5
  - **Probable Causes:**
    - #1: Cooling system malfunction (85%)
    - #2: Ambient temperature too high (70%)
    - #3: Temperature sensor calibration drift (65%)
  - **Recommended Actions:** 5-8 actionable steps

---

**Test Scenario 2: Communication Issue**

1. **Select Instrument:** Choose "Centrifuge 01"
2. **Select Symptoms:**
   - "Not responding"
   - "Connection lost"
   - "Communication timeout"
3. **Click "🔍 Analyze Problem"**

**Expected Result:**
- **Urgency:** 🚨 HIGH (red)
- **Confidence:** 75-80%
- **Probable Causes:**
   - Network connectivity issue (80%)
   - Instrument powered off or crashed (75%)
   - Firewall or network configuration (60%)
- **Actions:** Check power, verify cables, test network, etc.

---

**Test Scenario 3: Custom Symptom**

1. **Select Instrument:** Any
2. **Add Custom Symptom:**
   - Type "strange noise from motor"
   - Click "Add"
3. **Select Additional:**
   - "Noise or vibration"
   - "Mechanical jamming"
4. **Click "🔍 Analyze Problem"**

**Expected Result:**
- Matches rule_mechanical_failure
- Shows motor/actuator causes
- Recommends inspection and lubrication

---

### Step 5: Verify UI Features

**Visual Elements:**
✅ Purple gradient header
✅ Symptom chips turn purple when selected
✅ Selected symptoms show at bottom with ✕ to remove
✅ Analyze button disabled when no symptoms
✅ Loading state shows "🔍 Analyzing..."
✅ Urgency badge color-coded (red/orange/yellow/blue)
✅ Confidence badge shows percentage
✅ Probability bars animate smoothly
✅ Causes ranked #1, #2, #3
✅ Actions in numbered list with green accent
✅ Log summary shows statistics

**Interactions:**
✅ Click symptom chip → toggles selection
✅ Type custom symptom → press Enter or click Add
✅ Click ✕ on selected symptom → removes it
✅ Click "Reset" → clears all selections and results
✅ Hover over cause cards → lifts with shadow
✅ Responsive design → works on smaller screens

---

### Step 6: Integration Testing

**Full Workflow:**

1. **Seed Mock Data:**
```powershell
curl -X POST http://localhost:8000/api/logs/seed-mock-data
```

2. **Generate Anomalies:**
```powershell
curl -X POST "http://localhost:8000/api/logs/generate-anomaly-scenario?scenario=temp_spike"
curl -X POST http://localhost:8000/api/anomaly/detect
```

3. **In Dashboard:**
   - **AlertsPanel** shows temperature spike alert
   - **LogsViewer** shows error logs
   - **DiagnosisPanel:**
     - Select "thermocycler-01"
     - Select "High temperature", "Temperature spike"
     - Analyze → Should correlate with alerts and logs!

**Verification:**
- Diagnosis references the same issues as alerts
- Recommended actions align with alert severity
- Log summary reflects actual error patterns
- Confidence score correlates with log analysis

---

## API Reference

### POST /api/diagnosis/analyze

**Request Body:**
```json
{
  "instrument_id": "thermocycler-01",
  "symptoms": ["high temperature", "repeated errors"],
  "error_codes": ["E001", "TEMP_HIGH"]
}
```

**Response:**
```json
{
  "success": true,
  "diagnosis": {
    "id": "diag_xxx",
    "instrument_id": "thermocycler-01",
    "timestamp": "2025-11-03T...",
    "probable_causes": [
      {
        "cause": "string",
        "probability": 0.0-1.0,
        "description": "string"
      }
    ],
    "recommended_actions": ["string", ...],
    "confidence": 0.0-1.0,
    "urgency": "low|medium|high|critical",
    "matched_rules": ["rule_id", ...],
    "log_summary": {
      "total_logs_analyzed": int,
      "error_frequency": 0.0-1.0,
      "warning_frequency": 0.0-1.0,
      "patterns_found": int,
      "recent_errors": ["string", ...]
    }
  },
  "timestamp": "2025-11-03T..."
}
```

---

## Diagnosis Rules

### Available Rules:
1. **rule_temp_spike** - High temperature detection
2. **rule_temp_drop** - Low temperature detection
3. **rule_error_burst** - Repeated errors
4. **rule_calibration_drift** - Inaccuracy issues
5. **rule_communication_failure** - Connection problems
6. **rule_mechanical_failure** - Physical issues
7. **rule_power_issue** - Electrical problems
8. **rule_sample_error** - Contamination/quality

### Symptom Keywords:
Each rule matches specific keywords. Examples:
- Temperature: high, low, spike, drop, overheating, freezing
- Errors: repeated, burst, frequent, multiple, many
- Communication: timeout, offline, not responding, connection lost
- Mechanical: noise, vibration, stuck, jammed
- Calibration: inaccurate, drift, offset, readings wrong

---

## Troubleshooting

### Backend Not Responding
```powershell
# Check if services running
curl http://localhost:8000/health

# Should return: {"status": "healthy", ...}
```

### No Diagnosis Results
- **Check:** At least 1 symptom or error code selected
- **Check:** Instrument ID exists in database
- **Check:** Browser console for errors (F12)

### Low Confidence Scores
- **Reason:** Vague symptoms or no log patterns match
- **Solution:** Add more specific symptoms or error codes
- **Solution:** Ensure logs exist for the instrument

### No Logs Analyzed
- **Reason:** No logs in database for that instrument
- **Solution:** Run `curl -X POST http://localhost:8000/api/logs/seed-mock-data`

---

## Success Criteria

✅ Backend `/api/diagnosis/analyze` returns valid diagnosis
✅ Frontend DiagnosisPanel appears in dashboard
✅ Can select symptoms from chip list
✅ Can add custom symptoms
✅ Can enter error codes
✅ Analyze button triggers diagnosis
✅ Results display with probable causes
✅ Recommended actions listed
✅ Urgency and confidence shown
✅ Log summary displays statistics
✅ Probability bars animate
✅ Reset button clears form
✅ Responsive design works

---

## File Summary

### Created Files:
1. `services/diagnosis_engine.py` (544 lines) - Core diagnosis logic
2. `frontend/src/components/DiagnosisPanel.tsx` (430+ lines) - UI component
3. `frontend/src/components/DiagnosisPanel.css` (550+ lines) - Styling
4. `docs/smart-diagnosis-testing-guide.md` (this file)

### Modified Files:
1. `services/main.py` - Replaced placeholder endpoint
2. `frontend/src/App.tsx` - Added DiagnosisPanel import and integration

---

## Next Steps (Future Enhancements)

### Iteration 1 - NLP + AI:
- Integrate OpenAI API for free-text symptom parsing
- Add chain-of-thought explanations
- Summarize logs with AI
- Natural language action recommendations

### Iteration 2 - Knowledge Base:
- Document store for historical fixes
- Similarity search for past issues
- Learn from successful interventions
- Community-contributed solutions

---

**Smart Diagnosis Assistant (Feature D) - MVP Complete!** 🚀

The system can now:
1. Accept symptoms and error codes
2. Match against 8 diagnosis rules
3. Analyze recent logs for patterns
4. Calculate confidence and urgency
5. Provide probable causes with probabilities
6. Recommend actionable steps
7. Display results in beautiful UI

Ready for production testing! 🎉
