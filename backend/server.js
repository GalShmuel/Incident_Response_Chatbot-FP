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

// Add a message to an existing chat
app.post('/api/chats/:id/messages', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const { role, content, timestamp } = req.body;
        chat.messages.push({ role, content, timestamp });
        await chat.save();
        
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Process chat message with AutoGen
app.post('/api/chat/process', async (req, res) => {
    try {
        const { message, alertData, timestamp, chatId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Received message:', { message, timestamp });

        // Forward message to AutoGen server
        const autogenResponse = await axios.post(`${process.env.AUTOGEN_URL}/api/chat`, {
            message,
            alertData
        });

        console.log('AutoGen response:', autogenResponse.data);

        // Create messages with timestamps
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMessages = [
            {
                role: 'user',
                content: message,
                timestamp: timestamp || currentTime
            },
            {
                role: 'assistant',
                content: autogenResponse.data.content,
                timestamp: currentTime
            }
        ];

        let chat;
        if (chatId) {
            // Update existing chat
            chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
            chat.messages.push(...newMessages);
        } else {
            // Create new chat if no chatId provided
            chat = new Chat();
            chat.messages = newMessages;
        }

        // Save the chat
        const savedChat = await chat.save();
        console.log('Chat saved successfully:', savedChat._id);

        // Return AutoGen's response
        res.json({
            response: autogenResponse.data.content,
            role: 'assistant',
            timestamp: currentTime
        });
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 