// import React, { useState, useEffect, useRef } from 'react';
// import './ChatView.css';
// import { IoPersonOutline } from "react-icons/io5";
// import { RiRobot2Line } from "react-icons/ri";
// import { IoAddCircleOutline } from "react-icons/io5";
// import { FaTrash } from "react-icons/fa";
// import { MdOutlineContentCopy } from "react-icons/md";
// import ChatInput from '../ChatInput/ChatInput';

// const API_URL = 'http://localhost:5000/api';

// const formatJsonString = (content) => {
//   try {
//     // Check if the content is wrapped in ```json ``` format
//     const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
//     if (jsonMatch) {
//       const jsonStr = jsonMatch[1];
//       try {
//         // Check if the text is a JSON string
//         const jsonObj = JSON.parse(jsonStr);
        
//         // Custom stringify function to handle escaped quotes and nested JSON
//         const customStringify = (obj, indent = 0) => {
//           if (typeof obj === 'string') {
//             try {
//               // Try to parse the string as JSON
//               const parsedJson = JSON.parse(obj);
//               if (typeof parsedJson === 'object' && parsedJson !== null) {
//                 // If it's a valid JSON object/array, format it with proper indentation
//                 const nestedJson = customStringify(parsedJson, indent + 2);
//                 return `"\n${' '.repeat(indent + 2)}${nestedJson}\n${' '.repeat(indent)}"`;
//               }
//             } catch (e) {
//               // Not a JSON string, handle normally
//             }
//             // Replace escaped double quotes with single quotes for normal strings
//             return `"${obj.replace(/\\"/g, "'")}"`;
//           }
//           if (typeof obj !== 'object' || obj === null) {
//             return JSON.stringify(obj);
//           }
//           const isArray = Array.isArray(obj);
//           const items = Object.entries(obj).map(([key, value]) => {
//             const valueStr = customStringify(value, indent + 2);
//             return isArray ? valueStr : `"${key}": ${valueStr}`;
//           });
//           const bracket = isArray ? '[]' : '{}';
//           if (items.length === 0) return bracket;
//           return `${bracket[0]}\n${' '.repeat(indent + 2)}${items.join(',\n' + ' '.repeat(indent + 2))}\n${' '.repeat(indent)}${bracket[1]}`;
//         };

//         const formattedJson = customStringify(jsonObj);
        
//         // Tokenize each line for proper coloring
//         // This regex matches: key-value pairs, strings, numbers, booleans, null, braces, brackets, commas, colons
//         const tokenRegex = /("[^"]*"\s*:\s*)|("[^"]*")|(\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}\[\],:])/g;
//         const formattedContent = formattedJson.split('\n').map((line, index) => {
//           const tokens = line.match(tokenRegex) || [];
//           let lastIndex = 0;
//           const elements = [];
//           tokens.forEach((token, i) => {
//             const start = line.indexOf(token, lastIndex);
//             if (start > lastIndex) {
//               // Add any whitespace or non-token text
//               elements.push(line.slice(lastIndex, start));
//             }
//             lastIndex = start + token.length;
//             // Style tokens
//             if (/^"[^"]*"\s*:\s*$/.test(token)) {
//               // Key: wrap quotes in .json-quote
//               const match = token.match(/^("?)([^\"]*)("?)(\s*:\s*)$/);
//               if (match) {
//                 elements.push(
//                   <span key={i} className="json-key">
//                     <span className="json-quote">"</span>{match[2]}<span className="json-quote">"</span>{match[4]}
//                   </span>
//                 );
//               } else {
//                 elements.push(<span key={i} className="json-key">{token}</span>);
//               }
//             } else if (/^"[^"]*"$/.test(token)) {
//               // String: wrap quotes in .json-quote
//               const inner = token.slice(1, -1);
//               elements.push(
//                 <span key={i} className="json-string">
//                   <span className="json-quote">"</span>{inner}<span className="json-quote">"</span>
//                 </span>
//               );
//             } else if (/^\d+\.?\d*$/.test(token)) {
//               elements.push(<span key={i} className="json-number">{token}</span>);
//             } else if (token === 'true' || token === 'false') {
//               elements.push(<span key={i} className="json-boolean">{token}</span>);
//             } else if (token === 'null') {
//               elements.push(<span key={i} className="json-null">{token}</span>);
//             } else if (/[{}\[\]]/.test(token)) {
//               elements.push(<span key={i} className="json-brace">{token}</span>);
//             } else if (token === ',' || token === ':') {
//               elements.push(token);
//             } else {
//               elements.push(token);
//             }
//           });
//           // Add any trailing text
//           if (lastIndex < line.length) {
//             elements.push(line.slice(lastIndex));
//           }
//           return <span key={index}>{elements}{'\n'}</span>;
//         });

