import React, { useState } from "react";
import "./Onboarding.css";

const slides = [
  {
    title: "Welcome to NoaBuddy",
    text: "NoaBuddy is a private space to reflect on your relationship. We’ll ask simple questions to help you and your partner connect more deeply.",
  },
  {
    title: "Your private space",
    text: "NoaBuddy doesn’t record or store your conversation. You can use your real names, but you don’t have to. This is your space, your way.",
  },
  {
    title: "Speak or type",
    text: "Choose the way you prefer to communicate. Speak freely or write things down – whatever feels most natural to you.",
  },
  {
    title: "You’re in control",
    text: "You can end the conversation anytime. NoaBuddy is here to support you — not to judge or replace real human connection.",
  },
];

const OnboardingCarousel = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      if (dontShow) {
        localStorage.setItem("noabuddy_hideOnboarding", "true");
      }
      onFinish();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-slide">
        <h2>{slides[currentSlide].title}</h2>
        <p>{slides[currentSlide].text}</p>
        <div className="carousel-nav">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`carousel-dot ${currentSlide === idx ? "active" : ""}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
        <div className="onboarding-controls">
          <label>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={() => setDontShow((prev) => !prev)}
            />
            Don’t show this again
          </label>
          <button onClick={nextSlide}>
            {currentSlide === slides.length - 1 ? "Start" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
