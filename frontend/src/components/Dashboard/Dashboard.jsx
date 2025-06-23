import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Alerts from '../Alerts/Alerts';
import AlertGraphs from '../AlertGraphs/AlertGraphs';
import { GiMonoWheelRobot } from "react-icons/gi";
import ChatBot from '../ChatBotPop/ChatBot/ChatBot';
import Sidebar from './Sidebar';
import DashboardSummary from './DashboardSummary';
import DashboardCharts from './DashboardCharts';

const Dashboard = () => {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('alerts');
    const [currentFindings, setCurrentFindings] = useState([]);
    const [showMenu, setShowMenu] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');

    const handleAlertClick = (alert) => {
        setSelectedAlert(alert);
        setIsChatOpen(true);
    };

    const handleFindingsChange = (findings) => {
        setCurrentFindings(findings);
    };

    // Fetch findings for graphs
    useEffect(() => {
        const fetchFindings = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/findings');
                if (!response.ok) {
                    throw new Error('Failed to fetch findings');
                }
                const data = await response.json();
                setCurrentFindings(data.findings || []);
            } catch (error) {
                console.error('Error fetching findings for graphs:', error);
            }
        };

        fetchFindings();
    }, []);

    // Determine which main content to show based on sidebar nav
    let mainContent;
    if (activeSection === 'dashboard') {
        mainContent = <>
            <DashboardSummary findings={currentFindings} />
            <DashboardCharts findings={currentFindings} />
        </>;
    } else if (activeSection === 'alerts') {
        mainContent = <Alerts onAlertClick={handleAlertClick} onFindingsChange={handleFindingsChange} />;
    } else {
        mainContent = <div style={{padding:40, color:'#888'}}>Section coming soon...</div>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
            <Sidebar 
                active={activeSection} 
                onSelect={setActiveSection} 
                title={<><span style={{fontWeight:'bold'}}>Alerts G&amp;R</span></>} 
            />
            <div style={{ width: 'calc(100vw - 220px)', background: 'var(--secondary-color)', minHeight: '100vh', marginLeft: 220, overflowX: 'hidden' }}>
                <div className="dashboard-content">
                    {mainContent}
                </div>
                <ChatBot 
                    isOpen={isChatOpen} 
                    setIsOpen={setIsChatOpen} 
                    alertData={selectedAlert}
                    showMenu={showMenu}
                    setShowMenu={setShowMenu}
                />
            </div>
        </div>
    );
}

export default Dashboard;