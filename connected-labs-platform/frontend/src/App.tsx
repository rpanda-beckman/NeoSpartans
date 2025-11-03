import React, { useState } from 'react';
import './App.css';

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
  const [currentPage, setCurrentPage] = useState<'scanner' | 'api'>('scanner');
  const [foundInstruments, setFoundInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Network scanner - EXACT same functionality as your original implementation
  const scanNetwork = async () => {
    setIsScanning(true);
    setFoundInstruments([]);
    
    // Same IP ranges as your original implementation
    const ips = ['localhost'];
    for (let i = 40; i <= 50; i++) {
      ips.push(`10.122.72.${i}`);
    }

    const promises = ips.map(async (ip) => {
      try {
        // Use the EXACT same proxy approach as your original code
        const response = await fetch(`http://localhost:8081/DataService/GetSystemInfo`, {
          headers: {
            'x-target-url': `http://${ip}:8080`
          }
        });
        
        const xmlText = await response.text();
        
        // Parse XML response - SAME logic as original
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const systemModelNode = xmlDoc.querySelector('SystemModel');
        
        if (systemModelNode && systemModelNode.textContent) {
          return {
            ip,
            model: systemModelNode.textContent,
            id: `${ip}-${Date.now()}`
          };
        }
      } catch (error) {
        // Silently ignore errors like original implementation
      }
      
      return null;
    });

    const results = await Promise.all(promises);
    const validInstruments = results.filter((instrument): instrument is Instrument => 
      instrument !== null
    );
    
    setFoundInstruments(validInstruments);
    setIsScanning(false);
  };

  // Show API page - SAME functionality as original showApiPage function
  const showApiPage = (instrument: Instrument) => {
    setSelectedInstrument(instrument);
    setCurrentPage('api');
    setApiResponse('');
  };

  // API call - EXACT same logic as your original implementation
  const callApi = async (apiName: string) => {
    if (!selectedInstrument) return;
    
    try {
      setApiResponse('Loading...');
      
      // Direct API call like original implementation
      const response = await fetch(`http://${selectedInstrument.ip}:8080/DataService/${apiName}`);
      const data = await response.json();
      
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setApiResponse(`Error: ${error}`);
    }
  };

  // Go back to scanner
  const goBack = () => {
    setCurrentPage('scanner');
    setSelectedInstrument(null);
    setApiResponse('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Connected Labs Network Scanner</h1>
        <p>Enhanced platform with monitoring capabilities</p>
      </header>

      <div className="container">
        {currentPage === 'scanner' ? (
          // Scanner Page - Enhanced UI but EXACT same functionality
          <div id="scanner">
            <button 
              className="scan-button" 
              onClick={scanNetwork}
              disabled={isScanning}
            >
              {isScanning ? 'Scanning...' : 'Scan Network'}
            </button>
            
            <div className="instrument-list" id="instrumentList">
              {isScanning && (
                <div className="scanning-message">Scanning...</div>
              )}
              
              {foundInstruments.map((instrument) => (
                <button
                  key={instrument.id}
                  className="instrument-button"
                  onClick={() => showApiPage(instrument)}
                >
                  {instrument.model} ({instrument.ip})
                </button>
              ))}
              
              {!isScanning && foundInstruments.length === 0 && (
                <div>No instruments found.</div>
              )}
            </div>
          </div>
        ) : (
          // API Testing Page - Enhanced UI but EXACT same functionality
          <div id="apiPage">
            <h2 id="instrumentTitle">
              {selectedInstrument?.model} ({selectedInstrument?.ip}) APIs
            </h2>
            
            <div className="api-list" id="apiList">
              {API_LIST.map((api) => (
                <button
                  key={api}
                  className="api-button"
                  onClick={() => callApi(api)}
                >
                  {api}
                </button>
              ))}
            </div>
            
            <div className="response" id="apiResponse">
              {apiResponse}
            </div>
            
            <button className="back-button" onClick={goBack}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;