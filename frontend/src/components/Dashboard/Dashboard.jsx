import React, { useState } from 'react';
import './Dashboard.css';
import Alerts from '../Alerts/Alerts';
import { GiMonoWheelRobot } from "react-icons/gi";
import ChatBot from '../ChatBotPop/ChatBot/ChatBot';

const Dashboard = () => {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleAlertClick = (alert) => {
        setSelectedAlert(alert);
        setIsChatOpen(true);
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <GiMonoWheelRobot className="dashboard-icon"/>
                <h1>Alerts Dashboard</h1>
            </div>
            <div className="dashboard-content">
                <Alerts onAlertClick={handleAlertClick}/>
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