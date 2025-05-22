import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import ChatInput from '../ChatInput/ChatInput';

const API_URL = 'http://localhost:5000/api';

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Create a new chat session when component mounts
    const initializeChat = async () => {
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
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    initializeChat();
  }, []); // Empty dependency array means this runs once on mount

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
      </div>
      <div className="ChatInputArea">
        <ChatInput onSend={handleMessageSend} isDisabled={isThinking} />
      </div>
    </div>
  );
};

export default ChatView;