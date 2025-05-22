import React from 'react';
import './AlertCard.css';
import { FaExclamationTriangle } from 'react-icons/fa';
import { WiTime3 } from "react-icons/wi";

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
  
  const hexToRGBA = (hex, alpha = 0.2) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const AlertCard = ({ finding }) => {
  const {
    Title,
    Description,
    Severity,
    Type,
    CreatedAt,
    Id
  } = finding;

  return (
    <div 
      className="alert-card" 
      style={{
        border: `2px solid ${getSeverityColor(Severity)}`,
        backgroundColor: hexToRGBA(getSeverityColor(Severity), 0.15),
        position: 'relative'
      }}
    >
      <div 
        className="severity-badge"
        style={{ border: `2px solid ${getSeverityColor(Severity)}` }}
      >
        Severity: {Severity}
      </div>
      <div className="alert-card-header">
        <h3>{Title}</h3>
        <div className="created-at">
          Created: {formatDate(CreatedAt)}
        </div>
      </div>
      <div className="alert-content">
        <p className="description">{Description}</p>
        <div className="alert-details">
          <p><strong>Type:</strong> {Type}</p>
          <p><strong>ID:</strong> {Id}</p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;