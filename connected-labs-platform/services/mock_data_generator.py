"""
Mock Data Generator for Laboratory Instrument Logs
Generates realistic log data with normal patterns and injected anomalies
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json


# Instrument configurations
INSTRUMENT_CONFIGS = [
    {
        "id": "thermocycler-01",
        "model": "BioRad CFX96",
        "type": "thermocycler",
        "normal_temp_range": (20, 95),
        "normal_temp_mean": 55,
        "normal_temp_std": 15,
    },
    {
        "id": "centrifuge-01",
        "model": "Eppendorf 5424R",
        "type": "centrifuge",
        "normal_temp_range": (4, 25),
        "normal_temp_mean": 15,
        "normal_temp_std": 5,
    },
    {
        "id": "spectrometer-01",
        "model": "NanoDrop 2000",
        "type": "spectrometer",
        "normal_temp_range": (18, 28),
        "normal_temp_mean": 23,
        "normal_temp_std": 2,
    },
    {
        "id": "incubator-01",
        "model": "Thermo Scientific Heracell",
        "type": "incubator",
        "normal_temp_range": (35, 39),
        "normal_temp_mean": 37,
        "normal_temp_std": 0.5,
    },
    {
        "id": "avanti-centrifuge-01",
        "model": "Beckman Coulter Avanti J-26S XP",
        "type": "avanti_centrifuge",
        "normal_temp_range": (2, 25),
        "normal_temp_mean": 4,
        "normal_temp_std": 3,
    },
]

# Log message templates
LOG_MESSAGES = {
    "info": [
        "System initialization complete",
        "Routine self-check passed",
        "Temperature stabilized",
        "Run cycle started",
        "Run cycle completed successfully",
        "Calibration verified",
        "Data export completed",
        "Connection established",
        "Status update: Operating normally",
        "Maintenance check completed",
    ],
    "warning": [
        "Temperature approaching upper limit",
        "Minor calibration drift detected",
        "Network latency detected",
        "Maintenance due in 7 days",
        "Consumable level low",
        "Unusual vibration detected",
        "Power fluctuation detected",
        "Door opened during run",
        "Sample temperature variation",
        "Communication timeout recovered",
    ],
    "error": [
        "Temperature sensor malfunction",
        "Run aborted due to system error",
        "Communication failure with controller",
        "Critical error: Emergency shutdown",
        "Hardware fault detected",
        "Sample contamination detected",
        "Calibration failed",
        "Power supply error",
        "Fan failure detected",
        "Data corruption detected",
    ],
    "debug": [
        "Diagnostic mode enabled",
        "Reading sensor values",
        "Updating firmware parameters",
        "Cache cleared",
        "Debug trace: Protocol step 3",
    ],
}


def generate_log_entry(
    instrument_id: str,
    timestamp: datetime,
    level: Optional[str] = None,
    force_anomaly: bool = False,
    anomaly_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a single log entry for an instrument
    
    Args:
        instrument_id: ID of the instrument
        timestamp: Timestamp for the log entry
        level: Force specific log level (info, warning, error, debug)
        force_anomaly: Force an anomalous log entry
        anomaly_type: Type of anomaly (temp_spike, error_burst, etc.)
    
    Returns:
        Dictionary representing a log entry
    """
    # Find instrument config
    instrument = next((i for i in INSTRUMENT_CONFIGS if i["id"] == instrument_id), INSTRUMENT_CONFIGS[0])
    
    # Determine log level
    if level is None:
        if force_anomaly:
            level = random.choice(["warning", "error", "error"])  # Bias toward error
        else:
            # Normal distribution: 70% info, 20% warning, 8% error, 2% debug
            level = random.choices(
                ["info", "warning", "error", "debug"],
                weights=[70, 20, 8, 2]
            )[0]
    
    # Select message
    message = random.choice(LOG_MESSAGES[level])
    
    # Generate metadata
    metadata: Dict[str, Any] = {
        "instrument_model": instrument["model"],
        "instrument_type": instrument["type"],
    }
    
    # Add temperature reading
    if force_anomaly and anomaly_type == "temp_spike":
        # Temperature anomaly: spike way above normal
        temp = instrument["normal_temp_range"][1] + random.uniform(10, 30)
        metadata["temperature"] = round(temp, 2)
        metadata["anomaly_injected"] = "temp_spike"
    elif force_anomaly and anomaly_type == "temp_drop":
        # Temperature anomaly: drop way below normal
        temp = instrument["normal_temp_range"][0] - random.uniform(5, 15)
        metadata["temperature"] = round(temp, 2)
        metadata["anomaly_injected"] = "temp_drop"
    else:
        # Normal temperature with noise
        temp = random.gauss(instrument["normal_temp_mean"], instrument["normal_temp_std"])
        temp = max(instrument["normal_temp_range"][0], min(instrument["normal_temp_range"][1], temp))
        metadata["temperature"] = round(temp, 2)
    
    # Add other metrics
    metadata["pressure"] = round(random.gauss(1.0, 0.1), 3)  # bar
    metadata["humidity"] = round(random.gauss(50, 10), 1)  # %
    
    # Add error count for this session
    if level == "error":
        metadata["error_code"] = f"ERR_{random.randint(100, 999)}"
    
    return {
        "id": str(uuid.uuid4()),
        "instrument_id": instrument_id,
        "timestamp": timestamp.isoformat(),
        "level": level,
        "message": message,
        "metadata": metadata,
    }


