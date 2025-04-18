import React from "react";
import "./PageStyles.css";
import Navbar from "../../components/Navbar";
import PageLayout from "../../components/PageLayout";
import ScienceCard from "../../components/ScienceCard";
import "../../components/ScienceCard.css";

const SciencePage = () => (
  <div>
    <PageLayout>
      <div className="page-container">
        <ScienceCard index={0}>
          <h1>The Science Behind NoaBuddy™</h1>
          <p>
            NoaBuddy is designed using a comprehensive blend of research-backed therapy practices, ensuring that every interaction promotes understanding, emotional safety, and meaningful connection. The app draws from various therapeutic approaches to help couples navigate conflict, improve communication, and strengthen their bond in real time.
          </p>
          <p>
            Here’s a breakdown of the key therapeutic methods integrated into NoaBuddy and how they make it an invaluable tool for relationships:
          </p>
        </ScienceCard>

        <ScienceCard index={1}>
          <h1>Active Listening & Reflective Dialogue Inspired by Imago Relationship Therapy™</h1>
          <p>
            NoaBuddy is designed using a comprehensive blend of research-backed therapy practices, ensuring that every interaction promotes understanding, emotional safety, and meaningful connection. The app draws from various therapeutic approaches to help couples navigate conflict, improve communication, and strengthen their bond in real time. Here’s a breakdown of the key therapeutic methods integrated into NoaBuddy and how they make it an invaluable tool for relationships:
          </p>
        </ScienceCard>

        <ScienceCard index={2}>
          <h1>Active Listening & Reflective Dialogue</h1>
          <p>
            Inspired by Imago Relationship Therapy NoaBuddy encourages partners to:
          </p>
          <ul>
            <li>✔ Mirror – Repeat back what their partner is saying to confirm understanding.</li>
            <li>✔ Validate – Show appreciation for their partner’s emotions and perspective.</li>
            <li>✔ Empathize – Acknowledge and connect with their partner’s feelings.</li>
          </ul>
          <p>
            By structuring conversations in this way, NoaBuddy interrupts negative communication patterns and fosters a deeper sense of emotional safety between partners.
          </p>
        </ScienceCard>

        <ScienceCard index={3}>
          <h1>Emotionally Focused Therapy (EFT) & Attachment Theory</h1>
          <p>
            NoaBuddy helps couples identify attachment needs and emotional triggers, guiding them toward more secure and supportive interactions. Based on EFT, the app helps users:
          </p>
          <ul>
            <li>✔ Recognize underlying emotional needs.</li>
            <li>✔ Understand the attachment dynamics at play in their relationship.</li>
            <li>✔ Create a stronger, more connected bond.</li>
          </ul>
          <p>
            By bringing awareness to these emotional patterns, NoaBuddy transforms relationship struggles into opportunities for deeper intimacy.
          </p>
        </ScienceCard>

        <ScienceCard index={4}>
          <h1>Nonviolent Communication (NVC)</h1>
          <p>
            Conflict often arises from misunderstandings and unspoken emotions. NoaBuddy uses Nonviolent Communication principles to help couples:
          </p>
          <ul>
            <li>✔ Express feelings and needs without blame or criticism.</li>
            <li>✔ Make requests instead of demands, leading to healthier dialogue.</li>
            <li>✔ Strengthen mutual empathy and connection.</li>
          </ul>
          <p>
            By guiding conversations with NVC techniques, NoaBuddy reduces defensiveness and promotes productive, heartfelt discussions.
          </p>
        </ScienceCard>

        <ScienceCard index={5}>
          <h1>Cognitive Behavioral Therapy (CBT) & Reframing Negative Thought Patterns</h1>
          <p>
            CBT principles within NoaBuddy help users:
          </p>
          <ul>
            <li>✔ Identify and challenge unhelpful thought patterns.</li>
            <li>✔ Shift from assumptions and blame to understanding and problem-solving.</li>
            <li>✔ Recognize cognitive distortions, such as catastrophizing or mind-reading, that can escalate conflicts.</li>
          </ul>
          <p>
            This approach helps couples reframe conflicts in a constructive way, allowing for healthier interactions.
          </p>
        </ScienceCard>

        <ScienceCard index={6}>
          <h1>5. Dialectical Behavior Therapy (DBT) – Emotional Regulation & Mindfulness</h1>
          <ul>
            <li>✔ Emotional regulation – Managing overwhelming feelings during conversations.</li>
            <li>✔ Distress tolerance – Learning to pause instead of reacting impulsively.</li>
            <li>✔ Mindfulness practices – Staying present rather than dwelling on past conflicts.</li>
          </ul>
          <p>
            These skills help couples engage in conversations calmly and constructively, even in emotionally charged moments.
          </p>
        </ScienceCard>

        <ScienceCard index={7}>
          <h1>6. Mindfulness-Based Cognitive Therapy (MBCT) – Awareness & Acceptance</h1>
          <ul>
            <li>✔ Encourage awareness of emotions without judgment.</li>
            <li>✔ Help couples respond rather than react in conflict.</li>
            <li>✔ Reduce stress and increase emotional resilience.</li>
          </ul>
          <p>
            By practicing mindfulness, couples build stronger emotional connections and navigate challenges with greater clarity.
          </p>
        </ScienceCard>

        <ScienceCard index={8}>
          <h1>7. Acceptance and Commitment Therapy (ACT) – Strengthening Relationship Values</h1>
          <p>ACT encourages couples to:</p>
          <ul>
            <li>✔ Accept difficult emotions rather than resisting them.</li>
            <li>✔ Commit to behaviors aligned with their relationship goals.</li>
            <li>✔ Develop a shared vision for their future.</li>
          </ul>
          <p>
            By helping users focus on what truly matters, NoaBuddy supports couples in creating lasting change and deepening their commitment.
          </p>
        </ScienceCard>

        <ScienceCard index={9}>
          <h1>8. Gottman Method – The Science of Lasting Love</h1>
          <p>Based on decades of research, the Gottman Method informs NoaBuddy's ability to:</p>
          <ul>
            <li>✔ Recognise emotional bids and respond positively.</li>
            <li>✔ Strengthen fondness and admiration.</li>
            <li>✔ Reduce criticism, contempt, defensiveness, and stonewalling—the four behaviors most damaging to relationships.</li>
          </ul>
          <p>
            By integrating Gottman’s proven principles, NoaBuddy equips couples with tools for long-term relationship success.
          </p>
        </ScienceCard>

        <ScienceCard index={10}>
          <h1>Why These Principles Make NoaBuddy Amazing</h1>
          <ul>
            <li>✅ Helps couples communicate more effectively in real time.</li>
            <li>✅ Provides structured guidance, reducing misunderstandings.</li>
            <li>✅ Supports emotional regulation, preventing heated arguments.</li>
            <li>✅ Encourages active listening and empathy, fostering deeper connections.</li>
            <li>✅ Guides users toward healthy conflict resolution, improving long-term relationship satisfaction.</li>
          </ul>
          <p>
            NoaBuddy isn’t just an AI chatbot—it’s a science-backed relationship companion designed to enhance communication, strengthen emotional bonds, and create healthier, happier relationships.
          </p>
        </ScienceCard>
      </div>
    </PageLayout>
  </div>
);

export default SciencePage;
