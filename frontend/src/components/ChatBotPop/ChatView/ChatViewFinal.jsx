import React, { useState, useEffect, useRef } from 'react';
import './ChatView.css';
import ChatInput from '../ChatInput/ChatInput';
import { IoPersonOutline, IoAddCircleOutline } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { FaTrash } from 'react-icons/fa';
import Settings from '../Settings/Settings';

const formatJsonString = (content) => {
  try {
    // Check if the content is wrapped in ```json ``` format
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1];
      try {
        // Check if the text is a JSON string
        const jsonObj = JSON.parse(jsonStr);
        
        // Custom stringify function to handle escaped quotes and nested JSON
        const customStringify = (obj, indent = 0) => {
          if (typeof obj === 'string') {
            try {
              // Try to parse the string as JSON
              const parsedJson = JSON.parse(obj);
              if (typeof parsedJson === 'object' && parsedJson !== null) {
                // If it's a valid JSON object/array, format it with proper indentation
                const nestedJson = customStringify(parsedJson, indent + 2);
                return `"\n${' '.repeat(indent + 2)}${nestedJson}\n${' '.repeat(indent)}"`;
              }
            } catch (e) {
              // Not a JSON string, handle normally
            }
            // Replace escaped double quotes with single quotes for normal strings
            return `"${obj.replace(/\\"/g, "'")}"`;
          }
          if (typeof obj !== 'object' || obj === null) {
            return JSON.stringify(obj);
          }
          const isArray = Array.isArray(obj);
          const items = Object.entries(obj).map(([key, value]) => {
            const valueStr = customStringify(value, indent + 2);
            return isArray ? valueStr : `"${key}": ${valueStr}`;
          });
          const bracket = isArray ? '[]' : '{}';
          if (items.length === 0) return bracket;
          return `${bracket[0]}\n${' '.repeat(indent + 2)}${items.join(',\n' + ' '.repeat(indent + 2))}\n${' '.repeat(indent)}${bracket[1]}`;
        };

        const formattedJson = customStringify(jsonObj);
        
        // Tokenize each line for proper coloring
        // This regex matches: key-value pairs, strings, numbers, booleans, null, braces, brackets, commas, colons
        const tokenRegex = /("[^"]*"\s*:\s*)|("[^"]*")|(\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],:])/g;
        const formattedContent = formattedJson.split('\n').map((line, index) => {
          const tokens = line.match(tokenRegex) || [];
          let lastIndex = 0;
          const elements = [];
          tokens.forEach((token, i) => {
            const start = line.indexOf(token, lastIndex);
            if (start > lastIndex) {
              // Add any whitespace or non-token text
              elements.push(line.slice(lastIndex, start));
            }
            lastIndex = start + token.length;
            // Style tokens
            if (/^"[^"]*"\s*:\s*$/.test(token)) {
              // Key: wrap quotes in .json-quote
              const match = token.match(/^("?)([^\"]*)("?)(\s*:\s*)$/);
              if (match) {
                elements.push(
                  <span key={i} className="json-key">
                    <span className="json-quote">"</span>{match[2]}<span className="json-quote">"</span>{match[4]}
                  </span>
                );
              } else {
                elements.push(<span key={i} className="json-key">{token}</span>);
              }
            } else if (/^"[^"]*"$/.test(token)) {
              // String: wrap quotes in .json-quote
              const inner = token.slice(1, -1);
              elements.push(
                <span key={i} className="json-string">
                  <span className="json-quote">"</span>{inner}<span className="json-quote">"</span>
                </span>
              );
            } else if (/^\d+\.?\d*$/.test(token)) {
              elements.push(<span key={i} className="json-number">{token}</span>);
            } else if (token === 'true' || token === 'false') {
              elements.push(<span key={i} className="json-boolean">{token}</span>);
            } else if (token === 'null') {
              elements.push(<span key={i} className="json-null">{token}</span>);
            } else if (/[{}\[\]]/.test(token)) {
              elements.push(<span key={i} className="json-brace">{token}</span>);
            } else if (token === ',' || token === ':') {
              elements.push(token);
            } else {
              elements.push(token);
            }
          });
          // Add any trailing text
          if (lastIndex < line.length) {
            elements.push(line.slice(lastIndex));
          }
          return <span key={index}>{elements}{'\n'}</span>;
        });

        return (
          <pre className="json-block">
            {formattedContent}
          </pre>
        );
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return content;
      }
    }
    return content;
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return content;
  }
};

