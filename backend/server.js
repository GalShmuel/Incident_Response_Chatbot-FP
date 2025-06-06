// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const axios = require('axios');
// const Chat = require('./models/Chat');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => console.log('Connected to MongoDB Atlas'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Routes

// // Get recent chats (last 5)
// app.get('/api/chats/recent', async (req, res) => {
//     try {
//         const recentChats = await Chat.find()
//             .sort({ updatedAt: -1 })
//             .limit(5);
//         res.json(recentChats);
//     } catch (error) {
//         console.error('Error fetching recent chats:', error);
//         res.status(500).json({ message: error.message });
//     }
// });

// // Delete a chat
// app.delete('/api/chats/delete/:id', async (req, res) => {
//     try {
//         const chat = await Chat.findByIdAndDelete(req.params.id);
//         if (!chat) {
//             return res.status(404).json({ message: 'Chat not found' });
//         }
//         res.json({ message: 'Chat deleted successfully', deletedChat: chat });
//     } catch (error) {
//         console.error('Error deleting chat:', error);
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get a specific chat session
// app.get('/api/chats/:id', async (req, res) => {
//     try {
//         const chat = await Chat.findById(req.params.id);
//         if (!chat) {
//             return res.status(404).json({ message: 'Chat not found' });
//         }
//         res.json(chat);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get all chat sessions (you might want to add pagination later)
// app.get('/api/chats', async (req, res) => {
//     try {
//         const chats = await Chat.find().sort({ updatedAt: -1 });
//         res.json(chats);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Create a new chat session
// app.post('/api/chats', async (req, res) => {
//     try {
//         const { messages, alertId } = req.body;
//         const chat = new Chat({
//             messages: messages || [],
//             alertId: alertId // Store alert ID with chat
//         });
//         await chat.save();
//         res.status(201).json(chat);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Add messages to an existing chat
// app.post('/api/chats/:chatId/messages', async (req, res) => {
//     try {
//         const chat = await Chat.findById(req.params.chatId);
//         if (!chat) {
//             return res.status(404).json({ message: 'Chat not found' });
//         }

//         const messages = Array.isArray(req.body) ? req.body : [req.body];
        
//         // Validate each message
//         for (const message of messages) {
//             if (!message.role || !message.content || !message.id) {
//                 console.error('Invalid message format:', message);
//                 return res.status(400).json({ 
//                     message: 'Invalid message format. Each message must have id, role, and content.',
//                     invalidMessage: message 
//                 });
//             }

//             // Check for duplicates based on message ID first
//             const isDuplicateById = chat.messages.some(existingMsg => 
//                 existingMsg.id === message.id
//             );

//             if (isDuplicateById) {
//                 console.log(`Skipping duplicate message with ID ${message.id}`);
//                 continue;
//             }

//             // Fallback check for duplicates based on role, content, and timestamp
//             const isDuplicateByContent = chat.messages.some(existingMsg => 
//                 existingMsg.role === message.role && 
//                 existingMsg.content === message.content && 
//                 existingMsg.timestamp === message.timestamp
//             );

//             if (isDuplicateByContent) {
//                 console.log(`Skipping duplicate message by content: ${message.content}`);
//                 continue;
//             }

//             // Add message to chat
//             chat.messages.push(message);
//         }

//         await chat.save();
//         res.json(chat);
//     } catch (error) {
//         console.error('Error adding messages:', error);
//         res.status(500).json({ message: error.message });
//     }
// });

// // Process chat message with OpenRouter
// app.post('/api/chat/process', async (req, res) => {
//     try {
//         const { messageId, message, alertData, timestamp, chatId, isInitialAlert } = req.body;
        
//         if (!message || !messageId) {
//             console.error('Error: Message and messageId are required');
//             return res.status(400).json({ error: 'Message and messageId are required' });
//         }

