from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
import uvicorn
import os

app = FastAPI(
    title="Connected Labs AI Services",
    description="AI-powered services for laboratory instrument monitoring and diagnostics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081"],  # Frontend and Gateway
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "connected-labs-ai-services",
        "version": "1.0.0"
    }

# Log Collection Service
@app.post("/api/logs/collect")
async def collect_logs(request: dict):
    """
    Collect logs from instruments and store in database
    Accepts single log or batch of logs
    """
    from database import insert_log, insert_logs_batch
    
    try:
        # Handle both single log and batch formats
        logs_to_insert = []
        
        if "logs" in request:
            # Batch format: {"logs": [...]}
            logs_to_insert = request["logs"]
        elif "id" in request and "instrument_id" in request:
            # Single log format
            logs_to_insert = [request]
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid format. Expected 'logs' array or single log object"}
            )
        
        # Insert logs into database
        inserted_count = insert_logs_batch(logs_to_insert)
        
        return {
            "success": True,
            "received_logs": len(logs_to_insert),
            "inserted_logs": inserted_count,
            "timestamp": datetime.now().isoformat(),
            "status": "logs_stored"
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to store logs: {str(e)}"}
        )


# Seed mock data endpoint
@app.post("/api/logs/seed-mock-data")
async def seed_mock_data(hours_back: int = 24, logs_per_hour: int = 20):
    """
    Seed database with mock historical logs for testing and demo
    """
    from mock_data_generator import generate_historical_logs, get_instrument_ids
    from database import insert_logs_batch, init_database
    
    try:
        # Initialize database if not exists
        init_database()
        
        # Generate mock logs
        logs = generate_historical_logs(
            hours_back=hours_back,
            logs_per_hour=logs_per_hour,
            anomaly_probability=0.05
        )
        
        # Insert into database
        inserted_count = insert_logs_batch(logs)
        
        instrument_ids = get_instrument_ids()
        
        return {
            "success": True,
            "generated_logs": len(logs),
            "inserted_logs": inserted_count,
            "instruments": instrument_ids,
            "hours_back": hours_back,
            "logs_per_hour": logs_per_hour,
            "timestamp": datetime.now().isoformat(),
            "message": "Mock data seeded successfully"
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to seed mock data: {str(e)}"}
        )


# Get logs endpoint
@app.get("/api/logs")
async def get_logs(
    instrument_id: Optional[str] = None,
    level: Optional[str] = None,
    limit: int = 100
):
    """
    Retrieve logs with optional filters
    """
    from database import get_recent_logs
    
    try:
        logs = get_recent_logs(
            instrument_id=instrument_id,
            level=level,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(logs),
            "logs": logs,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve logs: {str(e)}"}
        )

# Test endpoint to generate anomaly scenarios
@app.post("/api/logs/generate-anomaly-scenario")
async def generate_anomaly_scenario_endpoint(scenario: str = "temp_spike"):
    """
    Generate specific anomaly scenarios for testing
    Available scenarios: temp_spike, error_burst, sensor_failure
    """
    from mock_data_generator import generate_anomaly_scenario
    from database import insert_logs_batch, init_database
    
    try:
        # Initialize database if not exists
        init_database()
        
        # Generate anomaly scenario
        logs = generate_anomaly_scenario(scenario=scenario)
        
        # Insert into database
        inserted_count = insert_logs_batch(logs)
        
        return {
            "success": True,
            "scenario": scenario,
            "generated_logs": len(logs),
            "inserted_logs": inserted_count,
            "timestamp": datetime.now().isoformat(),
            "message": f"Anomaly scenario '{scenario}' generated successfully"
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate anomaly scenario: {str(e)}"}
        )


# Anomaly Detection Service
@app.post("/api/anomaly/detect")
async def detect_anomalies_endpoint(data: Optional[dict] = None):
    """
    Detect anomalies in instrument data using statistical methods
    Can analyze specific instrument or all instruments
    """
    import requests
    from database import get_recent_logs, insert_anomaly, init_database
    from anomaly_detector import detect_anomalies, analyze_instrument_health
    from mock_data_generator import get_instrument_ids
    
    try:
        # Initialize database if not exists
        init_database()
        
        # Determine which instruments to analyze
        instrument_ids = []
        if data and "instrument_id" in data:
            instrument_ids = [data["instrument_id"]]
        else:
            # Analyze all instruments
            instrument_ids = get_instrument_ids()
        
        all_anomalies = []
        health_reports = {}
        
        for instrument_id in instrument_ids:
            # Get recent logs for this instrument
            logs = get_recent_logs(
                instrument_id=instrument_id,
                limit=200  # Analyze last 200 logs
            )
            
            if not logs:
                continue
            
            # Run anomaly detection
            anomalies = detect_anomalies(logs)
            
            # Store detected anomalies in database
            for anomaly in anomalies:
                insert_anomaly(anomaly)
                all_anomalies.append(anomaly)
                
                # Send alert to gateway via webhook
                try:
                    gateway_url = os.getenv("GATEWAY_URL", "http://localhost:8081")
                    requests.post(
                        f"{gateway_url}/api/alerts",
                        json=anomaly,
                        timeout=2
                    )
                except Exception as webhook_error:
                    print(f"Failed to send alert to gateway: {webhook_error}")
            
            # Analyze health
            health = analyze_instrument_health(logs)
            health_reports[instrument_id] = health
        
        return {
            "success": True,
            "instruments_analyzed": len(instrument_ids),
            "anomalies_detected": len(all_anomalies),
            "anomalies": all_anomalies,
            "health_reports": health_reports,
            "timestamp": datetime.now().isoformat(),
            "detection_methods": ["temperature_anomaly", "error_burst", "rapid_change"]
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Anomaly detection failed: {str(e)}"}
        )

# Smart Diagnosis Service
@app.post("/api/diagnosis/analyze")
async def analyze_diagnosis(request: dict):
    """
    AI-powered diagnosis of instrument issues using rule-based engine
    Accepts symptoms, error codes, and analyzes recent logs
    """
    from diagnosis_engine import diagnose_instrument
    from database import get_recent_logs, init_database
    
    try:
        # Initialize database if not exists
        init_database()
        
        # Extract request parameters
        instrument_id = request.get("instrument_id")
        symptoms = request.get("symptoms", [])
        error_codes = request.get("error_codes", [])
        
        if not instrument_id:
            return JSONResponse(
                status_code=400,
                content={"error": "instrument_id is required"}
            )
        
        if not symptoms and not error_codes:
            return JSONResponse(
                status_code=400,
                content={"error": "At least one symptom or error code is required"}
            )
        
        # Get recent logs for this instrument
        recent_logs = get_recent_logs(
            instrument_id=instrument_id,
            limit=50
        )
        
        # Run diagnosis
        diagnosis = diagnose_instrument(
            instrument_id=instrument_id,
            symptoms=symptoms,
            error_codes=error_codes,
            recent_logs=recent_logs
        )
        
        return {
            "success": True,
            "diagnosis": diagnosis,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Diagnosis failed: {str(e)}"}
        )

# PLACEHOLDER: Analytics Service
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """
    PLACEHOLDER: Get analytics for dashboard
    """
    return {
        "placeholder": "Dashboard analytics will be implemented here",
        "features": [
            "Real-time KPI calculations",
            "Trend analysis and forecasting",
            "Performance benchmarking",
            "Alert summary and prioritization",
            "Resource utilization metrics"
        ],
        "overview": {
            "total_instruments": 0,
            "online_instruments": 0,
            "active_alerts": 0,
            "system_health_score": 0.0,
            "last_updated": datetime.now().isoformat()
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )