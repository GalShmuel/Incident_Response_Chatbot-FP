import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './AlertCard.css';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaExclamationCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import AlertDetails from './AlertDetails';

const getSeverityColor = (severity) => {
  const colors = {
    1: '#00C851',  // Bright Green
    2: '#7CB342',  // Light Green
    3: '#CDDC39',  // Lime
    4: '#FFEB3B',  // Yellow
    5: '#FFC107',  // Amber
    6: '#FF9800',  // Orange
    7: '#FF5722',  // Deep Orange
    8: '#F44336',  // Red
    9: '#D32F2F',  // Dark Red
    10: '#B22222'  // Firebrick
  };
  return colors[severity] || '#00C851';
};

const getSeverityLabel = (severity) => {
  switch (severity) {
    case 1: return 'Very Low';
    case 2: return 'Low';
    case 3: return 'Slightly Elevated';
    case 4: return 'Moderate';
    case 5: return 'Medium';
    case 6: return 'Medium-High';
    case 7: return 'High';
    case 8: return 'Very High';
    case 9: return 'Critical';
    case 10: return 'Severe';
    default: return 'Very Low';
  }
};

const hexToRGBA = (hex, alpha = 0.2) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString();
};

const AlertCard = ({ finding, onStatusChange, onChatOpen }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(finding.Service?.Archived ? 'resolved' : 'open');
  const [isResolving, setIsResolving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState(finding.Severity);
  const statusRef = React.useRef(null);

  const handleMouseEnter = (e) => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking status
    if (isAnimating) return;
    
    setIsAnimating(true);
    const newStatus = currentStatus === 'open' ? 'resolved' : 'open';
    
    // Start both status icon and card animations immediately
    const statusIcon = document.querySelector(`#status-${finding.Id}`);
    if (statusIcon) {
      statusIcon.classList.add('exiting');
    }

    // If resolving, start the card fade out immediately
    if (newStatus === 'resolved') {
      setIsResolving(true);
    }

    // Update status after a short delay
    setTimeout(() => {
      setCurrentStatus(newStatus);
      onStatusChange(finding.Id, newStatus === 'resolved' ? 'closed' : 'open', selectedSeverity);
      
      if (statusIcon) {
        statusIcon.classList.remove('exiting');
        statusIcon.classList.add('entering');
      }

      // Remove animation classes after animation completes
      setTimeout(() => {
        if (statusIcon) {
          statusIcon.classList.remove('entering');
        }
        setIsAnimating(false);
        setIsResolving(false); // Reset resolving state
      }, 300);
    }, 300);
  };

  const handleSeverityChange = (e) => {
    e.stopPropagation(); // Prevent card click when changing severity
    const newSeverity = parseInt(e.target.value);
    setSelectedSeverity(newSeverity);
    onStatusChange(finding.Id, currentStatus === 'resolved' ? 'closed' : 'open', newSeverity);
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const severityColor = getSeverityColor(selectedSeverity);
  const severityLabel = getSeverityLabel(selectedSeverity);

  return (
    <>
      <div className="alert-card-wrapper">
        <div 
          className={`alert-card ${isResolving ? 'resolving' : ''} ${isExpanded ? 'expanded' : ''}`}
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
        >
          <div className="alert-severity-indicator" style={{ backgroundColor: severityColor }} />
          <div className="alert-card-content">
            <div className="alert-main">
              <div 
                ref={statusRef}
                className="alert-status" 
                onClick={handleStatusClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {currentStatus === 'open' ? (
                  <FaExclamationCircle 
                    id={`status-${finding.Id}`}
                    className={`status-icon ${currentStatus}`}
                  />
                ) : (
                  <FaCheckCircle 
                    id={`status-${finding.Id}`}
                    className={`status-icon ${currentStatus}`}
                  />
                )}
              </div>
              <FaExclamationTriangle 
                className="alert-icon"
                style={{ color: severityColor }}
              />
              <h3>{finding.Title || finding.displayData?.title || 'Untitled Alert'}</h3>
            </div>
            <div className="alert-meta">
              <div 
                className="severity-badge"
                style={{ 
                  backgroundColor: hexToRGBA(severityColor, 0.15),
                  color: severityColor,
                  borderColor: severityColor
                }}
              >
                {severityLabel}
              </div>
              <div className="meta-item">
                <FaClock className="meta-icon" />
                <span>{formatDate(finding.CreatedAt || finding.displayData?.createdAt)}</span>
              </div>
              <div className="alert-id">#{finding.Id}</div>
              <div className="expand-icon">
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="alert-details">
            <AlertDetails finding={finding} onChatOpen={onChatOpen} />
          </div>
        )}
      </div>
      {showTooltip && createPortal(
        <div 
          className="status-tooltip"
          style={{
            position: 'fixed',
            top: statusRef.current ? statusRef.current.getBoundingClientRect().bottom + 10 : 0,
            left: statusRef.current ? statusRef.current.getBoundingClientRect().left + (statusRef.current.offsetWidth / 2) : 0,
            transform: 'translateX(-50%)'
          }}
        >
          Click to {currentStatus === 'open' ? 'resolve' : 'reopen'} alert
        </div>,
        document.body
      )}
    </>
  );
};

export default AlertCard;