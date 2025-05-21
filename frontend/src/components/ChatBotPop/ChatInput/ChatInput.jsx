import React from 'react';
import './ChatInput.css';

const ChatInput = ({ input, onChange, onSend }) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <textarea
            className="chat-input"
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            rows="1"
        />
    );
};

export default ChatInput; 