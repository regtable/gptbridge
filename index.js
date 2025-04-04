import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors());
app.use(express.json());

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});
console.log("✅ MySQL connected");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientPath));

// WebSocket
const sockets = {};
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  sockets[userId] = socket;
  console.log('🟢 WS Connected:', userId);

  socket.on('disconnect', () => {
    delete sockets[userId];
    console.log('🔴 WS Disconnected:', userId);
  });
});

// REST Routes
app.post('/gpt-route/message', async (req, res) => {
  const { user_id, message_id, payload, timestamp } = req.body;
  await db.execute(
    "INSERT INTO messages (user_id, message_id, payload, direction, timestamp) VALUES (?, ?, ?, 'to_user', ?)",
    [user_id, message_id, payload, timestamp]
  );
  if (sockets[user_id]) sockets[user_id].emit('message', { from: 'gpt', text: payload });
  res.json({ status: 'delivered', tracking_id: message_id });
});

app.post('/gpt-route/callback', async (req, res) => {
  const { tracking_id, reply, metadata } = req.body;
  await db.execute(
    "INSERT INTO messages (user_id, message_id, payload, direction, metadata) VALUES (?, ?, ?, 'from_gpt', ?)",
    ['gpt', tracking_id, reply, JSON.stringify(metadata || {})]
  );
  res.json({ status: 'received' });
});

// Serve React
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
