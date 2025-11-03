"""
Anomaly Detection Engine for Laboratory Instruments
Statistical and pattern-based anomaly detection algorithms
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import statistics


def calculate_z_score(value: float, mean: float, std_dev: float) -> float:
    """
    Calculate z-score for a value given mean and standard deviation
    
    Args:
        value: The value to calculate z-score for
        mean: Mean of the distribution
        std_dev: Standard deviation of the distribution
    
    Returns:
        Z-score (number of standard deviations from mean)
    """
    if std_dev == 0:
        return 0.0
    return abs(value - mean) / std_dev


def detect_temperature_anomaly(
    logs: List[Dict[str, Any]],
    threshold_z_score: float = 3.0
) -> Optional[Dict[str, Any]]:
    """
    Detect temperature anomalies using z-score method
    
    Args:
        logs: List of recent logs with temperature metadata
        threshold_z_score: Z-score threshold for anomaly (default 3.0)
    
    Returns:
        Anomaly alert dict if anomaly detected, None otherwise
    """
    # Extract temperature values
    temps = []
    for log in logs:
        metadata = log.get("metadata", {})
        if isinstance(metadata, dict) and "temperature" in metadata:
            temps.append(metadata["temperature"])
    
    if len(temps) < 5:
        # Not enough data points
        return None
    
    # Calculate mean and std dev
    mean_temp = statistics.mean(temps)
    std_temp = statistics.stdev(temps) if len(temps) > 1 else 0
    
    # Check most recent temperature
    latest_log = logs[-1]
    latest_metadata = latest_log.get("metadata", {})
    
    if not isinstance(latest_metadata, dict) or "temperature" not in latest_metadata:
        return None
    
    latest_temp = latest_metadata["temperature"]
    z_score = calculate_z_score(latest_temp, mean_temp, std_temp)
    
    if z_score > threshold_z_score:
        # Determine severity based on z-score
        if z_score > 5.0:
            severity = "critical"
        elif z_score > 4.0:
            severity = "high"
        elif z_score > 3.0:
            severity = "medium"
        else:
            severity = "low"
        
        # Determine if it's a spike or drop
        direction = "spike" if latest_temp > mean_temp else "drop"
        
        return {
            "id": str(uuid.uuid4()),
            "instrument_id": latest_log["instrument_id"],
            "timestamp": datetime.now().isoformat(),
            "severity": severity,
            "description": f"Temperature {direction} detected: {latest_temp:.2f}°C (mean: {mean_temp:.2f}°C, z-score: {z_score:.2f})",
            "confidence": min(z_score / 5.0, 1.0),  # Normalize confidence to 0-1
            "suggested_actions": [
                "Check temperature sensor calibration",
                "Verify HVAC system operation",
                "Inspect instrument cooling system" if direction == "spike" else "Check heating element",
                "Review recent maintenance logs"
            ],
            "anomaly_type": f"temperature_{direction}",
            "metrics": {
                "current_temp": latest_temp,
                "mean_temp": mean_temp,
                "std_temp": std_temp,
                "z_score": z_score
            }
        }
    
    return None


def detect_error_burst(
    logs: List[Dict[str, Any]],
    time_window_minutes: int = 10,
    error_threshold: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Detect bursts of error messages in a short time window
    
    Args:
        logs: List of recent logs
        time_window_minutes: Time window to check for errors
        error_threshold: Number of errors to trigger anomaly
    
    Returns:
        Anomaly alert dict if anomaly detected, None otherwise
    """
    if not logs:
        return None
    
    # Get recent errors within time window
    now = datetime.now()
    cutoff_time = now - timedelta(minutes=time_window_minutes)
    
    recent_errors = []
    for log in logs:
        if log["level"] == "error":
            log_time = datetime.fromisoformat(log["timestamp"])
            if log_time > cutoff_time:
                recent_errors.append(log)
    
    if len(recent_errors) >= error_threshold:
        # Determine severity
        if len(recent_errors) >= error_threshold * 3:
            severity = "critical"
        elif len(recent_errors) >= error_threshold * 2:
            severity = "high"
        else:
            severity = "medium"
        
        # Extract unique error messages
        error_messages = list(set([log["message"] for log in recent_errors]))
        
        latest_log = logs[-1]
        
        return {
            "id": str(uuid.uuid4()),
            "instrument_id": latest_log["instrument_id"],
            "timestamp": datetime.now().isoformat(),
            "severity": severity,
            "description": f"Error burst detected: {len(recent_errors)} errors in {time_window_minutes} minutes",
            "confidence": min(len(recent_errors) / (error_threshold * 3), 1.0),
            "suggested_actions": [
                "Review error logs for patterns",
                "Check instrument connectivity",
                "Restart instrument if safe to do so",
                "Contact technical support if errors persist",
                "Document error sequence for diagnostics"
            ],
            "anomaly_type": "error_burst",
            "metrics": {
                "error_count": len(recent_errors),
                "time_window_minutes": time_window_minutes,
                "unique_errors": len(error_messages),
                "error_messages": error_messages[:5]  # First 5 unique errors
            }
        }
    
    return None


