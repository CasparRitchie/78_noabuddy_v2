 // frontend/components/ChatInput.jsx
import React, { useState, useRef } from 'react';
import Meyda from 'meyda';
import { cosineSim, meanVectors } from '../src/utils/audioMath';
import Waveform from './Waveform';
import './ChatInput.css';

/* ===== Tunables ===== */
const CALIB_MS = 4000;          // per-speaker calibration duration
const CALIB_MIN_RMS = 0.0002;   // accept very quiet frames during calibration
const VAD_MIN = 0.004;          // lower bound on VAD threshold (live)
const VAD_MULT = 2.5;           // noiseFloor * multiplier (live)
const NOISE_DECAY = 0.98;       // noise floor EWMA decay (live)
const NOISE_ALPHA = 0.02;       // noise floor EWMA update (live)
const COSINE_MARGIN = 0.08;     // top - second must exceed this (live)
const SMOOTH_WINDOW = 8;        // majority vote window (live)

/** Inline visualiser for a voiceprint (MFCC mean bars) */
function VoicePrintCard({ label, mfcc = [] }) {
  const W = 240, H = 120, PAD = 16;
  const n = mfcc.length || 0;
  const maxAbs = Math.max(1, ...mfcc.map(v => Math.abs(v)));
  const bars = mfcc.map(v => v / maxAbs);
  return (
    <div style={{ borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.05)', width: W + 24 }}>
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
      <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>Normalized MFCC mean bars</div>
    </div>
  );
}

/** Minimal debug overlay (toggle as needed) */
function DebugHUD({ visible, rms, noise, s1, s2, candidate, active }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', right: 8, top: 8, padding: '8px 10px',
      background: 'rgba(0,0,0,0.6)', borderRadius: 8, fontSize: 12, lineHeight: 1.3, zIndex: 5
    }}>
      <div><b>RMS:</b> {rms?.toFixed(4) ?? '-'}</div>
      <div><b>Noise:</b> {noise?.toFixed(4) ?? '-'}</div>
      <div><b>cos(S1):</b> {s1 !== null ? s1.toFixed(3) : '-'}</div>
      <div><b>cos(S2):</b> {s2 !== null ? s2.toFixed(3) : '-'}</div>
      <div><b>candidate:</b> {candidate ?? '-'}</div>
      <div><b>active:</b> {active ?? '-'}</div>
    </div>
  );
}

