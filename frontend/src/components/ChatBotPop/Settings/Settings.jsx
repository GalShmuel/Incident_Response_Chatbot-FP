import React, { useState, useEffect } from 'react';
import './Settings.css';
import { formatDate } from '../../../utils/dateUtils';

const Settings = ({ pendingAlertData, onSaveSettings }) => {
    const [selectedSetting, setSelectedSetting] = useState(null);
    const [settingsValues, setSettingsValues] = useState({});
    const [settingsCategories] = useState([
        {
            id: 'alert-management',
            title: 'Alert Management',
            description: 'Configure alert severity and status',
            icon: '💻',
            options: [
                { id: 'alertId', label: 'Alert ID', type: 'text', placeholder: 'Enter Alert ID' },
                { id: 'severity', label: 'Alert Severity', type: 'select', options: ['1','2','3','4','5','6','7','8','9','10'] },
                { id: 'status', label: 'Alert Status', type: 'select', options: ['Open', 'Close'] }
            ]
        },
        {
            id: 'notifications',
            title: 'Alert Notifications',
            description: 'Configure how and when you receive security alerts',
            icon: '🔔',
            options: [
                { id: 'email', label: 'Email Notifications', type: 'toggle' },
                { id: 'push', label: 'Push Notifications', type: 'toggle' },
                { id: 'severity', label: 'Minimum Severity Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
            ]
        },
        {
            id: 'dashboard',
            title: 'Dashboard Layout',
            description: 'Customize your security dashboard view',
            icon: '📊',
            options: [
                { id: 'theme', label: 'Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
                { id: 'layout', label: 'Layout Style', type: 'select', options: ['Compact', 'Detailed', 'Custom'] },
                { id: 'refresh', label: 'Auto-refresh Interval', type: 'select', options: ['30s', '1m', '5m', '15m'] }
            ]
        },
        {
            id: 'security',
            title: 'Security Preferences',
            description: 'Manage your security settings and preferences',
            icon: '🔒',
            options: [
                { id: '2fa', label: 'Two-Factor Authentication', type: 'toggle' },
                { id: 'session', label: 'Session Timeout', type: 'select', options: ['15m', '30m', '1h', '4h'] },
                { id: 'logging', label: 'Activity Logging', type: 'toggle' }
            ]
        },
        {
            id: 'display',
            title: 'Display Options',
            description: 'Adjust how information is displayed',
            icon: '📱',
            options: [
                { id: 'font', label: 'Font Size', type: 'select', options: ['Small', 'Medium', 'Large'] },
                { id: 'timezone', label: 'Time Zone', type: 'select', options: ['UTC', 'Local', 'Custom'] },
                { id: 'date', label: 'Date Format', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] }
            ]
        }
    ]);

    // Load saved settings from localStorage on component mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            setSettingsValues(JSON.parse(savedSettings));
        }
    }, []);

    const handleSettingSelect = (category) => {
        setSelectedSetting(category);
        // Initialize settings values when opening a category
        const initialValues = {};
        category.options.forEach(option => {
            if (option.id === 'alertId') {
                initialValues[option.id] = pendingAlertData?.displayData?.id || pendingAlertData?.Id || '';
            } else {
                // Load saved value or use default
                const savedValue = settingsValues[option.id];
                initialValues[option.id] = savedValue || '';
            }
        });
        setSettingsValues(initialValues);
    };

    const handleSaveSettings = async (category) => {
        if (category.id === 'alert-management') {
            try {
                // Get current findings
                const response = await fetch('http://localhost:5000/api/findings');
                if (!response.ok) throw new Error('Failed to fetch findings');
                const data = await response.json();

                // Ensure we have valid findings data
                if (!data || !Array.isArray(data.findings)) {
                    throw new Error('Invalid findings data received');
                }

                const alertId = settingsValues.alertId?.trim();
                const newSeverity = parseInt(settingsValues.severity);
                const newStatus = settingsValues.status === 'Close';

                if (!alertId) {
                    onSaveSettings({
                        success: false,
                        message: 'Please enter an Alert ID to update.'
                    });
                    return;
                }

                // Validate that the alert ID exists in the findings
                const findingExists = data.findings.some(f => f.Id === alertId);
                if (!findingExists) {
                    onSaveSettings({
                        success: false,
                        message: `Alert ID ${alertId} not found. Please enter a valid Alert ID.`
                    });
                    return;
                }

                // Update the specific finding
                const updateResponse = await fetch(`http://localhost:5000/api/findings/${alertId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Severity: newSeverity,
                        Service: {
                            Archived: newStatus
                        }
                    })
                });

                if (!updateResponse.ok) {
                    throw new Error(`Failed to update finding ${alertId}`);
                }

                onSaveSettings({
                    success: true,
                    message: `Alert ${alertId} has been updated successfully. New settings: Severity ${newSeverity}, Status ${newStatus ? 'Closed' : 'Open'}.`
                });
            } catch (error) {
                console.error('Error updating finding:', error);
                onSaveSettings({
                    success: false,
                    message: `Error: ${error.message}. Please try again.`
                });
            }
        } else if (category.id === 'dashboard') {
            // Save dashboard settings to localStorage
            const dashboardSettings = {
                theme: settingsValues.theme,
                layout: settingsValues.layout,
                refresh: settingsValues.refresh
            };
            
            // Save to localStorage
            localStorage.setItem('dashboardSettings', JSON.stringify(dashboardSettings));
            
            // Apply theme if changed
            if (settingsValues.theme) {
                document.documentElement.setAttribute('data-theme', settingsValues.theme.toLowerCase());
            }

            // Apply layout changes
            if (settingsValues.layout) {
                document.body.setAttribute('data-layout', settingsValues.layout.toLowerCase());
            }

            // Set up auto-refresh if enabled
            if (settingsValues.refresh) {
                const interval = settingsValues.refresh === '30s' ? 30000 :
                               settingsValues.refresh === '1m' ? 60000 :
                               settingsValues.refresh === '5m' ? 300000 :
                               settingsValues.refresh === '15m' ? 900000 : null;
                
                if (interval) {
                    // Clear any existing interval
                    if (window.dashboardRefreshInterval) {
                        clearInterval(window.dashboardRefreshInterval);
                    }
                    // Set new interval
                    window.dashboardRefreshInterval = setInterval(() => {
                        // Trigger dashboard refresh
                        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
                    }, interval);
                }
            }

            onSaveSettings({
                success: true,
                message: 'Dashboard settings have been updated successfully.'
            });
        } else if (category.id === 'display') {
            // Save display settings to localStorage
            const displaySettings = {
                font: settingsValues.font,
                timezone: settingsValues.timezone,
                date: settingsValues.date
            };
            
            // Save to localStorage
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
            
            // Apply font size
            if (settingsValues.font) {
                const fontSizeMap = {
                    'Small': '14px',
                    'Medium': '16px',
                    'Large': '18px'
                };
                document.documentElement.style.setProperty('--base-font-size', fontSizeMap[settingsValues.font]);
            }

            // Apply timezone
            if (settingsValues.timezone) {
                let timezone;
                switch (settingsValues.timezone) {
                    case 'UTC':
                        timezone = 'UTC';
                        break;
                    case 'Local':
                        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        break;
                    case 'Custom':
                        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        break;
                    default:
                        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                }
                localStorage.setItem('userTimezone', timezone);
            }

            // Apply date format
            if (settingsValues.date) {
                const dateFormatMap = {
                    'MM/DD/YYYY': 'MM/DD/YYYY',
                    'DD/MM/YYYY': 'DD/MM/YYYY',
                    'YYYY-MM-DD': 'YYYY-MM-DD'
                };
                localStorage.setItem('dateFormat', dateFormatMap[settingsValues.date]);
            }

            // Dispatch a custom event to notify other components about the display changes
            window.dispatchEvent(new CustomEvent('displaySettingsChanged', {
                detail: displaySettings
            }));

            onSaveSettings({
                success: true,
                message: 'Display settings have been updated successfully.'
            });
        } else {
            onSaveSettings({
                success: true,
                message: `${category.title} settings have been updated successfully.`
            });
        }
    };

    // Add this useEffect to load display settings on component mount
    useEffect(() => {
        const savedDisplaySettings = localStorage.getItem('displaySettings');
        if (savedDisplaySettings) {
            const parsedSettings = JSON.parse(savedDisplaySettings);
            setSettingsValues(prev => ({
                ...prev,
                ...parsedSettings
            }));

            // Apply saved settings
            if (parsedSettings.font) {
                const fontSizeMap = {
                    'Small': '14px',
                    'Medium': '16px',
                    'Large': '18px'
                };
                document.documentElement.style.setProperty('--base-font-size', fontSizeMap[parsedSettings.font]);
            }
        }
    }, []);

    // Add preview section for display settings
    const renderDisplayPreview = () => {
        if (selectedSetting?.id !== 'display') return null;

        const currentDate = new Date();
        const previewText = "This is a preview of the selected font size.";
        
        // Get the current date format from settings or default
        const currentFormat = settingsValues.date || 'MM/DD/YYYY';
        const timezone = settingsValues.timezone || 'Local';
        
        // Format the date according to the selected format
        let formattedDate;
        const options = {
            timeZone: timezone === 'UTC' ? 'UTC' : undefined,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };

        const dateObj = new Intl.DateTimeFormat('en-US', options).format(currentDate);
        const [datePart, timePart] = dateObj.split(', ');

        switch (currentFormat) {
            case 'DD/MM/YYYY':
                const [month, day, year] = datePart.split('/');
                formattedDate = `${day}/${month}/${year} ${timePart}`;
                break;
            case 'YYYY-MM-DD':
                const [m, d, y] = datePart.split('/');
                formattedDate = `${y}-${m}-${d} ${timePart}`;
                break;
            default:
                formattedDate = `${datePart} ${timePart}`;
        }

        return (
            <div className="display-preview">
                <h3>Preview</h3>
                <div className="preview-content">
                    <div className="preview-text" style={{ fontSize: settingsValues.font === 'Small' ? '14px' : 
                                                                    settingsValues.font === 'Large' ? '18px' : '16px' }}>
                        {previewText}
                    </div>
                    <div className="preview-date">
                        <strong>Date Format:</strong> {formattedDate}
                    </div>
                    <div className="preview-timezone">
                        <strong>Timezone:</strong> {timezone}
                    </div>
                </div>
            </div>
        );
    };

    if (!selectedSetting) {
        return (
            <div className="settings-categories">
                {settingsCategories.map((category) => (
                    <div
                        key={category.id}
                        className="settings-category"
                        onClick={() => handleSettingSelect(category)}
                    >
                        <div className="category-icon">{category.icon}</div>
                        <div className="category-content">
                            <h3>{category.title}</h3>
                            <p>{category.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="settings-options">
            <div className="settings-header">
                <h2>{selectedSetting.title}</h2>
                <p>{selectedSetting.description}</p>
            </div>
            {selectedSetting.options.map((option) => (
                <div key={option.id} className="setting-option">
                    <label htmlFor={option.id}>{option.label}</label>
                    {option.type === 'toggle' ? (
                        <div className="toggle-switch">
                            <input 
                                type="checkbox" 
                                id={option.id}
                                checked={settingsValues[option.id] || false}
                                onChange={(e) => {
                                    setSettingsValues(prev => ({
                                        ...prev,
                                        [option.id]: e.target.checked
                                    }));
                                }}
                            />
                            <label htmlFor={option.id}></label>
                        </div>
                    ) : option.type === 'text' ? (
                        <input 
                            type="text" 
                            id={option.id} 
                            className="setting-input"
                            placeholder={option.placeholder || ''}
                            value={settingsValues[option.id] || ''}
                            onChange={(e) => {
                                setSettingsValues(prev => ({
                                    ...prev,
                                    [option.id]: e.target.value
                                }));
                            }}
                            readOnly={option.id === 'alertId' && (pendingAlertData?.displayData?.id || pendingAlertData?.Id)}
                            required
                        />
                    ) : (
                        <select 
                            id={option.id} 
                            className="setting-select" 
                            value={settingsValues[option.id] || ''}
                            onChange={(e) => {
                                setSettingsValues(prev => ({
                                    ...prev,
                                    [option.id]: e.target.value
                                }));
                            }}
                            required
                        >
                            <option value="">{option.label}</option>
                            {option.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
            {renderDisplayPreview()}
            <div className="settings-actions">
                <button className="save-settings" onClick={() => handleSaveSettings(selectedSetting)}>
                    Save Changes
                </button>
                <button className="back-settings" onClick={() => setSelectedSetting(null)}>
                    Back to Categories
                </button>
            </div>
        </div>
    );
};

export default Settings; 