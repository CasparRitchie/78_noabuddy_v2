import React from 'react';
import Navbar from '../../components/Navbar';
import AboutCarousel from '../../components/AboutCarousel';

function About() {
  return (
    <div>
      <Navbar />
      <div style={{ paddingTop: '60px', textAlign: 'center' }}>
        <h1>About NoaBuddy</h1>
        <p>We believe in empathy, clarity, and growth — for both of you.</p>
        <AboutCarousel />
      </div>
    </div>
  );
}

export default About;
