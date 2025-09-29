// frontend/components/ChatInput.jsx
import React, { useState, useRef } from 'react';
import Meyda from 'meyda';
import { cosineSim, meanVectors } from '../src/utils/audioMath';
import Waveform from './Waveform';
import './ChatInput.css';

/** Simple inline visualiser for a voiceprint (MFCC mean bars) */
function VoicePrintCard({ label, mfcc = [] }) {
  const W = 240, H = 120, PAD = 16;
  const n = mfcc.length || 0;
  const maxAbs = Math.max(1, ...mfcc.map(v => Math.abs(v)));
  const bars = mfcc.map(v => v / maxAbs); // normalize to [-1..1]

  return (
    <div style={{ borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <svg width={W} height={H} role="img" aria-label={`${label} voiceprint`}>
        <rect x="0" y="0" width={W} height={H} fill="transparent" />
        {bars.map((b, i) => {
          const bw = (W - PAD * 2) / Math.max(1, n);
          const x = PAD + i * bw + 2;
          const mid = H / 2;
          const bh = Math.abs(b) * (H / 2 - 8);
          const y = b >= 0 ? mid - bh : mid;
          return <rect key={i} x={x} y={y} width={bw - 4} height={bh} rx="3" />;
        })}
        <line x1={PAD - 6} x2={W - PAD + 6} y1={H / 2} y2={H / 2} strokeOpacity="0.25" />
      </svg>
      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
        Bars show normalized MFCC mean values
      </div>
    </div>
  );
}

export default function ChatInput({ onSend }) {
  const [input,   setInput]   = useState('');
  const [interim, setInterim] = useState('');
  const [analysers, setAnalysers] = useState({});
  const [listening, setListening] = useState(false);

  // ---- Guided calibration phases ----
  // idle → cal_s1_prompt → cal_s1_recording → cal_s1_review
  // → cal_s2_prompt → cal_s2_recording → cal_s2_review → live
  const [phase, setPhase] = useState('idle');
  const PROMPT_PHRASE = "Please say: 'The quick brown fox jumps over the lazy dog'";

  // Active speaker (UI) + stable tracking
  const [_activeSpeaker, _setActiveSpeaker] = useState(null); // 's1' | 's2' | null
  const activeSpeakerRef = useRef(null);
  const lastNonNullSpeakerRef = useRef(null);
  const setActiveSpeaker = (label) => {
    activeSpeakerRef.current = label;
    if (label) lastNonNullSpeakerRef.current = label;
    _setActiveSpeaker(label);
  };

  // Calibration storage
  const [s1Preview, setS1Preview] = useState(null); // { mfcc: [] }
  const [s2Preview, setS2Preview] = useState(null);
  const s1FramesRef = useRef([]);
  const s2FramesRef = useRef([]);
  const s1PrintRef  = useRef(null); // Float32Array / number[]
  const s2PrintRef  = useRef(null);

  // Audio + analyzers
  const audioCtxRef = useRef();
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const meydaAnalyzerRef = useRef(null);

  // Smoothing & adaptive VAD for live classification
  const speakerWindowRef = useRef([]);     // last N labels
  const noiseFloorRef    = useRef(0.0015); // adaptive baseline RMS

  const speakInstruction = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.0; u.lang = 'en-GB';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* non-blocking */ }
  };

  // ----- Mic init (shared) -----
  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!micStreamRef.current) {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    return {
      ctx: audioCtxRef.current,
      source: audioCtxRef.current.createMediaStreamSource(micStreamRef.current),
    };
  };

  // ----- CALIBRATION RECORDING (generic helper) -----
  const recordCalibration = async (who /* 's1' | 's2' */) => {
    const { ctx, source } = await ensureAudio();

    // temp Meyda for calibration
    const frames = [];
    const calibAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: ctx,
      source,
      bufferSize: 1024,
      featureExtractors: ['mfcc', 'rms'],
      callback: ({ mfcc, rms }) => {
        if (mfcc && mfcc.length && (rms ?? 0) > 0.001) {
          frames.push(mfcc.slice());
        }
      },
    });

    calibAnalyzer.start();
    // collect ~4 seconds
    await new Promise(res => setTimeout(res, 4000));
    calibAnalyzer.stop();

    if (!frames.length) return null;

    // voiceprint = mean MFCC vector
    const mfccMean = meanVectors(frames);
    if (who === 's1') {
      s1PrintRef.current = mfccMean;
      setS1Preview({ mfcc: mfccMean });
    } else {
      s2PrintRef.current = mfccMean;
      setS2Preview({ mfcc: mfccMean });
    }
    return mfccMean;
  };

  // ----- LIVE LISTENING (STT + live speaker ID) -----
  const startLive = async () => {
    const { ctx, source } = await ensureAudio();

    // Waveforms
    const makeAnalyser = () => {
      const a = ctx.createAnalyser();
      a.fftSize = 256;
      source.connect(a);
      return a;
    };
    const analyserA = makeAnalyser();
    const analyserB = makeAnalyser();
    const analyserBot = ctx.createAnalyser();
    analyserBot.fftSize = 256;
    setAnalysers({ analyserA, analyserB, analyserBot });

    // Live Meyda for speaker identification
    if (meydaAnalyzerRef.current) {
      meydaAnalyzerRef.current.stop();
      meydaAnalyzerRef.current = null;
    }
    meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
      audioContext: ctx,
      source,
      bufferSize: 1024,
      featureExtractors: ['mfcc', 'rms'],
      callback: ({ mfcc, rms }) => {
        if (!mfcc || !mfcc.length) return;

        // Adaptive VAD
        if (rms < noiseFloorRef.current * 1.5) {
          noiseFloorRef.current = 0.98 * noiseFloorRef.current + 0.02 * rms;
        }
        const vadThreshold = Math.max(0.004, noiseFloorRef.current * 2.5);
        if (rms < vadThreshold) {
          setActiveSpeaker(null);
          return;
        }

        // Scores (cosine) against both prints
        const scores = [];
        if (s1PrintRef.current) scores.push(['s1', cosineSim(mfcc, s1PrintRef.current)]);
        if (s2PrintRef.current) scores.push(['s2', cosineSim(mfcc, s2PrintRef.current)]);
        if (!scores.length) return;

        scores.sort((a, b) => b[1] - a[1]);
        const [label, top] = scores[0];
        const margin = scores.length > 1 ? top - scores[1][1] : 1;
        const candidate = margin > 0.06 ? label : null;

        // Majority vote smoothing over last N frames
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
        let finalText = '', interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += text + ' ';
          else interimText += text;
        }
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
    setPhase('live');
  };

  // ----- Public buttons -----
  const startListening = async () => {
    // start a fresh mic session and begin guided calibration
    try {
      await ensureAudio();
      setPhase('cal_s1_prompt');
      speakInstruction("Let's calibrate. Speaker one, when ready, please read the phrase shown on screen.");
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone permission is required.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (meydaAnalyzerRef.current) { try { meydaAnalyzerRef.current.stop(); } catch {} meydaAnalyzerRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    setAnalysers({});
    setListening(false);
    setInterim('');
    setActiveSpeaker(null);
    speakerWindowRef.current = [];
    setPhase('idle');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const speaker = lastNonNullSpeakerRef.current || 's1';
    onSend?.({ text, speaker });
    setInput('');
    setInterim('');
  };

  // ---- Phase UI helpers ----
  const PhaseCalibrationS1 = () => (
    <div className="cal-block">
      <h3>Calibration — Speaker 1</h3>
      <p>{PROMPT_PHRASE}</p>
      <div className="controls">
        <button onClick={async () => {
          setPhase('cal_s1_recording');
          speakInstruction("Recording speaker one for four seconds. Please read the phrase now.");
          await recordCalibration('s1');
          setPhase('cal_s1_review');
        }}>Start Speaker 1 Recording</button>
      </div>
      {phase === 'cal_s1_review' && s1Preview && (
        <>
          <VoicePrintCard label="Speaker 1 voiceprint" mfcc={s1Preview.mfcc} />
          <div className="controls" style={{ marginTop: 10 }}>
            <button onClick={() => setPhase('cal_s2_prompt')}>Looks good → Next (Speaker 2)</button>
            <button onClick={async () => {
              setPhase('cal_s1_recording');
              await recordCalibration('s1');
              setPhase('cal_s1_review');
            }}>Re-record Speaker 1</button>
          </div>
        </>
      )}
    </div>
  );

  const PhaseCalibrationS2 = () => (
    <div className="cal-block">
      <h3>Calibration — Speaker 2</h3>
      <p>{PROMPT_PHRASE}</p>
      <div className="controls">
        <button onClick={async () => {
          setPhase('cal_s2_recording');
          speakInstruction("Recording speaker two for four seconds. Please read the phrase now.");
          await recordCalibration('s2');
          setPhase('cal_s2_review');
        }}>Start Speaker 2 Recording</button>
      </div>
      {phase === 'cal_s2_review' && s2Preview && (
        <>
          <VoicePrintCard label="Speaker 2 voiceprint" mfcc={s2Preview.mfcc} />
          <div className="controls" style={{ marginTop: 10 }}>
            <button onClick={startLive}>Finish Calibration → Start Conversation</button>
            <button onClick={async () => {
              setPhase('cal_s2_recording');
              await recordCalibration('s2');
              setPhase('cal_s2_review');
            }}>Re-record Speaker 2</button>
          </div>
        </>
      )}
    </div>
  );

  const wAClass  = _activeSpeaker === 's1' ? 'wave active' : 'wave';
  const wBClass  = _activeSpeaker === 's2' ? 'wave active' : 'wave';
  const wBotClass = _activeSpeaker === 'bot' ? 'wave active' : 'wave';

  return (
    <div className="chat-input-wrapper">
      {/* Top area: either guided calibration, or the 3 visualisers */}
      {phase === 'idle' ? (
        <div className="waveform-container" style={{ placeItems: 'center' }}>
          <button className="mic-button" onClick={startListening}>
            🎤 Start Listening
          </button>
        </div>
      ) : phase.startsWith('cal_s1') ? (
        <div className="cal-panel">
          <PhaseCalibrationS1 />
          <div className="controls" style={{ marginTop: 12 }}>
            <button className="mic-button stop" onClick={stopListening}>Cancel</button>
          </div>
        </div>
      ) : phase.startsWith('cal_s2') ? (
        <div className="cal-panel">
          <PhaseCalibrationS2 />
          <div className="controls" style={{ marginTop: 12 }}>
            <button className="mic-button stop" onClick={stopListening}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="waveform-container">
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
          </div>
        </div>
      )}

      {/* Bottom: input + interim preview (works in live mode and also manual typing) */}
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
