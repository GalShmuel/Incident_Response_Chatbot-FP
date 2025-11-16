
# Incident Response Chatbot (Final Project)

A chatbot designed to assist with incident response — simulating interactions, gathering information, and guiding users through security incident workflows.

---

## 🧠 Project Overview

This project is a full-stack chatbot system built for incident response scenarios. It’s composed of a **frontend** (user interface) and a **backend** (logic, data management, and integrations). The chatbot can be used for training, simulation, or real incident documentation.

**Key goals:**
- Simulate realistic security incident conversations  
- Help users document and triage incidents  
- Enable integrations with incident management systems or databases  
- Provide a platform for security teams to train on IR processes  

---

## 🔧 Architecture & Tech Stack

- **Frontend**: React + JavaScript  
- **Backend**: Node.js  
- **Data Storage / Logic**: Your backend handles incident flow, storage, and possibly AI / decision rules  
- **Dependencies**: Defined in `package.json` (frontend) and backend folder  

---

## 🚀 Getting Started

### Prerequisites

- Node.js (version X or higher)  
- npm or yarn  
- (Optional) A database or storage system for incident records  

### Installation

1. Clone the repository:  
   ```bash
   git clone https://github.com/GalShmuel/Incident_Response_Chatbot-FP.git
   cd Incident_Response_Chatbot-FP
Install backend dependencies:

bash
Copy code
cd backend  
npm install
Install frontend dependencies:

bash
Copy code
cd ../frontend  
npm install
Running Locally
Backend:

bash
Copy code
cd backend  
npm start
Frontend:

bash
Copy code
cd frontend  
npm start
After this, open your browser at http://localhost:3000 (or whatever port your frontend runs on) and you should see the chatbot interface.
