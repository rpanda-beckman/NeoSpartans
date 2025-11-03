# Database Schema (PostgreSQL) - PLACEHOLDER STRUCTURE
# This file defines the database schema for future implementation

# Instructions for implementation:
# 1. Install PostgreSQL
# 2. Create database: CREATE DATABASE connected_labs;
# 3. Run these CREATE TABLE statements
# 4. Update connection strings in .env files

-- Instruments table
CREATE TABLE instruments (
    id VARCHAR(255) PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'unknown',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    capabilities JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log entries table
CREATE TABLE log_entries (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(255) REFERENCES instruments(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly alerts table
CREATE TABLE anomaly_alerts (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(255) REFERENCES instruments(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2),
    suggested_actions JSONB DEFAULT '[]',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diagnosis results table  
CREATE TABLE diagnosis_results (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(255) REFERENCES instruments(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    probable_causes JSONB DEFAULT '[]',
    recommended_actions JSONB DEFAULT '[]',
    confidence DECIMAL(3,2),
    urgency VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Control commands table
CREATE TABLE control_commands (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(255) REFERENCES instruments(id),
    command VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table (for analytics)
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    instrument_id VARCHAR(255) REFERENCES instruments(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(10,2),
    pressure DECIMAL(10,2),
    is_running BOOLEAN DEFAULT FALSE,
    error_count INTEGER DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    throughput DECIMAL(10,2),
    efficiency DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_instruments_ip ON instruments(ip);
CREATE INDEX idx_instruments_status ON instruments(status);
CREATE INDEX idx_log_entries_instrument_timestamp ON log_entries(instrument_id, timestamp);
CREATE INDEX idx_anomaly_alerts_instrument_timestamp ON anomaly_alerts(instrument_id, timestamp);
CREATE INDEX idx_anomaly_alerts_severity ON anomaly_alerts(severity);
CREATE INDEX idx_diagnosis_results_instrument_timestamp ON diagnosis_results(instrument_id, timestamp);
CREATE INDEX idx_control_commands_instrument_timestamp ON control_commands(instrument_id, timestamp);
CREATE INDEX idx_control_commands_status ON control_commands(status);
CREATE INDEX idx_performance_metrics_instrument_timestamp ON performance_metrics(instrument_id, timestamp);