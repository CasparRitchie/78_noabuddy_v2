import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ padding: '10px', background: '#eee' }}>
      <Link to="/" style={{ marginRight: 10 }}>Home</Link>
      <Link to="/chat" style={{ marginRight: 10 }}>Chat</Link>
      <Link to="/about">About</Link>
    </nav>
  );
}

export default Navbar;