export default function ChatInput({ onSend }) {
  const [input,   setInput]   = useState('');
  const [interim, setInterim] = useState('');

  const [analysers, setAnalysers] = useState({});
  const [listening, setListening] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // ---- Guided calibration phases ----
  // idle → s1_prompt → s1_record → s1_review → s2_prompt → s2_record → s2_review → live
  const [phase, setPhase] = useState('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordCountdown, setRecordCountdown] = useState(0);
  const PROMPT_PHRASE = `Please say: “The quick brown fox jumps over the lazy dog.”`;

  // Active speaker (state + ref)
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
  const s1PrintRef  = useRef(null);
  const s2PrintRef  = useRef(null);

  // Audio + analyzers
  const audioCtxRef      = useRef();
  const recognitionRef   = useRef(null);
  const micStreamRef     = useRef(null);
  const meydaAnalyzerRef = useRef(null);

  // ensure graph pulls (silent gain → destination)
  const silentSinkRef    = useRef(null);

  // Smoothing & adaptive VAD for live classification
  const speakerWindowRef = useRef([]);     // last N labels
  const noiseFloorRef    = useRef(0.0015); // adaptive baseline RMS

  // Debug values
  const debugRef = useRef({ rms: null, noise: null, s1: null, s2: null, candidate: null });

  // ---- Helpers ----
  const speakInstruction = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.0; u.lang = 'en-GB';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
    }
    if (!micStreamRef.current) {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
    }
    const ctx = audioCtxRef.current;
    const source = ctx.createMediaStreamSource(micStreamRef.current);

    // Ensure the graph is "pulling": connect source → silent gain → destination
    if (!silentSinkRef.current) {
      const g = ctx.createGain();
      g.gain.value = 0.0;
      source.connect(g);
      g.connect(ctx.destination);
      silentSinkRef.current = g;
    }

    return { ctx, source };
  };

  // --- One-shot calibration recording (~4s, MFCC mean) ---
  const recordCalibration = async (who /* 's1' | 's2' */) => {
    const { ctx, source } = await ensureAudio();
    const frames = [];
    setIsRecording(true);
    setRecordCountdown(CALIB_MS / 1000);

    // simple countdown UI
    let remaining = CALIB_MS / 1000;
    const timer = setInterval(() => {
      remaining -= 1;
      setRecordCountdown(Math.max(0, remaining));
    }, 1000);

    const calibAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: ctx,
      source,
      bufferSize: 1024,
      featureExtractors: ['mfcc', 'rms'],
      callback: ({ mfcc, rms }) => {
        if (mfcc && mfcc.length && (rms ?? 0) > CALIB_MIN_RMS) {
          frames.push(mfcc.slice());
        }
      },
    });

    calibAnalyzer.start();
    await new Promise(res => setTimeout(res, CALIB_MS));
    calibAnalyzer.stop();
    clearInterval(timer);
    setIsRecording(false);

    if (!frames.length) return null;

    const mfccMean = meanVectors(frames);
    if (who === 's1') { s1PrintRef.current = mfccMean; setS1Preview({ mfcc: mfccMean }); }
    else              { s2PrintRef.current = mfccMean; setS2Preview({ mfcc: mfccMean }); }
    return mfccMean;
  };

  // --- Validate prints (warn if too similar) ---
  const printsLookTooSimilar = () => {
    if (!s1PrintRef.current || !s2PrintRef.current) return false;
    const sim = cosineSim(s1PrintRef.current, s2PrintRef.current);
    return sim > 0.95;
  };

  // --- Live mode: visualisers + diarisation + STT ---
  const startLive = async () => {
    const { ctx, source } = await ensureAudio();

    // Visual waveforms
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

    // Meyda for frame-by-frame speaker ID
    if (meydaAnalyzerRef.current) { try { meydaAnalyzerRef.current.stop(); } catch {} meydaAnalyzerRef.current = null; }
    meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
      audioContext: ctx,
      source,
      bufferSize: 1024,
      featureExtractors: ['mfcc', 'rms'],
      callback: ({ mfcc, rms }) => {
        if (!mfcc || !mfcc.length) return;

        // Adaptive VAD
        if (rms < noiseFloorRef.current * 1.5) {
          noiseFloorRef.current = NOISE_DECAY * noiseFloorRef.current + NOISE_ALPHA * rms;
        }
        const vadThreshold = Math.max(VAD_MIN, noiseFloorRef.current * VAD_MULT);
        if (rms < vadThreshold) { setActiveSpeaker(null); debugRef.current = { ...debugRef.current, rms, noise: noiseFloorRef.current, candidate: null }; return; }

        // Score to prints
        let s1 = null, s2 = null;
        if (s1PrintRef.current) s1 = cosineSim(mfcc, s1PrintRef.current);
        if (s2PrintRef.current) s2 = cosineSim(mfcc, s2PrintRef.current);
        if (s1 === null && s2 === null) return;

        let candidate = null;
        if (s1 !== null && s2 !== null) {
          const top = Math.max(s1, s2);
          const second = Math.min(s1, s2);
          candidate = (top - second) > COSINE_MARGIN ? (s1 > s2 ? 's1' : 's2') : null;
        } else {
          candidate = s1 !== null ? 's1' : 's2';
        }

        // Majority-vote smoothing
        if (candidate) {
          speakerWindowRef.current.push(candidate);
          if (speakerWindowRef.current.length > SMOOTH_WINDOW) speakerWindowRef.current.shift();
          const s1c = speakerWindowRef.current.filter(l => l === 's1').length;
          const s2c = speakerWindowRef.current.filter(l => l === 's2').length;
          setActiveSpeaker(s1c === s2c ? null : (s1c > s2c ? 's1' : 's2'));
        } else {
          setActiveSpeaker(null);
        }

        debugRef.current = { rms, noise: noiseFloorRef.current, s1, s2, candidate };
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

      rec.onend = () => { setListening(false); setInterim(''); };
      rec.start();
      recognitionRef.current = rec;
    } else {
      console.warn('SpeechRecognition not supported in this browser.');
    }

    setListening(true);
    setPhase('live');
  };

  // ---- Public controls ----
  const startListeningFlow = async () => {
    try {
      const { ctx } = await ensureAudio();
      if (ctx.state === 'suspended') await ctx.resume();

      // Reset session
      s1PrintRef.current = null; s2PrintRef.current = null;
      setS1Preview(null); setS2Preview(null);
      speakerWindowRef.current = [];
      setActiveSpeaker(null);
      setPhase('s1_prompt');
      speakInstruction("Let's calibrate. Speaker one, when ready, please read the phrase on screen.");
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone permission is required.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (meydaAnalyzerRef.current) { try { meydaAnalyzerRef.current.stop(); } catch {} meydaAnalyzerRef.current = null; }
    if (micStreamRef.current) { try { micStreamRef.current.getTracks().forEach(t => t.stop()); } catch {} micStreamRef.current = null; }
    if (silentSinkRef.current) { try { silentSinkRef.current.disconnect(); } catch {} silentSinkRef.current = null; }
    setAnalysers({});
    setListening(false);
    setInterim('');
    setActiveSpeaker(null);
    speakerWindowRef.current = [];
    setPhase('idle');
  };

  // Manual typed send (default to last detected, else S1)
  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const speaker = lastNonNullSpeakerRef.current || 's1';
    onSend?.({ text, speaker });
    setInput('');
    setInterim('');
  };

  // ---- Phase UIs ----
  const CalibrationS1 = () => (
    <div className="cal-panel">
      <h3>Calibration — Speaker 1</h3>
      <p style={{ opacity: 0.85 }}>{PROMPT_PHRASE}</p>
      <div className="controls">
        <button
          disabled={isRecording}
          onClick={async () => {
            // clear any previous preview
            setS1Preview(null);
            setPhase('s1_record');
            speakInstruction("Recording speaker one for four seconds. Please read the phrase now.");
            const mfcc = await recordCalibration('s1');
            if (!mfcc) {
              setPhase('s1_prompt');
              alert("I didn't catch enough audio for speaker one. Please try again closer to the mic.");
              return;
            }
            setPhase('s1_review');
            speakInstruction("Speaker one calibration complete.");
          }}>
          {isRecording && phase === 's1_record' ? `Recording… ${recordCountdown}s` : 'Start Speaker 1 Recording'}
        </button>
      </div>

      {phase === 's1_review' && s1Preview && (
        <>
          <div style={{ marginTop: 10 }}>
            <VoicePrintCard label="Speaker 1 voiceprint" mfcc={s1Preview.mfcc} />
          </div>
          <div className="controls" style={{ marginTop: 10 }}>
            <button onClick={() => {
              setPhase('s2_prompt');
              speakInstruction("Now speaker two, please read the phrase on screen.");
            }}>Looks good → Next (Speaker 2)</button>
            <button
              disabled={isRecording}
              onClick={async () => {
                setPhase('s1_record');
                speakInstruction("Re-recording speaker one.");
                const mfcc = await recordCalibration('s1');
                if (!mfcc) { setPhase('s1_prompt'); alert("Please try again for speaker one."); return; }
                setPhase('s1_review');
                speakInstruction("Speaker one calibration complete.");
              }}>
              Re-record Speaker 1
            </button>
          </div>
        </>
      )}

      <div className="controls" style={{ marginTop: 12 }}>
        <button className="mic-button stop" onClick={stopListening}>Cancel</button>
      </div>
    </div>
  );

  const CalibrationS2 = () => (
    <div className="cal-panel">
      <h3>Calibration — Speaker 2</h3>
      <p style={{ opacity: 0.85 }}>{PROMPT_PHRASE}</p>
      <div className="controls">
        <button
          disabled={isRecording}
          onClick={async () => {
            setS2Preview(null);
            setPhase('s2_record');
            speakInstruction("Recording speaker two for four seconds. Please read the phrase now.");
            const mfcc = await recordCalibration('s2');
            if (!mfcc) {
              setPhase('s2_prompt');
              alert("I didn't catch enough audio for speaker two. Please try again closer to the mic.");
              return;
            }
            setPhase('s2_review');
            speakInstruction("Speaker two calibration complete.");
          }}>
          {isRecording && phase === 's2_record' ? `Recording… ${recordCountdown}s` : 'Start Speaker 2 Recording'}
        </button>
      </div>

      {phase === 's2_review' && s2Preview && (
        <>
          <div style={{ marginTop: 10 }}>
            <VoicePrintCard label="Speaker 2 voiceprint" mfcc={s2Preview.mfcc} />
          </div>
          {printsLookTooSimilar() && (
            <div style={{ marginTop: 8, color: '#f59e0b' }}>
              ⚠️ The two voiceprints look very similar. Try re-recording each speaker closer to the mic and at normal volume.
            </div>
          )}
          <div className="controls" style={{ marginTop: 10 }}>
            <button onClick={startLive}>Finish Calibration → Start Conversation</button>
            <button
              disabled={isRecording}
              onClick={async () => {
                setPhase('s2_record');
                speakInstruction("Re-recording speaker two.");
                const mfcc = await recordCalibration('s2');
                if (!mfcc) { setPhase('s2_prompt'); alert("Please try again for speaker two."); return; }
                setPhase('s2_review');
                speakInstruction("Speaker two calibration complete.");
              }}>
              Re-record Speaker 2
            </button>
          </div>
        </>
      )}

      <div className="controls" style={{ marginTop: 12 }}>
        <button className="mic-button stop" onClick={stopListening}>Cancel</button>
      </div>
    </div>
  );

  const wAClass   = _activeSpeaker === 's1' ? 'wave active' : 'wave';
  const wBClass   = _activeSpeaker === 's2' ? 'wave active' : 'wave';
  const wBotClass = _activeSpeaker === 'bot' ? 'wave active' : 'wave';

  return (
    <div className="chat-input-wrapper" style={{ position: 'relative' }}>
      <DebugHUD
        visible={showDebug}
        rms={debugRef.current.rms}
        noise={debugRef.current.noise}
        s1={debugRef.current.s1}
        s2={debugRef.current.s2}
        candidate={debugRef.current.candidate}
        active={_activeSpeaker}
      />

      {/* Top: guided calibration or live 3-wave visualisers */}
      {phase === 'idle' && (
        <div className="waveform-container" style={{ placeItems: 'center' }}>
          <button className="mic-button" onClick={startListeningFlow}>🎤 Start Listening</button>
          <button style={{ marginLeft: 8 }} onClick={() => setShowDebug(v => !v)}>
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </button>
        </div>
      )}

      {phase.startsWith('s1') && <CalibrationS1 />}
      {phase.startsWith('s2') && <CalibrationS2 />}

      {phase === 'live' && (
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
            <button onClick={() => setShowDebug(v => !v)}>{showDebug ? 'Hide Debug' : 'Show Debug'}</button>
          </div>
        </div>
      )}

      {/* Bottom: input + interim preview */}
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
