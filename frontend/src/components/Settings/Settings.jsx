import React, { useState, useEffect } from 'react';
import { FaPalette, FaDesktop, FaUser, FaBell, FaShieldAlt, FaSave, FaArrowLeft } from 'react-icons/fa';
import './Settings.css';

const Settings = ({ onBack }) => {
    const [settings, setSettings] = useState({
        theme: 'light',
        layout: 'default',
        notifications: {
            email: true,
            push: false,
            sound: true
        },
        privacy: {
            dataCollection: true,
            analytics: false,
            thirdParty: false
        },
        display: {
            compactMode: false,
            showAnimations: true,
            autoRefresh: true
        }
    });

    const [activeTab, setActiveTab] = useState('appearance');
    const [pendingChanges, setPendingChanges] = useState({});

    useEffect(() => {
        // Load saved settings from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLayout = localStorage.getItem('layout') || 'default';
        
        setSettings(prev => ({
            ...prev,
            theme: savedTheme,
            layout: savedLayout
        }));
    }, []);

    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };

    const handleThemeChange = (theme) => {
        setSettings(prev => ({ ...prev, theme }));
        // Store the change as pending instead of applying immediately
        setPendingChanges(prev => ({ ...prev, theme }));
    };

    const handleLayoutChange = (layout) => {
        setSettings(prev => ({ ...prev, layout }));
        // Store the change as pending instead of applying immediately
        setPendingChanges(prev => ({ ...prev, layout }));
    };

    const saveSettings = () => {
        // Apply pending theme and layout changes
        if (pendingChanges.theme) {
            document.documentElement.setAttribute('data-theme', pendingChanges.theme);
            localStorage.setItem('theme', pendingChanges.theme);
        }
        if (pendingChanges.layout) {
            document.body.setAttribute('data-layout', pendingChanges.layout);
            localStorage.setItem('layout', pendingChanges.layout);
        }
        
        // Save all settings to localStorage or backend
        localStorage.setItem('settings', JSON.stringify(settings));
        
        // Clear pending changes
        setPendingChanges({});
        
        // You can also send to backend here
        console.log('Settings saved:', settings);
    };

    const resetSettings = () => {
        const defaultSettings = {
            theme: 'light',
            layout: 'default',
            notifications: {
                email: true,
                push: false,
                sound: true
            },
            privacy: {
                dataCollection: true,
                analytics: false,
                thirdParty: false
            },
            display: {
                compactMode: false,
                showAnimations: true,
                autoRefresh: true
            }
        };
        setSettings(defaultSettings);
        setPendingChanges({ theme: 'light', layout: 'default' });
    };

    const handleBack = () => {
        // If there are pending changes, ask user if they want to save
        if (Object.keys(pendingChanges).length > 0) {
            const shouldSave = window.confirm('You have unsaved changes. Do you want to save them before leaving?');
            if (shouldSave) {
                saveSettings();
            }
        }
        
        if (onBack) {
            onBack('dashboard');
        }
    };

    const renderAppearanceTab = () => (
        <div className="settings-section">
            <h3>Theme & Layout</h3>
            <div className="setting-group">
                <label>Theme</label>
                <div className="theme-options">
                    <div 
                        className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('light')}
                    >
                        <div className="theme-preview light"></div>
                        <span>Light</span>
                    </div>
                    <div 
                        className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                    >
                        <div className="theme-preview dark"></div>
                        <span>Dark</span>
                    </div>
                    <div 
                        className={`theme-option ${settings.theme === 'auto' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('auto')}
                    >
                        <div className="theme-preview auto"></div>
                        <span>Auto</span>
                    </div>
                </div>
            </div>

            <div className="setting-group">
                <label>Layout</label>
                <div className="layout-options">
                    <div 
                        className={`layout-option ${settings.layout === 'default' ? 'active' : ''}`}
                        onClick={() => handleLayoutChange('default')}
                    >
                        <span>Default</span>
                    </div>
                    <div 
                        className={`layout-option ${settings.layout === 'compact' ? 'active' : ''}`}
                        onClick={() => handleLayoutChange('compact')}
                    >
                        <span>Compact</span>
                    </div>
                </div>
            </div>

            <div className="setting-group">
                <label>Display Options</label>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.display.compactMode}
                            onChange={(e) => handleSettingChange('display', 'compactMode', e.target.checked)}
                        />
                        <span>Compact Mode</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.display.showAnimations}
                            onChange={(e) => handleSettingChange('display', 'showAnimations', e.target.checked)}
                        />
                        <span>Show Animations</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.display.autoRefresh}
                            onChange={(e) => handleSettingChange('display', 'autoRefresh', e.target.checked)}
                        />
                        <span>Auto Refresh</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderNotificationsTab = () => (
        <div className="settings-section">
            <h3>Notification Preferences</h3>
            <div className="setting-group">
                <label>Notification Types</label>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.notifications.email}
                            onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                        />
                        <span>Email Notifications</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.notifications.push}
                            onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                        />
                        <span>Push Notifications</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.notifications.sound}
                            onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
                        />
                        <span>Sound Alerts</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderPrivacyTab = () => (
        <div className="settings-section">
            <h3>Privacy & Security</h3>
            <div className="setting-group">
                <label>Data Collection</label>
                <div className="checkbox-group">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.privacy.dataCollection}
                            onChange={(e) => handleSettingChange('privacy', 'dataCollection', e.target.checked)}
                        />
                        <span>Allow Data Collection</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.privacy.analytics}
                            onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
                        />
                        <span>Analytics & Performance</span>
                    </label>
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.privacy.thirdParty}
                            onChange={(e) => handleSettingChange('privacy', 'thirdParty', e.target.checked)}
                        />
                        <span>Third-party Services</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: <FaPalette />, content: renderAppearanceTab },
        { id: 'notifications', label: 'Notifications', icon: <FaBell />, content: renderNotificationsTab },
        { id: 'privacy', label: 'Privacy', icon: <FaShieldAlt />, content: renderPrivacyTab }
    ];

    return (
        <div className="settings-full-page">
            <div className="settings-header-full">
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <div className="header-content">
                    <h1>Settings</h1>
                    <p>Customize your experience and preferences</p>
                </div>
            </div>

            <div className="settings-container-full">
                <div className="settings-content">
                    <div className="settings-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                <span className="tab-label">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="settings-panel">
                        {tabs.find(tab => tab.id === activeTab)?.content()}
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="btn btn-secondary" onClick={resetSettings}>
                        Reset to Default
                    </button>
                    <button 
                        className={`btn btn-primary ${Object.keys(pendingChanges).length > 0 ? 'has-changes' : ''}`} 
                        onClick={saveSettings}
                        disabled={Object.keys(pendingChanges).length === 0}
                    >
                        <FaSave /> 
                        {Object.keys(pendingChanges).length > 0 ? 'Save Changes' : 'No Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings; 