import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import ChatInput from '../ChatInput/ChatInput';

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleMessageSend = async (content) => {
    try {
      addMessage({
        role: 'user',
        content
      });
      setIsThinking(true);

      // Here you would typically make an API call to your backend
      // For now, we'll just simulate a response
      setTimeout(() => {
        addMessage({
          role: 'bot',
          content: 'This is a placeholder response. Backend integration pending.'
        });
        setIsThinking(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'bot',
        content: 'Sorry, I encountered an error processing your message.'
      });
      setIsThinking(false);
    }
  };

  return (
    <div className="chat-view">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-icon">
              {message.role === 'user' ? <IoPersonOutline /> : <RiRobot2Line />}
            </div>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="message bot">
            <div className="message-icon">
              <RiRobot2Line />
            </div>
            <div className="message-content thinking">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleMessageSend} />
    </div>
  );
};

export default ChatView;