const formatMessage = (content) => {
  if (typeof content !== 'string') return content;

  // Initialize arrays for storing extracted content
  const codeBlocks = [];
  const tables = [];

  // Step 1: Remove '---' lines and '>' characters
  content = content.replace(/^---\n?/gm, '');
  content = content.replace(/^>\s?/gm, '');

  // Step 2: Handle tables
  if (content.includes('|')) {
    const tableRegex = /(\|[^\n]+\n)+/g;
    content = content.replace(tableRegex, (match) => {
      const rows = match.trim().split('\n');
      const tableHtml = `
        <div class="table-wrapper">
          <table class="chat-table">
            <thead>
              ${rows[0].split('|').filter(cell => cell.trim()).map(cell => `
                <th>${cell.trim()}</th>
              `).join('')}
            </thead>
            <tbody>
              ${rows.slice(2).map(row => {
                const cells = row.split('|').filter(cell => cell.trim());
                return `
                  <tr>
                    ${cells.map(cell => `<td>${cell.trim()}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      tables.push(tableHtml);
      return `[[[TABLE_${tables.length - 1}]]]`;
    });
  }

  // Step 3: Handle code blocks with language specification
  if (content.includes('```')) {
    if (content.includes('```json')) {
      return formatJsonString(content);
    }
    
    // Updated regex to better handle code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

    content = content.replace(codeBlockRegex, (match, language, code) => {
      const cleanCode = code.trim();
      let displayedCode = cleanCode;
      let tableHtml = '';

      // More precise table detection regex that only matches markdown tables
      // and ignores HTML tables or other table-like structures
      const tableRegex = /^(?![^<]*>)\s*\|[^\n]+\|\s*\n\s*\|[-:]+\|\s*\n(?:\s*\|[^\n]+\|\s*\n)+/gm;
      const tableMatches = cleanCode.match(tableRegex);
      
      if (tableMatches) {
        // Process each table in the code block
        tableMatches.forEach(tableMatch => {
          // Skip if the table is part of HTML content
          if (tableMatch.includes('<table') || tableMatch.includes('</table>') || 
              tableMatch.includes('<th') || tableMatch.includes('</th>') ||
              tableMatch.includes('table-wrapper')  ||
              tableMatch.includes('<td') || tableMatch.includes('</td>')) {
            return;
          }

          const rows = tableMatch.trim().split('\n').map(row => row.trim()).filter(row => row.length > 0);
          
          // Validate table structure
          if (rows.length >= 3 && rows[1].match(/^\s*\|[-:]+\|\s*$/)) {
            const headers = rows[0].split('|').filter(cell => cell.trim());
            const dataRows = rows.slice(2);
            
            if (headers.length > 1) {
              tableHtml += `
                <div class="code-table-wrapper">
                  <table class="code-table">
                    <thead>
                      ${headers.map(cell => `
                        <th>${cell.trim()}</th>
                      `).join('')}
                    </thead>
                    <tbody>
                      ${dataRows.map(row => {
                        const cells = row.split('|').filter(cell => cell.trim());
                        return `
                          <tr>
                            ${cells.map(cell => `<td>${cell.trim()}</td>`).join('')}
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `;
              
              // Remove the table from the code content
              displayedCode = displayedCode.replace(tableMatch, '');
            }
          }
        });
      }

      // Clean up the code content
      displayedCode = displayedCode
        .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with double newline
        .replace(/^\s+/gm, '')       // Remove leading spaces
        .replace(/\s+$/gm, '')       // Remove trailing spaces
        .replace(/\s{2,}/g, ' ')     // Replace multiple spaces with single space
        .trim();                     // Final trim

      if (language === 'bash') {
        displayedCode = displayedCode
          .split('\n')
          .map(line => {
            if (line.trim() && !line.startsWith('$')) {
              return `<span class="prompt">$</span> ${line}`;
            }
            return line;
          })
          .join('\n');
      }

      // Create unique id for this block
      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

      // Only include the table wrapper if there's actual table content
      const tableSection = tableHtml ? tableHtml : '';

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
          <div class="code-content">
            ${tableSection}
            <pre id="${codeId}" class="code-block ${language ? `language-${language}` : ''}">${displayedCode}</pre>
          </div>
        </div>
      `;

      // Push HTML into array and replace with placeholder
      codeBlocks.push(html);
      return `[[[CODE_BLOCK_${codeBlocks.length - 1}]]]`;
    });

    // Step 4: Format quotes in regular text
    content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
    content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
    
    // Step 5: Fix malformed code blocks (if any)
    content = content.replace(/"code-block language-(\w+)">([^<]+)/g, (match, language, code) => {
      return `<pre class="code-block language-${language}">${code.trim()}</pre>`;
    });

    // Step 6: Format headings, bold, underline, color, severity level
    // First handle asterisk headings
    content = content.replace(/^\*+ (.*?)\*+$/gm, '<h1 class="chat-heading">$1</h1>');
    // Handle headings with underscores
    content = content.replace(/^([A-Za-z0-9\s&]+)\n[-=]+\n/gm, '<h1 class="chat-heading">$1</h1>');
    // Handle regular markdown headings
    content = content.replace(/^# (.*$)/gm, '<h1 class="chat-heading">$1</h1>');
    content = content.replace(/^## (.*$)/gm, '<h2 class="chat-heading">$1</h2>');
    content = content.replace(/^### (.*$)/gm, '<h3 class="chat-heading">$1</h3>');
    content = content.replace(/^#### (.*$)/gm, '<h4 class="chat-heading">$1</h4>');
    // Handle bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    // Handle underlined text
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');
    // Handle color tags
    content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
    // Handle severity level
    content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');

    // Step 7: Replace \n with <br> **only outside code blocks**
    content = content.replace(/\n/g, '<br>');

    // Step 8: Restore the code blocks from placeholders
    content = content.replace(/\[\[\[CODE_BLOCK_(\d+)\]\]\]/g, (match, index) => codeBlocks[index]);

    // Step 9: Restore the tables from placeholders
    content = content.replace(/\[\[\[TABLE_(\d+)\]\]\]/g, (match, index) => tables[index]);

    return content;
  }

  // If no code block, just format normally (with line breaks)
  content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
  content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
  
  // Handle headings in non-code content
  content = content.replace(/^\*+ (.*?)\*+$/gm, '<h1 class="chat-heading">$1</h1>');
  content = content.replace(/^([A-Za-z0-9\s&]+)\n[-=]+\n/gm, '<h1 class="chat-heading">$1</h1>');
  content = content.replace(/^# (.*$)/gm, '<h1 class="chat-heading">$1</h1>');
  content = content.replace(/^## (.*$)/gm, '<h2 class="chat-heading">$1</h2>');
  content = content.replace(/^### (.*$)/gm, '<h3 class="chat-heading">$1</h3>');
  content = content.replace(/^#### (.*$)/gm, '<h4 class="chat-heading">$1</h4>');
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  content = content.replace(/__(.*?)__/g, '<u>$1</u>');
  content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
  content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');
  content = content.replace(/\n/g, '<br>');

  return content;
};

const QUICK_REPLIES = [
  "Alert Analysis",
  "Incident Playbook",
  "Configure Settings",
  "General Security Chat"
];

function getWelcomeMessages() {
  return [
    {
      role: 'assistant',
      content: "Hi! Welcome to G&R bot security. I'll be assisting you here today.\nPlease select an option from the menu below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      role: 'quick_replies',
      content: QUICK_REPLIES,
      timestamp: null
    }
  ];
}

const ChatViewFinal = ({ showRecentChats, setShowRecentChats, alertData, showMenu, setShowMenu }) => {
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState(getWelcomeMessages());
    const [isThinking, setIsThinking] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletingChatId, setDeletingChatId] = useState(null);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [pendingAlertData, setPendingAlertData] = useState(null);
    const [settingsMessage, setSettingsMessage] = useState(null);
    const inactivityTimerRef = useRef(null);
    const [selectedSetting, setSelectedSetting] = useState(null);
    const [savedAlertData, setSavedAlertData] = useState(null);

    console.log('ChatViewFinal render - showMenu:', showMenu, 'showRecentChats:', showRecentChats);

    // Add effect to log state changes
    useEffect(() => {
        console.log('ChatViewFinal state changed - showMenu:', showMenu, 'showRecentChats:', showRecentChats);
    }, [showMenu, showRecentChats]);

    // Add state for current alert ID
    const [currentAlertId, setCurrentAlertId] = useState(null);

    // Function to reset the inactivity timer
    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            if (!isThinking) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I haven't heard from you in a while. Would you like to:",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }, {
                    role: 'menu',
                    content: <Settings 
                        pendingAlertData={pendingAlertData}
                        onSaveSettings={({ success, message }) => {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: message,
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            if (success) {
                                setMessages(prev => [...prev, {
                                    role: 'menu',
                                    content: (
                                        <div className="settings-actions">
                                            <button className="save-settings" onClick={() => handleConfigureSettings()}>
                                                Configure Another Category
                                            </button>
                                            <button className="back-settings" onClick={() => {
                                                setShowSettings(false);
                                                setSelectedSetting(null);
                                                setShowMenu(true);
                                            }}>
                                                Return to Main Menu
                                            </button>
                                        </div>
                                    ),
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }]);
                            }
                        }}
                    />,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        }, 1000000); // 30 seconds
    };

    // Effect to handle alert data when it changes
    useEffect(() => {
        if (alertData) {
            setPendingAlertData(alertData);
            setSavedAlertData(alertData); // Save the alert data
            setShowMenu(true);
        }
    }, [alertData]);

    // Effect to handle inactivity timer
    useEffect(() => {
        resetInactivityTimer();
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, [messages, isThinking]);

    const handleAnalyzeAlert = async () => {
        if (!pendingAlertData) {
            setMessages([{
                role: 'assistant',
                content: 'Please provide a security alert to analyze.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            return;
        }

        // Store the alert ID
        const alertId = pendingAlertData.displayData?.id || pendingAlertData.Id;
        if (alertId) {
            setCurrentAlertId(alertId);
            console.log('Stored alert ID:', alertId); // Debug log
        }

        const initialMessage = {
            role: 'user',
            content: `Please analyze this security alert:\n\n\`\`\`json\n${JSON.stringify(pendingAlertData, null, 2)}\n\`\`\``,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        try {
            const response = await fetch('http://localhost:5000/api/chat/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageId: Date.now().toString(),
                    message: initialMessage.content,
                    alertData: pendingAlertData,
                    isInitialAlert: true
                })
            });

            const data = await response.json();
            
            if (response.ok && data.response) {
                const chatResponse = await fetch('http://localhost:5000/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [initialMessage, {
                            role: 'assistant',
                            content: data.response,
                            timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }],
                        alertId: pendingAlertData.displayData?.id || Date.now().toString()
                    })
                });

                if (!chatResponse.ok) {
                    throw new Error('Failed to create chat');
                }

                const chatData = await chatResponse.json();
                setCurrentChatId(chatData._id);
                
                let botTimestamp = new Date(data.timestamp);
                if (isNaN(botTimestamp.getTime())) {
                  botTimestamp = new Date();
                }
                setMessages(prev => [
                    ...prev,
                    initialMessage,
                    {
                        role: 'assistant',
                        content: data.response,
                        timestamp: botTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    },
                    {
                        role: 'quick_replies',
                        content: QUICK_REPLIES,
                        timestamp: null
                    }
                ]);
            } else {
                throw new Error(data.error || 'Failed to analyze alert');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages([initialMessage, {
                role: 'assistant',
                content: 'Sorry, I encountered an error analyzing the alert. Please try again.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    };

    const handleConfigureSettings = () => {
        setShowSettings(true);
        setSelectedSetting(null);
        setMessages(prev => [...prev, {
            role: 'menu',
            content: <Settings 
                pendingAlertData={pendingAlertData}
                onSaveSettings={({ success, message }) => {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: message,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                    if (success) {
                        setMessages(prev => [...prev, {
                            role: 'menu',
                            content: (
                                <div className="settings-actions">
                                    <button className="save-settings" onClick={() => handleConfigureSettings()}>
                                        Configure Another Category
                                    </button>
                                    <button className="back-settings" onClick={() => {
                                        setShowSettings(false);
                                        setSelectedSetting(null);
                                        setShowMenu(true);
                                    }}>
                                        Return to Main Menu
                                    </button>
                                </div>
                            ),
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }]);
                    }
                }}
            />,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    };

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
                timestamp: msg.timestamp // Use the timestamp directly without parsing
            })));
            setCurrentChatId(chat._id);
            setShowRecentChats(false);
        } catch (err) {
            console.error('Error loading chat history:', err);
            setError('Failed to load chat history');
        }
    };

    const initializeNewChat = () => {
        setMessages(getWelcomeMessages());
        setCurrentChatId(null);
        setShowRecentChats(false);
        setShowMenu(false);
    };

    const handleMessageSend = async (content) => {
        if (isThinking) return;
        if (!content || content.trim() === '') {
            console.error('Empty message content');
            return;
        }

        // Reset the inactivity timer when a message is sent
        resetInactivityTimer();

        const userMessage = {
            role: 'user',
            content: content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);

        try {
            // Send the message to the assistant
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: content,
                    chatId: currentChatId,
                    alertData: savedAlertData || pendingAlertData // Use saved alert data if available
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                if (data.showMenu) {
                    // If showMenu is true, show the menu component
                    setShowMenu(true);
                    setIsThinking(false);
                    return;
                }

                if (!currentChatId) {
                    setCurrentChatId(data.chatId);
                    // Refresh recent chats when a new chat is created
                    await fetchRecentChats();
                }

                const assistantMessage = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, assistantMessage, { role: 'quick_replies', content: QUICK_REPLIES, timestamp: null }]);

                // Don't clear pending alert data after successful processing
                // This ensures the alert context is maintained throughout the conversation

                // Reset the inactivity timer after receiving a response
                resetInactivityTimer();
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    function handleQuickReplySelect(option) {
      if (option === "Configure Settings") {
        setShowSettings(true);
        setMessages(prev => [
          ...prev,
          {
            role: 'settings',
            content: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      } else if (option === "Alert Analysis") {
        if (!pendingAlertData) {
          setMessages([{
            role: 'assistant',
            content: 'Please provide a security alert to analyze.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          return;
        }
        handleAnalyzeAlert();
      } else if (option === "Incident Playbook") {
        handleMessageSend("Please help me create an incident playbook for this alert.");
      } else if (option === "General Security Chat") {
        handleMessageSend("I'd like to discuss some security topics.");
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'user', content: option, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
        handleMessageSend(option);
      }
    }

    // In the main render, always show the chat view (never the menu)
    return (
        <div className="ChatView">
            <div className="ChatMessages">
                {messages && messages.length > 0 ? (
                    messages.map((message, index) => (
                        message.role === 'quick_replies' ? (
                            <div key={index} style={{width: '100%'}}>
                                <div className="quick-replies-prompt">Choose an option:</div>
                                <div className="quick-replies-row">
                                    {message.content.map((reply, i) => (
                                        <button
                                            key={i}
                                            className="quick-reply-btn"
                                            onClick={() => {
                                                setMessages(prev => prev.filter((m, idx) => idx !== index));
                                                if (reply === "Incident Playbook" || reply === "General Security Chat") {
                                                    handleQuickReplySelect(reply);
                                                } else {
                                                    setMessages(prev => [
                                                        ...prev,
                                                        { role: 'user', content: reply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                                    ]);
                                                    handleQuickReplySelect(reply);
                                                }
                                            }}
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : message.role === 'settings' ? (
                            <div key={index} className="message settings-message">
                                <div className="message-text">
                                    <Settings
                                        pendingAlertData={pendingAlertData}
                                        onSaveSettings={({ success, message }) => {
                                            setMessages(prev => [...prev, {
                                                role: 'assistant',
                                                content: message,
                                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            }]);
                                        }}
                                    />
                                    <div className="message-timestamp">{message.timestamp}</div>
                                </div>
                            </div>
                        ) : (
                            <div key={index} className={`message ${message.role}`}>
                                <div className={`icon-wrapper ${message.role === 'user' ? 'user-icon-wrapper' : 'bot-icon-wrapper'}`}>
                                    {message.role === 'user' ? <IoPersonOutline className="icon" /> : <RiRobot2Line className="icon" />}
                                </div>
                                <div className="message-text">
                                    {typeof message.content === 'string'
                                        ? message.content.includes('```json')
                                            ? formatJsonString(message.content)
                                            : <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                                        : <div dangerouslySetInnerHTML={{ __html: message.content }} />}
                                    <div className="message-timestamp">
                                        {message.timestamp}
                                    </div>
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    <div className="no-messages">
                        Start a new conversation by sending a message.
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput
                onSend={handleMessageSend}
                isThinking={isThinking}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                selectedSetting={selectedSetting}
                setSelectedSetting={setSelectedSetting}
                settingsMessage={settingsMessage}
                setSettingsMessage={setSettingsMessage}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                initializeNewChat={initializeNewChat}
                recentChats={recentChats}
                deleteChat={deleteChat}
                selectChat={selectChat}
                isLoading={isLoading}
                error={error}
                showRecentChats={showRecentChats}
                setShowRecentChats={setShowRecentChats}
            />
        </div>
    );
};

export default ChatViewFinal;