import { useState, useEffect } from 'react';
import './DiagnosisPanel.css';

interface ProbableCause {
  cause: string;
  probability: number;
  description: string;
}

interface DiagnosisResult {
  id: string;
  instrument_id: string;
  timestamp: string;
  probable_causes: ProbableCause[];
  recommended_actions: string[];
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  matched_rules?: string[];
  log_summary?: {
    total_logs_analyzed: number;
    error_frequency: number;
    warning_frequency: number;
    patterns_found: number;
    recent_errors: string[];
  };
}

interface Instrument {
  id: string;
  name: string;
}

const COMMON_SYMPTOMS = [
  'High temperature',
  'Low temperature',
  'Temperature spike',
  'Repeated errors',
  'Communication timeout',
  'Calibration drift',
  'Inaccurate readings',
  'Not responding',
  'Connection lost',
  'Noise or vibration',
  'Mechanical jamming',
  'Power issue',
  'Unexpected shutdown',
  'Sample contamination',
  'Slow performance'
];

export default function DiagnosisPanel() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [errorCodes, setErrorCodes] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  const servicesUrl = process.env.REACT_APP_SERVICES_URL || 'http://localhost:8000';

  // Fetch available instruments
  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const response = await fetch(`${servicesUrl}/api/logs?limit=1`);
      const data = await response.json();
      
      // Extract unique instrument IDs from logs
      const uniqueInstruments = new Set<string>();
      if (data.success && data.logs) {
        data.logs.forEach((log: any) => {
          uniqueInstruments.add(log.instrument_id);
        });
      }
      
      // Add some default instruments if none found
      if (uniqueInstruments.size === 0) {
        ['thermocycler-01', 'centrifuge-01', 'spectrometer-01', 'incubator-01'].forEach(id => 
          uniqueInstruments.add(id)
        );
      }
      
      const instrumentList = Array.from(uniqueInstruments).map(id => ({
        id,
        name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
      
      setInstruments(instrumentList);
      if (instrumentList.length > 0) {
        setSelectedInstrument(instrumentList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch instruments:', err);
      // Set default instruments on error
      const defaultInstruments = [
        { id: 'thermocycler-01', name: 'Thermocycler 01' },
        { id: 'centrifuge-01', name: 'Centrifuge 01' },
        { id: 'spectrometer-01', name: 'Spectrometer 01' },
        { id: 'incubator-01', name: 'Incubator 01' }
      ];
      setInstruments(defaultInstruments);
      setSelectedInstrument(defaultInstruments[0].id);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const analyzeProblem = async () => {
    if (!selectedInstrument) {
      setError('Please select an instrument');
      return;
    }

    if (selectedSymptoms.length === 0 && !errorCodes.trim()) {
      setError('Please select at least one symptom or enter an error code');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setDiagnosis(null);

    try {
      const errorCodesList = errorCodes
        .split(',')
        .map(code => code.trim())
        .filter(code => code.length > 0);

      const response = await fetch(`${servicesUrl}/api/diagnosis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instrument_id: selectedInstrument,
          symptoms: selectedSymptoms,
          error_codes: errorCodesList
        }),
      });

      const data = await response.json();

      if (data.success && data.diagnosis) {
        setDiagnosis(data.diagnosis);
      } else {
        setError(data.error || 'Diagnosis failed');
      }
    } catch (err) {
      setError(`Failed to analyze: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setCustomSymptom('');
    setErrorCodes('');
    setDiagnosis(null);
    setError('');
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getUrgencyIcon = (urgency: string): string => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <div className="diagnosis-panel">
      <div className="diagnosis-header">
        <h2>🔬 Smart Diagnosis Assistant</h2>
        <p>Analyze instrument symptoms and receive AI-powered recommendations</p>
      </div>

      <div className="diagnosis-content">
        {/* Input Section */}
        <div className="diagnosis-input-section">
          <div className="input-group">
            <label>Select Instrument:</label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="instrument-select"
            >
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Select Symptoms:</label>
            <div className="symptoms-grid">
              {COMMON_SYMPTOMS.map(symptom => (
                <button
                  key={symptom}
                  className={`symptom-chip ${selectedSymptoms.includes(symptom) ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(symptom)}
                >
                  {selectedSymptoms.includes(symptom) && '✓ '}
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Add Custom Symptom:</label>
            <div className="custom-symptom-input">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                placeholder="Describe the problem..."
                className="text-input"
              />
              <button
                onClick={addCustomSymptom}
                disabled={!customSymptom.trim()}
                className="add-btn"
              >
                Add
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Error Codes (comma-separated):</label>
            <input
              type="text"
              value={errorCodes}
              onChange={(e) => setErrorCodes(e.target.value)}
              placeholder="E001, E002, TEMP_HIGH"
              className="text-input"
            />
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="selected-symptoms">
              <strong>Selected Symptoms ({selectedSymptoms.length}):</strong>
              <div className="selected-chips">
                {selectedSymptoms.map(symptom => (
                  <span key={symptom} className="selected-chip">
                    {symptom}
                    <button onClick={() => toggleSymptom(symptom)} className="remove-chip">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={analyzeProblem}
              disabled={isAnalyzing || selectedSymptoms.length === 0}
              className="analyze-btn"
            >
              {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Problem'}
            </button>
            <button onClick={resetForm} className="reset-btn">
              🔄 Reset
            </button>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {diagnosis && (
          <div className="diagnosis-results-section">
            <div className="results-header">
              <h3>Diagnosis Results</h3>
              <div className="diagnosis-meta">
                <span
                  className="urgency-badge"
                  style={{ backgroundColor: getUrgencyColor(diagnosis.urgency) }}
                >
                  {getUrgencyIcon(diagnosis.urgency)} {diagnosis.urgency.toUpperCase()}
                </span>
                <span className="confidence-badge">
                  {Math.round(diagnosis.confidence * 100)}% Confidence
                </span>
              </div>
            </div>

            {diagnosis.log_summary && (
              <div className="log-summary">
                <h4>📊 Log Analysis Summary</h4>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Logs Analyzed:</span>
                    <span className="stat-value">{diagnosis.log_summary.total_logs_analyzed}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Error Rate:</span>
                    <span className="stat-value">
                      {Math.round(diagnosis.log_summary.error_frequency * 100)}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Warning Rate:</span>
                    <span className="stat-value">
                      {Math.round(diagnosis.log_summary.warning_frequency * 100)}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Patterns Found:</span>
                    <span className="stat-value">{diagnosis.log_summary.patterns_found}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="probable-causes">
              <h4>🎯 Probable Causes</h4>
              {diagnosis.probable_causes.map((cause, index) => (
                <div key={index} className="cause-card">
                  <div className="cause-header">
                    <span className="cause-rank">#{index + 1}</span>
                    <span className="cause-title">{cause.cause}</span>
                    <span className="cause-probability">
                      {Math.round(cause.probability * 100)}%
                    </span>
                  </div>
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{ width: `${cause.probability * 100}%` }}
                    />
                  </div>
                  <p className="cause-description">{cause.description}</p>
                </div>
              ))}
            </div>

            <div className="recommended-actions">
              <h4>✅ Recommended Actions</h4>
              <ol className="actions-list">
                {diagnosis.recommended_actions.map((action, index) => (
                  <li key={index} className="action-item">
                    {action}
                  </li>
                ))}
              </ol>
            </div>

            <div className="diagnosis-footer">
              <small>
                Diagnosis ID: {diagnosis.id} • Generated: {new Date(diagnosis.timestamp).toLocaleString()}
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
