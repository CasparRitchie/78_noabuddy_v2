import React, { useState } from 'react';
import './AboutCarousel.css';
import PageLayout from '../../components/PageLayout';


const slides = [
  {
    title: 'Empathy',
    text: 'Noa listens with compassion. It’s not about who’s right or wrong—it’s about understanding.',
  },
  {
    title: 'Non-judgment',
    text: 'Noa offers a safe space where you can share without fear of blame or criticism.',
  },
  {
    title: 'Encouragement',
    text: 'Noa nudges you gently toward understanding each other better, without pressure.',
  },
  {
    title: 'Balance',
    text: 'Noa stays neutral. Its aim is to support both of you equally and fairly.',
  },
];

const AboutCarousel = () => {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <PageLayout>
      <div className="about-carousel-container">
        <div className="about-card">
          <h2>{slides[index].title}</h2>
          <p>{slides[index].text}</p>
          <div className="carousel-nav">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`carousel-dot ${index === idx ? "active" : ""}`}
                onClick={() => setIndex(idx)}
              />
            ))}
          </div>
        </div>
        <div className="about-carousel-controls">
          <button onClick={prev}>←</button>
          <button onClick={next}>→</button>
        </div>
      </div>
    </PageLayout>
  );
};

export default AboutCarousel;
