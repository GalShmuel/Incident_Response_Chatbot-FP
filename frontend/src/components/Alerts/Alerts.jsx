import React, { useState } from 'react';
import findings from '../../Data/findings.json'
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = () => {
  const [selectedSeverities, setSelectedSeverities] = useState([]);

  const filteredFindings = findings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  );

  return (
    <div className="alerts-page">
      <AlertFilters 
        selectedSeverities={selectedSeverities}
        onSeverityChange={setSelectedSeverities}
        findings={findings}
      />
      <div className="alerts-container">
        {filteredFindings.map((finding) => (
          <AlertCard key={finding.Id} finding={finding} />
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