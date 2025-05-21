import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import { IoPersonOutline } from "react-icons/io5";
import { RiRobot2Line } from "react-icons/ri";
import ChatInput from '../ChatInput/ChatInput';

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

const ChatView = () => {
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hello! How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
            return (
                <pre>
                    <code>
                        {formatJson(content)}
                    </code>
                </pre>
            );
        }

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

        const userMessage = { role: "user", content };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsThinking(true);

        try {
            // Simulate bot response for now
            setTimeout(() => {
                const botResponse = { 
                    role: "bot", 
                    content: "I'm a simple bot for now. Your message was: " + content 
                };
                setMessages(prev => [...prev, botResponse]);
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