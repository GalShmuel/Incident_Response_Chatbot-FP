const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' }); // Set your region
const guardduty = new AWS.GuardDuty();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Import Chat model
const Chat = require('./models/Chat');

// Logging middleware
app.use((req, res, next) => {
    console.log(`\n📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Process alert analysis
app.post('/api/chat/process', async (req, res) => {
    console.log('\n🚨 Processing alert analysis request...');
    try {
        const { messageId, message, alertData, isInitialAlert } = req.body;
        
        if (!alertData) {
            console.log('❌ No alert data provided');
            return res.status(400).json({ error: 'Alert data is required' });
        }

        console.log('📝 Processing alert:', alertData.displayData?.title || 'Unknown alert');
        
        // Prepare messages for OpenAI
        const messages = [
            {
                role: 'system',
                content: `You are a TIER1 SOC Analyst specialized in analyzing AWS GuardDuty findings. 
                write as the title the request you are asked to do.
                Always maintain a professional and clear communication style.
                `
            },
            {
                role: 'user',
                content: `Analyze this security alert: ${JSON.stringify(alertData)}`
            }
        ];

        console.log('🤖 Sending request to OpenAI...');
        console.log('📤 Request payload:', JSON.stringify({
            model: "gpt-4o-mini-2024-07-18",
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, null, 2));

        const response = await axios.post(
            `${OPENAI_BASE_URL}/chat/completions`,
            {
                model: "gpt-4o-mini-2024-07-18",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📥 Raw OpenAI response:', JSON.stringify(response.data, null, 2));

        // Validate the response
        if (!response.data) {
            console.error('❌ No data in OpenAI response');
            throw new Error('No data in OpenAI response');
        }

        if (!response.data.choices) {
            console.error('❌ No choices in OpenAI response');
            throw new Error('No choices in OpenAI response');
        }

        if (!response.data.choices[0]) {
            console.error('❌ No first choice in OpenAI response');
            throw new Error('No first choice in OpenAI response');
        }

        if (!response.data.choices[0].message) {
            console.error('❌ No message in first choice');
            throw new Error('No message in first choice');
        }

        const assistantMessage = response.data.choices[0].message.content;
        
        // Check if the response is empty
        if (!assistantMessage || assistantMessage.trim() === '') {
            console.error('❌ Empty response from OpenAI');
            throw new Error('Empty response from OpenAI');
        }

        console.log('✅ Received response from OpenAI:', assistantMessage);

        // Create a new chat with the initial messages
        const chat = new Chat({
            messages: [
                {
                    id: Date.now().toString(),
                    role: 'user',
                    content: `Analyze this security alert: ${JSON.stringify(alertData)}`,
                    timestamp: new Date().toLocaleTimeString()
                },
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date().toLocaleTimeString()
                }
            ],
            alertId: alertData.displayData?.id || Date.now().toString()
        });

        await chat.save();
        console.log('💾 Saved chat to database');

        res.json({
            response: assistantMessage,
            timestamp: new Date().toLocaleTimeString(),
            chatId: chat._id.toString()
        });
        console.log('📤 Sent alert analysis response to client');
    } catch (error) {
        console.error('❌ Error in alert analysis:', error.response?.data || error.message);
        console.error('❌ Full error details:', error);
        res.status(500).json({ 
            error: 'Failed to analyze alert',
            details: error.response?.data || error.message
        });
    }
});

// Menu option handlers
const handleAnalyzeAlert = () => {
    return {
        type: 'alert_analysis',
        message: "I would like to analyze a security alert. Please provide the alert data for analysis."
    };
};

const handleIncidentPlaybook = () => {
    return {
        type: 'playbook',
        content: `# Incident Response Playbook for Alert ${alertData?.displayData?.id || alertData?.Id || 'No specific alert'}
                    ## Alert Information
                    - **Alert ID**: ${alertData?.displayData?.id || alertData?.Id || 'N/A'}
                    - **Alert Source**: ${alertData?.displayData?.source || 'AWS GuardDuty'}
                    - **Severity Level**: ${alertData?.Severity || 'N/A'}
                    - **Detection Time**: ${alertData?.CreatedAt || 'N/A'}
                    When you receive logs or security-related information:
                    1. Analyze the logs for potential security findings
                    2. Follow standard incident response playbooks
                    3. Provide step-by-step guidance based on the logs
                    4. Include relevant security best practices
                    5. Suggest appropriate tools and commands
                    6. Explain the reasoning behind each step
                    7. Highlight critical findings and potential risks
                    8. Provide remediation steps when applicable

                    After presenting the playbook, ask the user in a new message: "Do you have any additional questions about the incident response playbook? (Yes/No)"`
    };
};

const handleAskQuestions = () => {
    return "I have questions about this security alert. Please help me understand the key aspects and implications.";
};

const handleConfigureSettings = () => {
    return "I would like to configure the settings for security alert handling. Please show me the available options.";
};

// Regular chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, chatId, alertData } = req.body;
        console.log('Received message:', message);
        console.log('Alert data:', alertData);

        // Check if the user is asking for the raw JSON alert data
        if (message.toLowerCase().includes('send me the alert json') || 
            message.toLowerCase().includes('show me the alert json') ||
            message.toLowerCase().includes('get the alert json')) {
            if (alertData) {
                return res.json({
                    message: `Here is the raw alert data:\n\`\`\`json\n${JSON.stringify(alertData, null, 2)}\n\`\`\``,
                    timestamp: new Date().toLocaleTimeString(),
                    chatId: chatId
                });
            } else {
                return res.json({
                    message: "I don't have any alert data to show you. Please analyze an alert first.",
                    timestamp: new Date().toLocaleTimeString(),
                    chatId: chatId
                });
            }
        }

        // Rest of the existing code for handling other types of messages
        let messages = [];

        // Get or create chat
        let chat;
        if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
            console.log('🔎 Looking up existing chat...');
            chat = await Chat.findById(chatId);
            if (!chat) {
                console.log('❌ Chat not found');
                return res.status(404).json({ error: 'Chat not found' });
            }
            console.log('✅ Found existing chat');
        } else {
            console.log('📝 Creating new chat');
            chat = new Chat();
        }

        // Handle menu selections and responses
        let processedMessage = message;
        const menuOption = message.trim().toLowerCase();
        
        // Check if this is a response to the playbook question
        const lastMessage = chat.messages[chat.messages.length - 1];
        const isPlaybookQuestion = lastMessage && 
            lastMessage.role === 'assistant' && 
            lastMessage.content.includes('Do you have any additional questions about the incident response playbook?');

        if (isPlaybookQuestion) {
            if (menuOption === 'yes' || menuOption.includes('yes')) {
                processedMessage = "I have additional questions about the incident response playbook.";
            } else if (menuOption === 'no' || menuOption.includes('no')) {
                // Return to menu with showMenu flag
                return res.json({
                    message: "Returning to main menu",
                    chatId: chat._id.toString(),
                    showMenu: true
                });
            }
        } else {
            // Regular menu handling
            if (menuOption === '1' || menuOption.includes('analyze') || menuOption.includes('alert')) {
                const alertResponse = handleAnalyzeAlert();
                if (alertData) {
                    processedMessage = `Analyze this security alert: ${JSON.stringify(alertData)}`;
                } else {
                    processedMessage = alertResponse.message;
                }
            } else if (menuOption === '2' || menuOption.includes('playbook') || menuOption.includes('incident')) {
                const playbookResponse = handleIncidentPlaybook();
                processedMessage = playbookResponse.content;
            } else if (menuOption === '3' || menuOption.includes('question') || menuOption.includes('ask')) {
                processedMessage = handleAskQuestions();
            } else if (menuOption === '4' || menuOption.includes('setting') || menuOption.includes('configure')) {
                processedMessage = handleConfigureSettings();
            }
        }

        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: processedMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        chat.messages.push(userMessage);
        console.log('💬 Added user message to chat');

        // Prepare messages for OpenAI including history
        messages = [
            {
                role: 'system',
                content: `You are a TIER1 SOC Analyst specialized in analyzing AWS GuardDuty findings.
                       You are currently discussing Alert ID: ${alertData?.displayData?.id || alertData?.Id || 'No specific alert'}.
                       Provide clear and concise responses to security-related questions.
                       Always maintain a professional and clear communication style.
                       If analyzing an alert, focus on:
                       1. Severity and impact assessment
                       2. Immediate action recommendations
                       3. Key security concerns
                       4. Relevant AWS GuardDuty context
                       If the user has additional questions about the playbook, provide detailed answers.
                       If the user indicates they have no more questions, guide them back to the main menu.
                       IMPORTANT: Always reference the specific Alert ID in your responses unless the user explicitly asks about a different alert or general security topics.`
            }
        ];

        // Add chat history
        messages = messages.concat(chat.messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
        })));
        console.log('📚 Added chat history to messages');

        // Check if this is a playbook request
        const isPlaybookRequest = menuOption.includes('playbook') || menuOption.includes('incident');
        if (isPlaybookRequest) {
            messages[0].content = `You are a cybersecurity incident response assistant. 
                You are currently discussing Alert ID: ${alertData?.displayData?.id || alertData?.Id || 'No specific alert'}.
                When analyzing a security alert or log, follow these steps:
                1. Analyze the logs for potential security findings.
                2. Follow standard incident response playbooks.
                3. Provide step-by-step guidance based on the logs.
                4. Include relevant security best practices.
                5. Suggest appropriate tools and commands for investigation and mitigation.
                6. Explain the reasoning behind each step you take.
                7. Highlight any critical findings and potential risks.
                8. Provide remediation steps when applicable.
                9. Consider the severity level of the alert in your response.
                10. Prioritize responses based on severity levels:
                    - Severe and Critical alerts require immediate attention.
                IMPORTANT: Always reference the specific Alert ID in your responses unless the user explicitly asks about a different alert or general security topics.
                After presenting the playbook, ask the user: "Do you have any additional questions about the incident response playbook? (Yes/No)"`;
        }

        console.log('🤖 Sending request to OpenAI...');
        console.log('📤 Request payload:', JSON.stringify({
            model: "gpt-4o-mini-2024-07-18",
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, null, 2));

        const response = await axios.post(
            `${OPENAI_BASE_URL}/chat/completions`,
            {
                model: "gpt-4o-mini-2024-07-18",
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📥 Raw OpenAI response:', JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            console.error('❌ Invalid OpenAI response structure:', JSON.stringify(response.data, null, 2));
            throw new Error('Invalid response from OpenAI');
        }

        const assistantMessage = response.data.choices[0].message.content;
        if (!assistantMessage || assistantMessage.trim() === '') {
            console.error('❌ Empty assistant message in response:', JSON.stringify(response.data.choices[0], null, 2));
            throw new Error('Empty response from OpenAI');
        }

        console.log('✅ Received response from OpenAI:', assistantMessage);

        // Add assistant response
        const assistantResponse = {
            id: Date.now().toString(),
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        chat.messages.push(assistantResponse);
        console.log('💬 Added assistant message to chat');

        // Save chat to database
        await chat.save();
        console.log('💾 Saved chat to database');

        res.json({
            message: assistantMessage,
            chatId: chat._id.toString()
        });
        console.log('📤 Sent response to client');
    } catch (error) {
        console.error('❌ Error in chat processing:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to get response from OpenAI',
            details: error.response?.data || error.message
        });
    }
});

