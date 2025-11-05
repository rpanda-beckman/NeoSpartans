import React, { useState } from 'react';
import optimaImg from './assets/Optima.png';
import avantiImg from'./assets/Avanti.png';
import './App.css';
import ResponseFormatter from './components/ResponseFormatter';
import AlertsPanel from './components/AlertsPanel';
import LogsViewer from './components/LogsViewer';
import DiagnosisPanel from './components/DiagnosisPanel';
import InstrumentControl from './components/InstrumentControl';
import SidebarMenu from './components/SidebarMenu';
import './components/SidebarMenu.css';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// Same API list as your original implementation
const API_LIST = [
  "GetStatus",
  "GetStatusXPN",
  "GetSystemInfo", 
  "GetDiagnostics",
  "GetReservations",
  "GetUserInfo",
  "GetRunBlockReason",
  "GetInstrumentAvailability",
  "GetSchedulerAvailability"
];

interface Instrument {
  ip: string;
  model: string;
  id: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'logs' | 'diagnosis' | 'scanner' | 'api' | 'control'>('dashboard');
  const [foundInstruments, setFoundInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [currentApiName, setCurrentApiName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [alertSeverities, setAlertSeverities] = useState<{critical: number, high: number}>({critical: 0, high: 0});

  // Listen for alert updates to set dashboard color
  useEffect(() => {
    const gatewayUrl = process.env.REACT_APP_GATEWAY_URL || 'http://localhost:8081';
    const socket: Socket = io(gatewayUrl);
    socket.on('alerts-history', (data: { alerts: any[] }) => {
      const critical = data.alerts.filter(a => a.severity === 'critical').length;
      const high = data.alerts.filter(a => a.severity === 'high').length;
      setAlertSeverities({critical, high});
    });
    socket.on('anomaly_alert', (alert: any) => {
      setAlertSeverities(prev => {
        let critical = prev.critical;
        let high = prev.high;
        if (alert.severity === 'critical') critical++;
        if (alert.severity === 'high') high++;
        return {critical, high};
      });
    });
    return () => { socket.close(); };
  }, []);

  let dashboardBg = '#eebbc3';
  if (alertSeverities.critical > 0) dashboardBg = '#8B0000'; // dark red
  else if (alertSeverities.high > 0) dashboardBg = '#ffcccc'; // light red
  else if (alertSeverities.critical === 0 && alertSeverities.high === 0) dashboardBg = '#b6e7a7'; // green

  // Network scanner - EXACT same functionality as your original implementation
  const scanNetwork = async () => {
    setIsScanning(true);
    setFoundInstruments([]);
    const ips = ['localhost'];
    for (let i = 10; i <= 50; i++) {
      ips.push(`10.122.72.${i}`);
    }
    const promises = ips.map(async (ip) => {
      try {
        const response = await fetch(`http://localhost:8081/DataService/GetSystemInfo`, {
          headers: {
            'x-target-url': `http://${ip}:8080`
          }
        });
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const systemModelNode = xmlDoc.querySelector('SystemModel');
        let modelName = systemModelNode && systemModelNode.textContent ? systemModelNode.textContent : '';
        // Assign Optima XPN if PreparatoryExtended
        let displayName = modelName;
        if (modelName === 'PreparatoryExtended') displayName = 'Optima XPN';
        if (displayName) {
          return {
            ip,
            model: displayName,
            id: `${ip}-${Date.now()}`
          };
        }
      } catch (error) {}
      return null;
    });
    const results = await Promise.all(promises);
    const validInstruments = results.filter((instrument): instrument is Instrument => instrument !== null);
    setFoundInstruments(validInstruments);
    setIsScanning(false);
  };
  // Navigation helpers
  const showApiPage = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setCurrentPage('api');
    setApiResponse('');
  };

  const showControlPage = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setCurrentPage('control');
  };

  const goBack = () => {
    setCurrentPage('scanner');
    setSelectedInstrument(null);
    setApiResponse('');
    setCurrentApiName('');
  };

