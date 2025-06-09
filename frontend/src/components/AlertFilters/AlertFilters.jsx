import React from 'react';
import './AlertFilters.css';

const severityLevels = [
  { value: 1, label: 'Very Low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Slightly Elevated' },
  { value: 4, label: 'Moderate' },
  { value: 5, label: 'Medium' },
  { value: 6, label: 'Medium-High' },
  { value: 7, label: 'High' },
  { value: 8, label: 'Very High' },
  { value: 9, label: 'Critical' },
  { value: 10, label: 'Severe' }
];

const AlertFilters = ({ selectedSeverities, onSeverityChange, findings }) => {
  const handleSeverityToggle = (severity) => {
    if (selectedSeverities.includes(severity)) {
      onSeverityChange(selectedSeverities.filter(s => s !== severity));
    } else {
      onSeverityChange([...selectedSeverities, severity]);
    }
  };

  // Calculate total counts for each severity level (all alerts)
  const totalSeverityCounts = severityLevels.reduce((acc, { value }) => {
    acc[value] = findings.filter(finding => finding.Severity === value).length;
    return acc;
  }, {});

  // Calculate current filtered alerts count
  const currentAlertsCount = findings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  ).length;

  return (
    <div className="filters-container">
      <div className="filters-header">
        <div className="filters-title">
          <h2>Severity Filters</h2>
          <span className="total-count">{currentAlertsCount} total alerts</span>
        </div>
        <button 
          className="clear-filters"
          onClick={() => onSeverityChange([])}
          disabled={selectedSeverities.length === 0}
        >
          Clear Filters
        </button>
      </div>
      <div className="severity-filters">
        {severityLevels.map(({ value, label }) => (
          <button
            key={value}
            className={`severity-filter ${selectedSeverities.includes(value) ? 'active' : ''} ${totalSeverityCounts[value] === 0 ? 'empty' : ''}`}
            onClick={() => handleSeverityToggle(value)}
            disabled={totalSeverityCounts[value] === 0}
          >
            <span className="severity-dot" style={{ 
              backgroundColor: selectedSeverities.includes(value) ? 'currentColor' : 'transparent' 
            }} />
            <span className="filter-label">{label}</span>
            <span className="count-badge">{totalSeverityCounts[value]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlertFilters; 