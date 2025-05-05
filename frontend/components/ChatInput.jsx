// frontend/src/components/ChatInput.jsx
import React, { useState, useEffect } from 'react';
import Waveform from './Waveform';
import './ChatInput.css';

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState('');
  const [analysers, setAnalysers] = useState({
    analyserA: null,
    analyserB: null,
    analyserBot: null,
  });

  useEffect(() => {
    // create a single AudioContext
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const source = audioCtx.createMediaStreamSource(stream);

        // Person A
        const analyserA = audioCtx.createAnalyser();
        analyserA.fftSize = 32;
        source.connect(analyserA);

        // Person B (if you had separate stream, you'd repeat; for demo we'll just clone A)
        const analyserB = audioCtx.createAnalyser();
        analyserB.fftSize = 32;
        source.connect(analyserB);

        // Bot (placeholder silent analyser)
        const analyserBot = audioCtx.createAnalyser();
        analyserBot.fftSize = 32;
        // we won't feed the bot analyser for now

        setAnalysers({ analyserA, analyserB, analyserBot });
      })
      .catch((err) => {
        console.error('Microphone access denied', err);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="chat-input-wrapper">
      <div className="waveform-container">
        <Waveform analyser={analysers.analyserA} color="#5e60ce" />
        <Waveform analyser={analysers.analyserB} color="#9b5de5" />
        <Waveform analyser={analysers.analyserBot} color="#48bb78" />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something…"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
