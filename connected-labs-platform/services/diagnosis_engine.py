"""
Smart Diagnosis Engine for Laboratory Instruments
Rule-based system for diagnosing instrument issues based on symptoms and log patterns
"""

import uuid
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter


# Comprehensive rule set for instrument diagnosis
DIAGNOSIS_RULES = [
    {
        "id": "rule_temp_spike",
        "symptoms": ["temperature", "high", "spike", "overheating", "hot"],
        "error_codes": ["E001", "TEMP_HIGH", "OVERHEAT"],
        "log_patterns": [r"temperature.*exceed", r"cooling.*fail", r"overheat", r"temp.*high"],
        "probable_causes": [
            {
                "cause": "Cooling system malfunction",
                "probability": 0.85,
                "description": "HVAC or internal fan failure preventing proper heat dissipation"
            },
            {
                "cause": "Ambient temperature too high",
                "probability": 0.70,
                "description": "Room temperature exceeds instrument specifications"
            },
            {
                "cause": "Temperature sensor calibration drift",
                "probability": 0.65,
                "description": "Sensor providing inaccurate readings"
            }
        ],
        "recommended_actions": [
            "Check cooling fan operation and clean dust filters",
            "Verify HVAC system is running and set correctly",
            "Inspect temperature sensor calibration",
            "Review room temperature conditions",
            "Check for blocked air vents"
        ],
        "urgency": "high"
    },
    {
        "id": "rule_temp_drop",
        "symptoms": ["temperature", "low", "cold", "freezing", "drop"],
        "error_codes": ["E002", "TEMP_LOW"],
        "log_patterns": [r"temperature.*below", r"heating.*fail", r"temp.*low"],
        "probable_causes": [
            {
                "cause": "Heating element failure",
                "probability": 0.80,
                "description": "Primary heating system not functioning"
            },
            {
                "cause": "Power supply issue",
                "probability": 0.70,
                "description": "Insufficient power to heating elements"
            }
        ],
        "recommended_actions": [
            "Inspect heating element operation",
            "Check power supply connections",
            "Verify temperature controller settings",
            "Test heating element resistance"
        ],
        "urgency": "medium"
    },
    {
        "id": "rule_error_burst",
        "symptoms": ["repeated errors", "frequent failures", "error burst", "multiple errors", "many errors"],
        "error_codes": ["E003", "E004", "COMM_ERROR"],
        "log_patterns": [r"error.*repeated", r"communication.*timeout", r"failed.*attempts"],
        "probable_causes": [
            {
                "cause": "Communication protocol failure",
                "probability": 0.75,
                "description": "Network or serial communication issues"
            },
            {
                "cause": "Firmware bug or corruption",
                "probability": 0.65,
                "description": "Software malfunction requiring restart or update"
            },
            {
                "cause": "Hardware interface failure",
                "probability": 0.60,
                "description": "Faulty communication port or cable"
            }
        ],
        "recommended_actions": [
            "Restart instrument to clear error state",
            "Check network connectivity and cables",
            "Update firmware to latest version",
            "Run instrument diagnostic tests",
            "Contact technical support if persists"
        ],
        "urgency": "medium"
    },
    {
        "id": "rule_calibration_drift",
        "symptoms": ["inaccurate", "calibration", "drift", "offset", "readings wrong"],
        "error_codes": ["E005", "CAL_FAIL", "ACCURACY"],
        "log_patterns": [r"calibration.*fail", r"accuracy.*low", r"drift.*detect"],
        "probable_causes": [
            {
                "cause": "Sensor calibration expired",
                "probability": 0.85,
                "description": "Sensors need recalibration per maintenance schedule"
            },
            {
                "cause": "Environmental factors",
                "probability": 0.70,
                "description": "Temperature, humidity, or pressure affecting readings"
            },
            {
                "cause": "Sensor degradation",
                "probability": 0.60,
                "description": "Physical wear or contamination of sensors"
            }
        ],
        "recommended_actions": [
            "Perform full system calibration",
            "Clean all sensors",
            "Verify environmental conditions are stable",
            "Check calibration standards are within spec",
            "Replace worn sensors if necessary"
        ],
        "urgency": "medium"
    },
    {
        "id": "rule_communication_failure",
        "symptoms": ["not responding", "connection lost", "timeout", "no response", "offline"],
        "error_codes": ["E006", "TIMEOUT", "NO_RESPONSE"],
        "log_patterns": [r"timeout", r"connection.*lost", r"no.*response", r"offline"],
        "probable_causes": [
            {
                "cause": "Network connectivity issue",
                "probability": 0.80,
                "description": "Network cable, switch, or router problem"
            },
            {
                "cause": "Instrument powered off or crashed",
                "probability": 0.75,
                "description": "Instrument in error state or power failure"
            },
            {
                "cause": "Firewall or network configuration",
                "probability": 0.60,
                "description": "Security settings blocking communication"
            }
        ],
        "recommended_actions": [
            "Check instrument power and status LEDs",
            "Verify network cable connections",
            "Test network connectivity with ping",
            "Check firewall and network settings",
            "Restart instrument and network equipment"
        ],
        "urgency": "high"
    },
    {
        "id": "rule_mechanical_failure",
        "symptoms": ["noise", "vibration", "stuck", "jammed", "mechanical"],
        "error_codes": ["E007", "MECH_ERROR", "MOTOR_FAIL"],
        "log_patterns": [r"motor.*fail", r"mechanical.*error", r"movement.*block"],
        "probable_causes": [
            {
                "cause": "Motor or actuator failure",
                "probability": 0.80,
                "description": "Mechanical component malfunction"
            },
            {
                "cause": "Obstruction or jamming",
                "probability": 0.75,
                "description": "Foreign object blocking movement"
            },
            {
                "cause": "Lubrication needed",
                "probability": 0.60,
                "description": "Moving parts require maintenance"
            }
        ],
        "recommended_actions": [
            "Inspect for physical obstructions",
            "Check motor and actuator operation",
            "Lubricate moving parts per maintenance schedule",
            "Run mechanical self-test routine",
            "Contact service technician if persists"
        ],
        "urgency": "high"
    },
    {
        "id": "rule_power_issue",
        "symptoms": ["power", "shutdown", "restart", "voltage", "electrical"],
        "error_codes": ["E008", "POWER_FAIL", "VOLTAGE"],
        "log_patterns": [r"power.*fail", r"voltage.*out", r"shutdown.*unexpected"],
        "probable_causes": [
            {
                "cause": "Power supply malfunction",
                "probability": 0.80,
                "description": "Internal power supply failure"
            },
            {
                "cause": "Facility power instability",
                "probability": 0.70,
                "description": "Building power fluctuations or outages"
            },
            {
                "cause": "Overload or short circuit",
                "probability": 0.65,
                "description": "Electrical fault in instrument"
            }
        ],
        "recommended_actions": [
            "Check facility power supply is stable",
            "Inspect power cables and connections",
            "Test with UPS or alternate power source",
            "Check circuit breakers and fuses",
            "Contact electrical technician"
        ],
        "urgency": "critical"
    },
    {
        "id": "rule_sample_error",
        "symptoms": ["sample", "contamination", "invalid", "quality", "result error"],
        "error_codes": ["E009", "SAMPLE_ERROR", "CONTAMINATED"],
        "log_patterns": [r"sample.*error", r"contamination", r"quality.*fail"],
        "probable_causes": [
            {
                "cause": "Sample contamination",
                "probability": 0.75,
                "description": "External contaminants in sample"
            },
            {
                "cause": "Improper sample preparation",
                "probability": 0.70,
                "description": "Sample not prepared according to protocol"
            },
            {
                "cause": "Consumable contamination",
                "probability": 0.60,
                "description": "Reagents or consumables contaminated"
            }
        ],
        "recommended_actions": [
            "Inspect sample preparation procedure",
            "Check reagent and consumable quality",
            "Clean instrument sample path",
            "Run blank/control samples",
            "Replace consumables if needed"
        ],
        "urgency": "low"
    }
]


