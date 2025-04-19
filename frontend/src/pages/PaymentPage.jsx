import React from "react";
import "./PaymentPage.css";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom"; // Add this at the top


import visa from "../assets/icons/visa-classic.svg";
import mastercard from "../assets/icons/mastercard-full.svg";
import amex from "../assets/icons/amex.svg";
import discover from "../assets/icons/discover.svg";

const PaymentPage = () => {
  return (
    <div className="payment-page">
      <Navbar />
      <div className="payment-container">
        <div className="payment-method-box">
          <span>Payment Method</span>
          <div className="payment-icons">
            <img src={mastercard} alt="MasterCard" />
            <img src={visa} alt="Visa" />
            <img src={amex} alt="American Express" />
            <img src={discover} alt="Discover" />
          </div>
        </div>

        <div className="payment-buttons">
        <Link to="/aboutpayment" className="primary button-link">
  About our Payment System
</Link>

          <button className="secondary">SKIP</button>
        </div>

        <h2>Credit Card Details <span role="img" aria-label="lock">🔒</span></h2>

        <input type="text" placeholder="Name on card" />
        <input type="text" placeholder="Card number" />

        <div className="expiry-cvc-row">
          <select>
            <option>Month</option>
            <option>01</option>
            <option>02</option>
            {/* Add more */}
          </select>
          <select>
            <option>Year</option>
            <option>2025</option>
            <option>2026</option>
            {/* Add more */}
          </select>
        </div>

        <input type="text" placeholder="Card Security Code" />

        <h2>Billing address</h2>
        <select>
          <option>Country</option>
          <option>UK</option>
          <option>USA</option>
        </select>
        <input type="text" placeholder="Address" />
        <input type="text" placeholder="City" />
        <input type="text" placeholder="State" />
        <input type="text" placeholder="Post Code" />

        <h2>Contact information</h2>
        <input type="email" placeholder="Email" />
        <input type="tel" placeholder="Phone" />

        <button className="continue-button">Continue</button>
      </div>
    </div>
  );
};

export default PaymentPage;
