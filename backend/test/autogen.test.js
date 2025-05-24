const axios = require('axios');
const { expect } = require('chai');

describe('AutoGen Server Integration Tests', () => {
    const AUTOGEN_URL = 'http://localhost:5001';
    const BACKEND_URL = 'http://localhost:5000';

    // Test health check endpoint
    describe('Health Check', () => {
        it('should return healthy status', async () => {
            try {
                const response = await axios.get(`${AUTOGEN_URL}/api/health`);
                console.log('\n🔵 Health Check Response:', JSON.stringify(response.data, null, 2));
                
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('status', 'healthy');
                expect(response.data).to.have.property('service', 'autogen-server');
                expect(response.data).to.have.property('backend_url');
                console.log('✅ Health check passed');
            } catch (error) {
                console.error('❌ Health check failed:', error.message);
                throw error;
            }
        });
    });

    // Test chat endpoint
    describe('Chat Endpoint', () => {
        it('should show detailed AutoGen response structure', async () => {
            try {
                const testMessage = 'Test AWS GuardDuty finding: Unauthorized access attempt detected';
                console.log('\n🔵 Sending test message:', testMessage);

                // Send a test message to AutoGen
                const chatResponse = await axios.post(`${AUTOGEN_URL}/api/chat`, {
                    message: testMessage
                });

                console.log('\n🔵 AutoGen Raw Response:', JSON.stringify(chatResponse.data, null, 2));
                console.log('\n🔵 AutoGen Response Structure:');
                console.log('- Role:', chatResponse.data.role);
                console.log('- Content Length:', chatResponse.data.content.length);
                console.log('- Content Preview:', chatResponse.data.content.substring(0, 200) + '...');
                
                expect(chatResponse.status).to.equal(200);
                expect(chatResponse.data).to.have.property('role', 'assistant');
                expect(chatResponse.data).to.have.property('content');
                console.log('✅ AutoGen response structure verified');
            } catch (error) {
                console.error('❌ AutoGen response test failed:', error.message);
                if (error.response) {
                    console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
                }
                throw error;
            }
        });

        it('should process a chat message and save to backend', async () => {
            try {
                const testMessage = 'Test AWS GuardDuty finding: Unauthorized access attempt detected';
                console.log('\n🔵 Sending test message:', testMessage);

                // Send a test message to AutoGen
                const chatResponse = await axios.post(`${AUTOGEN_URL}/api/chat`, {
                    message: testMessage
                });

                console.log('\n🔵 AutoGen Chat Response:', JSON.stringify(chatResponse.data, null, 2));

                expect(chatResponse.status).to.equal(200);
                expect(chatResponse.data).to.have.property('role', 'assistant');
                expect(chatResponse.data).to.have.property('content');
                console.log('✅ Chat response received');

                // Verify the chat was saved in backend
                const backendResponse = await axios.get(`${BACKEND_URL}/api/chats/recent`);
                console.log('\n🔵 Backend Recent Chats Response:', JSON.stringify(backendResponse.data, null, 2));

                expect(backendResponse.status).to.equal(200);
                expect(backendResponse.data).to.be.an('array');
                
                // Check if we have any chats
                expect(backendResponse.data.length).to.be.at.least(1);
                
                // Get the most recent chat
                const recentChat = backendResponse.data[0];
                expect(recentChat).to.have.property('messages');
                expect(recentChat.messages).to.be.an('array');
                
                // Verify the message structure
                const messages = recentChat.messages;
                expect(messages.length).to.be.at.least(1);
                
                // Check if the message contains the expected properties
                const message = messages[0];
                expect(message).to.have.property('role');
                expect(message).to.have.property('content');
                
                console.log('✅ Chat saved to backend');
            } catch (error) {
                console.error('❌ Chat test failed:', error.message);
                if (error.response) {
                    console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
                }
                throw error;
            }
        });

        it('should handle empty message gracefully', async () => {
            try {
                console.log('\n🔵 Testing empty message handling');
                const response = await axios.post(`${AUTOGEN_URL}/api/chat`, {
                    message: ''
                }).catch(error => error.response);

                console.log('\n🔵 Empty Message Response:', JSON.stringify(response.data, null, 2));

                expect(response.status).to.equal(400);
                expect(response.data).to.have.property('error', 'Message is required');
                console.log('✅ Empty message test passed');
            } catch (error) {
                console.error('❌ Empty message test failed:', error.message);
                if (error.response) {
                    console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
                }
                throw error;
            }
        });
    });
}); 