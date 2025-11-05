# Vi-CELL BLU API Integration Guide

## Overview
This document describes the Vi-CELL BLU REST API endpoints integrated into the Connected Labs Platform Gateway. These endpoints follow the same proxy pattern as the existing DataService implementation.

## Architecture
```
Frontend → Gateway (localhost:8081) → Vi-CELL BLU Instrument (IP:8080)
```

## API Endpoints

### 1. Get System Information
**Endpoint**: `GET /api/vi-cell/system-info/:instrumentId`

**Description**: Retrieves instrument system information including model, serial number, and software version.

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/system-info/10.122.72.15
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "systemInfo": {
    "model": "Vi-CELL BLU",
    "serialNumber": "VCBL-12345",
    "softwareVersion": "2.04.0",
    "firmwareVersion": "1.2.3",
    "instrumentName": "ViCell-Lab1",
    "ipAddress": "10.122.72.15"
  },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### 2. Get Instrument Status
**Endpoint**: `GET /api/vi-cell/status/:instrumentId`

**Description**: Gets the current status of the Vi-CELL BLU instrument.

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/status/10.122.72.15
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "status": {
    "status": "idle",
    "currentSample": null,
    "queueLength": 0,
    "lastAnalysisTime": "2025-11-04T10:25:00Z",
    "temperature": 37.0,
    "cellCount": 0,
    "errors": []
  },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

**Status Values**:
- `idle` - Instrument ready for analysis
- `running` - Currently analyzing a sample
- `error` - Error state, check errors array
- `maintenance` - In maintenance mode

---

### 3. Get Recent Results
**Endpoint**: `GET /api/vi-cell/results/recent/:instrumentId?limit=10`

**Description**: Retrieves recent analysis results from the instrument.

**Query Parameters**:
- `limit` (optional): Number of results to return (default: 10)

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/results/recent/10.122.72.15?limit=5
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "results": [
    {
      "sampleId": "SAMPLE_001",
      "timestamp": "2025-11-04T10:25:00Z",
      "viability": 95.3,
      "totalCells": 1250000,
      "viableCells": 1191250,
      "diameter": 15.2,
      "concentration": 1.25e6,
      "cellType": "CHO"
    },
    {
      "sampleId": "SAMPLE_002",
      "timestamp": "2025-11-04T10:15:00Z",
      "viability": 92.1,
      "totalCells": 980000,
      "viableCells": 902580,
      "diameter": 14.8,
      "concentration": 9.8e5,
      "cellType": "CHO"
    }
  ],
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### 4. Get Sample Status
**Endpoint**: `GET /api/vi-cell/sample/:instrumentId/:sampleId/status`

**Description**: Gets the status of a specific sample analysis.

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/sample/10.122.72.15/SAMPLE_001/status
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "sampleId": "SAMPLE_001",
  "sampleStatus": {
    "status": "completed",
    "progress": 100,
    "startTime": "2025-11-04T10:20:00Z",
    "endTime": "2025-11-04T10:25:00Z",
    "error": null
  },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### 5. Get Sample Results
**Endpoint**: `GET /api/vi-cell/sample/:instrumentId/:sampleId/results`

**Description**: Gets the detailed results for a specific sample.

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/sample/10.122.72.15/SAMPLE_001/results
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "sampleId": "SAMPLE_001",
  "sampleResults": {
    "sampleId": "SAMPLE_001",
    "timestamp": "2025-11-04T10:25:00Z",
    "viability": 95.3,
    "totalCells": 1250000,
    "viableCells": 1191250,
    "nonViableCells": 58750,
    "diameter": 15.2,
    "concentration": 1.25e6,
    "cellType": "CHO",
    "dilution": 1,
    "washType": "normal",
    "images": [
      {
        "imageId": "IMG_001",
        "url": "/api/vi-cell/sample/10.122.72.15/SAMPLE_001/image/1"
      }
    ]
  },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

---

### 6. Start Sample Analysis
**Endpoint**: `POST /api/vi-cell/sample/:instrumentId/analyze`

**Description**: Initiates a new sample analysis on the Vi-CELL BLU.

