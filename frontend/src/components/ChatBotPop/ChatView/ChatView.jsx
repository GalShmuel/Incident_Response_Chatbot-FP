import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import { IoAddCircleOutline } from "react-icons/io5";
import ChatInput from '../ChatInput/ChatInput';

const API_URL = 'http://localhost:5000/api';

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [showRecentChats, setShowRecentChats] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRecentChats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/chats/recent`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecentChats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      setError('Failed to load recent chats. Please try again.');
      setRecentChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = async (selectedChat) => {
    setChatId(selectedChat._id);
    setMessages(selectedChat.messages);
    setShowRecentChats(false);
  };

  const initializeNewChat = async () => {
    try {
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'bot',
            content: "Hello, I'm here to help you understand the Alerts.\n\nClick on one of them to get information.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        })
      });
      const data = await response.json();
      setChatId(data._id);
      setMessages(data.messages);
      setShowRecentChats(false);
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  useEffect(() => {
    fetchRecentChats();
  }, []); // Fetch recent chats on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const addMessage = async (message) => {
    if (!chatId) return;

    try {
      const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const handleMessageSend = async (content) => {
    try {
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      await addMessage(userMessage);
      setIsThinking(true);

      // Here you would typically make an API call to your backend
      // For now, we'll just simulate a response
      setTimeout(async () => {
        const botMessage = {
          role: 'bot',
          content: 'This is a placeholder response. Backend integration pending.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await addMessage(botMessage);
        setIsThinking(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'bot',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      await addMessage(errorMessage);
      setIsThinking(false);
    }
  };

  return (
    <div className="ChatView">
      <div className="ChatMessages">
        {showRecentChats ? (
          <div className="recent-chats">
            <h3>Recent Conversations</h3>
            {isLoading ? (
              <div className="loading-spinner">Loading recent chats...</div>
            ) : error ? (
              <div className="error-message">
                {error}
                <button onClick={fetchRecentChats} className="retry-button">
                  Retry
                </button>
              </div>
            ) : (
              <div className="recent-chats-list">
                {recentChats.length > 0 ? (
                  <>
                    {recentChats.map((chat) => (
                      <div
                        key={chat._id}
                        className="recent-chat-item"
                        onClick={() => selectChat(chat)}
                      >
                        <div className="recent-chat-preview">
                          <div className="recent-chat-time">
                            {new Date(chat.updatedAt).toLocaleString()}
                          </div>
                          <div className="recent-chat-messages">
                            {chat.messages.slice(-2).map((msg, idx) => (
                              <div key={idx} className={`preview-message ${msg.role}`}>
                                {msg.content.length > 50 
                                  ? msg.content.substring(0, 50) + '...' 
                                  : msg.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="no-chats-message">
                    No recent conversations found.
                  </div>
                )}
                <button 
                  className="new-chat-button"
                  onClick={initializeNewChat}
                >
                  <IoAddCircleOutline />
                  <span>Start New Chat</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className={`icon-wrapper ${message.role === 'user' ? 'user-icon-wrapper' : 'bot-icon-wrapper'}`}>
                  {message.role === 'user' ? <IoPersonOutline className="icon" /> : <RiRobot2Line className="icon" />}
                </div>
                <div className="message-text">
                  {message.content}
                  <div className="message-timestamp">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="message bot">
                <div className="icon-wrapper bot-icon-wrapper">
                  <RiRobot2Line className="icon" />
                </div>
                <div className="message-text thinking">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {!showRecentChats && (
        <div className="ChatInputArea">
          <ChatInput onSend={handleMessageSend} isDisabled={isThinking} />
        </div>
      )}
    </div>
  );
};

export default ChatView;