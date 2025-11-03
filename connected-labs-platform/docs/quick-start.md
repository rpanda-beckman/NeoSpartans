# Quick Start Guide

## Prerequisites Verification

Before starting, ensure you have:
- ✅ Node.js v24.11.0+
- ✅ npm 11.6.1+  
- ✅ Python 3.13.0+

## 1. Start the Gateway (Enhanced Proxy)

The gateway maintains **100% compatibility** with your existing frontend while providing enhanced features.

```bash
# Navigate to gateway directory
cd connected-labs-platform/gateway

# Install dependencies
npm install

# Start the server
npm start
```

**Expected output:**
```
Connected Labs Gateway running on http://localhost:8081/
✅ Legacy proxy compatibility maintained - existing frontend will work
🚧 Enhanced features ready for implementation
```

## 2. Test with Your Current Frontend

Your existing network scanner should work immediately:

1. **Start your current frontend** (from the original `src` folder)
2. **Open browser** to your frontend URL
3. **Click "Scan Network"** - it should work exactly as before
4. **Test API calls** - they should work exactly as before

The enhanced gateway acts as a **drop-in replacement** for your original `proxy.js`.

## 3. Start the New React Frontend (Optional)

To see the enhanced UI:

```bash
# Navigate to frontend directory  
cd connected-labs-platform/frontend

# Install dependencies
npm install

# Start the React app
npm start
```

**Browser opens to:** http://localhost:3000

## 4. Start AI Services (Placeholder)

```bash
# Navigate to services directory
cd connected-labs-platform/services

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn main:app --reload --port 8000
```

**API documentation:** http://localhost:8000/docs

## 5. Verify Everything Works

### Test Current Functionality
1. ✅ Network scanning finds instruments
2. ✅ API calls work for discovered instruments  
3. ✅ CORS proxy handles cross-origin requests

### Test Enhanced Features
1. 🚧 Visit http://localhost:8081/health (should return gateway status)
2. 🚧 Check http://localhost:8000/health (should return AI services status)
3. 🚧 Visit http://localhost:8000/docs (should show API documentation)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Gateway       │    │   AI Services   │
│                 │    │                 │    │                 │
│ React Dashboard │◄──►│ Enhanced Proxy  │◄──►│ FastAPI + ML    │
│ (Port 3000)     │    │ + WebSockets    │    │ (Port 8000)     │
│                 │    │ (Port 8081)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                         ┌─────────────────┐
                         │   Instruments   │
                         │   (Port 8080)   │
                         └─────────────────┘
```

## Troubleshooting

### Gateway Issues
- **Port 8081 in use**: Change PORT in `gateway/.env`
- **npm install fails**: Verify Node.js and npm are installed correctly
- **CORS errors**: Check frontend URL in gateway configuration

### Frontend Issues  
- **React app won't start**: Ensure all dependencies are installed
- **Build fails**: Check TypeScript errors and fix if needed
- **API calls fail**: Verify gateway is running on port 8081

### AI Services Issues
- **Python module not found**: Run `pip install -r requirements.txt`
- **FastAPI won't start**: Check Python version and dependencies
- **Import errors**: Verify all required packages are installed

## What's Working vs What's Placeholder

### ✅ Working Now (Same as before)
- Network scanning for instruments
- API testing with discovered instruments
- CORS proxy for cross-origin requests
- Enhanced UI with modern styling

### 🚧 Ready for Implementation
- Real-time monitoring dashboard
- Remote instrument control
- Log collection & anomaly detection  
- Smart diagnosis assistant
- WebSocket real-time updates
- Database integration

## Next Steps

1. **Verify current functionality** works in new architecture
2. **Choose first feature** to implement (recommend real-time monitoring)
3. **Follow implementation guides** in `/docs` folder
4. **Test thoroughly** before adding next feature

## Support

- **Implementation guides**: See `/docs` folder
- **API documentation**: http://localhost:8000/docs (when services running)
- **Health checks**: 
  - Gateway: http://localhost:8081/health
  - AI Services: http://localhost:8000/health