**Request Body**:
```json
{
  "sampleId": "SAMPLE_003",
  "cellType": "CHO",
  "dilution": 1,
  "washType": "normal"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:8081/api/vi-cell/sample/10.122.72.15/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "sampleId": "SAMPLE_003",
    "cellType": "CHO",
    "dilution": 1,
    "washType": "normal"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "sampleId": "SAMPLE_003",
  "analysisStatus": {
    "status": "queued",
    "queuePosition": 1,
    "estimatedStartTime": "2025-11-04T10:32:00Z"
  },
  "statusCode": 200,
  "message": "Analysis started for sample SAMPLE_003",
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

**Parameters**:
- `sampleId` (required): Unique identifier for the sample
- `cellType` (optional): Type of cell being analyzed (default: "default")
- `dilution` (optional): Dilution factor (default: 1)
- `washType` (optional): Wash type - "normal", "fast", "thorough" (default: "normal")

---

### 7. Get Analysis Queue
**Endpoint**: `GET /api/vi-cell/queue/:instrumentId`

**Description**: Gets the current analysis queue for the instrument.

**Example Request**:
```bash
curl http://localhost:8081/api/vi-cell/queue/10.122.72.15
```

**Example Response**:
```json
{
  "success": true,
  "instrumentIp": "10.122.72.15",
  "queue": {
    "queueLength": 2,
    "currentSample": {
      "sampleId": "SAMPLE_003",
      "status": "running",
      "progress": 45,
      "startTime": "2025-11-04T10:30:00Z"
    },
    "pendingSamples": [
      {
        "sampleId": "SAMPLE_004",
        "queuePosition": 1,
        "estimatedStartTime": "2025-11-04T10:35:00Z"
      }
    ]
  },
  "statusCode": 200,
  "timestamp": "2025-11-04T10:31:00.000Z"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Failed to get status",
  "message": "connect ECONNREFUSED 10.122.72.15:8080",
  "timestamp": "2025-11-04T10:30:00.000Z"
}
```

**Common Error Codes**:
- `400` - Invalid parameters or instrument ID format
- `404` - Resource not found (sample, result, etc.)
- `500` - Internal server error or connection failure
- `503` - Instrument not available

---

## Integration with Frontend

### TypeScript/React Example

```typescript
// Fetch Vi-CELL BLU system info
const getViCellInfo = async (instrumentIp: string) => {
  try {
    const response = await fetch(
      `http://localhost:8081/api/vi-cell/system-info/${instrumentIp}`
    );
    const data = await response.json();
    
    if (data.success) {
      console.log('Model:', data.systemInfo.model);
      console.log('Serial:', data.systemInfo.serialNumber);
      return data.systemInfo;
    }
  } catch (error) {
    console.error('Failed to get Vi-CELL info:', error);
  }
};

// Start analysis
const startAnalysis = async (instrumentIp: string, sampleId: string) => {
  try {
    const response = await fetch(
      `http://localhost:8081/api/vi-cell/sample/${instrumentIp}/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sampleId,
          cellType: 'CHO',
          dilution: 1,
          washType: 'normal'
        })
      }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to start analysis:', error);
  }
};

// Poll for status updates
const pollStatus = async (instrumentIp: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8081/api/vi-cell/status/${instrumentIp}`
    );
    const data = await response.json();
    
    if (data.success) {
      console.log('Status:', data.status.status);
      
      if (data.status.status === 'completed') {
        clearInterval(interval);
        // Fetch results
      }
    }
  }, 5000); // Poll every 5 seconds
};
```

---

## Testing

### 1. Test System Info
```bash
curl http://localhost:8081/api/vi-cell/system-info/10.122.72.15
```

### 2. Test Status
```bash
curl http://localhost:8081/api/vi-cell/status/10.122.72.15
```

### 3. Test Recent Results
```bash
curl "http://localhost:8081/api/vi-cell/results/recent/10.122.72.15?limit=5"
```

### 4. Test Start Analysis
```bash
curl -X POST http://localhost:8081/api/vi-cell/sample/10.122.72.15/analyze \
  -H "Content-Type: application/json" \
  -d '{"sampleId":"TEST_001","cellType":"CHO"}'
```

### 5. Test Queue
```bash
curl http://localhost:8081/api/vi-cell/queue/10.122.72.15
```

---

## Real-Time Monitoring Setup

For real-time monitoring, you can poll the status endpoint every 5-10 seconds:

```javascript
// In your React component
useEffect(() => {
  const pollInterval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8081/api/vi-cell/status/${instrumentId}`
    );
    const data = await response.json();
    
    if (data.success) {
      setInstrumentStatus(data.status);
    }
  }, 5000); // Poll every 5 seconds
  
  return () => clearInterval(pollInterval);
}, [instrumentId]);
```

---

## Network Discovery

To discover Vi-CELL BLU instruments on your network:

```typescript
const scanForViCellInstruments = async (ipRange: string[]) => {
  const promises = ipRange.map(async (ip) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/vi-cell/system-info/${ip}`,
        { timeout: 2000 }
      );
      
      const data = await response.json();
      
      if (data.success && data.systemInfo.model === 'Vi-CELL BLU') {
        return {
          ip,
          model: data.systemInfo.model,
          serialNumber: data.systemInfo.serialNumber,
          id: `${ip}-${Date.now()}`,
          type: 'vi-cell-blu'
        };
      }
    } catch (error) {
      // Instrument not found at this IP
    }
    
    return null;
  });
  
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
};
```

---

## Next Steps

1. ✅ **Gateway endpoints implemented**
2. 🚧 Create frontend components for Vi-CELL monitoring
3. 🚧 Add WebSocket support for real-time updates
4. 🚧 Implement anomaly detection for cell viability
5. 🚧 Add database storage for historical results
6. 🚧 Create dashboard visualizations

---

## Notes

- All endpoints use the same IP extraction logic as existing DataService endpoints
- Instrument ID format: `{ip}` or `{ip}-{timestamp}`
- Default port for Vi-CELL BLU is 8080
- Responses include timestamps for tracking
- All endpoints include proper error handling and logging
