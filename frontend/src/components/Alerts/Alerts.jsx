import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onAlertClick }) => {
  const [allFindings, setAllFindings] = useState([]);
  const [displayedFindings, setDisplayedFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('open');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevSentFindings = useRef(null);

  // Sort findings by severity
  const sortFindingsBySeverity = (findings) => {
    return [...findings].sort((a, b) => {
      const severityA = a.Severity || 0;
      const severityB = b.Severity || 0;
      return severityB - severityA;
    });
  };

  // Fetch alerts with filters
  const fetchAlerts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (selectedSeverities.length > 0) {
        params.append('severity', selectedSeverities.join(','));
      }
      const response = await fetch(`http://localhost:5000/api/findings?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch findings');
      }

      const data = await response.json();
      const sortedData = sortFindingsBySeverity(data);
      
      // Smooth transition for updates
      setIsRefreshing(true);
      setAllFindings(sortedData);
      
      const filteredFindings = sortedData.filter(finding => {
        const isArchived = finding.Service?.Archived;
        return selectedStatus === 'open' ? !isArchived : isArchived;
      });
      setDisplayedFindings(filteredFindings);

      // Reset refreshing state after a short delay
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [selectedSeverities, selectedStatus]);

  // Initial fetch and filter changes
  useEffect(() => {
    fetchAlerts(true);
  }, [fetchAlerts]);

  // Set up periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchAlerts(false); // Don't show loading state for periodic refreshes
    }, 5000);
    return () => clearInterval(refreshInterval);
  }, [fetchAlerts]);

  // Handle severity filter change
  const handleSeverityChange = (severity) => {
    setSelectedSeverities(prev => {
      if (prev.includes(severity)) {
        return prev.filter(s => s !== severity);
      }
      return [...prev, severity];
    });
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  // Handle alert status change
  const handleAlertStatusChange = async (alertId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/findings/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Service: {
            Archived: newStatus === 'closed'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      // Update local state immediately
      setAllFindings(prevFindings => {
        const updatedFindings = prevFindings.map(finding => 
          finding.Id === alertId 
            ? {
                ...finding,
                Service: {
                  ...finding.Service,
                  Archived: newStatus === 'closed'
                }
              }
            : finding
        );
        return sortFindingsBySeverity(updatedFindings);
      });

      // Trigger a smooth refresh
      fetchAlerts(false);
    } catch (err) {
      console.error('Error updating alert status:', err);
      setError(err.message);
    }
  };

  // Calculate counts from all findings
  const openCount = allFindings.filter(f => !f.Service?.Archived).length;
  const resolvedCount = allFindings.filter(f => f.Service?.Archived).length;

  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="alerts-page">
      <AlertFilters 
        selectedSeverities={selectedSeverities}
        onSeverityChange={setSelectedSeverities}
        findings={allFindings}
      />
      <div className="alerts-container">
        <div className="alerts-status-container">
          <div className="alerts-status-filters">
            <button 
              className={`status-filter-button ${selectedStatus === 'open' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('open')}
            >
              Open Alerts
              <span className="status-count">{openCount}</span>
            </button>
            <button 
              className={`status-filter-button ${selectedStatus === 'resolved' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('resolved')}
            >
              Resolved Alerts
              <span className="status-count">{resolvedCount}</span>
            </button>
          </div>
        </div>
        <div className={`alerts-list ${isRefreshing ? 'refreshing' : ''}`}>
          {displayedFindings.map((finding, index) => (
            <AlertCard 
              key={`${finding.Id}-${index}`} 
              finding={finding}
              onStatusChange={handleAlertStatusChange}
              onChatOpen={onAlertClick}
            />
          ))}
          {displayedFindings.length === 0 && (
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
