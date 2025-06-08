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
  const eventSourceRef = useRef(null);

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

  // Handle SSE events
  const handleSSEEvent = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'initial':
          setAllFindings(sortFindingsBySeverity(data.findings));
          setDisplayedFindings(applyFilters(data.findings));
          setLoading(false);
          break;
          
        case 'update':
          setAllFindings(prevFindings => {
            const updatedFindings = prevFindings.map(finding => 
              finding.Id === data.data.finding.Id ? data.data.finding : finding
            );
            const sortedFindings = sortFindingsBySeverity(updatedFindings);
            setDisplayedFindings(applyFilters(sortedFindings));
            return sortedFindings;
          });
          break;
          
        default:
          console.warn('Unknown SSE event type:', data.type);
      }
    } catch (error) {
      console.error('Error handling SSE event:', error);
    }
  }, [applyFilters]);

  // Set up SSE connection
  useEffect(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new SSE connection
    const eventSource = new EventSource('http://localhost:5000/api/findings/events');
    eventSourceRef.current = eventSource;

    // Set up event handlers
    eventSource.onmessage = handleSSEEvent;
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setError('Lost connection to server. Please refresh the page.');
      eventSource.close();
    };

    // Clean up on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [handleSSEEvent]);

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

      // The SSE connection will handle the update automatically
    } catch (err) {
      console.error('Error updating alert status:', err);
      setError(err.message);
    }
  };

  // Calculate counts from filtered findings based on selected severities
  const filteredBySeverity = allFindings.filter(finding => 
    selectedSeverities.length === 0 || selectedSeverities.includes(finding.Severity)
  );
  
  const openCount = filteredBySeverity.filter(f => !f.Service?.Archived).length;
  const resolvedCount = filteredBySeverity.filter(f => f.Service?.Archived).length;

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
