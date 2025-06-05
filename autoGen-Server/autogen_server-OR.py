from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()  # Load environment variables from .env file

# === OpenRouter API configuration ===
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("OpenRouter API key is missing")
# Store the last processed message to prevent duplicates
last_processed = {
    'message': None,
    'timestamp': None,
    'alert_id': None  # Add alert_id to track unique alerts
}

def map_role(role):
    """Map frontend roles to OpenAI API roles"""
    role_mapping = {
        'bot': 'assistant',
        'assistant': 'assistant',
        'user': 'user',
        'system': 'system'
    }
    return role_mapping.get(role, 'user')  # Default to 'user' if role is unknown

# Severity levels information
SEVERITY_LEVELS = {
    1: "Very Low",
    2: "Low",
    3: "Slightly Elevated",
    4: "Moderate",
    5: "Medium",
    6: "Medium-High",
    7: "High",
    8: "Very High",
    9: "Critical",
    10: "Severe"
}

@app.route('/api/chat', methods=['POST'])
def process_chat():
    try:
        data = request.json
        message = data.get('message')
        alert_data = data.get('alertData', {})
        chat_history = data.get('chatHistory', [])
        timestamp = data.get('timestamp')
        
        # Extract alert ID if present in alert_data
        alert_id = alert_data.get('id') if alert_data else None

        if not message:
            print("🔴 Error: Message is required")
            return jsonify({'error': 'Message is required'}), 400

        # Check for duplicate message with improved logic
        is_duplicate = False
        if alert_id:
            # For alerts, check if we've processed this specific alert recently
            is_duplicate = (last_processed['alert_id'] == alert_id and 
                          last_processed['timestamp'] == timestamp)
        else:
            # For regular messages, check content and timestamp
            is_duplicate = (last_processed['message'] == message and 
                          last_processed['timestamp'] == timestamp)

        if is_duplicate:
            print("🔵 Duplicate message detected, skipping processing")
            return jsonify({
                'response': "Processing your request...",
                'timestamp': datetime.now().strftime('%I:%M %p')
            })

        # Update last processed message
        last_processed['message'] = message
        last_processed['timestamp'] = timestamp
        last_processed['alert_id'] = alert_id

        print(f"🔵 Received message: {message}")
        
        # Prepare the payload for OpenAI API
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": f"""You are a TIER1 SOC Analyst specialized in analyzing AWS GuardDuty findings.
                    You are providing playbook-based responses. 

                    When analyzing alerts, consider the following severity levels:
                    {json.dumps(SEVERITY_LEVELS, indent=2)}

                    When you receive logs or security-related information:
                    1. Analyze the logs for potential security findings
                    2. Follow standard incident response playbooks
                    3. Provide step-by-step guidance based on the logs
                    4. Include relevant security best practices
                    5. Suggest appropriate tools and commands
                    6. Explain the reasoning behind each step
                    7. Highlight critical findings and potential risks
                    8. Provide remediation steps when applicable
                    9. Consider the severity level of the alert in your response
                    10. Prioritize responses based on severity levels (Severe and Critical alerts require immediate attention)
                    
                    IMPORTANT: If you need more information about an alert to provide a complete analysis, ask specific questions
                    
                    Always maintain a professional and clear communication style.
                    When discussing severity levels, use the exact labels provided above.
                    When asking questions, be specific and focus on gathering information that will help in the analysis."""
                }
            ]
        }

        # Add chat history if available
        if chat_history:
            for msg in chat_history:
                mapped_role = map_role(msg.get("role", "user"))
                payload["messages"].append({
                    "role": mapped_role,
                    "content": msg.get("content", "")
                })

        # Add the current message
        payload["messages"].append({
            "role": "user",
            "content": message
        })

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        print(f"🔵 Sending request to OpenAI API")
        
        # Send request to OpenAI API
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers)

        print(f"🔵 OpenAI API Response Status: {response.status_code}")

        if response.status_code == 200:
            try:
                response_data = response.json()
                assistant_message = response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                current_time = datetime.now().strftime('%I:%M %p')
                return jsonify({
                    'response': assistant_message,
                    'timestamp': current_time
                })
            except json.JSONDecodeError as e:
                print(f"🔴 JSON Parse Error: {str(e)}")
                return jsonify({
                    'error': 'Failed to parse OpenAI API response',
                    'details': str(e)
                }), 500
        else:
            print(f"🔴 Error from OpenAI API: {response.text}")
            return jsonify({
                'error': 'Failed to get response from OpenAI API',
                'status_code': response.status_code,
                'details': response.text
            }), 500

    except Exception as e:
        print(f"🔴 Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Server starting on port 5001...")
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
