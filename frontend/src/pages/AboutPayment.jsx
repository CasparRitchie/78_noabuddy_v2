import React from "react";
import "./PageStyles.css";
import Navbar from "../../components/Navbar";
import PageLayout from "../../components/PageLayout";
import ScienceCard from "../../components/ScienceCard";
import "../../components/ScienceCard.css";

const AboutPayment = () => (
  <div>
    <PageLayout>
      <div className="page-container">
        <Navbar />

        <ScienceCard index={0}>
          <h1>About Our Payment System</h1>
          <p>
            At NoaBuddy, we believe that everyone deserves access to support, regardless of their financial situation. That’s why we’ve chosen a pay-what-you-can model—a system built on trust, fairness, and accessibility.
          </p>
        </ScienceCard>

        <ScienceCard index={1}>
          <h1>Why We Don’t Use Subscriptions or Set Fees</h1>
          <p>
            Mental well-being doesn’t follow a schedule, and we don’t believe access to support should either. Many apps require expensive subscriptions, locking people into payments whether they use the service regularly or not. But we know that some people might turn to NoaBuddy once a week, while others may only need it once or twice a year. With our model, you only contribute when and if it feels right for you.
          </p>
        </ScienceCard>

        <ScienceCard index={2}>
          <h1>How It Works</h1>
          <p>
            After your session, you’ll have the opportunity to contribute based on what you can afford and what NoaBuddy has meant to you. There’s no obligation—only an invitation to support our mission if you’re able.
          </p>
          <ul>
            <li>💙 £5 – Helps keep NoaBuddy available for those who need it most.</li>
            <li>💙 £10 – Supports development and ensures we can continue improving the experience.</li>
          </ul>
        </ScienceCard>

        <ScienceCard index={3}>
          <h1>Why Your Support Matters</h1>
          <p>
            We are committed to keeping NoaBuddy accessible to all, but providing a high-quality experience comes with costs—from maintaining secure servers to developing new features and ensuring the chatbot continues to improve. Every contribution, no matter how small, helps us keep NoaBuddy running and available to as many people as possible.
          </p>
        </ScienceCard>

        <ScienceCard index={4}>
          <h1>What If I Can’t Pay?</h1>
          <p>
            If you’re unable to contribute, that’s completely okay. NoaBuddy will always be here for you, whenever you need it. The honor-based system means that those who can contribute help support those who can’t, ensuring NoaBuddy remains a resource for everyone.
          </p>
          <p>Thank you for being part of the NoaBuddy community. 💙</p>
        </ScienceCard>
      </div>
    </PageLayout>
  </div>
);

export default AboutPayment;
