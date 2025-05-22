import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

const INITIAL_MESSAGE = { 
    role: 'bot', 
    content: "Hello! How can I help you today?",
    timestamp: new Date()
};

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());

    const addMessage = (message) => {
        setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
        setLastActivityTime(Date.now());
    };

    const addAlertToChat = (alert) => {
        const formattedAlert = JSON.stringify(alert, null, 2);
        resetChat();
        addMessage({ role: 'user', content: "Here is the alert: " + formattedAlert });
        setIsChatOpen(true);
    };

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
    };

    const resetChat = () => {
        setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date() }]);
        setLastActivityTime(Date.now());
    };

    const closeChat = () => {
        setIsChatOpen(false);
        resetChat();
    };

    return (
        <ChatContext.Provider value={{ 
            messages, 
            addMessage, 
            addAlertToChat,
            isChatOpen,
            setIsChatOpen,
            toggleChat,
            lastActivityTime,
            setLastActivityTime,
            resetChat,
            closeChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}; 