import { useState, useEffect } from "react";
import "./Onboarding.css";

export default function Onboarding({ onFinish }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem("noabuddy_seen_onboarding", "true");
    }
    onFinish();
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-box">
        <h1>👋 Welcome to NoaBuddy</h1>
        <p>Your private, AI-powered relationship support buddy.</p>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don’t show this again
        </label>
        <button onClick={handleContinue}>Let’s Go</button>
      </div>
    </div>
  );
}
