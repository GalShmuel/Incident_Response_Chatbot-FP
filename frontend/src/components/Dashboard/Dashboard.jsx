import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Alerts from '../Alerts/Alerts';
import AlertGraphs from '../AlertGraphs/AlertGraphs';
import { GiMonoWheelRobot } from "react-icons/gi";
import ChatBot from '../ChatBotPop/ChatBot/ChatBot';

const Dashboard = () => {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('alerts');
    const [currentFindings, setCurrentFindings] = useState([]);

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

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <GiMonoWheelRobot className="dashboard-icon"/>
                <h1>Alerts G&R</h1>
                <div className="dashboard-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alerts')}
                    >
                        Alerts
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'graphs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('graphs')}
                    >
                        Dashboard
                    </button>
                </div>
            </div>
            <div className="dashboard-content">
                {activeTab === 'alerts' ? (
                    <Alerts 
                        onAlertClick={handleAlertClick}
                        onFindingsChange={handleFindingsChange}
                    />
                ) : (
                    <AlertGraphs findings={currentFindings} />
                )}
            </div>
            <ChatBot 
                isOpen={isChatOpen} 
                setIsOpen={setIsChatOpen} 
                alertData={selectedAlert} 
            />
        </div>
    );
}

export default Dashboard;