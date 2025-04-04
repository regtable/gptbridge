import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4001', {
  query: { userId: 'user1' }
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off('message');
  }, []);

  const sendMessage = () => {
    const message = {
      from: 'user1',
      text: input
    };

    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setInput('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>GPT Bridge Chat</h2>
      <div style={{ marginBottom: 20 }}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '70%', marginRight: 10 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
