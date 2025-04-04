import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('/', { path: '/socket.io', query: { userId: 'user1' } });

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
    const message = { from: 'user1', text: input };
    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setInput('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>GPTBridge Chat</h2>
      <div>{messages.map((msg, i) => <div key={i}><b>{msg.from}:</b> {msg.text}</div>)}</div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
