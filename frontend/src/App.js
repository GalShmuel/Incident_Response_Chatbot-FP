import React from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <div className="App">
      <ChatProvider>
        <Dashboard/>
      </ChatProvider>
    </div>
  );
}

export default App;
