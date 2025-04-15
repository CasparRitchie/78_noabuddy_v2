import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/noabuddy_logo.png';
import Navbar from '../../components/Navbar';
import OnboardingCarousel from '../../components/OnboardingCarousel';

function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const skip = localStorage.getItem('noabuddy_hideOnboarding');
    if (!skip) setShowOnboarding(true);
  }, []);

  const finishOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <div>
      <Navbar />
      {showOnboarding ? (
        <OnboardingCarousel onFinish={finishOnboarding} />
      ) : (
        <div className="home" style={{ textAlign: 'center', marginTop: '80px' }}>
          <img src={logo} alt="NoaBuddy Logo" style={{ width: 120, marginBottom: 20 }} />
          <h1>Welcome to NoaBuddy</h1>
          <p>Your relationship companion 💬</p>
          <Link to="/chat">Start chatting</Link>
        </div>
      )}
    </div>
  );
}

export default Home;
