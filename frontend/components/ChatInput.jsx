// frontend/components/ChatInput.jsx
import React, { useState, useRef } from 'react';
import Meyda from 'meyda';
import { cosineSim, meanVectors } from '../src/utils/audioMath';
import Waveform from './Waveform';
import './ChatInput.css';

export default function ChatInput({ onSend }) {
  const [input,   setInput]   = useState('');
  const [interim, setInterim] = useState('');

  const [analysers, setAnalysers] = useState({});
  const [listening, setListening] = useState(false);

  // ----- ACTIVE SPEAKER (state + ref to avoid stale closure) -----
  const [_activeSpeaker, _setActiveSpeaker] = useState(null); // 's1' | 's2' | 'bot' | null
  const activeSpeakerRef = useRef(null);
  const lastNonNullSpeakerRef = useRef(null); // remember last confidently detected speaker
  const setActiveSpeaker = (label) => {
    activeSpeakerRef.current = label;
    if (label) lastNonNullSpeakerRef.current = label; // cache last non-null immediately
    _setActiveSpeaker(label);
  };

  // Calibration state
  const [calibMode, setCalibMode] = useState(null); // 's1' | 's2' | null
  const s1FramesRef = useRef([]);
  const s2FramesRef = useRef([]);
  const s1PrintRef  = useRef(null);
  const s2PrintRef  = useRef(null);

  const audioCtxRef        = useRef();
  const recognitionRef     = useRef(null);
  const micStreamRef       = useRef(null);
  const meydaAnalyzerRef   = useRef(null);

  // Smoothing + adaptive VAD
  const speakerWindowRef = useRef([]);      // sliding window of recent labels
  const noiseFloorRef    = useRef(0.0015);  // adaptive baseline RMS

  const startListening = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const source = audioCtxRef.current.createMediaStreamSource(stream);

      // Waveforms
      const makeAnalyser = () => {
        const a = audioCtxRef.current.createAnalyser();
        a.fftSize = 256;
        source.connect(a);
        return a;
      };
      const analyserA  = makeAnalyser();
      const analyserB  = makeAnalyser();
      const analyserBot = audioCtxRef.current.createAnalyser();
      analyserBot.fftSize = 256;
      setAnalysers({ analyserA, analyserB, analyserBot });

      // Meyda MFCC stream
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

          // collect calibration frames
          if (calibMode === 's1') s1FramesRef.current.push(mfcc.slice());
          if (calibMode === 's2') s2FramesRef.current.push(mfcc.slice());

          // --- Adaptive VAD ---
          // update noise floor gently on quiet frames
          if (rms < noiseFloorRef.current * 1.5) {
            noiseFloorRef.current = 0.98 * noiseFloorRef.current + 0.02 * rms;
          }
          const vadThreshold = Math.max(0.004, noiseFloorRef.current * 2.5);
          if (rms < vadThreshold) {
            setActiveSpeaker(null);
            return;
          }

          // score vs enrolled voiceprints
          const scores = [];
          if (s1PrintRef.current) scores.push(['s1', cosineSim(mfcc, s1PrintRef.current)]);
          if (s2PrintRef.current) scores.push(['s2', cosineSim(mfcc, s2PrintRef.current)]);

          if (scores.length) {
            scores.sort((a, b) => b[1] - a[1]);
            const [label, top] = scores[0];
            const margin = scores.length > 1 ? top - scores[1][1] : 1;
            const candidate = margin > 0.06 ? label : null;

            // --- Majority vote smoothing over last N frames ---
            const N = 6;
            if (candidate) {
              speakerWindowRef.current.push(candidate);
              if (speakerWindowRef.current.length > N) speakerWindowRef.current.shift();
              const s1c = speakerWindowRef.current.filter(l => l === 's1').length;
              const s2c = speakerWindowRef.current.filter(l => l === 's2').length;
              const stable = s1c === s2c ? null : (s1c > s2c ? 's1' : 's2');
              setActiveSpeaker(stable);
            } else {
              setActiveSpeaker(null);
            }
          }
        },
      });
      meydaAnalyzerRef.current.start();

      // Web Speech API (STT)
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

          // lastNonNullSpeakerRef is already updated inside setActiveSpeaker()
          if (finalText) {
            const speaker = lastNonNullSpeakerRef.current || 's1';
            onSend?.({ text: finalText.trim(), speaker });
            setInput('');
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
    // reset UI/state bits
    setAnalysers({});
    setListening(false);
    setInterim('');
    setActiveSpeaker(null);
    speakerWindowRef.current = [];
  };

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

  // Manual send (typed text) still works; default to Speaker 1
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const speaker = lastNonNullSpeakerRef.current || 's1';
    onSend?.({ text, speaker });
    setInput('');
    setInterim('');
  };

  const wAClass  = _activeSpeaker === 's1' ? 'wave active' : 'wave';
  const wBClass  = _activeSpeaker === 's2' ? 'wave active' : 'wave';
  const wBotClass = _activeSpeaker === 'bot' ? 'wave active' : 'wave';

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
              {!calibMode ? (
                <>
                  <button onClick={() => setCalibMode('s1')}>Calibrate Speaker 1</button>
                  <button onClick={() => setCalibMode('s2')}>Calibrate Speaker 2</button>
                </>
              ) : (
                <button onClick={finishCalibration}>
                  Finish {calibMode === 's1' ? 'Speaker 1' : 'Speaker 2'} Calibration
                </button>
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
