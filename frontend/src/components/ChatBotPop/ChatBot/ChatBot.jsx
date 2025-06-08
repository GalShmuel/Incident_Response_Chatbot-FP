import React, { useRef, useEffect, useState } from 'react';
import './ChatBot.css';
import { VscRobot } from "react-icons/vsc";
import { FaTimes } from 'react-icons/fa';
import { MdHistory } from "react-icons/md";
import ChatViewFinal from '../ChatView/ChatViewFinal';

const ChatBot = ({ isOpen, setIsOpen, alertData, showMenu, setShowMenu }) => {
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 380, height: 600 });
  const chatWindowRef = useRef(null);
  const isResizing = useRef(false);
  const resizeType = useRef(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  console.log('ChatBot render - showMenu:', showMenu, 'showRecentChats:', showRecentChats);

  const toggleChat = () => {
    console.log('Toggle chat - current isOpen:', isOpen);
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    console.log('ChatBot state changed - showMenu:', showMenu, 'showRecentChats:', showRecentChats);
  }, [showMenu, showRecentChats]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current || !chatWindowRef.current) return;

      const rect = chatWindowRef.current.getBoundingClientRect();
      const minWidth = 320;
      const minHeight = 400;
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.8;

      if (resizeType.current === 'left') {
        const deltaX = e.clientX - startPos.current.x;
        const newWidth = Math.min(
          Math.max(minWidth, startPos.current.width - deltaX),
          maxWidth
        );
        setDimensions(prev => ({ ...prev, width: newWidth }));
      } else if (resizeType.current === 'top') {
        const deltaY = e.clientY - startPos.current.y;
        const newHeight = Math.min(
          Math.max(minHeight, startPos.current.height - deltaY),
          maxHeight
        );
        setDimensions(prev => ({ ...prev, height: newHeight }));
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current && chatWindowRef.current) {
        chatWindowRef.current.classList.remove('resizing');
        isResizing.current = false;
        resizeType.current = null;
      }
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
    if (chatWindowRef.current) {
      const rect = chatWindowRef.current.getBoundingClientRect();
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      };
      isResizing.current = true;
      resizeType.current = type;
      chatWindowRef.current.classList.add('resizing');
    }
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <div
          ref={chatWindowRef}
          className="chat-window"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            right: '20px',
            bottom: '20px'
          }}
        >
          <div className="resize-handles">
            <div 
              className="resize-handle-left" 
              onMouseDown={startResize('left')}
            />
            <div 
              className="resize-handle-top" 
              onMouseDown={startResize('top')}
            />
          </div>
          <div className="chat-header">
            <div className="chat-title">
              <VscRobot className="bot-icon" />
              <span>AI Assistant</span>
            </div>
            <div className="chat-controls">
              <button
                className="history-button"
                onClick={() => {
                  console.log('History button clicked - current states:', {
                    showMenu,
                    showRecentChats,
                    isOpen
                  });
                  setShowRecentChats(true);
                  setIsOpen(true);
                  setShowMenu(false);
                  console.log('After history button click - states should be:', {
                    showMenu: false,
                    showRecentChats: true,
                    isOpen: true
                  });
                }}
                title="View chat history"
              >
                <MdHistory />
              </button>
              <button className="close-button" onClick={toggleChat}>
                <FaTimes />
              </button>
            </div>
          </div>
          <ChatViewFinal
            showRecentChats={showRecentChats} 
            setShowRecentChats={setShowRecentChats}
            alertData={alertData}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
          />
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
