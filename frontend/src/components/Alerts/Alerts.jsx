import React, { useState, useEffect, useCallback, useRef } from 'react';
import AlertCard from '../AlertCard/AlertCard';
import AlertFilters from '../AlertFilters/AlertFilters';
import './Alerts.css';

const Alerts = ({ onAlertClick, filteredFindings, filterLabel, onClearFilter, onFindingsChange, initialStatus }) => {
  const [allFindings, setAllFindings] = useState([]);
  const [displayedFindings, setDisplayedFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
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

  // Fetch findings data
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
        if (onFindingsChange) {
          onFindingsChange(sortedFindings);
        }
      }
    } catch (error) {
      console.error('Error fetching findings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [onFindingsChange]);

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchFindings();

    // Set up polling interval (every 5 seconds)
    const pollInterval = setInterval(fetchFindings, 5000);

    // Clean up on unmount
    return () => clearInterval(pollInterval);
  }, [fetchFindings]);

  // Update displayed findings when filters change or filtered findings change
  useEffect(() => {
    const sourceFindings = filteredFindings || allFindings;
    setDisplayedFindings(applyFilters(sourceFindings));
  }, [allFindings, applyFilters, filteredFindings]);

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
  const baseFindings = filteredFindings || allFindings;
  const filteredBySeverity = baseFindings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  );
  
  const openCount = filteredBySeverity.filter(f => !f.Service?.Archived).length;
  const resolvedCount = filteredBySeverity.filter(f => f.Service?.Archived).length;

  // Update selectedStatus if initialStatus changes (e.g., when navigating from chart)
  useEffect(() => {
    setSelectedStatus(initialStatus);
  }, [initialStatus]);

  if (loading && allFindings.length === 0) {
    return <div className="loading">Loading alerts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="alerts-page">
      {/* Filter Label Display */}
      {filterLabel && (
        <div className="filter-label-container">
          <div className="filter-label" style={{ background: '#f5f7fa', color: '#222', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 8 }}>
            <span className="filter-icon" style={{ fontSize: '1.2rem' }}>🔍</span>
            <span className="filter-text">Showing alerts for: {filterLabel}</span>
            <button 
              className="clear-filter-btn"
              style={{
                background: '#ffeded',
                color: '#d32f2f',
                border: '1px solid #f8bbbb',
                fontWeight: 600,
                marginLeft: 12,
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(211,47,47,0.08)'
              }}
              onClick={onClearFilter}
            >
              ✕ Clear Location Filter
            </button>
          </div>
        </div>
      )}
      
      <AlertFilters 
        selectedSeverities={selectedSeverities}
        onSeverityChange={handleSeverityChange}
        findings={baseFindings}
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
              {filterLabel 
                ? "No alerts found for the selected filter and severity levels"
                : selectedSeverities.length > 0 
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
