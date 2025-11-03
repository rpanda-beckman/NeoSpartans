Implementation Roadmap — Connected Labs Platform

Purpose
-------
This document is a step-by-step implementation roadmap for the Connected Labs Platform features you requested:

- Real-Time Monitoring Dashboard
- Remote Instrument Control
- Log Collection & Anomaly Detection
- Smart Diagnosis Assistant

Goal: Make the project observable, controllable, and AI-assisted. The document is machine- and human-readable: if you tell me "read the document" I will start implementing the next pending step exactly as described.

How to use this document
------------------------
1. Read the whole file.
2. Decide which feature to implement first or say "Start implementing <feature> — step X" and I will begin.
3. After each step I complete, I'll report progress and update the roadmap to mark the step done.

Roadmap structure
-----------------
- For each feature we provide:
  - MVP (minimum viable implementation) steps (small, runnable)
  - Iteration 1 (improve reliability, safety, UI)
  - Iteration 2 (scaling, persistence, ML integration)
  - Files to edit and tests to add
  - Run / verification commands

Guiding principles
------------------
- Prefer small, testable increments that produce a working prototype quickly.
- Use existing project conventions (gateway: Node/Express + socket.io, services: FastAPI, frontend: React + TypeScript).
- Mock external instruments for developer/demo mode; swap to real instrument integrations later.
- Add tests for happy path and 1-2 edge cases per step.

Global setup (before you start)
------------------------------
- Gateway runs on port 8081 (Node.js)
- Frontend runs on port 3000 (React)
- Services run on port 8000 (FastAPI)

Make sure to run these once per system:

```powershell
# From repo root
cd connected-labs-platform/gateway
npm install
npm start

cd ..\frontend
npm install
npm start

cd ..\services
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Feature A: Real-Time Monitoring Dashboard
-----------------------------------------
MVP (quick demo, ~1-2 hours)
- Goal: Show live instrument status updates in the frontend from gateway via socket.io using mocked instrument telemetry.
- Backend (gateway):
  - Implement a minimal in-memory list of discovered instruments with mock telemetry generator.
  - Add a polling timer to generate/update InstrumentStatus objects and emit them over socket.io to `instrument-<id>` rooms and `dashboard-updates`.
  - Implement an endpoint `GET /api/monitoring/instruments` returning the latest statuses.
  - Files to edit: `gateway/server.js`
- Frontend:
  - Add `frontend/src/components/RealTimeDashboard.tsx` that connects to socket.io, subscribes to `subscribe-dashboard`, displays a table of instruments with lastSeen, temperature, isRunning, errorCount.
  - Add link from `App.tsx` to open the dashboard page.
  - Files to add/edit: `frontend/src/components/RealTimeDashboard.tsx`, `frontend/src/App.tsx` (small routing change).
- Tests:
  - Unit: simple function that formats InstrumentStatus for UI (Jest). Add test file `frontend/src/components/__tests__/RealTimeDashboard.test.tsx` mocking socket.io messages.
  - Integration: manual smoke test (browser shows rows updating every 2–5s).
- Verification commands:
  - Start gateway + frontend, open `http://localhost:3000/` and open dashboard page. Confirm statuses update.

Iteration 1 (safety & reliability)
- Add WebSocket auth token header validation in gateway (simple shared secret for MVP).
- Make mock telemetry realistic and add reconnect logic in frontend.
- Add a `GET /api/monitoring/dashboard` that aggregates counts (online/offline/alerts).
- File edits: `gateway/server.js`, `frontend/src/components/RealTimeDashboard.tsx`.

Iteration 2 (persistence & scaling)
- Persist last-known statuses in a simple SQLite DB (via services or gateway). Implement polling to instruments (replace mock generator) and a Redis adapter for socket.io for horizontal scaling.
- Add history API `GET /api/monitoring/instruments/:id/history?minutes=60`.
- Add charts in frontend (use charting lib already in project or a lightweight alternative).

Feature B: Remote Instrument Control
------------------------------------
MVP (demo mode, ~1-2 hours)
- Goal: Queue a command via gateway, simulate execution, and send back status updates. Provide a small UI control panel.
- Backend (gateway):
  - Implement `POST /api/control/instruments/:id/command` to validate basic schema, create an in-memory command object (ControlCommand), enqueue it, and return commandId.
  - Implement `executeCommandAsync` that sleeps for 1–3s, then sets status completed or failed (simulate random failures) and emits `command-update` over socket.io.
  - Files to edit: `gateway/server.js`
- Frontend:
  - Add `frontend/src/components/InstrumentControl.tsx` with temperature/pressure controls and start/stop buttons.
  - Connect to `command-update` socket events so the UI shows live progress.
  - Files to add/edit: `frontend/src/components/InstrumentControl.tsx`, small `App.tsx` integration.
