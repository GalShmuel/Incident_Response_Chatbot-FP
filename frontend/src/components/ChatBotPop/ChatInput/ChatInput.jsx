import React, { useState } from 'react';
import './ChatInput.css';
import { IoSend } from 'react-icons/io5';

const ChatInput = ({ onSend, isDisabled }) => {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() && !isDisabled) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`chat-input-container ${isDisabled ? 'disabled' : ''}`}>
            <input
                type="text"
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isDisabled ? "Waiting for response..." : "Type your message..."}
                disabled={isDisabled}
            />
            <button 
                className="send-button"
                onClick={handleSend}
                disabled={!input.trim() || isDisabled}
            >
                <IoSend />
            </button>
        </div>
    );
};

export default ChatInput; 