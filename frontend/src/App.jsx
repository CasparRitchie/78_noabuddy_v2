import React from 'react';
import ChatInput from '../components/ChatInput';
import './App.css';


function App() {
  const handleSend = (message) => {
    console.log('User said:', message);
    // Later we'll send this to the backend
  };

  return (
    <div className="App">
      <h1>NoaBuddy Chat</h1>
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;
