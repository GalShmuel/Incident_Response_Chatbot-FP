import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import { IoAddCircleOutline } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import ChatInput from '../ChatInput/ChatInput';

const API_URL = 'http://localhost:5000/api';

const ChatView = ({ showRecentChats, setShowRecentChats, alertData }) => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentAlertData, setCurrentAlertData] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRecentChats = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true);
      }
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
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  };

  const selectChat = async (selectedChat) => {
    setChatId(selectedChat._id);
    setMessages(selectedChat.messages);
    setShowRecentChats(false);
  };

  // Effect to handle new alert data
  useEffect(() => {
    if (alertData) {
      setCurrentAlertData(alertData);
      initializeNewChatWithAlert(alertData);
    }
  }, [alertData]);

  const initializeNewChatWithAlert = async (alert) => {
    try {
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `\`\`\`json\n${JSON.stringify(alert, null, 2)}\n\`\`\``,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, {
            role: 'bot',
            content: "I see you've shared an alert with me. I'll help you understand it better. What would you like to know about this alert?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]
        })
      });
      const data = await response.json();
      setChatId(data._id);
      setMessages(data.messages);
      setShowRecentChats(false);
    } catch (error) {
      console.error('Error creating chat session with alert:', error);
    }
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
      const initialUserMessage = {
        role: 'user',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      await addMessage(initialUserMessage);
      setIsThinking(true);

      // Send the message and complete alert data to the backend
      const response = await fetch(`${API_URL}/chat/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          alertData: currentAlertData // Send the complete alert data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        role: 'bot',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      await addMessage(botMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        role: 'bot',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      await addMessage(errorMessage);
    } finally {
      setIsThinking(false);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    try {
      // Set the deleting state
      setDeletingChatId(chatId);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 300));

      const response = await fetch(`${API_URL}/chats/delete/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to delete chat. Status: ${response.status}`);
      }

      // Remove the chat from the list
      setRecentChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
      
      // Fetch updated chats in background without loading state
      await fetchRecentChats(false);
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError(`Failed to delete chat: ${error.message}`);
      await fetchRecentChats(false);
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeletingChatId(null);
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
                        className={`recent-chat-item ${deletingChatId === chat._id ? 'deleting' : ''}`}
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
                        <button 
                          className="delete-chat-button"
                          onClick={(e) => deleteChat(chat._id, e)}
                          title="Delete chat"
                          disabled={deletingChatId === chat._id}
                        >
                          <FaTrash />
                        </button>
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