  const callApi = async (apiName: string) => {
    if (!selectedInstrument) return;
    try {
      setCurrentApiName(apiName);
      setApiResponse('Loading...');
      const headers: Record<string, string> = {
        'x-target-url': `http://${selectedInstrument.ip}:8080`
      };
      if (apiName === 'GetUserInfo') {
        headers['x-bci-LoggedInUserInfo'] = 'UserID:Administrator';
      }
      const response = await fetch(`http://localhost:8081/DataService/${apiName}`, {
        headers: headers
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.text();
      setApiResponse(data);
    } catch (error) {
      setApiResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="App" style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fb' }}>
      <SidebarMenu
        onSelect={(page: string) => {
          setCurrentPage(page as any);
          setSelectedInstrument(null);
          setApiResponse('');
          setCurrentApiName('');
        }}
        currentPage={currentPage}
      />
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {currentPage === 'dashboard' && (
          <header
            style={{
              marginBottom: '2rem',
              textAlign: 'center',
              background: dashboardBg,
              borderRadius: '12px',
              padding: '1.5rem 0',
              transition: 'background 0.3s'
            }}
          >
            <h1
              style={{
                color:
                  dashboardBg === '#8B0000' || dashboardBg === '#ffcccc'
                    ? '#fff'
                    : '#232946',
                fontWeight: 700,
                fontSize: '2.2rem',
                margin: 0
              }}
            >
              Connected Labs Dashboard
            </h1>
            <p
              style={{
                color:
                  dashboardBg === '#8B0000' || dashboardBg === '#ffcccc'
                    ? '#fff'
                    : '#393e46',
                fontSize: '1.1rem',
                margin: 0
              }}
            >
              Modern platform for monitoring, diagnosis, and control
            </p>
          </header>
        )}
        {currentPage === 'dashboard' && (
          <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ margin: '0 auto', width: '100%', maxWidth: 700, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#232946', fontWeight: 600, fontSize: '1.3rem', marginBottom: '1rem', textAlign: 'center' }}>Connected Instruments</h2>
              {foundInstruments.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', fontSize: '1.1rem' }}>
                  Please scan first to see the instruments.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
                  {foundInstruments.map(inst => (
                    <li key={inst.id} style={{ background: '#f4f6fb', borderRadius: 8, padding: '0.8rem 1.2rem', minWidth: 180, textAlign: 'center', boxShadow: '0 1px 4px #0001', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: '1.1rem', color: '#232946' }}>{inst.model}</span>
                      <span style={{ color: '#555', fontSize: '0.95rem', marginTop: 2 }}>{inst.ip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="dashboard-section" style={{ flex: 1, minWidth: 320 }}>
              <AlertsPanel />
            </div>
          </div>
        )}
        {currentPage === 'logs' && (
          <div className="logs-page">
            <LogsViewer maxLogs={100} autoRefresh={true} refreshInterval={10000} />
          </div>
        )}
        {currentPage === 'diagnosis' && (
          <div className="diagnosis-page">
            <DiagnosisPanel />
          </div>
        )}
        {currentPage === 'scanner' && (
          <div id="scanner" style={{ maxWidth: '100%', background: 'none', margin: 0, padding: 0 }}>
            <div style={{ width: '100%', background: '#a7c7ee', padding: '2rem 0 1.2rem 0', textAlign: 'center', boxShadow: '0 2px 8px #0001', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <h2 style={{ color: '#232946', fontWeight: 700, fontSize: '2.2rem', margin: 0, letterSpacing: 1 }}>Instrument Network Scanner</h2>
              <p style={{ color: '#2e4d1c', fontSize: '1.15rem', margin: '1rem 0 0.5rem 0' }}>
                Scan your local network to discover connected laboratory instruments. Click on an instrument to view its APIs or use remote control.
              </p>
            </div>
            <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#f4f6fb', borderRadius: 18, boxShadow: '0 2px 16px #0001', padding: '2rem', marginTop: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0 2rem 0' }}>
                <button 
                  className="scan-button" 
                  onClick={scanNetwork}
                  disabled={isScanning}
                  style={{ fontSize: '1.25rem', padding: '1.1rem 3.2rem', borderRadius: 10, background: '#388e3c', color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px #0002', letterSpacing: 1, border: 'none', transition: 'background 0.2s', minWidth: 220 }}
                >
                  {isScanning ? 'Scanning for Instruments...' : 'Start Scan'}
                </button>
              </div>
              <div className="instrument-list" id="instrumentList" style={{ marginTop: 8 }}>
                {isScanning && (
                  <div className="scanning-message" style={{ textAlign: 'center', color: '#388e3c', fontWeight: 600, fontSize: '1.2rem', marginBottom: 16 }}>Scanning the network, please wait...</div>
                )}
                {foundInstruments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'flex-start', alignItems: 'stretch' }}>
                    {foundInstruments.map((instrument) => {
                      let img = null;
                      let isOptima = instrument.model.startsWith('Optima');
                      let isAvanti = instrument.model.startsWith('Avanti');
                      if (isOptima) img = optimaImg;
                      if (isAvanti) img = avantiImg;
                      return (
                        <div key={instrument.id} className="instrument-item" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px #0001', padding: '1.2rem 1.5rem', minWidth: 200, flex: '1 0 220px', maxWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                          {img && (
                            <img 
                              src={img} 
                              alt={instrument.model} 
                              style={{ height: 100, width: 100, borderRadius: 12, background: '#f4f6fb', objectFit: 'contain', marginBottom: 10, marginTop: 0 }} 
                            />
                          )}
                          <span style={{ fontWeight: 600, fontSize: '1.15rem', color: '#232946', marginTop: 0 }}>{instrument.model}</span>
                          <span style={{ color: '#555', fontSize: '1rem', marginBottom: 8 }}>{instrument.ip}</span>
                          <div style={{ display: 'flex', gap: '0.7rem', width: '100%', justifyContent: 'center' }}>
                            <button
                              className="instrument-button"
                              style={{ flex: 1, fontSize: '1rem', padding: '0.5rem 0.7rem', borderRadius: 6, background: '#eebbc3', color: '#232946', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px #0001', transition: 'background 0.2s' }}
                              onClick={() => showApiPage(instrument)}
                            >
                              View APIs
                            </button>
                            <button
                              className="instrument-control-button"
                              style={{ flex: 1, fontSize: '1rem', padding: '0.5rem 0.7rem', borderRadius: 6, background: 'linear-gradient(90deg, #7b2ff2 0%, #f357a8 100%)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px #0001', transition: 'background 0.2s' }}
                              onClick={() => showControlPage(instrument)}
                              title="Remote Control"
                            >
                              Remote Control
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!isScanning && foundInstruments.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#888', fontSize: '1.1rem', marginTop: 24 }}>
                    No instruments found. Please click <span style={{ color: '#4caf50', fontWeight: 600 }}>&quot;Start Scan&quot;</span> to discover instruments on your network.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {currentPage === 'control' && selectedInstrument && (
          <div className="control-page">
            <InstrumentControl 
              instrumentId={selectedInstrument.id}
              instrumentName={`${selectedInstrument.model} (${selectedInstrument.ip})`}
            />
            <button className="back-button" onClick={goBack}>
              Back to Scanner
            </button>
          </div>
        )}
        {currentPage === 'api' && selectedInstrument && (
          <div id="apiPage" style={{ maxWidth: '1200px', margin: '0 auto', background: '#f4f6fb', borderRadius: 18, boxShadow: '0 2px 16px #0001', padding: '0', marginTop: 0 }}>
            <div style={{ width: '1200px', margin: '0 auto', background: '#a7c7ee', padding: '1.5rem 0 1.2rem 0', textAlign: 'center', boxShadow: '0 2px 8px #0001', borderTopLeftRadius: 18, borderTopRightRadius: 18, marginBottom: '2rem' }}>
              <h2 id="instrumentTitle" style={{ color: '#232946', fontWeight: 700, fontSize: '2rem', margin: 0, letterSpacing: 1, background: 'none' }}>
                {selectedInstrument?.model} ({selectedInstrument?.ip}) APIs
              </h2>
            </div>
            <div style={{ padding: '2rem' }}>
              <div className="api-list" id="apiList" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                {API_LIST.map((api) => (
                  <button
                    key={api}
                    className="api-button"
                    onClick={() => callApi(api)}
                    style={{ fontSize: '1.05rem', padding: '0.7rem 1.7rem', fontWeight: 600 }}
                  >
                    {api}
                  </button>
                ))}
              </div>
              <div className="response" id="apiResponse" style={{ fontSize: '1rem' }}>
                <ResponseFormatter 
                  response={apiResponse} 
                  apiName={currentApiName || 'API Response'} 
                />
              </div>
              <button className="back-button" onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;