//         return (
//           <pre className="json-block">
//             {formattedContent}
//           </pre>
//         );
//       } catch (e) {
//         console.error('Error parsing JSON:', e);
//         return content;
//       }
//     }
//     return content;
//   } catch (error) {
//     console.error('Error formatting JSON:', error);
//     return content;
//   }
// };

// function copyCode(codeId) {
//   const codeElement = document.getElementById(codeId);
//   if (!codeElement) return;

//   // Get the raw text content without HTML tags
//   const text = codeElement.innerText;

//   navigator.clipboard.writeText(text).then(() => {
//     alert('Code copied to clipboard!');
//   }).catch(() => {
//     alert('Failed to copy code.');
//   });
// }

// const formatMessage = (content) => {
//   if (typeof content !== 'string') return content;

//   // Step 1: Handle code blocks with language specification
//   if (content.includes('```')) {
//     if (content.includes('```json')) {
//       return formatJsonString(content);
//     }
    
//     const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

//     // We'll extract code blocks first and store them in an array
//     const codeBlocks = [];
//     content = content.replace(codeBlockRegex, (match, language, code) => {
//       const cleanCode = code.trim();
//       let displayedCode = cleanCode;

//       if (language === 'bash') {
//         displayedCode = cleanCode
//           .split('\n')
//           .map(line => `<span class="prompt">$</span> ${line}`)
//           .join('\n');
//       }

//       // Create unique id for this block
//       const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

//       const html = `
//         <div class="code-block-wrapper">
//           <div class="code-header">
//             <span class="code-language-label">${language || 'code'}</span>
//             <button class="copy-button" data-code-id="${codeId}">
//               <svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16">
//                 <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
//               </svg>
//             </button>
//           </div>
//           <pre id="${codeId}" class="code-block ${language ? `language-${language}` : ''}">${displayedCode}</pre>
//         </div>
//       `;

//       // Push HTML into array and replace with placeholder
//       codeBlocks.push(html);
//       return `[[[CODE_BLOCK_${codeBlocks.length - 1}]]]`;
//     });

//     // Step 2: Format quotes in regular text
//     content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
//     content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
    
//     // Step 3: Fix malformed code blocks (if any)
//     content = content.replace(/"code-block language-(\w+)">([^<]+)/g, (match, language, code) => {
//       return `<pre class="code-block language-${language}">${code.trim()}</pre>`;
//     });

//     // Step 4: Format headings, bold, underline, color, severity level
//     content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/(<h1>.*?<\/h1>)\n+/g, '$1');
//     content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/(<h2>.*?<\/h2>)\n+/g, '$1');
//     content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/(<h3>.*?<\/h3>)\n+/g, '$1');
//     content = content.replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/(<h4>.*?<\/h4>)\n+/g, '$1');
//     content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
//     content = content.replace(/__(.*?)__/g, '<u>$1</u>');
//     content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
//     content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');

//     // Step 5: Replace \n with <br> **only outside code blocks**
//     content = content.replace(/\n/g, '<br>');

//     // Step 6: Restore the code blocks from placeholders
//     content = content.replace(/\[\[\[CODE_BLOCK_(\d+)\]\]\]/g, (match, index) => codeBlocks[index]);

//     return content;
//   }