def detect_rapid_metric_change(
    logs: List[Dict[str, Any]],
    metric_name: str = "temperature",
    change_threshold_percent: float = 30.0,
    time_window_minutes: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Detect rapid changes in a metric value
    
    Args:
        logs: List of recent logs
        metric_name: Name of metric to monitor
        change_threshold_percent: Percentage change threshold
        time_window_minutes: Time window to check
    
    Returns:
        Anomaly alert dict if anomaly detected, None otherwise
    """
    if len(logs) < 2:
        return None
    
    # Get metric values within time window
    now = datetime.now()
    cutoff_time = now - timedelta(minutes=time_window_minutes)
    
    recent_values = []
    for log in logs:
        log_time = datetime.fromisoformat(log["timestamp"])
        if log_time > cutoff_time:
            metadata = log.get("metadata", {})
            if isinstance(metadata, dict) and metric_name in metadata:
                recent_values.append({
                    "value": metadata[metric_name],
                    "timestamp": log["timestamp"]
                })
    
    if len(recent_values) < 2:
        return None
    
    # Calculate change between first and last value
    first_value = recent_values[0]["value"]
    last_value = recent_values[-1]["value"]
    
    if first_value == 0:
        return None
    
    percent_change = abs((last_value - first_value) / first_value * 100)
    
    if percent_change >= change_threshold_percent:
        # Determine severity
        if percent_change >= change_threshold_percent * 2:
            severity = "high"
        else:
            severity = "medium"
        
        direction = "increased" if last_value > first_value else "decreased"
        latest_log = logs[-1]
        
        return {
            "id": str(uuid.uuid4()),
            "instrument_id": latest_log["instrument_id"],
            "timestamp": datetime.now().isoformat(),
            "severity": severity,
            "description": f"Rapid {metric_name} change: {direction} {percent_change:.1f}% in {time_window_minutes} minutes",
            "confidence": min(percent_change / (change_threshold_percent * 2), 1.0),
            "suggested_actions": [
                f"Monitor {metric_name} closely",
                "Check for environmental factors",
                "Verify instrument stability",
                "Review recent configuration changes"
            ],
            "anomaly_type": f"rapid_{metric_name}_change",
            "metrics": {
                "metric_name": metric_name,
                "initial_value": first_value,
                "current_value": last_value,
                "percent_change": percent_change,
                "time_window_minutes": time_window_minutes
            }
        }
    
    return None


def detect_anomalies(
    logs: List[Dict[str, Any]],
    detection_methods: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Run multiple anomaly detection methods on logs
    
    Args:
        logs: List of logs to analyze
        detection_methods: List of methods to run (default: all)
    
    Returns:
        List of detected anomalies
    """
    if not logs:
        return []
    
    if detection_methods is None:
        detection_methods = ["temperature", "error_burst", "rapid_change"]
    
    anomalies = []
    
    # Temperature anomaly detection
    if "temperature" in detection_methods:
        temp_anomaly = detect_temperature_anomaly(logs)
        if temp_anomaly:
            anomalies.append(temp_anomaly)
    
    # Error burst detection
    if "error_burst" in detection_methods:
        error_anomaly = detect_error_burst(logs)
        if error_anomaly:
            anomalies.append(error_anomaly)
    
    # Rapid change detection
    if "rapid_change" in detection_methods:
        rapid_change = detect_rapid_metric_change(logs, metric_name="temperature")
        if rapid_change:
            anomalies.append(rapid_change)
    
    return anomalies


def analyze_instrument_health(logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze overall instrument health based on logs
    
    Args:
        logs: List of logs to analyze
    
    Returns:
        Health analysis report
    """
    if not logs:
        return {
            "status": "unknown",
            "score": 0,
            "message": "No logs available"
        }
    
    # Count log levels
    level_counts = {"info": 0, "warning": 0, "error": 0, "debug": 0}
    for log in logs:
        level = log.get("level", "info")
        level_counts[level] = level_counts.get(level, 0) + 1
    
    total_logs = len(logs)
    error_ratio = level_counts["error"] / total_logs if total_logs > 0 else 0
    warning_ratio = level_counts["warning"] / total_logs if total_logs > 0 else 0
    
    # Calculate health score (0-100)
    health_score = 100
    health_score -= error_ratio * 50  # Errors reduce score significantly
    health_score -= warning_ratio * 20  # Warnings reduce score moderately
    health_score = max(0, health_score)
    
    # Determine status
    if health_score >= 90:
        status = "excellent"
    elif health_score >= 75:
        status = "good"
    elif health_score >= 50:
        status = "fair"
    elif health_score >= 25:
        status = "poor"
    else:
        status = "critical"
    
    return {
        "status": status,
        "score": round(health_score, 1),
        "total_logs": total_logs,
        "error_count": level_counts["error"],
        "warning_count": level_counts["warning"],
        "error_ratio": round(error_ratio * 100, 2),
        "warning_ratio": round(warning_ratio * 100, 2),
        "message": f"Instrument health is {status} ({health_score:.1f}/100)"
    }


if __name__ == "__main__":
    # Test anomaly detector with mock data
    from mock_data_generator import generate_anomaly_scenario, generate_historical_logs
    
    print("Testing anomaly detection...")
    
    # Test temperature spike scenario
    print("\n1. Temperature Spike Scenario:")
    temp_spike_logs = generate_anomaly_scenario("temp_spike")
    anomalies = detect_anomalies(temp_spike_logs)
    print(f"Detected {len(anomalies)} anomalies")
    for anomaly in anomalies:
        print(f"  - {anomaly['severity'].upper()}: {anomaly['description']}")
        print(f"    Confidence: {anomaly['confidence']:.2f}")
    
    # Test error burst scenario
    print("\n2. Error Burst Scenario:")
    error_burst_logs = generate_anomaly_scenario("error_burst")
    anomalies = detect_anomalies(error_burst_logs)
    print(f"Detected {len(anomalies)} anomalies")
    for anomaly in anomalies:
        print(f"  - {anomaly['severity'].upper()}: {anomaly['description']}")
        print(f"    Confidence: {anomaly['confidence']:.2f}")
    
    # Test health analysis
    print("\n3. Health Analysis:")
    normal_logs = generate_historical_logs(hours_back=1, logs_per_hour=20, anomaly_probability=0.02)
    health = analyze_instrument_health(normal_logs)
    print(f"Health Status: {health['status'].upper()}")
    print(f"Health Score: {health['score']}/100")
    print(f"Errors: {health['error_count']}, Warnings: {health['warning_count']}")
