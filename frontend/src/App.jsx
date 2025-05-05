// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import ChatInput from "../components/ChatInput";
import Onboarding from "../components/Onboarding";
import Navbar from "../components/Navbar";
import "./App.css";

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [messages, setMessages] = useState([]);
  const [audioStreams, setAudioStreams] = useState(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("hideOnboarding") === "true") {
      setShowOnboarding(false);
    }
  }, []);

  const startMic = async () => {
    if (audioStreams) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const analyserA = audioCtx.createAnalyser();
      analyserA.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserA);

      // placeholder for B + Bot later:
      setAudioStreams({ analyserA, analyserB: null, analyserBot: null });
    } catch (err) {
      console.error("Microphone access error:", err);
    }
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text },
      { sender: "bot", text: "🤖 (bot reply placeholder)" },
    ]);
  };

  const handleFinishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("hideOnboarding", "true");
  };

  useEffect(() => () => {
    if (audioCtxRef.current) audioCtxRef.current.close();
  }, []);

  if (showOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  return (
    <div className="app">
      <Navbar />

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button onClick={startMic}>🎤 Start Mic</button>
      </div>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <ChatInput onSend={handleSend} audioStreams={audioStreams} />
    </div>
  );
}

export default App;
