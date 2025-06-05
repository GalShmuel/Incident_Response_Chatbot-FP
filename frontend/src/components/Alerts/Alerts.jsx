import React, { useState, useEffect, useCallback, useRef } from 'react';
import findingsData from '../../Data/findings.json';
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onFindingsChange, onAlertClick }) => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [uniqueFindings, setUniqueFindings] = useState([]);
  const prevSentFindings = useRef(null);

  // Load saved alert states from localStorage on component mount
  useEffect(() => {
    const savedAlertStates = localStorage.getItem('alertStates');
    if (savedAlertStates) {
      const parsedStates = JSON.parse(savedAlertStates);
      // Initialize findings with saved states
      const findingsWithSavedStates = findingsData.map(finding => ({
        ...finding,
        Status: parsedStates[finding.Id] || finding.Status || 'open'
      }));
      setUniqueFindings(findingsWithSavedStates);
    } else {
      // Initialize with default states if no saved states exist
      setUniqueFindings(addStatusToFindings(findingsData));
    }
  }, []);

  // Add status to findings if not present
  const addStatusToFindings = useCallback((findings) => {
    return findings.map(finding => ({
      ...finding,
      Status: finding.Status || 'open' // Default to 'open' if status not set
    }));
  }, []);

  // Handle status change and save to localStorage
  const handleStatusChange = useCallback((findingId, newStatus) => {
    setUniqueFindings(prevFindings => {
      const updatedFindings = prevFindings.map(finding => 
        finding.Id === findingId 
          ? { ...finding, Status: newStatus }
          : finding
      );
      
      // Save updated states to localStorage
      const alertStates = updatedFindings.reduce((acc, finding) => {
        acc[finding.Id] = finding.Status;
        return acc;
      }, {});
      localStorage.setItem('alertStates', JSON.stringify(alertStates));
      
      return updatedFindings;
    });
  }, []);

  // Filter findings by severity and status
  const filterFindings = useCallback((findings, severities) => {
    const findingsArray = Array.isArray(findings) ? findings : 
                         (findings.Findings || []);
    
    const uniqueById = Array.from(new Map(
      addStatusToFindings(findingsArray).map(finding => [finding.Id, finding])
    ).values());
    
    return uniqueById
      .filter(finding =>
        (severities.length === 0 || severities.includes(finding.Severity)) &&
        finding.Status === selectedStatus
      )
      .sort((a, b) => {
        const severityA = parseInt(a.Severity, 10);
        const severityB = parseInt(b.Severity, 10);
        
        if (severityB !== severityA) {
          return severityB - severityA;
        }
        
        const dateA = new Date(a.CreatedAt).getTime();
        const dateB = new Date(b.CreatedAt).getTime();
        return dateB - dateA;
      });
  }, [addStatusToFindings, selectedStatus]);

  // עדכון הורה בממצאים מסוננים — רק אם הם באמת שונים מהקודמים
  useEffect(() => {
    if (onFindingsChange) {
      const filtered = filterFindings(uniqueFindings, selectedSeverities);
      const currentStr = JSON.stringify(filtered);
      const prevStr = prevSentFindings.current;

      if (currentStr !== prevStr) {
        prevSentFindings.current = currentStr;
        onFindingsChange(filtered);
      }
    }
  }, [uniqueFindings, selectedSeverities, filterFindings, onFindingsChange]);

  const filteredFindings = filterFindings(uniqueFindings, selectedSeverities);

  return (
    <div className="alerts-page">
      <AlertFilters 
        selectedSeverities={selectedSeverities}
        onSeverityChange={setSelectedSeverities}
        findings={uniqueFindings}
      />
      <div className="alerts-container">
        <div className="alerts-status-container">
          <div className="alerts-status-filters">
            <button 
              className={`status-filter-button ${selectedStatus === 'open' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('open')}
            >
              Open Alerts
              <span className="status-count">
                {uniqueFindings.filter(f => f.Status === 'open').length}
              </span>
            </button>
            <button 
              className={`status-filter-button ${selectedStatus === 'resolved' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('resolved')}
            >
              Resolved Alerts
              <span className="status-count">
                {uniqueFindings.filter(f => f.Status === 'resolved').length}
              </span>
            </button>
          </div>
        </div>
        <div className="alerts-list">
          {filteredFindings.map((finding, index) => (
            <AlertCard 
              key={`${finding.Id}-${index}`} 
              finding={finding}
              onStatusChange={handleStatusChange}
              onChatOpen={onAlertClick}
            />
          ))}
          {filteredFindings.length === 0 && (
            <div className="no-results">
              {selectedSeverities.length > 0 
                ? "No alerts found for the selected severity levels"
                : "No alerts found"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
