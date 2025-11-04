import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './InstrumentControl.css';

interface ControlCommand {
  id: string;
  instrumentId: string;
  command: string;
  parameters: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface InstrumentControlProps {
  instrumentId: string;
  instrumentName?: string;
}

const InstrumentControl = ({ 
  instrumentId, 
  instrumentName = 'Instrument' 
}: InstrumentControlProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [temperature, setTemperature] = useState<number>(25);
  const [speed, setSpeed] = useState<number>(500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [commands, setCommands] = useState<ControlCommand[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Connect to socket.io server
  useEffect(() => {
    const newSocket = io('http://localhost:8081');
    
    newSocket.on('connect', () => {
      console.log('Connected to gateway socket');
      newSocket.emit('subscribe-commands', instrumentId);
    });

    newSocket.on('commands-subscription-confirmed', (data) => {
      console.log('Subscribed to commands:', data);
      showMessage('Connected to instrument', 'success');
    });

    newSocket.on('commands-history', (data) => {
      console.log('Received command history:', data);
      setCommands(data.commands);
    });

    newSocket.on('command-update', (command: ControlCommand) => {
      console.log('Command update:', command);
      
      if (command.instrumentId === instrumentId) {
        // Update command in list
        setCommands(prev => {
          const index = prev.findIndex(c => c.id === command.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = command;
            return updated;
          } else {
            return [command, ...prev];
          }
        });

        // Show status message
        if (command.status === 'completed') {
          showMessage(`Command ${command.command} completed successfully`, 'success');
        } else if (command.status === 'failed') {
          showMessage(`Command failed: ${command.error}`, 'error');
        } else if (command.status === 'executing') {
          showMessage(`Executing ${command.command}...`, 'info');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from gateway');
      showMessage('Disconnected from gateway', 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [instrumentId]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const sendCommand = async (command: string, parameters: Record<string, any> = {}) => {
    try {
      showMessage(`Sending command: ${command}...`, 'info');
      
      const response = await fetch(`http://localhost:8081/api/control/instruments/${instrumentId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command, parameters }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage(`Command queued: ${data.commandId}`, 'success');
      } else {
        showMessage(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      showMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleSetTemperature = () => {
    sendCommand('set_temperature', { value: temperature });
  };

  const handleSetSpeed = async () => {
    // Validate speed range
    if (speed < 500 || speed > 100000) {
      showMessage('Speed must be between 500 and 100,000', 'error');
      return;
    }

    try {
      showMessage(`Setting speed to ${speed}...`, 'info');
      
      // Use instrumentId to dynamically determine the target instrument IP
      const response = await fetch(`http://localhost:8081/api/proxy/setspeed/${instrumentId}/${speed}`, {
        method: 'GET',
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        showMessage(`Error: ${errorData.error || 'Failed to set speed'}`, 'error');
        return;
      }

      const data = await response.json();

      if (data.success) {
        showMessage(data.message || `Speed set successfully to ${speed}`, 'success');
        console.log('SetSpeed response:', data);
      } else {
        showMessage(`Error: ${data.error || data.message || 'Failed to set speed'}`, 'error');
      }
    } catch (error) {
      console.error('SetSpeed error:', error);
      showMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleStart = () => {
    sendCommand('start');
    setIsRunning(true);
  };

  const handleStop = () => {
    sendCommand('stop');
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'executing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="instrument-control">
      <div className="control-header">
        <h2>🎛️ Remote Control: {instrumentName}</h2>
        <div className={`connection-status ${socket?.connected ? 'connected' : 'disconnected'}`}>
          {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {message && (
        <div className={`control-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="control-panels">
        <div className="control-panel">
          <h3>Temperature Control</h3>
          <div className="control-input-group">
            <label>
              Temperature (°C):
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                min="-80"
                max="300"
                step="1"
              />
            </label>
            <span className="range-hint">Range: -80°C to 300°C</span>
          </div>
          <button 
            className="control-button temperature"
            onClick={handleSetTemperature}
          >
            🌡️ Set Temperature
          </button>
        </div>

        <div className="control-panel">
          <h3>Speed Control</h3>
          <div className="control-input-group">
            <label>
              Speed:
              <input
                type="number"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                min="500"
                max="100000"
                step="100"
              />
            </label>
            <span className="range-hint">Range: 500 to 100,000</span>
          </div>
          <button 
            className="control-button speed"
            onClick={handleSetSpeed}
          >
            � Set Speed
          </button>
        </div>

        <div className="control-panel">
          <h3>Operation Control</h3>
          <div className="operation-status">
            Status: {isRunning ? '🟢 Running' : '🔴 Stopped'}
          </div>
          <div className="operation-buttons">
            <button 
              className="control-button start"
              onClick={handleStart}
              disabled={isRunning}
            >
              ▶️ Start
            </button>
            <button 
              className="control-button stop"
              onClick={handleStop}
              disabled={!isRunning}
            >
              ⏹️ Stop
            </button>
          </div>
        </div>
      </div>

      <div className="command-history">
        <h3>Command History</h3>
        <div className="command-list">
          {commands.length === 0 ? (
            <div className="no-commands">No commands yet</div>
          ) : (
            commands.slice(0, 10).map((cmd) => (
              <div key={cmd.id} className={`command-item ${cmd.status}`}>
                <div className="command-header">
                  <span className="command-status-icon">{getStatusIcon(cmd.status)}</span>
                  <span className="command-name">{cmd.command}</span>
                  <span className="command-time">{formatTimestamp(cmd.timestamp)}</span>
                </div>
                <div className="command-details">
                  {Object.keys(cmd.parameters).length > 0 && (
                    <div className="command-params">
                      Params: {JSON.stringify(cmd.parameters)}
                    </div>
                  )}
                  {cmd.error && (
                    <div className="command-error">Error: {cmd.error}</div>
                  )}
                  {cmd.result && (
                    <div className="command-result">
                      {cmd.result.message}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InstrumentControl;
