import React, { useState } from 'react';
import ChatInput from '../components/ChatInput';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    const newUserMessage = { sender: 'user', text };
    const newBotMessage = { sender: 'bot', text: "That's interesting!" };

    setMessages((prev) => [...prev, newUserMessage, newBotMessage]);
  };

  return (
    <div className="app">
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;