def normalize_text(text: str) -> str:
    """Normalize text for matching (lowercase, strip, remove special chars)"""
    return re.sub(r'[^a-z0-9\s]', '', text.lower().strip())


def match_symptoms_to_rules(
    symptoms: List[str],
    error_codes: List[str],
    rules: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Match symptoms and error codes to diagnosis rules
    
    Args:
        symptoms: List of symptom descriptions
        error_codes: List of error codes
        rules: List of diagnosis rules
    
    Returns:
        List of matched rules with scores
    """
    matched_rules = []
    
    # Normalize inputs
    normalized_symptoms = [normalize_text(s) for s in symptoms]
    normalized_errors = [e.upper() for e in error_codes]
    
    for rule in rules:
        score = 0.0
        matches = {
            "symptom_matches": [],
            "error_matches": [],
            "match_count": 0
        }
        
        # Check symptom keywords
        for symptom_input in normalized_symptoms:
            for rule_keyword in rule["symptoms"]:
                if normalize_text(rule_keyword) in symptom_input or symptom_input in normalize_text(rule_keyword):
                    score += 1.0
                    matches["symptom_matches"].append(rule_keyword)
                    matches["match_count"] += 1
        
        # Check error codes (weighted higher)
        for error_input in normalized_errors:
            for rule_error in rule["error_codes"]:
                if error_input == rule_error.upper():
                    score += 2.0  # Error codes are stronger signals
                    matches["error_matches"].append(error_input)
                    matches["match_count"] += 1
        
        # Only include rules with at least one match
        if score > 0:
            matched_rules.append({
                "rule": rule,
                "score": score,
                "matches": matches
            })
    
    # Sort by score (highest first)
    matched_rules.sort(key=lambda x: x["score"], reverse=True)
    
    return matched_rules


def analyze_log_patterns(
    logs: List[Dict[str, Any]],
    rules: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyze recent logs for patterns matching diagnosis rules
    
    Args:
        logs: List of recent log entries
        rules: List of diagnosis rules
    
    Returns:
        Dictionary with log analysis results
    """
    if not logs:
        return {
            "patterns_found": [],
            "error_frequency": 0,
            "warning_frequency": 0,
            "recent_errors": []
        }
    
    patterns_found = []
    error_count = 0
    warning_count = 0
    recent_errors = []
    
    # Analyze each log entry
    for log in logs:
        message = log.get("message", "")
        level = log.get("level", "")
        
        # Count errors and warnings
        if level == "error":
            error_count += 1
            recent_errors.append(message)
        elif level == "warning":
            warning_count += 1
        
        # Check for pattern matches
        for rule in rules:
            for pattern in rule.get("log_patterns", []):
                if re.search(pattern, message, re.IGNORECASE):
                    patterns_found.append({
                        "rule_id": rule["id"],
                        "pattern": pattern,
                        "log_message": message,
                        "log_level": level,
                        "timestamp": log.get("timestamp")
                    })
    
    return {
        "patterns_found": patterns_found,
        "error_frequency": error_count / len(logs) if logs else 0,
        "warning_frequency": warning_count / len(logs) if logs else 0,
        "recent_errors": recent_errors[:5],  # Last 5 errors
        "total_logs_analyzed": len(logs)
    }


def calculate_confidence(
    matched_rules: List[Dict[str, Any]],
    log_analysis: Dict[str, Any]
) -> float:
    """
    Calculate confidence score for the diagnosis
    
    Args:
        matched_rules: List of matched rules with scores
        log_analysis: Log analysis results
    
    Returns:
        Confidence score between 0 and 1
    """
    if not matched_rules:
        return 0.0
    
    # Base confidence from rule matches
    best_match_score = matched_rules[0]["score"]
    match_confidence = min(best_match_score / 5.0, 1.0)  # Normalize to 0-1
    
    # Boost confidence if log patterns also match
    pattern_boost = min(len(log_analysis.get("patterns_found", [])) * 0.1, 0.3)
    
    # Adjust based on error frequency
    error_freq = log_analysis.get("error_frequency", 0)
    if error_freq > 0.2:  # More than 20% errors
        error_boost = 0.1
    else:
        error_boost = 0
    
    total_confidence = min(match_confidence + pattern_boost + error_boost, 1.0)
    
    return round(total_confidence, 2)


def determine_urgency(
    matched_rules: List[Dict[str, Any]],
    log_analysis: Dict[str, Any]
) -> str:
    """
    Determine urgency level based on matched rules and log patterns
    
    Args:
        matched_rules: List of matched rules
        log_analysis: Log analysis results
    
    Returns:
        Urgency level: 'low', 'medium', 'high', 'critical'
    """
    if not matched_rules:
        return "low"
    
    # Get highest urgency from matched rules
    urgency_levels = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    max_urgency = 0
    
    for match in matched_rules[:3]:  # Check top 3 matches
        rule_urgency = match["rule"].get("urgency", "low")
        urgency_value = urgency_levels.get(rule_urgency, 0)
        max_urgency = max(max_urgency, urgency_value)
    
    # Escalate if high error frequency
    error_freq = log_analysis.get("error_frequency", 0)
    if error_freq > 0.5:  # More than 50% errors
        max_urgency = max(max_urgency, 2)  # At least high
    
    # Convert back to string
    for level, value in urgency_levels.items():
        if value == max_urgency:
            return level
    
    return "low"


def generate_diagnosis_result(
    instrument_id: str,
    matched_rules: List[Dict[str, Any]],
    log_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate final diagnosis result
    
    Args:
        instrument_id: ID of the instrument being diagnosed
        matched_rules: List of matched rules
        log_analysis: Log analysis results
    
    Returns:
        Complete diagnosis result
    """
    if not matched_rules:
        return {
            "id": f"diag_{uuid.uuid4().hex[:8]}",
            "instrument_id": instrument_id,
            "timestamp": datetime.now().isoformat(),
            "probable_causes": [
                {
                    "cause": "Unable to determine cause",
                    "probability": 0.0,
                    "description": "No matching diagnosis rules found for the provided symptoms"
                }
            ],
            "recommended_actions": [
                "Review instrument logs for error patterns",
                "Check instrument documentation",
                "Contact technical support with detailed symptoms"
            ],
            "confidence": 0.0,
            "urgency": "low",
            "log_summary": log_analysis
        }
    
    # Collect probable causes from top matched rules
    probable_causes = []
    recommended_actions = set()
    
    for match in matched_rules[:3]:  # Top 3 matches
        rule = match["rule"]
        
        # Add causes from this rule
        for cause in rule["probable_causes"]:
            probable_causes.append(cause)
        
        # Add recommended actions
        for action in rule["recommended_actions"]:
            recommended_actions.add(action)
    
    # Sort causes by probability
    probable_causes.sort(key=lambda x: x["probability"], reverse=True)
    
    # Calculate overall confidence
    confidence = calculate_confidence(matched_rules, log_analysis)
    
    # Determine urgency
    urgency = determine_urgency(matched_rules, log_analysis)
    
    return {
        "id": f"diag_{uuid.uuid4().hex[:8]}",
        "instrument_id": instrument_id,
        "timestamp": datetime.now().isoformat(),
        "probable_causes": probable_causes[:5],  # Top 5 causes
        "recommended_actions": list(recommended_actions)[:8],  # Up to 8 actions
        "confidence": confidence,
        "urgency": urgency,
        "matched_rules": [m["rule"]["id"] for m in matched_rules[:3]],
        "log_summary": {
            "total_logs_analyzed": log_analysis.get("total_logs_analyzed", 0),
            "error_frequency": log_analysis.get("error_frequency", 0),
            "warning_frequency": log_analysis.get("warning_frequency", 0),
            "patterns_found": len(log_analysis.get("patterns_found", [])),
            "recent_errors": log_analysis.get("recent_errors", [])
        }
    }


def diagnose_instrument(
    instrument_id: str,
    symptoms: List[str],
    error_codes: Optional[List[str]] = None,
    recent_logs: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Main diagnosis function - analyzes symptoms and logs to provide diagnosis
    
    Args:
        instrument_id: ID of the instrument
        symptoms: List of symptom descriptions
        error_codes: Optional list of error codes
        recent_logs: Optional list of recent log entries
    
    Returns:
        Complete diagnosis result with causes and recommendations
    """
    if error_codes is None:
        error_codes = []
    
    if recent_logs is None:
        recent_logs = []
    
    # Match symptoms and error codes to rules
    matched_rules = match_symptoms_to_rules(symptoms, error_codes, DIAGNOSIS_RULES)
    
    # Analyze log patterns
    log_analysis = analyze_log_patterns(recent_logs, DIAGNOSIS_RULES)
    
    # Check if any log patterns match rules not yet in matched_rules
    pattern_rule_ids = set(p["rule_id"] for p in log_analysis.get("patterns_found", []))
    for rule in DIAGNOSIS_RULES:
        if rule["id"] in pattern_rule_ids:
            # Check if this rule is already matched
            if not any(m["rule"]["id"] == rule["id"] for m in matched_rules):
                # Add it with a lower score
                matched_rules.append({
                    "rule": rule,
                    "score": 0.5,  # Lower score for pattern-only matches
                    "matches": {
                        "symptom_matches": [],
                        "error_matches": [],
                        "match_count": 1
                    }
                })
    
    # Re-sort after adding pattern matches
    matched_rules.sort(key=lambda x: x["score"], reverse=True)
    
    # Generate diagnosis result
    diagnosis = generate_diagnosis_result(instrument_id, matched_rules, log_analysis)
    
    return diagnosis
