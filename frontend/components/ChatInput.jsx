// frontend/src/components/ChatInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import Meyda from 'meyda';
import { cosineSim, meanVectors } from '../src/utils/audioMath';
import Waveform from './Waveform';
import './ChatInput.css';

export default function ChatInput({ onSend }) {
  const [input, setInput] = useState('');
  const [interim, setInterim] = useState('');

  const [analysers, setAnalysers] = useState({});
  const [listening, setListening] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null); // 's1' | 's2' | 'bot' | null

  // Calibration state
  const [calibMode, setCalibMode] = useState(null); // 's1' | 's2' | null
  const s1FramesRef = useRef([]);
  const s2FramesRef = useRef([]);
  const s1PrintRef = useRef(null);
  const s2PrintRef = useRef(null);

  const audioCtxRef = useRef();
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const meydaAnalyzerRef = useRef(null);

  // TTS (bot) output node (optional hookup)
  const botAudioCtxRef = useRef(null);
  const botAnalyserRef = useRef(null);

  const setupBotAnalyser = () => {
    // If you already create an <audio> element for TTS playback, connect it here.
    // For example, if you have an AudioContext for bot TTS:
    if (!audioCtxRef.current) return;
    if (!botAnalyserRef.current) {
      botAnalyserRef.current = audioCtxRef.current.createAnalyser();
      botAnalyserRef.current.fftSize = 32;
    }
    return botAnalyserRef.current;
  };

  const startListening = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const source = audioCtxRef.current.createMediaStreamSource(stream);

      // 1) Visual waveforms (you already do this)
      const makeAnalyser = () => {
        const a = audioCtxRef.current.createAnalyser();
        a.fftSize = 256;
        source.connect(a);
        return a;
      };
      const analyserA = makeAnalyser();
      const analyserB = makeAnalyser();
      const analyserBot = audioCtxRef.current.createAnalyser();
      analyserBot.fftSize = 256;

      setAnalysers({ analyserA, analyserB, analyserBot });

      // 2) Meyda MFCC stream
      if (meydaAnalyzerRef.current) {
        meydaAnalyzerRef.current.stop();
        meydaAnalyzerRef.current = null;
      }
      meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioCtxRef.current,
        source,
        bufferSize: 1024,
        featureExtractors: ['mfcc', 'rms'],
        callback: ({ mfcc, rms }) => {
          if (!mfcc || !mfcc.length) return;

          // Collect calibration frames
          if (calibMode === 's1') s1FramesRef.current.push(mfcc.slice());
          if (calibMode === 's2') s2FramesRef.current.push(mfcc.slice());

          // Decide active speaker in real time (only if enrolled)
          if (s1PrintRef.current || s2PrintRef.current) {
            // Basic VAD by RMS to suppress silence/noise
            if (rms < 0.01) {
              setActiveSpeaker(null);
              return;
            }
            let scores = [];
            if (s1PrintRef.current) scores.push(['s1', cosineSim(mfcc, s1PrintRef.current)]);
            if (s2PrintRef.current) scores.push(['s2', cosineSim(mfcc, s2PrintRef.current)]);
            scores.sort((a, b) => b[1] - a[1]);
            const [label, score] = scores[0];
            // Margin to avoid rapid flicker
            if (scores.length === 1 || (scores[0][1] - scores[1][1] > 0.05)) {
              setActiveSpeaker(label);
            } else {
              setActiveSpeaker(null);
            }
          }
        },
      });
      meydaAnalyzerRef.current.start();

      // 3) Web Speech API (STT) – unchanged
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
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
            setInput((prev) => (prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalText).trim() + ' ');
          }
          setInterim(interimText);
        };
        rec.onend = () => {
          setListening(false);
          setInterim('');
        };
        rec.start();
        recognitionRef.current = rec;
      }

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
    if (meydaAnalyzerRef.current) {
      try { meydaAnalyzerRef.current.stop(); } catch {}
      meydaAnalyzerRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setAnalysers({});
    setListening(false);
    setInterim('');
    setActiveSpeaker(null);
  };

  // Finish calibration for whichever speaker is active
  const finishCalibration = () => {
    if (calibMode === 's1' && s1FramesRef.current.length) {
      s1PrintRef.current = meanVectors(s1FramesRef.current);
      s1FramesRef.current = [];
    }
    if (calibMode === 's2' && s2FramesRef.current.length) {
      s2PrintRef.current = meanVectors(s2FramesRef.current);
      s2FramesRef.current = [];
    }
    setCalibMode(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
    setInterim('');
  };

  // Highlight classes for each waveform based on activeSpeaker
  const wAClass = activeSpeaker === 's1' ? 'wave active' : 'wave';
  const wBClass = activeSpeaker === 's2' ? 'wave active' : 'wave';
  const wBotClass = activeSpeaker === 'bot' ? 'wave active' : 'wave';

  return (
    <div className="chat-input-wrapper">
      <div className="waveform-container">
        {listening ? (
          <>
            <div className={wAClass}>
              <Waveform analyser={analysers.analyserA} color="#5e60ce" />
              <div className="label">Speaker 1</div>
            </div>
            <div className={wBClass}>
              <Waveform analyser={analysers.analyserB} color="#9b5de5" />
              <div className="label">Speaker 2</div>
            </div>
            <div className={wBotClass}>
              <Waveform analyser={analysers.analyserBot} color="#48bb78" />
              <div className="label">NoaBuddy</div>
            </div>

            <div className="controls">
              <button className="mic-button stop" onClick={stopListening}>⏹ Stop Listening</button>
              {!calibMode && (
                <>
                  <button onClick={() => setCalibMode('s1')}>Calibrate Speaker 1</button>
                  <button onClick={() => setCalibMode('s2')}>Calibrate Speaker 2</button>
                </>
              )}
              {calibMode && (
                <button onClick={finishCalibration}>Finish {calibMode === 's1' ? 'Speaker 1' : 'Speaker 2'} Calibration</button>
              )}
            </div>
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
