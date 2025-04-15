import React, { useState, useEffect } from "react";
import ChatInput from "../components/ChatInput";
import Onboarding from "../components/Onboarding";
import Navbar from '../components/Navbar';
import "./App.css";


function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const hide = localStorage.getItem("hideOnboarding");
    if (hide === "true") setShowOnboarding(false);
  }, []);

  const handleSend = (text) => {
    if (!text.trim()) return;

    const newUserMessage = { sender: "user", text };
    const newBotMessage = { sender: "bot", text: "That's interesting!" };

    setMessages((prev) => [...prev, newUserMessage, newBotMessage]);
  };

  const handleFinishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("hideOnboarding", "true");
  };

  if (showOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  return (
    <div className="app">
      <Navbar />
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
