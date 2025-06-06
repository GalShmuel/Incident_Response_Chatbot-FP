const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Import Chat model
const Chat = require('./models/Chat');

app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatId } = req.body;
        
        // Get or create chat
        let chat;
        if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
            chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
        } else {
            chat = new Chat();
        }

        // Add user message
        chat.messages.push({
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Prepare messages for OpenRouter including history
        const messages = chat.messages.slice(-5).map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            content: msg.content
        }));

        const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
                model: "deepseek/deepseek-r1-0528:free",
                messages: messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Your App Name'
                }
            }
        );

        const assistantMessage = response.data.choices[0].message.content;

        // Add assistant response
        chat.messages.push({
            id: Date.now().toString(),
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Save chat to database
        await chat.save();

        res.json({
            message: assistantMessage,
            chatId: chat._id.toString()
        });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get response from OpenRouter' });
    }
});

// Get all chats
app.get('/api/chats', async (req, res) => {
    try {
        const chats = await Chat.find()
            .sort({ updatedAt: -1 })  // Sort by most recent first
            .limit(5);  // Limit to 5 most recent chats
        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get specific chat
app.get('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ error: 'Invalid chat ID format' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// Delete chat
app.delete('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ error: 'Invalid chat ID format' });
        }

        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
