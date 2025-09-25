// ChatInput.jsx
import React, { useState, useRef } from 'react';
import Waveform from './Waveform';
import './ChatInput.css';

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState('');
  const [interim, setInterim] = useState('');          // 👈 NEW: interim preview
  const [analysers, setAnalysers] = useState({});
  const [listening, setListening] = useState(false);
  const audioCtxRef = useRef();
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);

  const startListening = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
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
        analyserBot: audioCtxRef.current.createAnalyser(),
      });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition not supported in this browser.');
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = 'en-GB';
      rec.interimResults = true;
      rec.continuous = true;

      rec.onresult = (e) => {
        let finalText = '';
        let interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += text + ' ';
          else interimText += text;
        }
        if (finalText) {
          // append finalised chunk to the input box
          setInput((prev) => (prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalText).trim() + ' ');
        }
        setInterim(interimText); // show live words under the input
      };

      rec.onend = () => {
        setListening(false);
        setInterim('');
      };

      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch (err) {
      console.error('Could not get microphone:', err);
      alert('Microphone permission is required.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setAnalysers({});
    setListening(false);
    setInterim(''); // clear interim line
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
    setInterim('');
  };

  return (
    <div className="chat-input-wrapper">
      <div className="waveform-container">
        {listening ? (
          <>
            <Waveform analyser={analysers.analyserA} color="#5e60ce" />
            <Waveform analyser={analysers.analyserB} color="#9b5de5" />
            <Waveform analyser={analysers.analyserBot} color="#48bb78" />
            <button className="mic-button stop" onClick={stopListening}>
              ⏹ Stop Listening
            </button>
          </>
        ) : (
          <button className="mic-button" onClick={startListening}>
            🎤 Start Listening
          </button>
        )}
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something…"
        />
        {/* 👇 Interim preview line */}
        {interim && (
          <div className="interim-line" aria-live="polite">
            <em>{interim}</em>
          </div>
        )}
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
