import React from 'react';
import { FaTachometerAlt, FaBell, FaChartLine, FaFileAlt, FaExclamationTriangle, FaCog } from 'react-icons/fa';
import { GiMonoWheelRobot } from 'react-icons/gi';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard', icon: <FaTachometerAlt />, id: 'dashboard' },
  { label: 'Alerts', icon: <FaBell />, id: 'alerts' },
  { label: 'Analytics', icon: <FaChartLine />, id: 'analytics' },
  { label: 'Reports', icon: <FaFileAlt />, id: 'reports' },
  { label: 'Incidents', icon: <FaExclamationTriangle />, id: 'incidents' },
  { label: 'Settings', icon: <FaCog />, id: 'settings' },
];

const Sidebar = ({ active, onSelect, title, tabButtons }) => (
  <aside className="sidebar">
    <div className="sidebar-header" style={{display:'flex',alignItems:'center',gap:12}}>
      <GiMonoWheelRobot className="dashboard-icon" style={{fontSize:32}}/>
      {title}
    </div>
    <nav className="sidebar-nav">
      {navItems.map(item => (
        <div
          key={item.id}
          className={`sidebar-nav-item${active === item.id ? ' active' : ''}`}
          onClick={() => onSelect && onSelect(item.id)}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
        </div>
      ))}
    </nav>
    {tabButtons && <div className="sidebar-tabs-area">{tabButtons}</div>}
  </aside>
);

export default Sidebar; 