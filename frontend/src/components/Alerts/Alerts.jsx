import React, { useState, useEffect, useCallback, useRef } from 'react';
import findingsData from '../../Data/findings.json';
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onAlertClick, onFindingsChange }) => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [uniqueFindings, setUniqueFindings] = useState([]);
  const prevSentFindings = useRef(null); // כדי לעקוב אם שלחנו את אותו מידע קודם

  // סינון לפי רמות חומרה
  const filterFindings = useCallback((findings, severities) => {
    // Handle both direct findings array and nested Findings structure
    const findingsArray = Array.isArray(findings) ? findings : 
                         (findings.Findings || []);
    
    // First ensure we have unique findings by ID
    const uniqueById = Array.from(new Map(findingsArray.map(finding => [finding.Id, finding])).values());
    
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
  }, []);

  // ייחודיות לפי ID - רץ רק פעם אחת
  useEffect(() => {
    // Handle both direct findings array and nested Findings structure
    const findingsArray = Array.isArray(findingsData) ? findingsData : 
                         (findingsData.Findings || []);
    
    const seenIds = new Set();
    const unique = findingsArray.filter(finding => {
      if (seenIds.has(finding.Id)) {
        console.warn(`Duplicate finding ID found: ${finding.Id}`);
        return false;
      }
      seenIds.add(finding.Id);
      return true;
    });
    setUniqueFindings(unique);
  }, []);

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
        {filteredFindings.map((finding, index) => (
          <AlertCard 
            key={`${finding.Id}-${index}`} 
            finding={finding}
            onAlertClick={onAlertClick}
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
  );
};

export default Alerts;
