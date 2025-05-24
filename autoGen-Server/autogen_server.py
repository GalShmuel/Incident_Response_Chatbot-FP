from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()  # This will load the environment variables from the .env file

# OpenRouter API URL and API key (replace with your actual API key)
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"  # Updated to the correct endpoint
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")  # Store the API key in environment variables

# Backend server configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")  # Default to localhost:5000 if not specified

# Ensure the OpenRouter API key is loaded correctly
if not OPENROUTER_API_KEY:
    raise ValueError("OpenRouter API key is missing")

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Extract the message from the request
        data = request.json
        message = data.get('message', '')
        alert_data = data.get('alertData', {})
        
        print(f"🔵 [Autogen] Received message: {message}")
        print(f"🔵 [Autogen] Received alert data: {json.dumps(alert_data, indent=2)}")
        
        if not message:
            print("🔴 [Autogen] Error: Message is required")
            return jsonify({'error': 'Message is required'}), 400

        # Check if this is a welcome message or system message
        if message.startswith("Hello, I'm here to help") or message.startswith("Sorry, I encountered an error"):
            print("🟡 [Autogen] Skipping processing of welcome/error message")
            return jsonify({
                'role': 'assistant',
                'content': message
            })
        
        # Prepare the payload to send to OpenRouter API
        payload = {
            "model": "gpt-3.5-turbo",  # Specify the model
            "messages": [
                {
                    "role": "system",
                    "content": """You are a TIER1 SOC Analyst specialized in analyzing AWS GuardDuty findings.
                    You are providing a single, comprehensive response that combines both analysis and playbook steps.
                    When you receive logs or security-related information:
                    1. Start with a brief analysis of the finding
                    2. Follow with a detailed incident response playbook
                    3. Include all necessary steps, tools, and commands in a single response
                    4. Provide security best practices and recommendations
                    5. Explain the reasoning behind each step
                    6. Highlight critical findings and potential risks
                    7. Include remediation steps when applicable
                    
                    Format your response as a single, well-structured message that includes:
                    - Analysis section
                    - Detailed steps
                    - Tools and commands
                    - Best practices
                    - Conclusion
                    
                    Always maintain a professional and clear communication style."""
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        print(f"🔵 [Autogen] Sending request to OpenRouter API with payload: {json.dumps(payload, indent=2)}")
        
        # Send the request to OpenRouter API
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)

        print(f"🔵 [Autogen] OpenRouter API Response Status: {response.status_code}")
        print(f"🔵 [Autogen] OpenRouter API Response Headers: {response.headers}")
        print(f"🔵 [Autogen] OpenRouter API Raw Response: {response.text}")

        # Check if the response is successful
        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"🟢 [Autogen] Parsed OpenRouter Response: {json.dumps(response_data, indent=2)}")
                
                # Extract the assistant's message from the response
                assistant_message = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not assistant_message:
                    print("🔴 [Autogen] Error: No content in assistant message")
                    return jsonify({
                        'error': 'No content in assistant message',
                        'details': response_data
                    }), 500
                
                print(f"🟢 [Autogen] Extracted assistant message: {assistant_message}")
                
                # Return the response without saving to backend
                # The frontend will handle saving the chat
                return jsonify({
                    'role': 'assistant',
                    'content': assistant_message
                })
            except json.JSONDecodeError as e:
                print(f"🔴 [Autogen] JSON Parse Error: {str(e)}")
                print(f"🔴 [Autogen] Raw Response: {response.text}")
                return jsonify({
                    'error': 'Failed to parse OpenRouter API response',
                    'details': str(e)
                }), 500
        else:
            print(f"🔴 [Autogen] Error from OpenRouter API: {response.text}")
            return jsonify({
                'error': 'Failed to get response from OpenRouter API',
                'status_code': response.status_code,
                'details': response.text
            }), 500

    except Exception as e:
        print(f"🔴 [Autogen] Error: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify the server is running"""
    return jsonify({
        'status': 'healthy',
        'service': 'autogen-server',
        'backend_url': BACKEND_URL
    })

if __name__ == '__main__':
    print("🚀 Autogen server starting on port 5001...")
    print(f"🔵 [Autogen] Backend URL: {BACKEND_URL}")
    app.run(port=5001, debug=True)
