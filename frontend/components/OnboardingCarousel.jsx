import React, { useState } from 'react';
import './Onboarding.css';

const slides = [
  {
    title: 'Welcome to NoaBuddy',
    text: 'Your friendly relationship companion here to help you connect, reflect, and grow.',
  },
  {
    title: 'How it works',
    text: 'Just speak or type to chat. Noa listens, understands, and supports you both.',
  },
  {
    title: 'What to expect',
    text: 'Thoughtful questions, helpful insights, and a safe space for open dialogue.',
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
        localStorage.setItem('noabuddy_hideOnboarding', 'true');
      }
      onFinish();
    }
  };

  return (
    <div className="onboarding-carousel">
      <h2>{slides[currentSlide].title}</h2>
      <p>{slides[currentSlide].text}</p>
      <div className="onboarding-controls">
        <label>
          <input
            type="checkbox"
            checked={dontShow}
            onChange={() => setDontShow((prev) => !prev)}
          />
          Don't show this again
        </label>
        <button onClick={nextSlide}>
          {currentSlide === slides.length - 1 ? 'Start' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