//         console.log(`[ID: ${messageId}] Processing message:`, { message, timestamp, isInitialAlert });
//         console.log(`[ID: ${messageId}] Alert data:`, alertData);

//         if (!process.env.OPENROUTER_API_KEY) {
//             console.error(`[ID: ${messageId}] Error: OPENROUTER_API_KEY environment variable is not set`);
//             throw new Error('OPENROUTER_API_KEY environment variable is not set');
//         }

//         // Fetch chat history if chatId is provided
//         let chatHistory = [];
//         if (chatId) {
//             const chat = await Chat.findById(chatId);
//             if (chat) {
//                 console.log(`[ID: ${messageId}] Found existing chat, checking for duplicates`);
                
//                 // For initial alert messages, don't check for duplicates
//                 if (!isInitialAlert) {
//                     // Check for duplicate message by ID first
//                     const isDuplicateById = chat.messages.some(msg => 
//                         msg.id === messageId
//                     );

//                     if (isDuplicateById) {
//                         console.log(`[ID: ${messageId}] Duplicate message detected by ID in chat history`);
//                         return res.status(200).json({
//                             response: "I've already processed this message. Is there something specific you'd like to know about the alert?",
//                             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                         });
//                     }

//                     // Fallback check for duplicate message by content
//                     const recentMessages = chat.messages.slice(-5);
//                     const isDuplicateByContent = recentMessages.some(msg => 
//                         msg.role === 'user' && 
//                         msg.content === message && 
//                         msg.timestamp === timestamp
//                     );

//                     if (isDuplicateByContent) {
//                         console.log(`[ID: ${messageId}] Duplicate message detected by content in chat history`);
//                         return res.status(200).json({
//                             response: "I've already processed this message. Is there something specific you'd like to know about the alert?",
//                             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//                         });
//                     }
//                 }

//                 // Only include the last 5 messages to maintain context without overwhelming
//                 chatHistory = chat.messages.slice(-5).map(msg => ({
//                     role: msg.role === 'user' ? 'user' : 'assistant',
//                     content: msg.content
//                 }));
//                 console.log(`[ID: ${messageId}] Loaded ${chatHistory.length} messages from chat history`);
//             }
//         }

//         // Add system message to set context
//         const systemMessage = {
//             role: 'system',
//             content: isInitialAlert 
//                 ? 'You are a security assistant. Provide a detailed analysis of the security alert, including severity, potential impact, and recommended actions.'
//                 : 'You are a security assistant. If the user asks about an alert, provide a detailed analysis. For general questions, provide direct answers without repeating alert information unless specifically asked.'
//         };

//         // Prepare messages for OpenRouter
//         const messages = [
//             systemMessage,
//             ...chatHistory,
//             { role: 'user', content: message }
//         ];

//         console.log(`[ID: ${messageId}] Sending request to OpenRouter`);
//         // Call OpenRouter API
//         const openRouterResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
//             model: 'deepseek/deepseek-r1-0528:free',
//             messages: messages,
//             temperature: 0.7,
//             max_tokens: 3000
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
//                 'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
//                 'X-Title': 'Security Chat Assistant'
//             }
//         });

//         console.log(`[ID: ${messageId}] Received response from OpenRouter`);
//         // Extract the response
//         const responseContent = openRouterResponse.data.choices[0].message.content;
//         const responseTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//         // Return the response with timestamp
//         res.json({
//             response: responseContent,
//             timestamp: responseTimestamp
//         });
//         console.log(`[ID: ${messageId}] Message processing complete`);
//     } catch (error) {
//         console.error(`[ID: ${messageId}] Error processing chat message:`, error);
//         console.error(`[ID: ${messageId}] Error details:`, {
//             message: error.message,
//             response: error.response?.data,
//             status: error.response?.status
//         });
        
//         res.status(500).json({ 
//             error: 'Failed to process message',
//             details: error.message,
//             response: error.response?.data
//         });
//     }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// }); 