# Vi-CELL BLU API Quick Reference

## 🚀 Quick Start

### 1. Start the Gateway
```bash
cd gateway
npm start
```
Gateway runs on: `http://localhost:8081`

### 2. Test the APIs
```bash
cd gateway
node test-vi-cell-api.js
```

---

## 📡 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vi-cell/system-info/:id` | GET | Get system information |
| `/api/vi-cell/status/:id` | GET | Get current status |
| `/api/vi-cell/results/recent/:id` | GET | Get recent results |
| `/api/vi-cell/queue/:id` | GET | Get analysis queue |
| `/api/vi-cell/sample/:id/:sampleId/status` | GET | Get sample status |
| `/api/vi-cell/sample/:id/:sampleId/results` | GET | Get sample results |
| `/api/vi-cell/sample/:id/analyze` | POST | Start analysis |

**Note**: `:id` = instrument IP (e.g., `10.122.72.15`)

---

## 🧪 Quick Test Commands

### Get System Info
```bash
curl http://localhost:8081/api/vi-cell/system-info/10.122.72.15
```

### Get Status
```bash
curl http://localhost:8081/api/vi-cell/status/10.122.72.15
```

### Get Recent Results
```bash
curl "http://localhost:8081/api/vi-cell/results/recent/10.122.72.15?limit=5"
```

### Start Analysis
```bash
curl -X POST http://localhost:8081/api/vi-cell/sample/10.122.72.15/analyze \
  -H "Content-Type: application/json" \
  -d '{"sampleId":"TEST_001","cellType":"CHO","dilution":1}'
```

---

## 📊 Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "data": { /* endpoint-specific data */ },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

## 🔧 Frontend Integration

### Fetch Status
```typescript
const response = await fetch(
  `http://localhost:8081/api/vi-cell/status/${instrumentIp}`
);
const data = await response.json();
console.log(data.status);
```

### Poll for Updates
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8081/api/vi-cell/status/${instrumentIp}`
    );
    const data = await response.json();
    if (data.success) {
      setStatus(data.status);
    }
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, [instrumentIp]);
```

---

## 📝 Cell Viability Data

Key metrics from Vi-CELL BLU:

- **Viability**: Percentage of live cells (0-100%)
- **Total Cells**: Total cell count
- **Viable Cells**: Number of live cells
- **Diameter**: Average cell diameter (μm)
- **Concentration**: Cells per mL

---

## 🎯 Next Steps

1. ✅ Test endpoints with your Vi-CELL BLU
2. 🚧 Create frontend monitoring component
3. 🚧 Add real-time WebSocket updates
4. 🚧 Implement anomaly detection
5. 🚧 Store results in database

---

## 📚 Full Documentation

See: `docs/vi-cell-blu-api.md`
