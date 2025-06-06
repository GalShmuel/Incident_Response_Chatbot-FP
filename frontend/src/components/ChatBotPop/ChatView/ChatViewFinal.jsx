import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import ChatInput from '../ChatInput/ChatInput';
import { IoPersonOutline, IoAddCircleOutline } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { FaTrash } from 'react-icons/fa';

const formatJsonString = (content) => {
    try {
        // Extract JSON content from the code block
        const jsonMatch = content.match(/```json\n([\s\S]*?)```/);
        if (!jsonMatch) return content;

        const jsonContent = jsonMatch[1].trim();
        const parsedJson = JSON.parse(jsonContent);
        const formattedJson = JSON.stringify(parsedJson, null, 2);

        // Create a formatted HTML representation
        const formattedHtml = formattedJson
            .split('\n')
            .map(line => {
                // Add syntax highlighting
                return line
                    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
                    .replace(/"([^"]+)"/g, '<span class="json-string">"$1"</span>')
                    .replace(/(\d+)/g, '<span class="json-number">$1</span>')
                    .replace(/(true|false)/g, '<span class="json-boolean">$1</span>')
                    .replace(/null/g, '<span class="json-null">null</span>')
                    .replace(/({|}|\[|\])/g, '<span class="json-brace">$1</span>');
            })
            .join('\n');

        return `
            <div class="json-block">
                <pre>${formattedHtml}</pre>
            </div>
        `;
    } catch (error) {
        console.error('Error formatting JSON:', error);
        return content;
    }
};

const formatMessage = (content) => {
    if (typeof content !== 'string') return content;
  
    // Step 1: Handle code blocks with language specification
    if (content.includes('```')) {
      if (content.includes('```json')) {
        return formatJsonString(content);
      }
      
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
      // We'll extract code blocks first and store them in an array
      const codeBlocks = [];
      content = content.replace(codeBlockRegex, (match, language, code) => {
        const cleanCode = code.trim();
        let displayedCode = cleanCode;
  
        if (language === 'bash') {
          displayedCode = cleanCode
            .split('\n')
            .map(line => `<span class="prompt">$</span> ${line}`)
            .join('\n');
        }
  
        // Create unique id for this block
        const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
  
        const html = `
          <div class="code-block-wrapper">
            <div class="code-header">
              <span class="code-language-label">${language || 'code'}</span>
              <button class="copy-button" data-code-id="${codeId}">
                <svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
            <pre id="${codeId}" class="code-block ${language ? `language-${language}` : ''}">${displayedCode}</pre>
          </div>
        `;
  
        // Push HTML into array and replace with placeholder
        codeBlocks.push(html);
        return `[[[CODE_BLOCK_${codeBlocks.length - 1}]]]`;
      });
  
      // Step 2: Format quotes in regular text
      content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
      content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
      
      // Step 3: Fix malformed code blocks (if any)
      content = content.replace(/"code-block language-(\w+)">([^<]+)/g, (match, language, code) => {
        return `<pre class="code-block language-${language}">${code.trim()}</pre>`;
      });
  
      // Step 4: Format headings, bold, underline, color, severity level
      content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/(<h1>.*?<\/h1>)\n+/g, '$1');
      content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/(<h2>.*?<\/h2>)\n+/g, '$1');
      content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/(<h3>.*?<\/h3>)\n+/g, '$1');
      content = content.replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/(<h4>.*?<\/h4>)\n+/g, '$1');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/__(.*?)__/g, '<u>$1</u>');
      content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
      content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');
  
      // Step 5: Replace \n with <br> **only outside code blocks**
      content = content.replace(/\n/g, '<br>');
  
      // Step 6: Restore the code blocks from placeholders
      content = content.replace(/\[\[\[CODE_BLOCK_(\d+)\]\]\]/g, (match, index) => codeBlocks[index]);
  
      return content;
    }
    
  // If no code block, just format normally (with line breaks)
  content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
  content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
  
  content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/(<h1>.*?<\/h1>)\n+/g, '$1');
  content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/(<h2>.*?<\/h2>)\n+/g, '$1');
  content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/(<h3>.*?<\/h3>)\n+/g, '$1');
  content = content.replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/(<h4>.*?<\/h4>)\n+/g, '$1');
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/__(.*?)__/g, '<u>$1</u>');
  content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
  content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');
  content = content.replace(/\n/g, '<br>');

  return content;
};

