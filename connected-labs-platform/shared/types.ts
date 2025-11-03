// Shared TypeScript interfaces for the Connected Labs Platform
// These types are used across Gateway, Frontend, and Services

export interface Instrument {
  id: string;
  ip: string;
  model: string;
  status: 'online' | 'offline' | 'error' | 'unknown';
  lastSeen: string;
  capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface ApiCall {
  instrumentId: string;
  apiName: string;
  timestamp: string;
  response?: any;
  error?: string;
  duration?: number;
}

// PLACEHOLDER: Types for future real-time monitoring
export interface InstrumentStatus {
  instrumentId: string;
  timestamp: string;
  temperature?: number;
  pressure?: number;
  isRunning: boolean;
  errorCount: number;
  performance: {
    uptime: number;
    throughput: number;
    efficiency: number;
  };
}

// PLACEHOLDER: Types for log collection
export interface LogEntry {
  id: string;
  instrumentId: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

// PLACEHOLDER: Types for anomaly detection
export interface AnomalyAlert {
  id: string;
  instrumentId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  suggestedActions: string[];
}

// PLACEHOLDER: Types for smart diagnosis
export interface DiagnosisRequest {
  instrumentId: string;
  symptoms: string[];
  errorCodes?: string[];
  recentLogs?: LogEntry[];
}

export interface DiagnosisResult {
  id: string;
  instrumentId: string;
  timestamp: string;
  probableCauses: Array<{
    cause: string;
    probability: number;
    description: string;
  }>;
  recommendedActions: string[];
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// PLACEHOLDER: Types for instrument control
export interface ControlCommand {
  id: string;
  instrumentId: string;
  command: string;
  parameters: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// WebSocket message types for real-time communication
export interface WebSocketMessage {
  type: 'instrument_status' | 'anomaly_alert' | 'command_update' | 'log_entry';
  data: any;
  timestamp: string;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}