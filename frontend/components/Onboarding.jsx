import { useState } from "react";
import "./Onboarding.css";
import logo from "../src/assets/noabuddy_logo.png";

const slides = [
  {
    title: "Welcome to NoaBuddy",
    text: "Your friendly AI relationship companion. Private, supportive, and here for both of you.",
  },
  {
    title: "Reflect Together",
    text: "Get prompts to guide meaningful conversation and strengthen your bond.",
  },
  {
    title: "Anytime, Anywhere",
    text: "Use NoaBuddy when tensions rise, or when you just want to connect more deeply.",
  },
  {
    title: "Let’s Start",
    text: "We’re here to support your journey – one chat at a time. 💬",
  },
];

export default function Onboarding({ onFinish }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      if (dontShowAgain) {
        localStorage.setItem("noabuddy_seen_onboarding", "true");
      }
      onFinish();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-logo-wrapper">
        <img src={logo} alt="NoaBuddy logo" className="onboarding-logo" />
      </div>
      <div className="onboarding-slide">
        <h2>{slides[currentSlide].title}</h2>
        <p>{slides[currentSlide].text}</p>
        <div className="carousel-nav">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`carousel-dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(i)}
            ></div>
          ))}
        </div>
        <div className="onboarding-controls">
          <label>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don’t show this again
          </label>
          <button className="onboarding-button" onClick={handleNext}>
            {currentSlide === slides.length - 1 ? "Let’s Go" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
