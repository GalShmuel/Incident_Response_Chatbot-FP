import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { VscRobot } from "react-icons/vsc";
import { FaTimes } from 'react-icons/fa';
import ChatView from '../ChatView/ChatView';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 640, height: 800 });
  const chatWindowRef = useRef(null);
  const isResizing = useRef(false);
  const resizeType = useRef(null); // 'left' or 'top'
  const startPos = useRef({ x: 0, width: 0 });

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || !chatWindowRef.current) return;

      const rect = chatWindowRef.current.getBoundingClientRect();

      if (resizeType.current === 'left') {
        // Calculate new width based on the distance from the right edge
        const distanceFromRight = window.innerWidth - e.clientX;
        const newWidth = Math.min(
          Math.max(300, distanceFromRight - 20), // 20px is the right margin
          window.innerWidth * 0.9
        );
        setDimensions(prev => ({ ...prev, width: newWidth }));
      } else if (resizeType.current === 'top') {
        // Calculate new height based on the distance from the bottom
        const distanceFromBottom = window.innerHeight - e.clientY;
        const newHeight = Math.min(
          Math.max(400, distanceFromBottom - 20), // 20px is the bottom margin
          window.innerHeight * 0.9
        );
        setDimensions(prev => ({ ...prev, height: newHeight }));
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      resizeType.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (type) => (e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeType.current = type;
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <div
          className="chat-window"
          ref={chatWindowRef}
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            right: '20px',  // Fixed right position
            bottom: '20px'  // Fixed bottom position
          }}
        >
          <div 
            className="resize-handle-left" 
            onMouseDown={startResize('left')}
          />
          <div 
            className="resize-handle-top" 
            onMouseDown={startResize('top')}
          />
          <div className="chat-header">
            <div className="chat-title">
              <VscRobot className="bot-icon" />
              <span>AI Assistant</span>
            </div>
            <button className="close-button" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>
          <ChatView />
        </div>
      ) : (
        <button className="chat-toggle" onClick={toggleChat}>
          <VscRobot />
          <span>Chat with AI</span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
