import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './AlertCard.css';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaExclamationCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import AlertDetails from './AlertDetails';

const getSeverityColor = (severity) => {
  switch (severity) {
    case 1: return '#E0E0E0'; // Very Low - Light Gray
    case 2: return '#D6CFC7'; // Low - Beige Gray
    case 3: return '#F0D98C'; // Slightly Elevated - Pale Yellow
    case 4: return '#F6C244'; // Moderate - Yellow
    case 5: return '#FFB300'; // Medium - Vivid Amber
    case 6: return '#FFA000'; // Medium-High - Deeper Amber
    case 7: return '#FF8C42'; // High - Orange
    case 8: return '#FF7043'; // Very High - Orange-Red
    case 9: return '#FF4444'; // Critical - Red
    case 10: return '#B22222'; // Severe - Dark Red
    default: return '#F5F5F5'; // Default - Neutral Gray
  }
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

const AlertCard = ({ finding, onStatusChange }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(finding.Status);
  const [isResolving, setIsResolving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
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
      onStatusChange(finding.Id, newStatus);
      
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
      }, 300);
    }, 300);
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const severityColor = getSeverityColor(finding.Severity);
  const severityLabel = getSeverityLabel(finding.Severity);

  return (
    <>
      <div className="alert-card-wrapper">
        <div 
          className={`alert-card ${isResolving ? 'resolving' : ''}`}
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
              <h3>{finding.Title}</h3>
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
                <span>{formatDate(finding.CreatedAt)}</span>
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
            <AlertDetails finding={finding} />
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