//   // If no code block, just format normally (with line breaks)
//   content = content.replace(/"([^"]+)"/g, '<code class="double-quote">$1</code>');
//   content = content.replace(/@@@([^@]+)@@@/g, '<code class="triple-at">$1</code>');
  
//   content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/(<h1>.*?<\/h1>)\n+/g, '$1');
//   content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/(<h2>.*?<\/h2>)\n+/g, '$1');
//   content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/(<h3>.*?<\/h3>)\n+/g, '$1');
//   content = content.replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/(<h4>.*?<\/h4>)\n+/g, '$1');
//   content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
//   content = content.replace(/__(.*?)__/g, '<u>$1</u>');
//   content = content.replace(/\[color=(.*?)\](.*?)\[\/color\]/g, '<span style="color: $1">$2</span>');
//   content = content.replace(/Severity Level: (Low|Medium|High|Critical)/g, '<strong class="severity-level">Severity Level: $1</strong>');
//   content = content.replace(/\n/g, '<br>');

//   return content;
// };

// const ChatView = ({ showRecentChats, setShowRecentChats, alertData }) => {
//   const [messages, setMessages] = useState([]);
//   const [isThinking, setIsThinking] = useState(false);
//   const [chatId, setChatId] = useState(null);
//   const [recentChats, setRecentChats] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [deletingChatId, setDeletingChatId] = useState(null);
//   const messagesEndRef = useRef(null);
//   const [currentAlertData, setCurrentAlertData] = useState(null);
//   const [copiedCodeId, setCopiedCodeId] = useState(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const fetchRecentChats = async (showLoadingState = true) => {
//     try {
//       if (showLoadingState) {
//         setIsLoading(true);
//       }
//       setError(null);
//       const response = await fetch(`${API_URL}/chats/recent`);
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
      
//       // Filter out chats that only contain bot messages
//       const filteredChats = Array.isArray(data) ? data.filter(chat => {
//         // Check if chat has messages
//         if (!chat.messages || chat.messages.length === 0) return false;
        
//         // Check if there's at least one user message
//         return chat.messages.some(msg => msg.role === 'user');
//       }) : [];
      
//       setRecentChats(filteredChats);
      
//       // If no valid chats remain, initialize a new chat
//       if (filteredChats.length === 0) {
//         initializeNewChat();
//       }
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//       setError('Failed to load recent chats. Please try again.');
//       setRecentChats([]);
//     } finally {
//       if (showLoadingState) {
//         setIsLoading(false);
//       }
//     }
//   };

//   const selectChat = async (selectedChat) => {
//     setChatId(selectedChat._id);
//     setMessages(selectedChat.messages);
//     setShowRecentChats(false);
//   };

//   // Effect to handle new alert data
//   useEffect(() => {
//     if (alertData && alertData !== currentAlertData) {
//       console.log('New alert data received:', alertData);
//       setCurrentAlertData(alertData);
//       initializeNewChatWithAlert(alertData);
//     }
//   }, [alertData, currentAlertData]);

//   const initializeNewChatWithAlert = async (alert) => {
//     try {
//       console.log('Initializing chat with alert:', alert);
      
//       // Create initial user message with the simplified display data
//       const userMessage = {
//         role: 'user',
//         content: `I want to discuss alert ${alert.displayData.id}: ${alert.displayData.title}`,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };

//       // Create new chat with the alert message
//       const response = await fetch(`${API_URL}/chats`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           messages: [userMessage]
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => null);
//         throw new Error(errorData?.message || `Failed to create chat: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log('Chat created:', data);
      
//       setChatId(data._id);
//       setMessages([userMessage]);
//       setShowRecentChats(false);

//       // Set thinking state
//       setIsThinking(true);

//       // Immediately send the alert to get an initial response
//       const processResponse = await fetch(`${API_URL}/chat/process`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: userMessage.content,
//           alertData: alert.fullData,  // Send the full alert data
//           timestamp: userMessage.timestamp,
//           chatId: data._id
//         })
//       });

