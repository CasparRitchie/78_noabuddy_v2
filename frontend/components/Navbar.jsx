import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">
          NoaBuddy
        </Link>
        {/* handle both click and touch */}
        <button
          className="burger"
          onClick={toggleMenu}
          onTouchEnd={(e) => {
            e.preventDefault();    // kill the “ghost click”
            toggleMenu();
          }}
        >
          ☰
        </button>
      </div>

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/science">Science</Link>
        </li>
        <li>
          <Link to="/terms">Terms</Link>
        </li>
        <li>
          <Link to="/privacy">Privacy</Link>
        </li>
        <li>
          <Link to="/payment">Payment</Link>
        </li>
        <li>
          <Link to="/signin">Sign In</Link>
        </li>
        <li>
          <Link to="/chat">Chat</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
