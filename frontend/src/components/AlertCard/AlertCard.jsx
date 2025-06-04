import React from 'react';
import './AlertCard.css';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

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

const formatDate = (dateString) => {
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
  const severityColor = getSeverityColor(finding.Severity);
  const severityLabel = getSeverityLabel(finding.Severity);
  const status = finding.Status || 'open'; // Default to 'open' if status not set

  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onStatusChange) {
      onStatusChange(finding.Id, status === 'open' ? 'resolved' : 'open');
    }
  };

  return (
    <div className="alert-card">
      <div className="alert-severity-indicator" style={{ backgroundColor: severityColor }} />
      <div className="alert-card-content">
        <div className="alert-main">
          <div className="alert-status" onClick={handleStatusClick}>
            {status === 'resolved' ? (
              <FaCheckCircle className="status-icon resolved" />
            ) : (
              <FaExclamationCircle className="status-icon open" />
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
        </div>
      </div>
    </div>
  );
};

export default AlertCard;