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
  const lastModifiedRef = useRef(null);

  // Sort findings by severity
  const sortFindingsBySeverity = (findings) => {
    return [...findings].sort((a, b) => {
      const severityA = a.Severity || 0;
      const severityB = b.Severity || 0;
      return severityB - severityA;
    });
  };

  // Apply filters to findings
  const applyFilters = useCallback((findings) => {
    let filtered = [...findings];
    
    // Apply severity filter
    if (selectedSeverities.length > 0) {
      filtered = filtered.filter(finding => selectedSeverities.includes(finding.Severity));
    }
    
    // Apply status filter
    filtered = filtered.filter(finding => 
      selectedStatus === 'open' ? !finding.Service?.Archived : finding.Service?.Archived
    );
    
    return sortFindingsBySeverity(filtered);
  }, [selectedSeverities, selectedStatus]);

  // Fetch findings datad
  const fetchFindings = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/findings');
      if (!response.ok) {
        throw new Error('Failed to fetch findings');
      }
      const data = await response.json();
      
      // Only update if data has changed
      if (data.lastModified !== lastModifiedRef.current) {
        lastModifiedRef.current = data.lastModified;
        const sortedFindings = sortFindingsBySeverity(data.findings || []);
        setAllFindings(sortedFindings);
        setDisplayedFindings(applyFilters(sortedFindings));
        setLoading(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching findings:', error);
      setError(error.message);
      setLoading(false);
    }
  }, [applyFilters]);

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchFindings();

    // Set up polling interval (every 5 seconds)
    const pollInterval = setInterval(fetchFindings, 5000);

    // Clean up on unmount
    return () => clearInterval(pollInterval);
  }, [fetchFindings]);

  // Update displayed findings when filters change
  useEffect(() => {
    setDisplayedFindings(applyFilters(allFindings));
  }, [allFindings, applyFilters]);

  // Handle severity filter change
  const handleSeverityChange = (severities) => {
    setSelectedSeverities(severities);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  };

  // Handle alert status change
  const handleAlertStatusChange = async (alertId, newStatus, newSeverity) => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`http://localhost:5000/api/findings/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Severity: newSeverity,
          Service: {
            Archived: newStatus === 'closed'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      // Fetch updated data
      await fetchFindings();
    } catch (err) {
      console.error('Error updating alert status:', err);
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate counts from filtered findings based on selected severities
  const filteredBySeverity = allFindings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  );
  
  const openCount = filteredBySeverity.filter(f => !f.Service?.Archived).length;
  const resolvedCount = filteredBySeverity.filter(f => f.Service?.Archived).length;

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
        onSeverityChange={handleSeverityChange}
        findings={allFindings}
      />
      <div className="alerts-container">
        <div className="alerts-status-container">
          <div className="alerts-status-filters">
            <button 
              className={`status-filter-button ${selectedStatus === 'open' ? 'active' : ''}`}
              onClick={() => handleStatusChange('open')}
            >
              Open Alerts
              <span className="status-count">{openCount}</span>
            </button>
            <button 
              className={`status-filter-button ${selectedStatus === 'resolved' ? 'active' : ''}`}
              onClick={() => handleStatusChange('resolved')}
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
