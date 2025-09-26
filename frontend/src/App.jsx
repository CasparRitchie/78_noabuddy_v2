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

  // 🔧 CHANGED: accept structured messages { text, speaker } from ChatInput
  const handleSend = (msg) => {
    // Backward compatibility: if a string comes in, wrap it
    const payload = typeof msg === "string" ? { text: msg, speaker: "s1" } : msg;

    // Map speaker tag to a display role (for CSS / labels)
    const role =
      payload.speaker === "s1" ? "speaker1" :
      payload.speaker === "s2" ? "speaker2" :
      payload.speaker === "bot" ? "bot" : "unknown";

    // Append the user/speaker message
    setMessages((prev) => [
      ...prev,
      { role, text: payload.text }
      // If you still want a bot placeholder, uncomment below:
      // , { role: "bot", text: "🤖 (bot reply placeholder)" }
    ]);
  };

  const handleFinishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("hideOnboarding", "true");
  };

  useEffect(() => () => {
    if (audioCtxRef.current) audioCtxRef.current.close();
  }, []);

  // Helper to label bubbles nicely
  const speakerLabel = (role) =>
    role === "speaker1" ? "Speaker 1" :
    role === "speaker2" ? "Speaker 2" :
    role === "bot" ? "NoaBuddy" : "Unknown";

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
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <strong>{speakerLabel(m.role)}:</strong> {m.text}
          </div>
        ))}
      </div>

      {/* ChatInput now emits { text, speaker } for final chunks */}
      <ChatInput onSend={handleSend} audioStreams={audioStreams} />
    </div>
  );
}

export default App;
