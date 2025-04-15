import React, { useState } from 'react';

function ChatInput({ onSend }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(input);
    setInput('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Say something..."
      />
      <button type="submit">Send</button>
    </form>
  );
}

export default ChatInput;
