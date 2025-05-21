import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import ChatInput from '../ChatInput/ChatInput';
import { useChat } from '../../../context/ChatContext';

const formatJson = (text) => {
    try {
        const jsonObj = JSON.parse(text);
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        
        return formattedJson.split('\n').map((line, index) => {
            const parts = line.split(/(?<=")([^"]+)(?=":)|(?<=: )([^,}\]]+)/g).filter(Boolean);
            
            return (
                <span key={index}>
                    {parts.map((part, i) => {
                        if (part.trim().startsWith('"')) {
                            return <span key={i} className="json-key">{part}</span>;
                        } else if (part.trim().startsWith('"') || part.trim().endsWith('"')) {
                            return <span key={i} className="json-string">{part}</span>;
                        } else if (!isNaN(part.trim())) {
                            return <span key={i} className="json-number">{part}</span>;
                        } else if (part.trim() === 'true' || part.trim() === 'false') {
                            return <span key={i} className="json-boolean">{part}</span>;
                        } else if (part.trim() === 'null') {
                            return <span key={i} className="json-null">{part}</span>;
                        }
                        return part;
                    })}
                    {'\n'}
                </span>
            );
        });
    } catch (e) {
        return text;
    }
};

const findJsonContent = (text) => {
    let startIndex = text.indexOf('{');
    if (startIndex === -1) return null;

    let bracketCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        
        if (inString) {
            if (char === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            if (char === '"' && !escaped) {
                inString = false;
            }
            escaped = false;
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            bracketCount++;
        } else if (char === '}') {
            bracketCount--;
            if (bracketCount === 0) {
                return {
                    before: text.substring(0, startIndex),
                    json: text.substring(startIndex, i + 1),
                    after: text.substring(i + 1)
                };
            }
        }
    }
    return null;
};

const INACTIVITY_WARNING_TIME = 10 * 60 * 1000; // 10 minutes
const CLOSE_AFTER_WARNING_TIME = 2 * 60 * 1000; // 2 minutes
const CHECK_INTERVAL = 5000; // Check every 5 seconds

const ChatView = () => {
    const { 
        messages, 
        addMessage, 
        lastActivityTime, 
        setLastActivityTime,
        closeChat,
        isChatOpen 
    } = useChat();
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [warningShown, setWarningShown] = useState(false);
    const [closingTimerStarted, setClosingTimerStarted] = useState(false);
    const messagesEndRef = useRef(null);
    const inactivityTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Reset all states when chat is closed
    useEffect(() => {
        if (!isChatOpen) {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
            }
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
            setWarningShown(false);
            setClosingTimerStarted(false);
        }
    }, [isChatOpen]);

    // Handle inactivity timer
    useEffect(() => {
        const checkInactivity = () => {
            const currentTime = Date.now();
            const timeSinceLastActivity = currentTime - lastActivityTime;

            if (!warningShown && timeSinceLastActivity >= INACTIVITY_WARNING_TIME) {
                console.log('Showing inactivity warning');
                addMessage({
                    role: 'bot',
                    content: "We haven't talked for a while, I hope you're doing well!"
                });
                setWarningShown(true);
                setClosingTimerStarted(true);

                // Set timer to close chat after warning time
                closeTimerRef.current = setTimeout(() => {
                    console.log('Closing chat due to inactivity');
                    closeChat();
                }, CLOSE_AFTER_WARNING_TIME);
            }
        };

        // Clear any existing timers when activity time changes
        if (inactivityTimerRef.current) {
            clearInterval(inactivityTimerRef.current);
        }

        // Only set up timer if chat is open and warning hasn't been shown
        if (isChatOpen && !closingTimerStarted) {
            inactivityTimerRef.current = setInterval(checkInactivity, CHECK_INTERVAL);
        }

        return () => {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
            }
        };
    }, [lastActivityTime, warningShown, addMessage, closeChat, isChatOpen, closingTimerStarted]);

    // Reset states when there's new activity
    useEffect(() => {
        const isUserMessage = messages[messages.length - 1]?.role === 'user';
        if (isUserMessage) {
            setWarningShown(false);
            setClosingTimerStarted(false);
            setLastActivityTime(Date.now());
            
            // Clear the close timer
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        }
    }, [messages, setLastActivityTime]);

    const renderBoldText = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const renderMessageContent = (content) => {
        const jsonContent = findJsonContent(content);
        
        if (jsonContent) {
            try {
                // Verify if it's valid JSON
                JSON.parse(jsonContent.json);
                
                return (
                    <div>
                        {jsonContent.before && <div>{renderBoldText(jsonContent.before)}</div>}
                        <pre>
                            <code>
                                {formatJson(jsonContent.json)}
                            </code>
                        </pre>
                        {jsonContent.after && <div>{renderBoldText(jsonContent.after)}</div>}
                    </div>
                );
            } catch (e) {
                // If JSON parsing fails, treat it as regular text
                return renderRegularText(content);
            }
        }

        return renderRegularText(content);
    };

    const renderRegularText = (content) => {
        const lines = content.split('\n');
        let currentList = [];
        let result = [];
        let isInCodeBlock = false;
        let currentCodeBlock = [];
        let codeBlockLanguage = '';

        const handleCopy = (code) => {
            navigator.clipboard.writeText(code).then(() => {
                // You can add a visual feedback here if needed
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('```')) {
                if (isInCodeBlock) {
                    const codeContent = currentCodeBlock.join('\n');
                    result.push(
                        <pre key={`code-${index}`} data-language={codeBlockLanguage}>
                            <div className="code-block-header">
                                <span className="code-language">{codeBlockLanguage || 'plaintext'}</span>
                                <button 
                                    className="copy-button"
                                    onClick={() => handleCopy(codeContent)}
                                    title="Copy code"
                                >
                                    Copy
                                </button>
                            </div>
                            <code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ''}>
                                {codeContent}
                            </code>
                        </pre>
                    );
                    currentCodeBlock = [];
                    isInCodeBlock = false;
                    codeBlockLanguage = '';
                } else {
                    isInCodeBlock = true;
                    codeBlockLanguage = trimmedLine.slice(3).trim();
                }
                return;
            }

            if (isInCodeBlock) {
                currentCodeBlock.push(line);
                return;
            }

            if (trimmedLine.startsWith('#')) {
                const level = trimmedLine.match(/^#+/)[0].length;
                const text = trimmedLine.replace(/^#+\s*/, '');
                const HeaderTag = `h${Math.min(level, 6)}`;
                result.push(React.createElement(HeaderTag, { key: index, className: 'markdown-header' }, text));
            }
            else if (trimmedLine.startsWith('-')) {
                const listItemText = trimmedLine.replace(/^-+\s*/, '').trim();
                currentList.push(<li key={index}>{renderBoldText(listItemText)}</li>);
            }
            else if (currentList.length > 0) {
                result.push(<ul key={`list-${index}`}>{currentList}</ul>);
                currentList = [];
                result.push(<div key={index}>{renderBoldText(line)}</div>);
            }
            else {
                result.push(<div key={index}>{renderBoldText(line)}</div>);
            }
        });

        if (currentList.length > 0) {
            result.push(<ul key="final-list">{currentList}</ul>);
        }

        if (isInCodeBlock && currentCodeBlock.length > 0) {
            const codeContent = currentCodeBlock.join('\n');
            result.push(
                <pre key="final-code" data-language={codeBlockLanguage}>
                    <div className="code-block-header">
                        <span className="code-language">{codeBlockLanguage || 'plaintext'}</span>
                        <button 
                            className="copy-button"
                            onClick={() => handleCopy(codeContent)}
                            title="Copy code"
                        >
                            Copy
                        </button>
                    </div>
                    <code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ''}>
                        {codeContent}
                    </code>
                </pre>
            );
        }

        return result;
    };

    const sendMessage = async (content) => {
        if (!content.trim() || isThinking) return;

        setLastActivityTime(Date.now());
        const userMessage = { role: "user", content };
        addMessage(userMessage);
        setInput("");
        setIsThinking(true);

        try {
            // Simulate bot response for now
            setTimeout(() => {
                const botResponse = { 
                    role: "bot", 
                    content: "I'm a simple bot for now. Your message was: " + content 
                };
                addMessage(botResponse);
                setIsThinking(false);
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
            setIsThinking(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
    };

    return (
        <div className="ChatView">
            <div className="ChatMessages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                        {msg.role === 'user' ? (
                            <div className="user-icon-wrapper icon-wrapper">
                                <IoPersonOutline className="icon" />
                            </div>
                        ) : (
                            <div className="bot-icon-wrapper icon-wrapper">
                                <RiRobot2Line className="icon" />
                            </div>
                        )}
                        <div className="message-text">{renderMessageContent(msg.content)}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="ChatInputArea">
                <ChatInput
                    input={input}
                    onChange={(e) => setInput(e.target.value)}
                    onSend={handleSend}
                />
                <button
                    onClick={handleSend}
                    className={`send-button ${isThinking ? 'thinking' : ''}`}
                    disabled={isThinking || !input.trim()}
                >
                    {isThinking ? <div className="spinner"></div> : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatView;