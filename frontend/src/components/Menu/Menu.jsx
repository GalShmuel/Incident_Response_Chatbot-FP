import React from 'react';
import './Menu.css';

const Menu = ({ onSelect }) => {
    const menuOptions = [
        {
            id: 'alert-analysis',
            title: 'Alert Analysis',
            description: 'Analyze security alerts and gain actionable insights',
            icon: '🔍',
            value: '1'
        },
        {
            id: 'playbook',
            title: 'Incident Playbook',
            description: 'Follow predefined steps to handle incidents efficiently',
            icon: '📘',
            value: '2'
        },
        {
            id: 'general-chat',
            title: 'General Chat',
            description: 'Discuss security topics or ask general questions',
            icon: '💬',
            value: '3'
        },
        {
            id: 'settings',
            title: 'Settings',
            description: 'Configure your preferences and system settings',
            icon: '⚙️',
            value: '4'
        }
    ];

    return (
        <div className="menu-container">
            <div className="menu-header">
                <div className="menu-header-content">
                    <h2>What would you like to do?</h2>
                    <p>Select an option to get started</p>
                </div>
            </div>
            <div className="menu-options">
                {menuOptions.map((option) => (
                    <div
                        key={option.id}
                        className="menu-option"
                        onClick={() => onSelect(option)}
                    >
                        <div className="menu-option-icon">{option.icon}</div>
                        <div className="menu-option-content">
                            <h3>{option.title}</h3>
                            <p>{option.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Menu;