// Get all chats
app.get('/api/chats', async (req, res) => {
    console.log('\n📥 Fetching recent chats...');
    try {
        const chats = await Chat.find()
            .sort({ updatedAt: -1 })
            .limit(5);
        console.log(`✅ Found ${chats.length} recent chats`);
        res.json(chats);
    } catch (error) {
        console.error('❌ Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Create new chat
app.post('/api/chats', async (req, res) => {
    console.log('\n📝 Creating new chat...');
    try {
        const { messages, alertId } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            console.log('❌ Invalid messages format');
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        console.log('📦 Creating chat with messages:', messages.length);
        
        const chat = new Chat({
            messages: messages.map(msg => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || new Date().toLocaleTimeString()
            })),
            alertId: alertId || null
        });

        await chat.save();
        console.log('✅ Chat created successfully');
        
        res.status(201).json(chat);
    } catch (error) {
        console.error('❌ Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Get specific chat
app.get('/api/chats/:chatId', async (req, res) => {
    const { chatId } = req.params;
    console.log(`\n📥 Fetching chat with ID: ${chatId}`);
    
    try {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            console.log('❌ Invalid chat ID format');
            return res.status(400).json({ error: 'Invalid chat ID format' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            console.log('❌ Chat not found');
            return res.status(404).json({ error: 'Chat not found' });
        }
        console.log('✅ Found chat');
        res.json(chat);
    } catch (error) {
        console.error('❌ Error fetching chat:', error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// Delete chat
app.delete('/api/chats/:chatId', async (req, res) => {
    const { chatId } = req.params;
    console.log(`\n🗑️ Deleting chat with ID: ${chatId}`);
    
    try {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            console.log('❌ Invalid chat ID format');
            return res.status(400).json({ error: 'Invalid chat ID format' });
        }

        const chat = await Chat.findByIdAndDelete(chatId);
        if (!chat) {
            console.log('❌ Chat not found');
            return res.status(404).json({ error: 'Chat not found' });
        }
        console.log('✅ Chat deleted successfully');
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting chat:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Add in-memory cache for findings
let findingsCache = {
    data: null,
    lastFetched: 0
};
const FINDINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

app.get('/api/findings', async (req, res) => {
    console.log('\n📥 ===== FINDINGS REQUEST =====');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Request Type: GET all findings');
    try {
        // Check cache
        const now = Date.now();
        if (findingsCache.data && (now - findingsCache.lastFetched < FINDINGS_CACHE_TTL)) {
            console.log('✅ Returning findings from cache');
            return res.json({
                findings: findingsCache.data,
                total: findingsCache.data.length,
                cached: true
            });
        }

        // 1. Read local findings.json
        let localFindings = [];
        const findingsPath = path.join(__dirname, './data/findings.json');
        if (fs.existsSync(findingsPath)) {
            try {
                const fileContent = fs.readFileSync(findingsPath, 'utf8');
                localFindings = JSON.parse(fileContent);
            } catch (err) {
                console.error('Error reading/parsing findings.json:', err);
            }
        }

        // Use detector ID from environment variable if set, otherwise fetch programmatically
        let detectorId = process.env.GUARDDUTY_DETECTOR_ID;
        if (!detectorId) {
            const detectors = await guardduty.listDetectors().promise();
            if (!detectors.DetectorIds || detectors.DetectorIds.length === 0) {
                return res.status(404).json({ message: 'No GuardDuty detectors found' });
            }
            detectorId = detectors.DetectorIds[0];
        }

        // Paginate through all findings
        let allFindingIds = [];
        let nextToken = undefined;
        do {
            const params = {
                DetectorId: detectorId,
                MaxResults: 50,
                NextToken: nextToken
            };
            const findingsList = await guardduty.listFindings(params).promise();
            allFindingIds = allFindingIds.concat(findingsList.FindingIds);
            nextToken = findingsList.NextToken;
        } while (nextToken);

        // Fetch all findings in batches of 50
        let allFindings = [];
        for (let i = 0; i < allFindingIds.length; i += 50) {
            const batchIds = allFindingIds.slice(i, i + 50);
            const findings = await guardduty.getFindings({
                DetectorId: detectorId,
                FindingIds: batchIds
            }).promise();
            allFindings = allFindings.concat(findings.Findings);
        }

        // 3. Merge AWS and local findings
        const combinedFindings = [...allFindings, ...localFindings];

        // Update cache
        findingsCache.data = combinedFindings;
        findingsCache.lastFetched = Date.now();

        res.json({
            findings: combinedFindings,
            total: combinedFindings.length,
            cached: false
        });
    } catch (error) {
        console.error('❌ Error fetching GuardDuty findings:', error);
        res.status(500).json({ message: error.message });
    }
    console.log('📥 ===== END FINDINGS REQUEST =====\n');
});

// Get a specific finding by ID
app.get('/api/findings/:id', async (req, res) => {
    console.log('\n📥 ===== SINGLE FINDING REQUEST =====');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Request Type: GET single finding');
    console.log('🆔 Finding ID:', req.params.id);
    try {
        let detectorId = process.env.GUARDDUTY_DETECTOR_ID;
        if (!detectorId) {
        const detectors = await guardduty.listDetectors().promise();
        if (!detectors.DetectorIds || detectors.DetectorIds.length === 0) {
            return res.status(404).json({ message: 'No GuardDuty detectors found' });
        }
            detectorId = detectors.DetectorIds[0];
        }

        const findingData = await guardduty.getFindings({
            DetectorId: detectorId,
            FindingIds: [req.params.id]
        }).promise();

        if (!findingData.Findings || findingData.Findings.length === 0) {
            return res.status(404).json({ message: 'Finding not found' });
        }

        res.json(findingData.Findings[0]);
    } catch (error) {
        console.error('❌ Error fetching GuardDuty finding:', error);
        res.status(500).json({ message: error.message });
    }
    console.log('📥 ===== END SINGLE FINDING REQUEST =====\n');
});

// Update findings endpoint
app.put('/api/findings/:id', (req, res) => {
    console.log('\n📝 ===== UPDATE FINDING REQUEST =====');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Request Type: PUT update finding');
    console.log('🆔 Finding ID:', req.params.id);
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const findingsPath = path.join(__dirname, './data/findings.json');
        
        // Check if file exists
        if (!fs.existsSync(findingsPath)) {
            console.error('❌ Findings file not found');
            return res.status(404).json({ 
                error: 'Findings file not found',
                message: 'The findings data file could not be located'
            });
        }

        // Read and parse findings
        let findings;
        try {
            const fileContent = fs.readFileSync(findingsPath, 'utf8');
            findings = JSON.parse(fileContent);
        } catch (error) {
            console.error('❌ Error reading/parsing findings file:', error);
            return res.status(500).json({ 
                error: 'Error reading findings file',
                message: 'Failed to read or parse the findings data file'
            });
        }

        // Validate findings array
        if (!Array.isArray(findings)) {
            console.error('❌ Invalid findings data format');
            return res.status(500).json({ 
                error: 'Invalid findings format',
                message: 'Findings data is not in the expected format'
            });
        }

        const findingIndex = findings.findIndex(f => f.Id === req.params.id);
        
        if (findingIndex === -1) {
            console.log('❌ Error: Finding not found');
            return res.status(404).json({ 
                error: 'Finding not found',
                message: `No finding found with ID: ${req.params.id}`
            });
        }

        const updatedFinding = req.body;
        
        // Validate the updated finding
        if (!updatedFinding || typeof updatedFinding !== 'object') {
            console.log('❌ Error: Invalid finding format');
            return res.status(400).json({ 
                error: 'Invalid finding format',
                message: 'Expected an object for the finding update'
            });
        }

        // Validate required fields
        if (updatedFinding.Severity !== undefined && 
            (typeof updatedFinding.Severity !== 'number' || 
             updatedFinding.Severity < 1 || 
             updatedFinding.Severity > 10)) {
            return res.status(400).json({
                error: 'Invalid severity value',
                message: 'Severity must be a number between 1 and 10'
            });
        }

        // Log the changes
        console.log('📊 Changes being made:');
        console.log('- Old Severity:', findings[findingIndex].Severity);
        console.log('- New Severity:', updatedFinding.Severity);
        console.log('- Old Status:', findings[findingIndex].Service?.Archived ? 'Archived' : 'Active');
        console.log('- New Status:', updatedFinding.Service?.Archived ? 'Archived' : 'Active');

        // Create a backup of the original finding
        const originalFinding = { ...findings[findingIndex] };
        
        // Update the finding
        findings[findingIndex] = {
            ...findings[findingIndex],
            ...updatedFinding,
            Id: req.params.id, // Ensure ID is preserved
            Service: {
                ...findings[findingIndex].Service,
                ...updatedFinding.Service
            }
        };

        // Write the updated findings back to the file
        try {
            fs.writeFileSync(findingsPath, JSON.stringify(findings, null, 2));
        } catch (error) {
            console.error('❌ Error writing to findings file:', error);
            // Restore the original finding
            findings[findingIndex] = originalFinding;
            return res.status(500).json({ 
                error: 'Error saving changes',
                message: 'Failed to write changes to the findings file'
            });
        }
        
        // Invalidate the cache
        // findingsCache.data = null; // This line is removed
        // findingsCache.lastModified = null; // This line is removed
        
        console.log('✅ Success: Updated the finding');
        console.log('📤 Sending response...');
        res.json({ 
            message: 'Finding updated successfully', 
            finding: findings[findingIndex] 
        });
    } catch (error) {
        console.error('❌ Error updating finding:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to update finding',
            message: error.message,
            details: error.stack
        });
    }
    console.log('📝 ===== END UPDATE FINDING REQUEST =====\n');
});

// Update all findings
app.put('/api/findings', (req, res) => {
    console.log('\n📝 ===== BULK UPDATE FINDINGS REQUEST =====');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Request Type: PUT update all findings');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    try {
        const findingsPath = path.join(__dirname, './data/findings.json');
        const updatedFindings = req.body;
        
        // Validate the updated findings
        if (!Array.isArray(updatedFindings)) {
            console.log('❌ Error: Invalid findings format');
            return res.status(400).json({ message: 'Invalid findings format. Expected an array.' });
        }

        // Write the updated findings back to the file
        fs.writeFileSync(findingsPath, JSON.stringify(updatedFindings, null, 4));
        
        // Invalidate the cache
        // findingsCache.data = null; // This line is removed
        // findingsCache.lastModified = null; // This line is removed
        
        console.log('✅ Success: Updated all findings');
        console.log('📤 Sending response...');
        res.json({ message: 'Findings updated successfully' });
    } catch (error) {
        console.error('❌ Error updating findings:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: error.message });
    }
    console.log('📝 ===== END BULK UPDATE FINDINGS REQUEST =====\n');
});

// Get alerts with filtering
app.get('/api/alerts', async (req, res) => {
    console.log('\n📥 ===== ALERTS REQUEST =====');
    console.log('📅 Time:', new Date().toISOString());
    console.log('🔍 Request Type: GET alerts');
    console.log('🔍 Query Parameters:', req.query);
    
    try {
        const findingsPath = path.join(__dirname, './data/findings.json');
        const findings = JSON.parse(fs.readFileSync(findingsPath, 'utf8'));
        
        // Apply filters if provided
        let filteredFindings = [...findings];
        
        // Filter by severity if provided
        if (req.query.severity) {
            const severities = req.query.severity.split(',');
            filteredFindings = filteredFindings.filter(finding => 
                severities.includes(finding.Severity.toString())
            );
        }
        
        // Filter by status if provided
        if (req.query.status) {
            const status = req.query.status.toLowerCase();
            filteredFindings = filteredFindings.filter(finding => 
                status === 'open' ? !finding.Service.Archived : finding.Service.Archived
            );
        }

        // Sort by createdAt in descending order (newest first)
        filteredFindings.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

        console.log(`✅ Success: Found ${filteredFindings.length} alerts`);
        console.log('📊 Alerts Summary:');
        console.log('- Total alerts:', filteredFindings.length);
        console.log('- Severity distribution:', filteredFindings.reduce((acc, f) => {
            acc[f.Severity] = (acc[f.Severity] || 0) + 1;
            return acc;
        }, {}));
        console.log('- Archived count:', filteredFindings.filter(f => f.Service.Archived).length);
        
        res.json(filteredFindings);
    } catch (error) {
        console.error('❌ Error fetching alerts:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch alerts',
            details: error.message 
        });
    }
    console.log('📥 ===== END ALERTS REQUEST =====\n');
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Add connection timeout handling
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        console.error('❌ Request timeout');
        res.status(408).json({
            error: 'Request Timeout',
            message: 'The request took too long to process',
            timestamp: new Date().toISOString()
        });
    });
    next();
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log('📝 Logging enabled - watching for requests...\n');
});

// Increase max listeners for the server
server.setMaxListeners(20);

// Create a single shutdown function
const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server Error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
    }
});

// Handle process termination with a single listener
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
});
