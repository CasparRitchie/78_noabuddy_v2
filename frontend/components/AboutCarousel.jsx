import React, { useState } from 'react';
import './AboutCarousel.css';

const slides = [
  {
    title: 'Empathy',
    text: 'Noa listens with compassion and aims to understand both sides of the conversation.',
  },
  {
    title: 'Non-judgment',
    text: 'Noa provides a safe space free of blame or criticism.',
  },
  {
    title: 'Encouragement',
    text: 'Noa helps you both reflect and grow, gently encouraging communication.',
  },
  {
    title: 'Balance',
    text: 'Noa keeps things fair and focused on connection rather than conflict.',
  },
];

const AboutCarousel = () => {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <div className="carousel-container">
      <div className="carousel-card">
        <h3>{slides[index].title}</h3>
        <p>{slides[index].text}</p>
      </div>
      <div className="carousel-controls">
        <button className="carousel-dot" onClick={prev}>←</button>
        <button className="carousel-dot" onClick={next}>→</button>
      </div>
    </div>
  );
};

export default AboutCarousel;