//       if (!processResponse.ok) {
//         const errorData = await processResponse.json().catch(() => null);
//         console.error('Process response error:', errorData);
//         throw new Error(errorData?.message || `Failed to process alert: ${processResponse.status}`);
//       }

//       const processData = await processResponse.json();
//       console.log('Process response:', processData);
      
//       if (!processData.response) {
//         throw new Error('No response content received from the server');
//       }

//       // Clear thinking state before adding the response
//       setIsThinking(false);

//       // Add the bot's response to the messages
//       const botMessage = {
//         role: 'assistant',
//         content: processData.response,
//         timestamp: processData.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };

//       // Update messages in state
//       setMessages(prevMessages => [...prevMessages, botMessage]);

//       // Save both messages to the backend in a single request
//       const saveResponse = await fetch(`${API_URL}/chats/${data._id}/messages`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify([userMessage, botMessage])
//       });

//       if (!saveResponse.ok) {
//         const errorText = await saveResponse.text();
//         console.warn('Failed to save messages:', errorText);
//       }
      
//       // Update recent chats in the background
//       await fetchRecentChats(false);
//     } catch (error) {
//       console.error('Error creating chat session with alert:', error);
//       // Show error message to user
//       const errorMessage = {
//         role: 'assistant',
//         content: `Sorry, I encountered an error processing the alert: ${error.message}. Please try again.`,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
//       setMessages(prevMessages => [...prevMessages, errorMessage]);
//       setIsThinking(false);
//     }
//   };

//   const initializeNewChat = async () => {
//     try {
//       const welcomeMessage = {
//         role: 'bot',
//         content: "Hello, I'm here to help you understand the Alerts.\n\nClick on one of them to get information.",
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };

//       // Set the welcome message immediately in the UI
//       setMessages([welcomeMessage]);

//       // Create new chat with just the welcome message
//       const response = await fetch(`${API_URL}/chats`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           messages: [welcomeMessage]
//         })
//       });
//       const data = await response.json();
//       setChatId(data._id);
      
//       // Update recent chats in the background
//       await fetchRecentChats(false);
      
//       // Switch to chat view
//       setShowRecentChats(false);
//     } catch (error) {
//       console.error('Error creating chat session:', error);
//     }
//   };

//   useEffect(() => {
//     fetchRecentChats();
//   }, []); // Fetch recent chats on mount

//   // Effect to initialize a new chat if none is loaded after fetching recent chats
//   useEffect(() => {
//     if (!isLoading && !chatId && recentChats.length === 0) {
//       initializeNewChat();
//     }
//   }, [isLoading, chatId, recentChats]);

//   // Add a new effect to ensure welcome message is shown when chat is first opened
//   useEffect(() => {
//     if (!showRecentChats && messages.length === 0) {
//       initializeNewChat();
//     }
//   }, [showRecentChats]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages, isThinking]);

//   const addMessage = async (message) => {
//     if (!chatId) return;

//     try {
//       const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(message)
//       });
//       const data = await response.json();
//       setMessages(data.messages);
//     } catch (error) {
//       console.error('Error adding message:', error);
//     }
//   };

//   const handleMessageSend = async (content) => {
//     // Prevent sending if already thinking
//     if (isThinking) {
//       return;
//     }

//     try {
//       // If no chatId exists, create a new chat first
//       if (!chatId) {
//         await initializeNewChat();
//       }

//       const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
//       // Create user message
//       const userMessage = {
//         role: 'user',
//         content,
//         timestamp
//       };

//       // Set thinking state and show user message immediately
//       setIsThinking(true);
//       setMessages(prevMessages => [...prevMessages, userMessage]);

//       // Send the message to the backend, which will forward it to AutoGen
//       const response = await fetch(`${API_URL}/chat/process`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: content,
//           alertData: currentAlertData,
//           timestamp,
//           chatId
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
      
//       // Clear thinking state before adding the response
//       setIsThinking(false);

