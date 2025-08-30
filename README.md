# Incident Response Chatbot (Final Project)- not finished.

This project is a chatbot system designed to assist with cybersecurity incident response using AI.

🌐 Features
- 🔐 Real-time alert integration from Wazuh / GuardDuty
- 🤖 AI Agents powered by AutoGen (e.g., Playbook Agent, Analyst Agent)
- 📄 Automatic generation of incident response playbooks
- 🧑‍💻 Interactive chatbot interface for cybersecurity professionals

## 🛠️ Technologies

- Python, Flask
- React.js
- Open Ai 
- AWS GuardDuty


 ## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/GalShmuel/Incident_Response_Chatbot-FP.git



💻 Frontend Setup (React)
Navigate to the frontend directory:
  ``` bash
  cd ../frontend
  ```

Install dependencies:
  ```bash
  npm install
  ```

Run the frontend app:
  ``` bash
  npm start
  ```

Open http://localhost:3000 in your browser.

**Navigate to the backend directory:**
     ```bash
     cd backend
    ```

Create and activate a virtual environment:
   ```
   bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
Install Python dependencies:
  ```
  bash
  pip install -r requirements.txt
  ```

Set up environment variables (e.g., OpenAI , OpenRouter keys):

Create a .env file: 
  ```
  env
  OPENAI_API_KEY=your_openai_key_here
  ```

Run the backend server:
  ```
  bash
  python autogen_server.py 
  ```



👨‍💻 Authors

Gal Shmuel
Rachel Yeholashet
