import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AnsibleDeploy.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AnsibleDeploy({ theme, currentTheme, onClose }) {
  const [step, setStep] = useState('info'); // 'info', 'deployment', 'history'
  const [deploymentType, setDeploymentType] = useState('check');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([]);
  const [ansibleInfo, setAnsibleInfo] = useState(null);
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    fetchAnsibleInfo();
    fetchDeploymentHistory();
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const fetchAnsibleInfo = async () => {
    try {
      const res = await axios.get(`${API_URL}/ansible/info`);
      setAnsibleInfo(res.data);
    } catch (err) {
      console.error('Error fetching Ansible info:', err);
    }
  };

  const fetchDeploymentHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/ansible/deployments`);
      setDeploymentHistory(res.data);
    } catch (err) {
      console.error('Error fetching deployment history:', err);
    }
  };

  const runDeployment = async () => {
    setIsRunning(true);
    setOutput([]);
    setCurrentDeployment(null);
    setStep('deployment');

    try {
      const response = await axios.post(`${API_URL}/ansible/run`, {
        type: deploymentType,
        dryRun: deploymentType === 'check'
      }, {
        responseType: 'stream'
      });

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          try {
            const data = JSON.parse(lines[i]);
            setOutput(prev => [...prev, data]);
            if (data.status === 'success' || data.status === 'failed') {
              setCurrentDeployment(data);
              setIsRunning(false);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
        
        buffer = lines[lines.length - 1];
      }
    } catch (err) {
      setOutput(prev => [...prev, {
        status: 'error',
        error: err.message || 'Deployment failed'
      }]);
      setIsRunning(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return '#10B981';
      case 'failed': return '#EF4444';
      case 'running': return '#F59E0B';
      default: return currentTheme.text;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'pending': return '⏹️';
      default: return '📋';
    }
  };

  return (
    <div className="ansible-deploy-wrapper" style={{ color: currentTheme.text }}>
      {/* Navigation Tabs */}
      <div className="ansible-tabs">
        <button
          className={`ansible-tab ${step === 'info' ? 'active' : ''}`}
          onClick={() => setStep('info')}
          style={{
            borderBottomColor: step === 'info' ? currentTheme.primary : 'transparent'
          }}
        >
          📖 Information
        </button>
        <button
          className={`ansible-tab ${step === 'deployment' ? 'active' : ''}`}
          onClick={() => setStep('deployment')}
          style={{
            borderBottomColor: step === 'deployment' ? currentTheme.primary : 'transparent'
          }}
        >
          🚀 Deployment
        </button>
        <button
          className={`ansible-tab ${step === 'history' ? 'active' : ''}`}
          onClick={() => setStep('history')}
          style={{
            borderBottomColor: step === 'history' ? currentTheme.primary : 'transparent'
          }}
        >
          📜 History
        </button>
      </div>

      {/* Information Tab */}
      {step === 'info' && (
        <div className="ansible-content">
          <div className="ansible-header">
            <h2>🤖 Ansible Kubernetes Automation</h2>
            <p>Automated deployment of a 3-node Kubernetes cluster</p>
          </div>

          {ansibleInfo && (
            <>
              <div className="info-section">
                <h3>📋 Description</h3>
                <p>{ansibleInfo.description}</p>
              </div>

              <div className="info-section">
                <h3>⏱️ Estimated Time</h3>
                <p className="time-badge">{ansibleInfo.estimatedTime}</p>
              </div>

              <div className="info-section">
                <h3>✨ Features</h3>
                <ul className="features-list">
                  {ansibleInfo.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="info-section">
                <h3>📍 Deployment Phases</h3>
                <div className="phases-grid">
                  {ansibleInfo.phases.map((phase, idx) => (
                    <div key={idx} className="phase-card" style={{
                      backgroundColor: currentTheme.hover,
                      borderColor: currentTheme.border
                    }}>
                      <div className="phase-number" style={{ backgroundColor: currentTheme.primary }}>
                        {idx + 1}
                      </div>
                      <div className="phase-name">{phase}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-section">
                <h3>✅ Requirements</h3>
                <ul className="requirements-list">
                  {ansibleInfo.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="info-section">
                <button
                  className="btn btn-large btn-primary"
                  onClick={() => setStep('deployment')}
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  🚀 Start Deployment
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Deployment Tab */}
      {step === 'deployment' && (
        <div className="ansible-content">
          <div className="deployment-section">
            <h3>🎯 Deployment Type</h3>
            
            <div className="deployment-options">
              <label className="deployment-option">
                <input
                  type="radio"
                  value="check"
                  checked={deploymentType === 'check'}
                  onChange={(e) => setDeploymentType(e.target.value)}
                  disabled={isRunning}
                />
                <div className="option-content">
                  <span className="option-title">🔍 Dry Run (Check Only)</span>
                  <span className="option-desc">Validates playbook without making changes</span>
                </div>
              </label>

              <label className="deployment-option">
                <input
                  type="radio"
                  value="apply"
                  checked={deploymentType === 'apply'}
                  onChange={(e) => setDeploymentType(e.target.value)}
                  disabled={isRunning}
                />
                <div className="option-content">
                  <span className="option-title">⚙️ Full Deployment</span>
                  <span className="option-desc">Applies configuration changes to servers</span>
                </div>
              </label>
            </div>

            <button
              className="btn btn-large btn-primary"
              onClick={runDeployment}
              disabled={isRunning}
              style={{
                backgroundColor: currentTheme.primary,
                opacity: isRunning ? 0.6 : 1,
                cursor: isRunning ? 'not-allowed' : 'pointer'
              }}
            >
              {isRunning ? '⏳ Running...' : '▶️ Execute Playbook'}
            </button>
          </div>

          {/* Output Terminal */}
          {output.length > 0 && (
            <div className="output-section">
              <h3>📡 Live Output</h3>
              <div className="terminal" style={{
                backgroundColor: '#1E1E1E',
                borderColor: currentTheme.border
              }} ref={outputRef}>
                {output.map((item, idx) => (
                  <div key={idx} className="terminal-line">
                    {item.output && (
                      <span className="output-line">{item.output}</span>
                    )}
                    {item.error && (
                      <span className="error-line" style={{ color: '#EF4444' }}>
                        {item.error}
                      </span>
                    )}
                    {item.message && (
                      <span className="message-line" style={{ color: '#10B981' }}>
                        {item.message}
                      </span>
                    )}
                    {item.status && (item.status === 'success' || item.status === 'failed') && (
                      <div className="status-summary">
                        <span style={{ color: getStatusColor(item.status) }}>
                          {getStatusIcon(item.status)} {item.status.toUpperCase()}
                        </span>
                        {item.duration && <span> - Duration: {item.duration}s</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentDeployment && (
                <div className="deployment-summary" style={{
                  backgroundColor: currentTheme.hover,
                  borderColor: getStatusColor(currentDeployment.status)
                }}>
                  <h4>{getStatusIcon(currentDeployment.status)} Deployment Summary</h4>
                  <p><strong>Status:</strong> <span style={{ color: getStatusColor(currentDeployment.status) }}>
                    {currentDeployment.status.toUpperCase()}
                  </span></p>
                  {currentDeployment.duration && (
                    <p><strong>Duration:</strong> {currentDeployment.duration.toFixed(2)} seconds</p>
                  )}
                  {currentDeployment.message && (
                    <p><strong>Message:</strong> {currentDeployment.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {step === 'history' && (
        <div className="ansible-content">
          <h3>📜 Deployment History</h3>
          
          {deploymentHistory.length === 0 ? (
            <div className="empty-history">
              <p>No deployments yet. Start your first deployment to see history here.</p>
            </div>
          ) : (
            <div className="history-list">
              {deploymentHistory.map((dep) => (
                <div key={dep._id} className="history-item" style={{
                  backgroundColor: currentTheme.hover,
                  borderLeftColor: getStatusColor(dep.status)
                }}>
                  <div className="history-header">
                    <span className="history-status" style={{ color: getStatusColor(dep.status) }}>
                      {getStatusIcon(dep.status)} {dep.status.toUpperCase()}
                    </span>
                    <span className="history-type">{dep.type === 'check' ? '🔍 Dry Run' : '⚙️ Deployment'}</span>
                    <span className="history-time">
                      {new Date(dep.startTime).toLocaleString()}
                    </span>
                  </div>
                  {dep.duration && (
                    <div className="history-duration">
                      ⏱️ Duration: {dep.duration.toFixed(2)}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <button className="close-btn" onClick={onClose} style={{ color: currentTheme.text }}>
        ✕ Close
      </button>
    </div>
  );
}
