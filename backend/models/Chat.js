const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['user', 'bot', 'assistant'],
            message: '{VALUE} is not a valid role'
        }
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    timestamp: {
        type: String,
        required: [true, 'Timestamp is required'],
        default: function() {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }
});

const chatSchema = new mongoose.Schema({
    messages: {
        type: [messageSchema],
        default: []
    },
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

// Add error handling for validation
chatSchema.post('save', function(error, doc, next) {
    if (error.name === 'ValidationError') {
        console.error('Validation Error:', error);
    }
    next(error);
});

module.exports = mongoose.model('Chat', chatSchema); 