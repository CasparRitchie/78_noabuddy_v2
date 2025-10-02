// frontend/src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import ChatInput from "../components/ChatInput";
import Navbar from "../components/Navbar"; // keep if you already have it
import { computeFlags } from "./utils/coach";
import "./App.css";

export default function App() {
  // messages: { sender: 's1'|'s2'|'bot', text: string, ts: number }
  const [messages, setMessages] = useState([]);
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const lastCoachAtRef = useRef(0);
  const MIN_COACH_GAP = 30; // seconds between coach messages
  const PAUSE_BEFORE_COACH = 1.0; // seconds of lull before coach speaks
  const speakerLabels = { s1: "Speaker 1", s2: "Speaker 2" };

  // Optional: speak out bot messages
  const speakBot = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  };

  // Called by ChatInput when an STT chunk finalizes
  const handleSend = ({ text, speaker }) => {
    const msg = { sender: speaker, text, ts: Date.now() / 1000 };
    setMessages((prev) => {
      const next = [...prev, msg];
      // fire-and-forget; we don't await here to keep UI snappy
      void maybeCoach(next);
      return next;
    });
  };

  // Decide whether to call the coach and possibly add a bot message
  const maybeCoach = async (allMsgs) => {
    if (!coachingEnabled) return;

    const now = Date.now() / 1000;
    if (now - lastCoachAtRef.current < MIN_COACH_GAP) return;

    const last = allMsgs[allMsgs.length - 1];
    if (!last) return;
    const lull = now - last.ts;
    if (lull < PAUSE_BEFORE_COACH) return;

    // Build "turns" (ignore prior bot messages)
    const turns = allMsgs
      .filter((m) => m.sender === "s1" || m.sender === "s2")
      .slice(-20)
      .map((m) => ({ speaker: m.sender, text: m.text, ts: m.ts }));

    if (turns.length < 2) return;

    const flags = computeFlags(turns);
    // Be conservative for v1: require 2+ signals
    if (flags.length < 2) return;

    try {
      setIsThinking(true);
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns, flags, speaker_labels: speakerLabels }),
      });
      const data = await res.json();

      if (data?.should_intervene && data?.message) {
        lastCoachAtRef.current = now;
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.message, ts: Date.now() / 1000 },
        ]);
        speakBot(data.message);
      }
    } catch (e) {
      console.warn("coach error", e);
    } finally {
      setIsThinking(false);
    }
  };

  // Optional: show a very light intro message on mount
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text:
          "Hi! I’ll listen quietly and occasionally offer a short nudge when it could help you both feel heard.",
        ts: Date.now() / 1000,
      },
    ]);
  }, []);

  return (
    <div className="app">
      {/* Top bar */}
      <Navbar />

      {/* Coach controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "10px 0" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={coachingEnabled}
            onChange={(e) => setCoachingEnabled(e.target.checked)}
          />
          Coaching enabled
        </label>
        {isThinking && (
          <span aria-live="polite" style={{ opacity: 0.7 }}>
            🧠 thinking…
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="chat-window">
        {messages.map((m, i) => {
          const who =
            m.sender === "s1"
              ? speakerLabels.s1
              : m.sender === "s2"
              ? speakerLabels.s2
              : "NoaBuddy";
        return (
            <div key={i} className={`message ${m.sender}`}>
              <div className="meta" style={{ opacity: 0.7, fontSize: 12, marginBottom: 2 }}>
                {who}
              </div>
              <div>
                {m.sender === "bot" ? <>🧠 {m.text}</> : m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mic + diarisation + STT input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
