import React from 'react';
import './Dashboard.css';
import Alerts from '../Alerts/Alerts';
import ChatBot from '../ChatBotPop/ChatBot/ChatBot'
import { GiMonoWheelRobot } from "react-icons/gi";

const Dashboard = () => {
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <GiMonoWheelRobot className="dashboard-icon"/>
                <h1>Alerts Dashboard</h1>
            </div>
            <div className="dashboard-content">
                <Alerts/>
            </div>
            <ChatBot />
        </div>
    );
}

export default Dashboard;