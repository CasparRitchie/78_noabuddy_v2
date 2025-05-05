// ChatInput.jsx
import React, { useState, useRef } from 'react';
import Waveform from './Waveform';
import './ChatInput.css';

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState('');
  const [analysers, setAnalysers] = useState({});
  const audioCtxRef = useRef();

  const startListening = async () => {
    try {
      // create AudioContext once
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioCtxRef.current.createMediaStreamSource(stream);

      const makeAnalyser = () => {
        const a = audioCtxRef.current.createAnalyser();
        a.fftSize = 32;
        source.connect(a);
        return a;
      };

      setAnalysers({
        analyserA: makeAnalyser(),
        analyserB: makeAnalyser(),
        analyserBot: audioCtxRef.current.createAnalyser(), // silent placeholder
      });
    } catch (err) {
      console.error('Could not get microphone:', err);
      alert('Microphone permission is required to see the waveforms.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="chat-input-wrapper">
      <div className="waveform-container">
        {analysers.analyserA
          ? <>
              <Waveform analyser={analysers.analyserA} color="#5e60ce" />
              <Waveform analyser={analysers.analyserB} color="#9b5de5" />
              <Waveform analyser={analysers.analyserBot} color="#48bb78" />
            </>
          : <button className="mic-button" onClick={startListening}>
              🎤 Start Listening
            </button>
        }
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
