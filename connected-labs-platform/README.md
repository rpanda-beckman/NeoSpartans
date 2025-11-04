# Connected Labs Platform

A hybrid Node.js + FastAPI platform for laboratory instrument monitoring, control, and AI-powered diagnostics.

## Architecture

```
connected-labs-platform/
├── frontend/          # React dashboard
├── gateway/           # Node.js API gateway with WebSocket support
├── services/          # FastAPI microservices for AI/ML
├── shared/           # Common types and interfaces
└── docs/             # Documentation and implementation guides
```

## Current Features (Working)

- ✅ Network scanning for laboratory instruments
- ✅ API testing and instrument communication
- ✅ CORS proxy for cross-origin requests

## Planned Features (Placeholders Ready)

- 🚧 Real-time monitoring dashboard
- 🚧 Remote instrument control
- 🚧 Log collection & anomaly detection
- 🚧 Smart diagnosis assistant

## Prerequisites

- Node.js v24.11.0+ ✅
- npm 11.6.1+ ✅
- Python 3.13.0+ ✅

## Quick Start

1. **Start Gateway Server:**
   ```bash
   cd gateway
   npm install
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Start AI Services (Future):**
   ```bash
   cd services
   pip install -r requirements.txt
   pip install fastapi uvicorn requests
   uvicorn main:app --reload
   ```

## Development

Each component is designed to work independently and can be developed/deployed separately.

See `/docs` for detailed implementation guides for each planned feature.