const ChatViewFinal = ({ showRecentChats, setShowRecentChats, alertData }) => {
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletingChatId, setDeletingChatId] = useState(null);
    const [currentChatId, setCurrentChatId] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch recent chats when component mounts or showRecentChats changes
    useEffect(() => {
        if (showRecentChats) {
            fetchRecentChats();
            // Set up periodic refresh every 30 seconds
            const refreshInterval = setInterval(fetchRecentChats, 30000);
            return () => clearInterval(refreshInterval);
        }
    }, [showRecentChats]);

    const fetchRecentChats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/chats');
            if (!response.ok) throw new Error('Failed to fetch recent chats');
            const data = await response.json();
            console.log('Fetched recent chats:', data); // Debug log
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format');
            }
            setRecentChats(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching recent chats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        setDeletingChatId(chatId);
        try {
            const response = await fetch(`http://localhost:5000/api/chats/${chatId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete chat');
            // Refresh the recent chats list after deletion
            await fetchRecentChats();
            if (currentChatId === chatId) {
                setCurrentChatId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Error deleting chat:', err);
            setError('Failed to delete chat');
        } finally {
            setDeletingChatId(null);
        }
    };

    const selectChat = async (chat) => {
        try {
            const response = await fetch(`http://localhost:5000/api/chats/${chat._id}`);
            if (!response.ok) throw new Error('Failed to fetch chat history');
            const chatData = await response.json();
            
            setMessages(chatData.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp).toLocaleTimeString()
            })));
            setCurrentChatId(chat._id);
            setShowRecentChats(false);
        } catch (err) {
            console.error('Error loading chat history:', err);
            setError('Failed to load chat history');
        }
    };

    const initializeNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
        setShowRecentChats(false);
    };

    const handleMessageSend = async (content) => {
        if (isThinking) return;

        const userMessage = {
            role: 'user',
            content: content,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: content,
                    chatId: currentChatId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                if (!currentChatId) {
                    setCurrentChatId(data.chatId);
                    // Refresh recent chats when a new chat is created
                    await fetchRecentChats();
                }

                const assistantMessage = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toLocaleTimeString()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toLocaleTimeString()
            }]);
        } finally {
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
                            <>
                                <div className="recent-chats-list">
                                    {recentChats && recentChats.length > 0 ? (
                                        recentChats.map((chat) => (
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
                                                        {chat.messages && chat.messages.length > 0 && (
                                                            <>
                                                                {chat.messages[0].content && (
                                                                    <div className="preview-message alert-title">
                                                                        {(() => {
                                                                            try {
                                                                                const jsonMatch = chat.messages[0].content.match(/```json\n([\s\S]*?)\n```/);
                                                                                if (jsonMatch) {
                                                                                    const alertData = JSON.parse(jsonMatch[1]);
                                                                                    const description = alertData.description || 
                                                                                                     alertData.Description || 
                                                                                                     alertData.details?.description ||
                                                                                                     'Alert Analysis';
                                                                                    return description.length > 50 
                                                                                        ? description.substring(0, 50) + '...' 
                                                                                        : description;
                                                                                }
                                                                                
                                                                                const firstLine = chat.messages[0].content.split('\n')[0];
                                                                                if (firstLine && !firstLine.includes('```')) {
                                                                                    return firstLine.length > 50 
                                                                                        ? firstLine.substring(0, 50) + '...' 
                                                                                        : firstLine;
                                                                                }
                                                                            } catch (e) {
                                                                                console.error('Error parsing alert data:', e);
                                                                            }
                                                                            return 'Alert Analysis';
                                                                        })()}
                                                                    </div>
                                                                )}
                                                                {chat.messages.slice(-2).map((msg, idx) => (
                                                                    <div key={idx} className={`preview-message ${msg.role}`}>
                                                                        {msg.content && msg.content.length > 50 
                                                                            ? msg.content.substring(0, 50) + '...' 
                                                                            : msg.content}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
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
                                        ))
                                    ) : (
                                        <div className="no-chats-message">
                                            No recent conversations found.
                                        </div>
                                    )}
                                </div>
                                <div className="recent-chats-footer">
                                    <button 
                                        className="new-chat-button"
                                        onClick={initializeNewChat}
                                    >
                                        <IoAddCircleOutline />
                                        <span>Start New Chat</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {messages && messages.length > 0 ? (
                            messages.map((message, index) => (
                                <div key={index} className={`message ${message.role}`}>
                                    <div className={`icon-wrapper ${message.role === 'user' ? 'user-icon-wrapper' : 'bot-icon-wrapper'}`}>
                                        {message.role === 'user' ? <IoPersonOutline className="icon" /> : <RiRobot2Line className="icon" />}
                                    </div>
                                    <div className="message-text">
                                        {typeof message.content === 'string' 
                                            ? message.content.includes('```json')
                                                ? formatJsonString(message.content)
                                                : <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                                            : <div dangerouslySetInnerHTML={{ __html: message.content }} />
                                        }
                                        <div className="message-timestamp">
                                            {message.timestamp}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-messages">
                                Start a new conversation by sending a message.
                            </div>
                        )}
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
}

export default ChatViewFinal;