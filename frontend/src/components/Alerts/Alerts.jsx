import React, { useState, useEffect } from 'react';
import findings from '../../Data/findings.json'
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onAlertClick }) => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [uniqueFindings, setUniqueFindings] = useState([]);

  useEffect(() => {
    // Create a Set to track seen IDs
    const seenIds = new Set();
    // Filter out duplicates and add index to make keys unique
    const unique = findings.filter(finding => {
      if (seenIds.has(finding.Id)) {
        console.warn(`Duplicate finding ID found: ${finding.Id}`);
        return false;
      }
      seenIds.add(finding.Id);
      return true;
    });
    setUniqueFindings(unique);
  }, []);

  const filteredFindings = uniqueFindings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  );

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