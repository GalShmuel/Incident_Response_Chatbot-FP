import React, { useEffect } from 'react';
import './styles/theme.css';
// ... existing imports ...

function App() {
    useEffect(() => {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLayout = localStorage.getItem('layout') || 'default';
        
        // Apply saved theme and layout
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-layout', savedLayout);
    }, []);

    // ... rest of the component code ...
}

export default App; 