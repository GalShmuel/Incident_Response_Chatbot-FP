require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Chat = require('./models/Chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes

// Get recent chats (last 5)
app.get('/api/chats/recent', async (req, res) => {
    try {
        const recentChats = await Chat.find()
            .sort({ updatedAt: -1 })
            .limit(5);
        res.json(recentChats);
    } catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete a chat
app.delete('/api/chats/delete/:id', async (req, res) => {
    try {
        const chat = await Chat.findByIdAndDelete(req.params.id);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json({ message: 'Chat deleted successfully', deletedChat: chat });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a specific chat session
app.get('/api/chats/:id', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all chat sessions (you might want to add pagination later)
app.get('/api/chats', async (req, res) => {
    try {
        const chats = await Chat.find().sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new chat session
app.post('/api/chats', async (req, res) => {
    try {
        const chat = new Chat({
            messages: req.body.messages || []
        });
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add messages to an existing chat
app.post('/api/chats/:chatId/messages', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const messages = Array.isArray(req.body) ? req.body : [req.body];
        
        // Validate each message
        for (const message of messages) {
            if (!message.role || !message.content) {
                console.error('Invalid message format:', message);
                return res.status(400).json({ 
                    message: 'Invalid message format. Each message must have role and content.',
                    invalidMessage: message 
                });
            }

            // Check for duplicates based on role, content, and timestamp
            const isDuplicate = chat.messages.some(existingMsg => 
                existingMsg.role === message.role && 
                existingMsg.content === message.content && 
                existingMsg.timestamp === message.timestamp
            );

            if (isDuplicate) {
                console.log('Skipping duplicate message:', message);
                continue;
            }

            // Add message to chat
            chat.messages.push(message);
        }

        await chat.save();
        res.json(chat);
    } catch (error) {
        console.error('Error adding messages:', error);
        res.status(500).json({ message: error.message });
    }
});

// Process chat message with AutoGen
app.post('/api/chat/process', async (req, res) => {
    try {
        const { message, alertData, timestamp, chatId } = req.body;
        
        if (!message) {
            console.error('Error: Message is required');
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Received message:', { message, timestamp });
        console.log('Alert data:', alertData);

        if (!process.env.AUTOGEN_URL) {
            console.error('Error: AUTOGEN_URL environment variable is not set');
            throw new Error('AUTOGEN_URL environment variable is not set');
        }

        // Forward message to AutoGen server
        console.log('Forwarding to AutoGen server:', process.env.AUTOGEN_URL);
        const autogenResponse = await axios.post(`${process.env.AUTOGEN_URL}/api/chat`, {
            message,
            alertData
        }).catch(error => {
            console.error('Error from AutoGen server:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw new Error(`AutoGen server error: ${error.message}`);
        });

        console.log('AutoGen response:', autogenResponse.data);

        if (!autogenResponse.data || !autogenResponse.data.content) {
            console.error('Invalid response from AutoGen server:', autogenResponse.data);
            throw new Error('Invalid response from AutoGen server');
        }

        // Create timestamp for the response
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Return only the assistant's response without saving to chat
        // The frontend will handle saving the chat
        res.json({
            response: autogenResponse.data.content,
            timestamp: currentTime
        });
    } catch (error) {
        console.error('Error processing chat message:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message,
            response: error.response?.data
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 