//       // Create bot message from AutoGen response
//       const botMessage = {
//         role: 'assistant',
//         content: data.response,
//         timestamp: data.timestamp
//       };

//       // Add bot message to UI
//       setMessages(prevMessages => [...prevMessages, botMessage]);

//       // Save both messages to backend in a single request
//       const saveResponse = await fetch(`${API_URL}/chats/${chatId}/messages`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify([userMessage, botMessage])
//       });

//       if (!saveResponse.ok) {
//         const errorText = await saveResponse.text();
//         console.warn('Failed to save messages:', errorText);
//       }

//       // Refresh recent chats to show the updated conversation
//       await fetchRecentChats(false);
//     } catch (error) {
//       console.error('Error processing message:', error);
//       const errorMessage = {
//         role: 'assistant',
//         content: 'Sorry, I encountered an error processing your message. Please try again.',
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
//       setMessages(prevMessages => [...prevMessages, errorMessage]);
//       setIsThinking(false);
//     }
//   };

//   const deleteChat = async (chatId, e) => {
//     e.stopPropagation(); // Prevent chat selection when clicking delete
//     try {
//       // Set the deleting state
//       setDeletingChatId(chatId);

//       // Wait for animation
//       await new Promise(resolve => setTimeout(resolve, 300));

//       const response = await fetch(`${API_URL}/chats/delete/${chatId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => null);
//         throw new Error(errorData?.message || `Failed to delete chat. Status: ${response.status}`);
//       }

//       // Remove the chat from the list
//       setRecentChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
      
//       // Fetch updated chats in background without loading state
//       await fetchRecentChats(false);
//     } catch (error) {
//       console.error('Error deleting chat:', error);
//       setError(`Failed to delete chat: ${error.message}`);
//       await fetchRecentChats(false);
//       setTimeout(() => setError(null), 3000);
//     } finally {
//       setDeletingChatId(null);
//     }
//   };

//   // Add event listener for copy events
//   useEffect(() => {
//     const handleCopyClick = (event) => {
//       const button = event.target.closest('.copy-button');
//       if (!button) return;

//       const codeId = button.getAttribute('data-code-id');
//       if (!codeId) return;

//       const codeElement = document.getElementById(codeId);
//       if (!codeElement) return;

//       try {
//         // Get the raw text content without HTML tags
//         const text = codeElement.innerText.replace(/\$\s/g, ''); // Remove bash prompts
//         navigator.clipboard.writeText(text).then(() => {
//           // Update button text and class
//           const buttonText = button.querySelector('span');
//           if (buttonText) {
//             buttonText.textContent = 'Copied!';
//           }
//           button.classList.add('copied');
          
//           // Reset after 2 seconds
//           setTimeout(() => {
//             if (buttonText) {
//               buttonText.textContent = 'Copy';
//             }
//             button.classList.remove('copied');
//           }, 2000);
//         });
//       } catch (err) {
//         console.error('Failed to copy code:', err);
//       }
//     };

//     // Add click event listener to the document
//     document.addEventListener('click', handleCopyClick);

//     // Cleanup
//     return () => {
//       document.removeEventListener('click', handleCopyClick);
//     };
//   }, [messages]); // Re-run when messages change

