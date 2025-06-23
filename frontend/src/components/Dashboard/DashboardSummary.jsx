import React from 'react';
import './DashboardSummary.css';

const DashboardSummary = ({ findings }) => {
  const totalAlerts = findings.length;
  const highLevelAlerts = findings.filter(f => f.Severity >= 8).length;
  const unauthorizedAccess = findings.filter(f =>
    (f.Type || '').includes('UnauthorizedAccess')
  ).length;
  const networkConnection = findings.filter(f =>
    f.Service?.Action?.ActionType === 'NETWORK_CONNECTION'
  ).length;

  const tiles = [
    { label: 'Total Alerts', value: totalAlerts, color: '#1976d2' },
    { label: 'Level 8 or above alerts', value: highLevelAlerts, color: '#d32f2f' },
    { label: 'Unauthorized Access Alerts', value: unauthorizedAccess, color: '#f57c00' },
    { label: 'Network Connection Alerts', value: networkConnection, color: '#388e3c' },
  ];

  return (
    <div className="dashboard-summary-row">
      {tiles.map(tile => (
        <div className="dashboard-summary-tile" key={tile.label} style={{ borderBottom: `4px solid ${tile.color}` }}>
          <div className="dashboard-summary-value" style={{ color: tile.color }}>{tile.value}</div>
          <div className="dashboard-summary-label">{tile.label}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSummary; 