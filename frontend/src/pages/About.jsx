import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const slides = [
  {
    title: 'Welcome to NoaBuddy™',
    text: `NoaBuddy is designed to help you navigate communication in your relationships with greater clarity, empathy, and understanding. Whether you're working through a disagreement, strengthening your connection, or simply looking for a space to express yourself, NoaBuddy is here to support you.`,
    bgColor: '#3ab0c3',
  },
  {
    title: 'What is NoaBuddy?',
    text: `NoaBuddy is a conversation-focused app that helps individuals and couples communicate more effectively. It offers tools for clear expression and deep listening, using guided conversations, reflection prompts, and active listening techniques.`,
    bgColor: '#7bdcb5',
  },
  {
    title: 'Our Ethos',
    text: `At NoaBuddy, we believe that true connection begins with understanding. Miscommunication is a natural part of human relationships, but with the right support, it can be transformed into opportunities for growth and deeper connection.`,
    bgColor: '#f5b971',
  },
  {
    title: 'Our Core Values',
    text: `💙 Empathy – Helping you feel heard and understood.\n💡 Clarity – Encouraging open and honest conversations.\n🔄 Growth – Supporting healthy communication habits.\n🛡 Privacy – Your conversations, your choice.`,
    bgColor: '#52b4c3',
  },
  {
    title: 'Not a Replacement for Therapy',
    text: `NoaBuddy is not a substitute for professional therapy, but rather a real-time communication tool to help couples navigate conversations more effectively. It acts as a neutral third-party presence, offering guidance based on psychological research and therapeutic communication techniques.`,
    bgColor: '#8fd3c1',
  },
  {
    title: 'How NoaBuddy Works',
    text: `• Choose your conversation mode – save history or keep everything private\n• Engage in guided conversations\n• Practice active listening\n• Reflect and grow\n\nNoaBuddy is here to help you connect, communicate, and grow—together.`,
    bgColor: '#f5b971',
  },
];

const About = () => {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));

  return (
    <div className="about-carousel-container">
      <div className="about-content-wrapper">
        <div className="about-slide" style={{ backgroundColor: slides[index].bgColor }}>
          <h2>{slides[index].title}</h2>
          <p>{slides[index].text}</p>

          <div className="dot-navigation">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`dot ${index === i ? 'active' : ''}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          <div className="about-carousel-controls">
            <button onClick={prev}>←</button>
            <button onClick={next}>→</button>
          </div>
        </div>

        {/* Footer links BELOW the slide */}
        <div className="about-footer-links">
          <Link to="/signin">Back to Sign in</Link>
          <Link to="/science">The Science behind NoaBuddy™</Link>
          <p className="about-legal">
            Please read our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
