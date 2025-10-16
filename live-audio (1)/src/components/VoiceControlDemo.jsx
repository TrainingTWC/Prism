import React, { useState, useCallback } from 'react';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { applyVoiceCommandToChecklist } from './VoiceControlAdapterExample';

const cardStyle = {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '500px',
    margin: '20px auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: '1px solid transparent',
    marginRight: '10px',
};

const startButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: 'white',
};

const stopButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: 'white',
};

const statusIndicatorStyle = {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px',
};

const logStyle = {
    background: '#f8f9fa',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '10px',
    marginTop: '15px',
    height: '150px',
    overflowY: 'auto',
    fontSize: '14px',
};

export function VoiceControlDemo() {
  const [logs, setLogs] = useState([]);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [checklistState, setChecklistState] = useState({ open: null, fields: {} });

  const addLog = (message) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // --- Integration Example ---
  // These would be your actual app's state update functions (e.g., from Redux, Zustand, or props)
  const checklistActions = {
    openChecklistByName: (name) => {
      setChecklistState({ open: name, fields: {} });
      addLog(`ACTION: Opening checklist for "${name}"`);
    },
    fillChecklistFields: (name, fields) => {
      setChecklistState((prev) => ({
        ...prev,
        open: name, // Ensure it's open
        fields: { ...prev.fields, ...fields },
      }));
      addLog(`ACTION: Filling fields for "${name}": ${JSON.stringify(fields)}`);
    },
  };
  // --- End Integration Example ---

  const handleWake = useCallback(() => {
    setWakeWordDetected(true);
    addLog("Wake word 'Hey Prism' detected!");
    setTimeout(() => setWakeWordDetected(false), 4000); // Reset visual indicator
  }, []);

  const handleCommand = useCallback((command) => {
    addLog(`Command received: ${JSON.stringify(command)}`);
    applyVoiceCommandToChecklist(command, checklistActions);
  }, []);

  const { start, stop, isListening, isSupported, lastTranscript, error } = useVoiceCommands({
    onWake: handleWake,
    onCommand: handleCommand,
  });

  return (
    <div style={cardStyle}>
      <h2>Voice Control Demo</h2>
      <p>Say <strong>"Hey Prism"</strong> followed by a command like <strong>"open the checklist for 12th main"</strong>.</p>
      
      {!isSupported && <p style={{ color: 'red' }}>Web Speech API is not supported in this browser.</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div>
        <button onClick={start} disabled={isListening || !isSupported} style={startButtonStyle}>Start Listening</button>
        <button onClick={stop} disabled={!isListening} style={stopButtonStyle}>Stop Listening</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Status</h4>
        <p><span style={{ ...statusIndicatorStyle, backgroundColor: isSupported ? 'green' : 'red' }}></span>API Supported</p>
        <p><span style={{ ...statusIndicatorStyle, backgroundColor: isListening ? 'green' : 'gray' }}></span>Listening</p>
        <p><span style={{ ...statusIndicatorStyle, backgroundColor: wakeWordDetected ? 'orange' : 'gray' }}></span>Wake Word Detected</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Live Transcript</h4>
        <p style={{ minHeight: '2em', color: '#555', fontStyle: 'italic' }}>{lastTranscript || '...'}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Command Log</h4>
        <div style={logStyle}>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Simulated Checklist State</h4>
        {checklistState.open ? (
          <div>
            <p><strong>Checklist:</strong> {checklistState.open}</p>
            <p><strong>Status:</strong> OPEN</p>
            <pre style={{ background: '#eee', padding: '5px' }}>{JSON.stringify(checklistState.fields, null, 2)}</pre>
          </div>
        ) : (
          <p>No checklist open.</p>
        )}
      </div>
    </div>
  );
}
