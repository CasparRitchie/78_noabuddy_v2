import React, { useState } from 'react';

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === '') return;
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        className="input"
      />
      <button type="submit" className="send-button">Send</button>
    </form>
  );
};

export default ChatInput;