def generate_historical_logs(
    hours_back: int = 24,
    logs_per_hour: int = 20,
    anomaly_probability: float = 0.05
) -> List[Dict[str, Any]]:
    """
    Generate historical log data for all instruments
    
    Args:
        hours_back: Number of hours of history to generate
        logs_per_hour: Average number of logs per hour per instrument
        anomaly_probability: Probability of injecting an anomaly
    
    Returns:
        List of log entries sorted by timestamp
    """
    logs = []
    now = datetime.now()
    
    for instrument in INSTRUMENT_CONFIGS:
        instrument_id = instrument["id"]
        
        # Generate logs going backwards in time
        for hour in range(hours_back):
            timestamp_base = now - timedelta(hours=hour)
            
            # Generate logs for this hour
            for _ in range(random.randint(logs_per_hour - 5, logs_per_hour + 5)):
                # Random minute/second within the hour
                timestamp = timestamp_base - timedelta(
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                # Decide if this should be an anomaly
                force_anomaly = random.random() < anomaly_probability
                anomaly_type = None
                
                if force_anomaly:
                    anomaly_type = random.choice(["temp_spike", "temp_drop", "error_burst"])
                
                log = generate_log_entry(
                    instrument_id=instrument_id,
                    timestamp=timestamp,
                    force_anomaly=force_anomaly,
                    anomaly_type=anomaly_type
                )
                logs.append(log)
    
    # Sort by timestamp
    logs.sort(key=lambda x: x["timestamp"])
    
    return logs


def generate_realtime_log_batch(count: int = 10) -> List[Dict[str, Any]]:
    """
    Generate a batch of recent logs for real-time testing
    
    Args:
        count: Number of logs to generate
    
    Returns:
        List of recent log entries
    """
    logs = []
    now = datetime.now()
    
    for _ in range(count):
        # Pick random instrument
        instrument = random.choice(INSTRUMENT_CONFIGS)
        
        # Generate timestamp within last few minutes
        timestamp = now - timedelta(seconds=random.randint(0, 300))
        
        # Small chance of anomaly
        force_anomaly = random.random() < 0.1
        anomaly_type = random.choice(["temp_spike", "temp_drop"]) if force_anomaly else None
        
        log = generate_log_entry(
            instrument_id=instrument["id"],
            timestamp=timestamp,
            force_anomaly=force_anomaly,
            anomaly_type=anomaly_type
        )
        logs.append(log)
    
    logs.sort(key=lambda x: x["timestamp"])
    return logs


def generate_anomaly_scenario(scenario: str = "temp_spike", instrument_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate a specific anomaly scenario for testing
    
    Args:
        scenario: Type of scenario (temp_spike, error_burst, sensor_failure)
        instrument_id: Specific instrument ID to generate anomalies for
    
    Returns:
        List of log entries demonstrating the anomaly
    """
    logs = []
    now = datetime.now()
    
    # Use specified instrument or default to first one
    if instrument_id:
        instrument = get_instrument_config(instrument_id)
        if not instrument:
            # If instrument not found, use first one
            instrument = INSTRUMENT_CONFIGS[0]
    else:
        instrument = INSTRUMENT_CONFIGS[0]  # Use first instrument
    
    if scenario == "temp_spike":
        # Generate 10 logs showing temperature gradually spiking
        for i in range(10):
            timestamp = now - timedelta(minutes=10 - i)
            log = generate_log_entry(
                instrument_id=instrument["id"],
                timestamp=timestamp,
                level="warning" if i < 7 else "error",
                force_anomaly=i >= 7,
                anomaly_type="temp_spike"
            )
            logs.append(log)
    
    elif scenario == "error_burst":
        # Generate burst of errors in short time
        for i in range(15):
            timestamp = now - timedelta(seconds=60 - i * 4)
            log = generate_log_entry(
                instrument_id=instrument["id"],
                timestamp=timestamp,
                level="error",
                force_anomaly=True
            )
            logs.append(log)
    
    elif scenario == "sensor_failure":
        # Simulate sensor reading failures
        for i in range(8):
            timestamp = now - timedelta(minutes=8 - i)
            log = generate_log_entry(
                instrument_id=instrument["id"],
                timestamp=timestamp,
                level="error" if i >= 5 else "warning",
                force_anomaly=True
            )
            log["message"] = "Temperature sensor malfunction" if i >= 5 else "Temperature sensor reading unstable"
            logs.append(log)
    
    return logs


def get_instrument_ids() -> List[str]:
    """Get list of all instrument IDs"""
    return [inst["id"] for inst in INSTRUMENT_CONFIGS]


def get_instrument_config(instrument_id: str) -> Optional[Dict[str, Any]]:
    """Get configuration for a specific instrument"""
    return next((i for i in INSTRUMENT_CONFIGS if i["id"] == instrument_id), None)


if __name__ == "__main__":
    # Test the generator
    print("Generating sample historical logs...")
    historical = generate_historical_logs(hours_back=2, logs_per_hour=10)
    print(f"Generated {len(historical)} historical logs")
    
    print("\nSample logs:")
    for log in historical[:5]:
        print(f"  [{log['timestamp']}] {log['level'].upper()}: {log['message']}")
        print(f"    Instrument: {log['instrument_id']}, Temp: {log['metadata'].get('temperature')}°C")
    
    print("\nGenerating anomaly scenario (temp_spike)...")
    anomaly_logs = generate_anomaly_scenario("temp_spike")
    print(f"Generated {len(anomaly_logs)} anomaly logs")
    for log in anomaly_logs[-3:]:
        print(f"  [{log['timestamp']}] {log['level'].upper()}: {log['message']}")
        print(f"    Temp: {log['metadata'].get('temperature')}°C")