//   return (
//     <div className="ChatView">
//       <div className="ChatMessages">
//         {showRecentChats ? (
//           <div className="recent-chats">
//             <h3>Recent Conversations</h3>
//             {isLoading ? (
//               <div className="loading-spinner">Loading recent chats...</div>
//             ) : error ? (
//               <div className="error-message">
//                 {error}
//                 <button onClick={fetchRecentChats} className="retry-button">
//                   Retry
//                 </button>
//               </div>
//             ) : (
//               <div className="recent-chats-list">
//                 {recentChats && recentChats.length > 0 ? (
//                   <>
//                     {recentChats.map((chat) => (
//                       <div
//                         key={chat._id}
//                         className={`recent-chat-item ${deletingChatId === chat._id ? 'deleting' : ''}`}
//                         onClick={() => selectChat(chat)}
//                       >
//                         <div className="recent-chat-preview">
//                           <div className="recent-chat-time">
//                             {new Date(chat.updatedAt).toLocaleString()}
//                           </div>
//                           <div className="recent-chat-messages">
//                             {chat.messages && chat.messages.length > 0 && (
//                               <>
//                                 {/* Show alert title from first message if it exists */}
//                                 {chat.messages[0].content && (
//                                   <div className="preview-message alert-title">
//                                     {(() => {
//                                       try {
//                                         // First try to find JSON data
//                                         const jsonMatch = chat.messages[0].content.match(/```json\n([\s\S]*?)\n```/);
//                                         if (jsonMatch) {
//                                           const alertData = JSON.parse(jsonMatch[1]);
//                                           // Try to get description from different possible fields
//                                           const description = alertData.description || 
//                                                            alertData.Description || 
//                                                            alertData.details?.description ||
//                                                            'Alert Analysis';
//                                           return description.length > 50 
//                                             ? description.substring(0, 50) + '...' 
//                                             : description;
//                                         }
                                        
//                                         // If no JSON found, try to get the first line of the message
//                                         const firstLine = chat.messages[0].content.split('\n')[0];
//                                         if (firstLine && !firstLine.includes('```')) {
//                                           return firstLine.length > 50 
//                                             ? firstLine.substring(0, 50) + '...' 
//                                             : firstLine;
//                                         }
//                                       } catch (e) {
//                                         console.error('Error parsing alert data:', e);
//                                       }
//                                       return 'Alert Analysis';
//                                     })()}
//                                   </div>
//                                 )}
//                                 {/* Show last two messages */}
//                                 {chat.messages.slice(-2).map((msg, idx) => (
//                                   <div key={idx} className={`preview-message ${msg.role}`}>
//                                     {msg.content && msg.content.length > 50 
//                                       ? msg.content.substring(0, 50) + '...' 
//                                       : msg.content}
//                                   </div>
//                                 ))}
//                               </>
//                             )}
//                           </div>
//                         </div>
//                         <button 
//                           className="delete-chat-button"
//                           onClick={(e) => deleteChat(chat._id, e)}
//                           title="Delete chat"
//                           disabled={deletingChatId === chat._id}
//                         >
//                           <FaTrash />
//                         </button>
//                       </div>
//                     ))}
//                   </>
//                 ) : (
//                   <div className="no-chats-message">
//                     No recent conversations found.
//                   </div>
//                 )}
//                 <button 
//                   className="new-chat-button"
//                   onClick={initializeNewChat}
//                 >
//                   <IoAddCircleOutline />
//                   <span>Start New Chat</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         ) : (
//           <>
//             {messages && messages.length > 0 ? (
//               messages.map((message, index) => (
//                 <div key={index} className={`message ${message.role}`}>
//                   <div className={`icon-wrapper ${message.role === 'user' ? 'user-icon-wrapper' : 'bot-icon-wrapper'}`}>
//                     {message.role === 'user' ? <IoPersonOutline className="icon" /> : <RiRobot2Line className="icon" />}
//                   </div>
//                   <div className="message-text">
//                     {typeof message.content === 'string' 
//                       ? message.content.includes('```json')
//                         ? formatJsonString(message.content)
//                         : <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
//                       : <div dangerouslySetInnerHTML={{ __html: message.content }} />
//                     }
//                     <div className="message-timestamp">
//                       {message.timestamp}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="no-messages">
//                 Start a new conversation by sending a message.
//               </div>
//             )}
//             {isThinking && (
//               <div className="message bot">
//                 <div className="icon-wrapper bot-icon-wrapper">
//                   <RiRobot2Line className="icon" />
//                 </div>
//                 <div className="message-text thinking">
//                   <div className="thinking-dots">
//                     <span></span>
//                     <span></span>
//                     <span></span>
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </>
//         )}
//       </div>
//       {!showRecentChats && (
//         <div className="ChatInputArea">
//           <ChatInput onSend={handleMessageSend} isDisabled={isThinking} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatView;