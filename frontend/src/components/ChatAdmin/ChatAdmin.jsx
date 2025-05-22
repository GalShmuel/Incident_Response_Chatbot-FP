import React, { useState, useEffect } from 'react';
import './ChatAdmin.css';

const API_URL = 'http://localhost:5000/api';

const ChatAdmin = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch(`${API_URL}/chats`);
            const data = await response.json();
            setChats(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch chats');
            setLoading(false);
        }
    };

    if (loading) return <div className="chat-admin-loading">Loading...</div>;
    if (error) return <div className="chat-admin-error">{error}</div>;

    return (
        <div className="chat-admin">
            <h1>Chat History</h1>
            <div className="chat-list">
                {chats.map((chat) => (
                    <div key={chat._id} className="chat-item">
                        <div className="chat-header">
                            <span>Chat ID: {chat._id}</span>
                            <span>Created: {new Date(chat.createdAt).toLocaleString()}</span>
                            <span>Updated: {new Date(chat.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="messages-list">
                            {chat.messages.map((message, index) => (
                                <div key={index} className={`message ${message.role}`}>
                                    <div className="message-header">
                                        <span className="role">{message.role}</span>
                                        <span className="timestamp">{message.timestamp}</span>
                                    </div>
                                    <div className="content">{message.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatAdmin; 