import React, { useState, useEffect, useCallback, useRef } from 'react';
import findingsData from '../../Data/findings.json';
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onAlertClick, onFindingsChange }) => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [uniqueFindings, setUniqueFindings] = useState([]);
  const [activeSection, setActiveSection] = useState('open'); // 'open' or 'resolved'
  const prevSentFindings = useRef(null);

  // Add status to findings if not present
  const addStatusToFindings = useCallback((findings) => {
    return findings.map(finding => ({
      ...finding,
      Status: finding.Status || 'open' // Default to 'open' if status not set
    }));
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((findingId, newStatus) => {
    setUniqueFindings(prevFindings => 
      prevFindings.map(finding => 
        finding.Id === findingId 
          ? { ...finding, Status: newStatus }
          : finding
      )
    );
  }, []);

  // Filter findings by severity and status
  const filterFindings = useCallback((findings, severities) => {
    // Handle both direct findings array and nested Findings structure
    const findingsArray = Array.isArray(findings) ? findings : 
                         (findings.Findings || []);
    
    // First ensure we have unique findings by ID and add status
    const uniqueById = Array.from(new Map(
      addStatusToFindings(findingsArray).map(finding => [finding.Id, finding])
    ).values());
    
    return uniqueById
      .filter(finding =>
        severities.length === 0 || severities.includes(finding.Severity)
      )
      .sort((a, b) => {
        // Ensure we're working with numbers
        const severityA = parseInt(a.Severity, 10);
        const severityB = parseInt(b.Severity, 10);
        
        // Primary sort by severity
        if (severityB !== severityA) {
          return severityB - severityA;
        }
        
        // Secondary sort by creation date
        const dateA = new Date(a.CreatedAt).getTime();
        const dateB = new Date(b.CreatedAt).getTime();
        return dateB - dateA;
      });
  }, [addStatusToFindings]);

  // Initialize unique findings with status
  useEffect(() => {
    // Handle both direct findings array and nested Findings structure
    const findingsArray = Array.isArray(findingsData) ? findingsData : 
                         (findingsData.Findings || []);
    
    const seenIds = new Set();
    const unique = addStatusToFindings(findingsArray).filter(finding => {
      if (seenIds.has(finding.Id)) {
        console.warn(`Duplicate finding ID found: ${finding.Id}`);
        return false;
      }
      seenIds.add(finding.Id);
      return true;
    });
    setUniqueFindings(unique);
  }, [addStatusToFindings]);

  // Update parent with filtered findings
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
  
  // Group findings by status
  const openFindings = filteredFindings.filter(finding => finding.Status === 'open');
  const resolvedFindings = filteredFindings.filter(finding => finding.Status === 'resolved');

  return (
    <div className="alerts-page">
      <AlertFilters 
        selectedSeverities={selectedSeverities}
        onSeverityChange={setSelectedSeverities}
        findings={uniqueFindings}
      />
      <div className="alerts-container">
        <div className="alerts-sections">
          <div 
            className={`section-header ${activeSection === 'open' ? 'active' : ''}`}
            onClick={() => setActiveSection('open')}
          >
            <h3>Open Alerts</h3>
            <span className="section-count">{openFindings.length}</span>
          </div>
          <div 
            className={`section-header ${activeSection === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveSection('resolved')}
          >
            <h3>Resolved Alerts</h3>
            <span className="section-count">{resolvedFindings.length}</span>
          </div>
        </div>

        <div className="alerts-content">
          {activeSection === 'open' && (
            <div className="alerts-list">
              {openFindings.length > 0 ? (
                openFindings.map((finding, index) => (
                  <AlertCard 
                    key={`${finding.Id}-${index}`} 
                    finding={finding}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <div className="no-results">No open alerts found</div>
              )}
            </div>
          )}

          {activeSection === 'resolved' && (
            <div className="alerts-list">
              {resolvedFindings.length > 0 ? (
                resolvedFindings.map((finding, index) => (
                  <AlertCard 
                    key={`${finding.Id}-${index}`} 
                    finding={finding}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <div className="no-results">No resolved alerts found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
