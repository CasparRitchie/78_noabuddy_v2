import React from 'react';
import './PageStyles.css';
import Navbar from '../../components/Navbar';

const SignInPage = () => (
  <div className="page-container">
    <Navbar/>
    <h1>NoaBuddy</h1>
    <h2>Create an account</h2>
    <p>Enter your email to sign up for this app</p>
    <input type="email" placeholder="email@domain.com" />
    <button>Continue</button>
    <p>or</p>
    <button>Continue with Google</button>
    <button>Continue with Apple</button>
    <p>
      By clicking continue, you agree to our{' '}
      <a href="/terms">Terms of Service</a> and{' '}
      <a href="/privacy">Privacy Policy</a>.
    </p>
  </div>
);

export default SignInPage;
