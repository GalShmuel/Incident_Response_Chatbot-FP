import React from 'react';
import './Dashboard.css';
import Alerts from '../Alerts/Alerts';
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
        </div>
    );
}

export default Dashboard;