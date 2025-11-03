/// <reference types="react" />
import * as React from 'react';
import './ResponseFormatter.css';

interface ParsedData {
  type: 'list' | 'object' | 'text' | 'error';
  data: any;
  columns?: string[];
  rows?: Record<string, any>[];
  error?: string;
}

interface ResponseFormatterProps {
  response: string;
  apiName: string;
}

export default function ResponseFormatter({ response, apiName }: ResponseFormatterProps) {
  const parseXmlResponse = (xmlText: string): ParsedData => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      if (xmlDoc.documentElement && xmlDoc.documentElement.nodeName !== 'parsererror') {
        const root = xmlDoc.documentElement;
        const children = Array.from(root.children);
        
        if (children.length > 0) {
          // Check if all children have the same tag (list mode)
          const allSameTag = children.every(c => c.tagName === children[0].tagName);
          
          if (allSameTag) {
            // List mode - multiple items of same type
            const columns: string[] = [];
            const rows: Record<string, any>[] = [];
            
            children.forEach(child => {
              const row: Record<string, any> = {};
              Array.from(child.children).forEach(grandChild => {
                row[grandChild.tagName] = grandChild.textContent;
                if (!columns.includes(grandChild.tagName)) {
                  columns.push(grandChild.tagName);
                }
              });
              rows.push(row);
            });
            
            return { type: 'list', data: rows, columns, rows };
          } else {
            // Single object mode - key-value pairs
            const data: Record<string, any> = {};
            children.forEach(child => {
              data[child.tagName] = child.textContent;
            });
            
            return { type: 'object', data };
          }
        } else {
          // No children, show root text
          return { type: 'text', data: root.textContent };
        }
      } else {
        // XML parsing failed, treat as plain text
        return { type: 'text', data: xmlText };
      }
    } catch (error) {
      return { type: 'error', data: xmlText, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const renderListView = (columns: string[], rows: Record<string, any>[]) => (
    <div className="response-card">
      <div className="response-header">
        <h3 className="response-title">{apiName} Results</h3>
        <span className="response-count">{rows.length} items</span>
      </div>
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} className="table-header">
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="table-row">
                {columns.map(col => (
                  <td key={col} className="table-cell">
                    {row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderObjectView = (data: Record<string, any>) => (
    <div className="response-card">
      <div className="response-header">
        <h3 className="response-title">{apiName} Details</h3>
        <span className="response-count">{Object.keys(data).length} properties</span>
      </div>
      <div className="properties-grid">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="property-item">
            <div className="property-label">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="property-value">
              {value || '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTextView = (text: string) => (
    <div className="response-card">
      <div className="response-header">
        <h3 className="response-title">{apiName} Response</h3>
      </div>
      <div className="text-content">
        {text}
      </div>
    </div>
  );

  const renderErrorView = (text: string, error: string) => (
    <div className="response-card error-card">
      <div className="response-header">
        <h3 className="response-title">Error - {apiName}</h3>
      </div>
      <div className="error-content">
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
        <div className="error-details">
          <strong>Response:</strong>
          <pre>{text}</pre>
        </div>
      </div>
    </div>
  );

  if (!response) {
    return (
      <div className="response-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">📊</div>
          <h3>Select an API to view results</h3>
          <p>Click on any API button above to see formatted response data</p>
        </div>
      </div>
    );
  }

  if (response === 'Loading...') {
    return (
      <div className="response-card loading-card">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Loading {apiName}...</h3>
          <p>Fetching data from instrument</p>
        </div>
      </div>
    );
  }

  const parsedData = parseXmlResponse(response);

  switch (parsedData.type) {
    case 'list':
      return renderListView(parsedData.columns!, parsedData.rows!);
    case 'object':
      return renderObjectView(parsedData.data);
    case 'text':
      return renderTextView(parsedData.data);
    case 'error':
      return renderErrorView(parsedData.data, parsedData.error!);
    default:
      return renderTextView(response);
  }
}