- Tests:
  - Unit: validate command parameter validation logic.
  - Integration: manual CLI curl test for POST endpoint and manual UI test.
- Verification:
  - Send a POST to the control endpoint and watch socket event; or use the UI to send a command and observe completion.

Iteration 1 (safety)
- Add parameter validation (range checks) as in docs; add `requireAuth` middleware with a shared secret or JWT for MVP.
- Add an emergency-stop endpoint.

Iteration 2 (persistence & real integration)
- Persist commands in the DB, add retries and timeouts, integrate with real instrument API.
- Add audit logs and role-based access control.

Feature C: Log Collection & Anomaly Detection
--------------------------------------------
MVP (basic ingestion + simple anomaly) (~2–3 hours)
- Goal: Accept logs, store them, run a basic statistical anomaly detector (z-score), generate `anomaly_alert` when threshold exceeded.
- Backend (services):
  - Implement `POST /api/logs/collect` to write incoming logs to a SQLite DB (or in-memory list if SQLite not desired yet).
  - Implement a basic anomaly detector endpoint `POST /api/anomaly/detect` that examines recent numeric fields (temperature, errorCount) and returns alerts.
  - Emit alerts to gateway via an HTTP webhook `POST http://localhost:8081/api/alerts` (gateway will broadcast to clients).
  - Files to edit: `services/main.py` (implement DB writes and detection logic), optionally add `services/db.py`.
- Gateway:
  - Add `POST /api/alerts` to accept alerts and `io.emit('anomaly_alert', alert)`.
  - Files to edit: `gateway/server.js`.
- Frontend:
  - Add UI card in `RealTimeDashboard` that lists active alerts and shows severity/confidence.
- Tests:
  - Unit tests for anomaly function (z-score detection); integration tests for log ingestion to alert emission pipeline.
- Verification:
  - Post synthetic logs to `/api/logs/collect`, and verify dashboard receives `anomaly_alert` events.

Iteration 1 (ML)
- Train a small isolation forest model offline and add model serialization to `services/` for inference.
- Replace statistical detector with model inference.

Iteration 2 (production)
- Add streaming ingestion (Kafka/Rabbit), model retraining pipeline, and threshold tuning.

Feature D: Smart Diagnosis Assistant
------------------------------------
MVP (rule-based assistant, ~2–3 hours)
- Goal: Provide a `POST /api/diagnosis/analyze` that accepts symptoms + recent logs and returns probable causes using rules and historical matches.
- Backend (services):
  - Implement a rules engine (simple prioritized rules in code or YAML) that maps symptom patterns / error codes to causes and actions.
  - Use recent logs (from DB) to enrich the diagnosis and compute simple confidence scores.
  - Return `DiagnosisResult` shaped like `shared/types.ts`.
  - Files to edit: `services/main.py`.
- Frontend:
  - Add a simple Diagnosis panel in the dashboard that allows submitting a symptom and shows returned probable causes and recommended actions.
- Tests:
  - Unit tests for rule matching and confidence scoring.
- Verification:
  - Submit a sample diagnosis request and confirm returned actionable steps.

Iteration 1 (NLP + AI)
- Integrate a small LLM or local model (or call OpenAI if you have API keys) to parse free text symptoms and summarize logs.
- Add chain-of-thought-like explainability: show which logs and rules led to the conclusion.

Iteration 2 (KB + learning)
- Integrate a knowledge base (document store), similarity search, and allow the assistant to propose actions learned from past successful interventions.

Files to change (initial set)
-----------------------------
- gateway/server.js — implement real-time emitters, control command queue, alerts endpoint
- frontend/src/components/RealTimeDashboard.tsx — new component
- frontend/src/components/InstrumentControl.tsx — new component
- frontend/src/App.tsx — add navigation / route to dashboard/control
- services/main.py — implement log storage, anomaly detection, diagnosis rules
- connected-labs-platform/shared/types.ts — already contains types; update if needed

Testing
-------
- Add unit tests for each service function (anomaly detector, command validator, diagnosis rule matcher).
- Use Jest for frontend (add if missing) and pytest for Python services.

How I will proceed when you say "read the document"
----------------------------------------------------
- I will parse this roadmap and identify the next not-yet-implemented step for the chosen feature.
- I'll mark that step as in-progress in our todo list.
- I'll implement code, add tests, run the project's checks (typecheck/build/tests), and iterate until passing or until blocked by missing info (e.g., instrument API details or secrets).
- After finishing a step I'll update the roadmap and the todo list and provide a short progress summary and next suggested step.

Next actions
------------
- I completed the document and added it at `connected-labs-platform/docs/implementation-roadmap.md`.
- I'll now mark the roadmap task done in the todo list.

If this plan looks good, tell me: which feature and which iteration (MVP / Iteration 1 / Iteration 2) should I start implementing now?