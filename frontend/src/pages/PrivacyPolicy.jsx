import React from 'react';
import './PageStyles.css';
import Navbar from '../../components/Navbar';
import PageLayout from '../../components/PageLayout';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => (
  <PageLayout>
    <Navbar />
    <div className="page-container">
      <h1>Your Privacy</h1>

      <p>
        At NoaBuddy, we believe in giving you control over your conversations and data.
        You have two options for how your chats are handled:
      </p>

      <div className="privacy-option remember">
        <h2>🔹 Remember & Learn</h2>
        <p>
          NoaBuddy will remember past conversations to personalize responses and improve over time.
          Your data is securely stored and can be managed or deleted anytime in settings.
        </p>
      </div>

      <div className="privacy-option forget">
        <h2>🔹 Forget & Flow</h2>
        <p>
          Every conversation stays private and disappears when you close the app.
          No history, no storage—just a fresh start every time.
        </p>
      </div>

      <p>
        You can switch between these options anytime in <strong>Settings &gt; Memory</strong>. Choose what feels right for you! 💙
      </p>

      <h3 style={{ marginTop: '2rem' }}>
        Would you like NoaBuddy to <em>Remember & Learn</em> or <em>Forget & Flow</em>?
      </h3>

      <div className="privacy-choice-buttons">
        <button className="choice remember">Remember & Learn</button>
        <button className="choice forget">Forget & Flow</button>
      </div>

      <p className="legal-text">
        Please read our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  </PageLayout>
);

export default PrivacyPolicy;
