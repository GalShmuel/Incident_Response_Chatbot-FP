const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'bot']
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    }
});

const chatSchema = new mongoose.Schema({
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
chatSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Chat', chatSchema); 